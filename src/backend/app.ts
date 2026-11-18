import { Hono, type Context } from "hono";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";
import { z } from "zod";
import { bodyLimit } from "hono/body-limit";
import { requestAccount } from "./authorize";
import type { BackendEnv, User } from "./env";
import type { Product, Drop, ShippingZone, Order } from "../lib/types";
import { hashPassword, checkPassword, randomToken, hashToken } from "./crypto";
import {
  credentials,
  productSchema,
  dropSchema,
  shippingSchema,
  checkoutSchema,
} from "./schema";
import { normalizePhone, isEgyptMobile } from "../lib/validate";
import { snap } from "../lib/snap";

type Env = {
  Bindings: BackendEnv & { LEGACY_ADMIN?: boolean };
  Variables: { user: User | null };
};
export const app = new Hono<Env>().basePath("/api/backend");
app.use(
  "*",
  bodyLimit({
    maxSize: 3_000_000,
    onError: (c) => c.json({ error: "too_large" }, 413),
  }),
);
const sessionCookie = "lbasy-session";
const cookieOptions = (url: string) => ({
  httpOnly: true,
  secure: new URL(url).protocol === "https:",
  sameSite: "Lax" as const,
  path: "/",
});
const userFields = "id,email,name,avatar,role";
const db = (c: { env: BackendEnv }) => c.env.DB!;
function rows<T>(results: { results: unknown[] }) {
  return results.results.map(
    (r) => JSON.parse((r as { data: string }).data) as T,
  );
}
async function body(c: { req: { json: () => Promise<unknown> } }) {
  try {
    return await c.req.json();
  } catch {
    return null;
  }
}
app.use("*", async (c, next) => {
  c.header("Cache-Control", "no-store");
  c.header("X-Content-Type-Options", "nosniff");
  if (!c.env.DB) return c.json({ error: "backend_unavailable" }, 503);
  if (!["GET", "HEAD", "OPTIONS"].includes(c.req.method)) {
    const origin = c.req.header("Origin");
    if (!origin || origin !== new URL(c.req.url).origin)
      return c.json({ error: "origin" }, 403);
    if (Number(c.req.header("Content-Length") || 0) > 3000000)
      return c.json({ error: "too_large" }, 413);
  }
  const token = getCookie(c, sessionCookie);
  const user = await requestAccount(c.env, token);
  c.set("user", user);
  await next();
});
app.onError((err, c) => {
  console.error(
    "[lbasy backend]",
    err instanceof Error ? err.message : "request_failed",
  );
  return c.json({ error: "server" }, 500);
});
async function rate(c: Context<Env>, scope: string, limit: number) {
  const ip = c.req.header("CF-Connecting-IP") || "local";
  const key = scope + ":" + (await hashToken(ip));
  const now = Date.now();
  const r = await db(c)
    .prepare(
      "INSERT INTO rate_limits(key,hits,reset_at) VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET hits=CASE WHEN reset_at<? THEN 1 ELSE hits+1 END,reset_at=CASE WHEN reset_at<? THEN excluded.reset_at ELSE reset_at END RETURNING hits",
    )
    .bind(key, now + 900000, now, now)
    .first<{ hits: number }>();
  return !!r && r.hits <= limit;
}
async function newSession(c: Context<Env>, userId: string) {
  const token = randomToken();
  await db(c).batch([
    db(c).prepare("DELETE FROM sessions WHERE expires_at<?").bind(Date.now()),
    db(c)
      .prepare(
        "INSERT INTO sessions(token_hash,user_id,expires_at) VALUES(?,?,?)",
      )
      .bind(await hashToken(token), userId, Date.now() + 30 * 86400000),
  ]);
  setCookie(c, sessionCookie, token, {
    ...cookieOptions(c.req.url),
    maxAge: 30 * 86400,
  });
}
app.get("/auth/me", (c) =>
  c.json({
    user: c.get("user"),
    googleEnabled: !!(c.env.GOOGLE_CLIENT_ID && c.env.GOOGLE_CLIENT_SECRET),
  }),
);
app.post("/auth/:action", async (c) => {
  const action = c.req.param("action");
  if (action === "logout") {
    const token = getCookie(c, sessionCookie);
    if (token)
      await db(c)
        .prepare("DELETE FROM sessions WHERE token_hash=?")
        .bind(await hashToken(token))
        .run();
    deleteCookie(c, sessionCookie, { path: "/" });
    return c.json({ ok: true });
  }
  if (!["signup", "login"].includes(action))
    return c.json({ error: "not_found" }, 404);
  if (!(await rate(c, "auth", 20))) return c.json({ error: "rate_limit" }, 429);
  const parsed = credentials.safeParse(await body(c));
  if (!parsed.success || (action === "signup" && !parsed.data.name))
    return c.json({ error: "invalid" }, 400);
  const { email, password, name } = parsed.data;
  let user = await db(c)
    .prepare(`SELECT ${userFields},password_hash FROM users WHERE email=?`)
    .bind(email)
    .first<User & { password_hash: string | null }>();
  if (action === "signup") {
    if (user) return c.json({ error: "account_unavailable" }, 409);
    const id = crypto.randomUUID();
    const passwordHash = await hashPassword(password);
    try {
      await db(c)
        .prepare(
          "INSERT INTO users(id,email,name,password_hash) VALUES(?,?,?,?)",
        )
        .bind(id, email, name!, passwordHash)
        .run();
    } catch {
      return c.json({ error: "account_unavailable" }, 409);
    }
    user = {
      id,
      email,
      name: name!,
      avatar: null,
      role: "customer",
      password_hash: null,
    };
  } else {
    // A dummy derivation keeps an unknown account from returning immediately.
    const stored =
      user?.password_hash || "pbkdf2-sha256$100000$dummy$" + "0".repeat(64);
    if (!(await checkPassword(password, stored)) || !user)
      return c.json({ error: "credentials" }, 401);
  }
  await newSession(c, user.id);
  const { password_hash: _, ...safe } = user;
  void _;
  return c.json({ user: safe }, action === "signup" ? 201 : 200);
});
app.get("/auth/google", async (c) => {
  if (!c.env.GOOGLE_CLIENT_ID || !c.env.GOOGLE_CLIENT_SECRET)
    return c.json({ error: "google_not_configured" }, 503);
  const state = randomToken();
  const verifier = randomToken();
  const digest = new Uint8Array(
    await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier)),
  );
  const challenge = btoa(String.fromCharCode(...digest))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  const lang = c.req.query("lang") === "en" ? "en" : "ar";
  setCookie(c, "lbasy-oauth", `${state}.${verifier}.${lang}`, {
    ...cookieOptions(c.req.url),
    maxAge: 600,
  });
  const u = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  u.search = new URLSearchParams({
    client_id: c.env.GOOGLE_CLIENT_ID,
    redirect_uri: new URL("/api/backend/auth/google/callback", c.req.url).href,
    response_type: "code",
    scope: "openid email profile",
    state,
    code_challenge: challenge,
    code_challenge_method: "S256",
  }).toString();
  return c.redirect(u.href);
});
app.get("/auth/google/callback", async (c) => {
  const [state, verifier, lang] = (getCookie(c, "lbasy-oauth") || "").split(
    ".",
  );
  deleteCookie(c, "lbasy-oauth", { path: "/" });
  if (
    !state ||
    state !== c.req.query("state") ||
    !c.req.query("code") ||
    !c.env.GOOGLE_CLIENT_ID ||
    !c.env.GOOGLE_CLIENT_SECRET
  )
    return c.redirect("/account?error=google");
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    body: new URLSearchParams({
      code: c.req.query("code")!,
      client_id: c.env.GOOGLE_CLIENT_ID,
      client_secret: c.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: new URL("/api/backend/auth/google/callback", c.req.url)
        .href,
      grant_type: "authorization_code",
      code_verifier: verifier,
    }),
  });
  const token = (await tokenRes.json()) as { access_token?: string };
  if (!tokenRes.ok || !token.access_token)
    return c.redirect("/account?error=google");
  const profileRes = await fetch(
    "https://openidconnect.googleapis.com/v1/userinfo",
    { headers: { Authorization: `Bearer ${token.access_token}` } },
  );
  const p = (await profileRes.json()) as {
    sub?: string;
    email?: string;
    email_verified?: boolean;
    name?: string;
    picture?: string;
  };
  if (!profileRes.ok || !p.sub || !p.email || !p.email_verified)
    return c.redirect("/account?error=google");
  const email = p.email.toLowerCase();
  let user = await db(c)
    .prepare("SELECT id,google_id FROM users WHERE email=?")
    .bind(email)
    .first<{ id: string; google_id: string | null }>();
  // Do not silently link a password-only account using an email assertion.
  if (user && !user.google_id)
    return c.redirect(
      `${lang === "en" ? "/en" : ""}/account?error=link_required`,
    );
  if (user && user.google_id !== p.sub)
    return c.redirect("/account?error=google");
  if (!user) {
    const id = crypto.randomUUID();
    const role =
      c.env.ADMIN_EMAIL?.toLowerCase() === email ? "admin" : "customer";
    await db(c)
      .prepare(
        "INSERT INTO users(id,email,name,google_id,avatar,role) VALUES(?,?,?,?,?,?)",
      )
      .bind(
        id,
        email,
        (p.name || email).slice(0, 80),
        p.sub,
        p.picture || null,
        role,
      )
      .run();
    user = { id, google_id: p.sub };
  }
  await newSession(c, user.id);
  return c.redirect(`${lang === "en" ? "/en" : ""}/account`);
});
app.use("/account/*", async (c, next) =>
  c.get("user") ? next() : c.json({ error: "unauthorized" }, 401),
);
app.get("/account/saved", async (c) => {
  const r = await db(c)
    .prepare(
      "SELECT s.kind,p.data,p.stock,p.price FROM saved_items s JOIN products p ON p.id=s.product_id WHERE user_id=?",
    )
    .bind(c.get("user")!.id)
    .all<{ kind: string; data: string; stock: number; price: number }>();
  const mapped = r.results.map((x) => ({
    kind: x.kind,
    item: snap({ ...JSON.parse(x.data), stock: x.stock, price: x.price }),
  }));
  return c.json({
    cart: mapped.filter((x) => x.kind === "cart").map((x) => x.item),
    favorites: mapped.filter((x) => x.kind === "favorites").map((x) => x.item),
  });
});
app.put("/account/saved/:kind/:id", async (c) => {
  const kind = c.req.param("kind"),
    id = c.req.param("id");
  if (!["cart", "favorites"].includes(kind))
    return c.json({ error: "invalid" }, 400);
  const exists = await db(c)
    .prepare("SELECT id FROM products WHERE id=? AND published=1")
    .bind(id)
    .first();
  if (!exists) return c.json({ error: "not_found" }, 404);
  await db(c)
    .prepare(
      "INSERT OR IGNORE INTO saved_items(user_id,product_id,kind) VALUES(?,?,?)",
    )
    .bind(c.get("user")!.id, id, kind)
    .run();
  return c.json({ ok: true });
});
app.delete("/account/saved/:kind/:id", async (c) => {
  await db(c)
    .prepare(
      "DELETE FROM saved_items WHERE user_id=? AND kind=? AND product_id=?",
    )
    .bind(c.get("user")!.id, c.req.param("kind"), c.req.param("id"))
    .run();
  return c.json({ ok: true });
});
app.get("/account/orders", async (c) => {
  const r = await db(c)
    .prepare(
      "SELECT data,status FROM orders WHERE user_id=? ORDER BY created_at DESC LIMIT 100",
    )
    .bind(c.get("user")!.id)
    .all<{ data: string; status: string }>();
  return c.json({
    orders: r.results.map((o) => ({ ...JSON.parse(o.data), status: o.status })),
  });
});
app.post("/account/orders", async (c) => {
  if (!(await rate(c, "orders", 15)))
    return c.json({ error: "rate_limit" }, 429);
  const p = checkoutSchema.safeParse(await body(c));
  if (!p.success) return c.json({ error: "invalid" }, 400);
  const input = p.data;
  const ids = [...new Set(input.item_ids)];
  if (
    !isEgyptMobile(input.phone) ||
    (input.phone2 && !isEgyptMobile(input.phone2))
  )
    return c.json({ error: "invalid", field: "phone" }, 400);
  const key = c.req.header("Idempotency-Key");
  if (!key || !z.string().uuid().safeParse(key).success)
    return c.json({ error: "idempotency_required" }, 400);
  const userId = c.get("user")!.id;
  const existing = await db(c)
    .prepare(
      "SELECT data,status FROM orders WHERE user_id=? AND idempotency_key=?",
    )
    .bind(userId, key)
    .first<{ data: string; status: string }>();
  if (existing)
    return c.json({
      order: { ...JSON.parse(existing.data), status: existing.status },
    });
  const zoneRow = await db(c)
    .prepare("SELECT data FROM shipping WHERE code=?")
    .bind(input.governorate)
    .first<{ data: string }>();
  const zone: ShippingZone | null = zoneRow ? JSON.parse(zoneRow.data) : null;
  if (!zone?.active)
    return c.json({ error: "invalid", field: "governorate" }, 400);
  const selected = await db(c)
    .prepare(
      `SELECT data,stock,price,published FROM products WHERE id IN (${ids.map(() => "?").join(",")})`,
    )
    .bind(...ids)
    .all<{ data: string; stock: number; price: number; published: number }>();
  const products = selected.results.map((p) => ({
    ...JSON.parse(p.data),
    stock: p.stock,
    price: p.price,
    published: p.published,
  })) as (Product & { published: number })[];
  const sold = ids.filter(
    (id) => !products.some((p) => p.id === id && p.stock === 1 && p.published),
  );
  if (sold.length) return c.json({ error: "sold", sold }, 409);
  const subtotal = products.reduce((s, p) => s + p.price, 0);
  const id = crypto.randomUUID();
  const order: Order = {
    ...input,
    phone: normalizePhone(input.phone),
    phone2: input.phone2 ? normalizePhone(input.phone2) : null,
    id,
    number: "LB-" + id.slice(0, 8).toUpperCase(),
    created_at: new Date().toISOString(),
    items: products.map((p) => ({
      product_id: p.id,
      slug: p.slug,
      name_ar: p.name_ar,
      name_en: p.name_en,
      brand: p.brand,
      size: p.size,
      price: p.price,
      image: p.images[0],
    })),
    subtotal,
    shipping: zone.fee,
    total: subtotal + zone.fee,
    status: "new",
  };
  try {
    await db(c).batch([
      db(c)
        .prepare(
          "INSERT INTO orders(id,number,user_id,data,idempotency_key) VALUES(?,?,?,?,?)",
        )
        .bind(id, order.number, userId, JSON.stringify(order), key),
      ...products.map((p) =>
        db(c)
          .prepare(
            "INSERT INTO order_items(order_id,product_id,price) VALUES(?,?,?)",
          )
          .bind(id, p.id, p.price),
      ),
      db(c)
        .prepare("DELETE FROM saved_items WHERE user_id=? AND kind='cart'")
        .bind(userId),
    ]);
  } catch {
    const retry = await db(c)
      .prepare(
        "SELECT data,status FROM orders WHERE user_id=? AND idempotency_key=?",
      )
      .bind(userId, key)
      .first<{ data: string; status: string }>();
    if (retry)
      return c.json({
        order: { ...JSON.parse(retry.data), status: retry.status },
      });
    return c.json({ error: "sold", sold: ids }, 409);
  }
  return c.json({ order }, 201);
});
app.use("/admin/*", async (c, next) =>
  c.env.LEGACY_ADMIN || c.get("user")?.role === "admin"
    ? next()
    : c.json({ error: "forbidden" }, 403),
);
app.get("/admin/:kind", async (c) => {
  const kind = c.req.param("kind");
  if (kind === "products") {
    const r = await db(c)
      .prepare(
        "SELECT data,price,stock,published,revision FROM products ORDER BY updated_at DESC LIMIT 5000",
      )
      .all<{
        data: string;
        price: number;
        stock: number;
        published: number;
        revision: number;
      }>();
    return c.json({
      items: r.results.map((p) => ({
        ...JSON.parse(p.data),
        price: p.price,
        stock: p.stock,
        published: !!p.published,
        _revision: p.revision,
      })),
    });
  }
  if (kind === "orders") {
    const r = await db(c)
      .prepare(
        "SELECT data,status FROM orders ORDER BY created_at DESC LIMIT 1000",
      )
      .all<{ data: string; status: string }>();
    return c.json({
      items: r.results.map((p) => ({
        ...JSON.parse(p.data),
        status: p.status,
      })),
    });
  }
  if (kind === "drops" || kind === "shipping")
    return c.json({
      items: rows<Drop | ShippingZone>(
        await db(c).prepare(`SELECT data FROM ${kind}`).all(),
      ),
    });
  return c.json({ error: "not_found" }, 404);
});
app.put("/admin/products", async (c) => {
  const p = productSchema.safeParse(await body(c));
  if (!p.success) return c.json({ error: "invalid" }, 400);
  const x = p.data;
  const result = await db(c)
    .prepare(
      "INSERT INTO products(id,slug,price,stock,published,data) VALUES(?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET slug=excluded.slug,price=excluded.price,stock=excluded.stock,published=excluded.published,data=excluded.data,revision=products.revision+1,updated_at=CURRENT_TIMESTAMP WHERE products.revision=?",
    )
    .bind(
      x.id,
      x.slug,
      x.price,
      x.stock,
      x.published === false ? 0 : 1,
      JSON.stringify(x),
      x._revision ?? 0,
    )
    .run();
  return result.meta.changes
    ? c.json({ ok: true })
    : c.json({ error: "stale_product_reload" }, 409);
});
app.put("/admin/drops", async (c) => {
  const parsed = z
    .object({ drop: dropSchema, originalSlug: z.string().optional() })
    .safeParse(await body(c));
  if (!parsed.success) return c.json({ error: "invalid" }, 400);
  const { drop, originalSlug } = parsed.data;
  // Renaming a live drop is explicit, and its product associations move with it.
  const statements = [
    db(c)
      .prepare(
        "INSERT INTO drops(slug,data) VALUES(?,?) ON CONFLICT(slug) DO UPDATE SET data=excluded.data",
      )
      .bind(drop.slug, JSON.stringify(drop)),
  ];
  if (originalSlug && originalSlug !== drop.slug) {
    statements.push(
      db(c)
        .prepare(
          "UPDATE products SET data=json_set(data,'$.drop_slug',?) WHERE json_extract(data,'$.drop_slug')=?",
        )
        .bind(drop.slug, originalSlug),
    );
    statements.push(
      db(c)
        .prepare(
          "UPDATE drops SET data=json_set(data,'$.published',json('false')) WHERE slug=?",
        )
        .bind(originalSlug),
    );
  }
  await db(c).batch(statements);
  return c.json({ ok: true });
});
app.put("/admin/shipping", async (c) => {
  const p = shippingSchema.safeParse(await body(c));
  if (!p.success || !p.data.length) return c.json({ error: "invalid" }, 400);
  await db(c).batch(
    p.data.map((x) =>
      db(c)
        .prepare(
          "INSERT INTO shipping(code,data) VALUES(?,?) ON CONFLICT(code) DO UPDATE SET data=excluded.data",
        )
        .bind(x.code, JSON.stringify(x)),
    ),
  );
  return c.json({ ok: true });
});
app.patch("/admin/orders/:id", async (c) => {
  const p = z
    .object({
      status: z.enum(["new", "confirmed", "shipped", "delivered", "cancelled"]),
    })
    .safeParse(await body(c));
  if (!p.success) return c.json({ error: "invalid" }, 400);
  const row = await db(c)
    .prepare("SELECT status FROM orders WHERE id=?")
    .bind(c.req.param("id"))
    .first<{ status: string }>();
  if (!row) return c.json({ error: "not_found" }, 404);
  const transitions: Record<string, string[]> = {
    new: ["confirmed", "cancelled"],
    confirmed: ["shipped", "cancelled"],
    shipped: ["delivered"],
    delivered: [],
    cancelled: [],
  };
  if (row.status === p.data.status) return c.json({ ok: true });
  if (!transitions[row.status]?.includes(p.data.status))
    return c.json({ error: "invalid_transition" }, 409);
  // Cancellation does not automatically re-list a one-off item. An admin must inspect and explicitly re-stock it.
  const result = await db(c)
    .prepare("UPDATE orders SET status=? WHERE id=? AND status=?")
    .bind(p.data.status, c.req.param("id"), row.status)
    .run();
  return result.meta.changes
    ? c.json({ ok: true })
    : c.json({ error: "conflict" }, 409);
});
// No product, drop, order or account deletion route. Archive products by unpublishing.
export default app;
