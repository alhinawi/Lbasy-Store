import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { Miniflare } from "miniflare";
import { readFileSync } from "node:fs";
import { app } from "../src/backend/app";
import { sampleProducts, sampleShipping } from "../src/lib/seed";
import type { D1Database } from "@cloudflare/workers-types";
import { hashPassword, checkPassword } from "../src/backend/crypto";
let mf: Miniflare;
let DB: D1Database;
let cookie = "";
let secondCookie = "";
const origin = "https://lbasy.test";
async function request(
  path: string,
  method = "GET",
  data?: unknown,
  session = cookie,
  headers: Record<string, string> = {},
) {
  return app.request(
    origin + "/api/backend" + path,
    {
      method,
      headers: {
        Origin: origin,
        "Content-Type": "application/json",
        Cookie: session,
        ...headers,
      },
      body: data === undefined ? undefined : JSON.stringify(data),
    },
    { DB },
  );
}
beforeAll(async () => {
  mf = new Miniflare({
    modules: true,
    script: 'export default {fetch(){return new Response("ok")}}',
    d1Databases: ["DB"],
    compatibilityDate: "2026-08-01",
  });
  DB = (await mf.getD1Database("DB")) as unknown as D1Database;
  const sql = readFileSync("migrations/0001_accounts_store.sql", "utf8");
  await DB.exec(sql.replace(/\n/g, " "));
  for (const p of sampleProducts.slice(0, 3))
    await DB.prepare(
      "INSERT INTO products(id,slug,price,stock,published,data) VALUES(?,?,?,?,1,?)",
    )
      .bind(p.id, p.slug, p.price, 1, JSON.stringify(p))
      .run();
  const z = sampleShipping[0];
  await DB.prepare("INSERT INTO shipping(code,data) VALUES(?,?)")
    .bind(z.code, JSON.stringify(z))
    .run();
});
afterAll(async () => {
  await mf?.dispose();
});
describe("account security and persisted store", () => {
  it("hashes and checks passwords with fresh salts", async () => {
    const a = await hashPassword("correct horse battery");
    const b = await hashPassword("correct horse battery");
    expect(a).not.toBe(b);
    expect(await checkPassword("correct horse battery", a)).toBe(true);
    expect(await checkPassword("wrong", a)).toBe(false);
  });
  it("rejects cross-site writes and malformed bodies", async () => {
    const r = await app.request(
      origin + "/api/backend/auth/signup",
      { method: "POST", headers: { Origin: "https://other.test" }, body: "{}" },
      { DB },
    );
    expect(r.status).toBe(403);
    expect((await request("/auth/signup", "POST", null)).status).toBe(400);
  });
  it("creates a real account and HttpOnly session", async () => {
    const r = await request("/auth/signup", "POST", {
      name: "Test Customer",
      email: "customer@example.test",
      password: "safe password 12345",
    });
    expect(r.status).toBe(201);
    const set = r.headers.get("set-cookie")!;
    expect(set).toContain("HttpOnly");
    expect(set).toContain("Secure");
    expect(set).toContain("SameSite=Lax");
    cookie = set.split(";")[0];
    const me = await request("/auth/me");
    expect((await me.json()).user.email).toBe("customer@example.test");
    const row = await DB.prepare(
      "SELECT password_hash FROM users LIMIT 1",
    ).first<{ password_hash: string }>();
    expect(row?.password_hash).toMatch(/^pbkdf2/);
  });
  it("rejects incorrect login and blocks non-admins", async () => {
    expect(
      (
        await request("/auth/login", "POST", {
          email: "customer@example.test",
          password: "wrong password value",
        })
      ).status,
    ).toBe(401);
    expect((await request("/admin/products")).status).toBe(403);
  });
  it("persists cart and favorites across requests", async () => {
    const id = sampleProducts[0].id;
    expect((await request("/account/saved/cart/" + id, "PUT")).status).toBe(
      200,
    );
    expect(
      (await request("/account/saved/favorites/" + id, "PUT")).status,
    ).toBe(200);
    const r = await request("/account/saved");
    const data = await r.json();
    expect(data.cart[0].id).toBe(id);
    expect(data.favorites[0].id).toBe(id);
  });
  it("creates a second user with isolated saved items", async () => {
    const r = await request("/auth/signup", "POST", {
      name: "Other",
      email: "other@example.test",
      password: "safe password 23456",
    });
    secondCookie = r.headers.get("set-cookie")!.split(";")[0];
    const saved = await request(
      "/account/saved",
      "GET",
      undefined,
      secondCookie,
    );
    expect((await saved.json()).cart).toHaveLength(0);
  });
  it("atomically reserves one-off stock with idempotent order retries", async () => {
    const input = {
      customer_name: "Test Customer",
      phone: "01012345678",
      governorate: sampleShipping[0].code,
      city: "Cairo",
      address: "10 Test street",
      item_ids: [sampleProducts[0].id],
      payment_method: "cod",
    };
    const key = crypto.randomUUID();
    const r = await request("/account/orders", "POST", input, cookie, {
      "Idempotency-Key": key,
    });
    expect(r.status).toBe(201);
    const { order } = await r.json();
    expect(order.total).toBe(sampleProducts[0].price + sampleShipping[0].fee);
    const retry = await request("/account/orders", "POST", input, cookie, {
      "Idempotency-Key": key,
    });
    expect((await retry.json()).order.id).toBe(order.id);
    expect(
      (
        await request("/account/orders", "POST", input, secondCookie, {
          "Idempotency-Key": crypto.randomUUID(),
        })
      ).status,
    ).toBe(409);
    const otherOrders = await request(
      "/account/orders",
      "GET",
      undefined,
      secondCookie,
    );
    expect((await otherOrders.json()).orders).toHaveLength(0);
  });
  it("rolls back an entire multi-item order when one item is already sold", async () => {
    const input = {
      customer_name: "Other Customer",
      phone: "01012345678",
      governorate: sampleShipping[0].code,
      city: "Cairo",
      address: "10 Test street",
      item_ids: [sampleProducts[1].id, sampleProducts[0].id],
      payment_method: "cod",
    };
    expect(
      (
        await request("/account/orders", "POST", input, secondCookie, {
          "Idempotency-Key": crypto.randomUUID(),
        })
      ).status,
    ).toBe(409);
    expect(
      (
        await DB.prepare("SELECT stock FROM products WHERE id=?")
          .bind(sampleProducts[1].id)
          .first<{ stock: number }>()
      )?.stock,
    ).toBe(1);
  });
  it("allows exactly one winner when two shoppers race for a piece", async () => {
    const input = {
      customer_name: "Test Customer",
      phone: "01012345678",
      governorate: sampleShipping[0].code,
      city: "Cairo",
      address: "10 Test street",
      item_ids: [sampleProducts[2].id],
      payment_method: "cod",
    };
    const results = await Promise.all([
      request("/account/orders", "POST", input, cookie, {
        "Idempotency-Key": crypto.randomUUID(),
      }),
      request("/account/orders", "POST", input, secondCookie, {
        "Idempotency-Key": crypto.randomUUID(),
      }),
    ]);
    expect(results.map((r) => r.status).sort()).toEqual([201, 409]);
  });
  it("persists admin edits and enforces valid order transitions", async () => {
    await DB.prepare(
      "UPDATE users SET role='admin' WHERE email='other@example.test'",
    ).run();
    const before = (
      await (
        await request("/admin/products", "GET", undefined, secondCookie)
      ).json()
    ).items.find((p: { id: string }) => p.id === sampleProducts[1].id);
    const product = {
      ...before,
      name_en: "Edited item",
      price: 777,
      images: ["/editorial/tee.webp", "/editorial/jeans.webp"],
    };
    expect(
      (await request("/admin/products", "PUT", product, secondCookie)).status,
    ).toBe(200);
    expect(
      (await request("/admin/products", "PUT", product, secondCookie)).status,
    ).toBe(409);
    const items = (
      await (
        await request("/admin/products", "GET", undefined, secondCookie)
      ).json()
    ).items;
    expect(items.find((p: { id: string }) => p.id === product.id).price).toBe(
      777,
    );
    expect(
      items.find((p: { id: string }) => p.id === product.id).images,
    ).toHaveLength(2);
    expect(
      (
        await request(
          "/admin/products",
          "PUT",
          { ...product, price: -1 },
          secondCookie,
        )
      ).status,
    ).toBe(400);
    const orders = (
      await (
        await request("/admin/orders", "GET", undefined, secondCookie)
      ).json()
    ).items;
    const id = orders[0].id;
    expect(
      (
        await request(
          "/admin/orders/" + id,
          "PATCH",
          { status: "delivered" },
          secondCookie,
        )
      ).status,
    ).toBe(409);
    expect(
      (
        await request(
          "/admin/orders/" + id,
          "PATCH",
          { status: "cancelled" },
          secondCookie,
        )
      ).status,
    ).toBe(200);
    expect(
      (
        await request(
          "/admin/orders/" + id,
          "PATCH",
          { status: "new" },
          secondCookie,
        )
      ).status,
    ).toBe(409);
  });
  it("rate limits repeated authentication failures", async () => {
    const responses = [];
    for (let i = 0; i < 22; i++)
      responses.push(
        (
          await request("/auth/login", "POST", {
            email: "none@example.test",
            password: "not a real password",
          })
        ).status,
      );
    expect(responses).toContain(429);
  });
  it("revokes the session on logout", async () => {
    expect((await request("/auth/logout", "POST")).status).toBe(200);
    expect((await request("/account/orders")).status).toBe(401);
  });
  it("has no deletion endpoint for store records", async () => {
    expect((await request("/admin/products/x", "DELETE")).status).not.toBe(200);
  });
});
