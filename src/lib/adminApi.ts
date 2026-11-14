"use client";

import { browserSupabase } from "./supabase";
import { demo } from "./demo";
import { demoAdminPassword, supabaseConfigured } from "./config";
import type { Drop, Order, OrderStatus, Product, ShippingZone } from "./types";

export const isDemo = !supabaseConfigured;
const DEMO_SESSION = "lbasy-demo-admin";

function sb() {
  const c = browserSupabase();
  if (!c) throw new Error("Supabase not configured");
  return c;
}

function check<T>(r: { data: T; error: { message: string } | null }): T {
  if (r.error) throw new Error(r.error.message);
  return r.data;
}

/** Resize a photo in the browser before upload: smaller files, faster store. */
export async function resizeImage(file: File, maxSide = 1600, quality = 0.82): Promise<Blob> {
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) return file;
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, w, h);
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b ?? file), "image/webp", quality));
}

const blobToDataUrl = (b: Blob) =>
  new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(b);
  });

export const adminApi = {
  async session(): Promise<string | null> {
    if (isDemo) {
      try { const r = await fetch("/api/admin/session", { cache: "no-store" }); const v = await r.json(); if (v.configured) return v.authenticated ? "store-admin" : null; } catch {}
      return sessionStorage.getItem(DEMO_SESSION) ? "demo@lbasy" : null;
    }
    const { data } = await sb().auth.getSession();
    if (!data.session) return null;
    const { data: ok } = await sb().rpc("is_admin");
    return ok ? data.session.user.email ?? "admin" : null;
  },

  async signIn(email: string, password: string): Promise<"ok" | "bad" | "not_admin"> {
    if (isDemo) {
      try {const info = await fetch("/api/admin/session", { cache: "no-store" }).then(r=>r.json()); if(info.configured){const r=await fetch("/api/admin/session",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({password})}); return r.ok ? "ok" : "bad";}} catch {return "bad";}
      if (password !== demoAdminPassword) return "bad";
      sessionStorage.setItem(DEMO_SESSION, "1");
      return "ok";
    }
    const { error } = await sb().auth.signInWithPassword({ email, password });
    if (error) return "bad";
    const { data: ok } = await sb().rpc("is_admin");
    if (!ok) {
      await sb().auth.signOut();
      return "not_admin";
    }
    return "ok";
  },

  async signOut() {
    if (isDemo) { sessionStorage.removeItem(DEMO_SESSION); await fetch("/api/admin/session",{method:"DELETE"}); }
    else await sb().auth.signOut();
  },

  // Products
  async products(): Promise<Product[]> {
    if (isDemo) return demo.get().products;
    return check(await sb().from("products").select("*").order("created_at", { ascending: false }).limit(5000)) as Product[];
  },

  async saveProduct(p: Product & { published?: boolean }) {
    if (isDemo) {
      demo.update((s) => {
        const i = s.products.findIndex((x) => x.id === p.id);
        if (i >= 0) s.products[i] = p;
        else s.products.unshift(p);
      });
      return;
    }
    const row = { ...p, updated_at: new Date().toISOString() };
    check(await sb().from("products").upsert(row));
  },

  async deleteProduct(id: string) {
    if (isDemo) {
      demo.update((s) => {
        s.products = s.products.filter((p) => p.id !== id);
      });
      return;
    }
    check(await sb().from("products").delete().eq("id", id));
  },

  async uploadImage(file: File, folder: string): Promise<string> {
    if (isDemo) {
      // Kept small because demo photos live in the browser's storage.
      return blobToDataUrl(await resizeImage(file, 900, 0.72));
    }
    const blob = await resizeImage(file);
    const path = `${folder}/${crypto.randomUUID()}.webp`;
    check(await sb().storage.from("products").upload(path, blob, { contentType: "image/webp", cacheControl: "31536000" }));
    return sb().storage.from("products").getPublicUrl(path).data.publicUrl;
  },

  // Orders
  async orders(): Promise<Order[]> {
    if (isDemo) return demo.get().orders;
    // Items live in their own table (order_items); PostgREST joins them in as "items".
    return check(
      await sb()
        .from("orders")
        .select("*, items:order_items(product_id, slug, name_ar, name_en, brand, size, price, image)")
        .order("created_at", { ascending: false })
        .limit(1000),
    ) as unknown as Order[];
  },

  async setOrderStatus(id: string, status: OrderStatus) {
    if (isDemo) {
      demo.update((s) => {
        const o = s.orders.find((x) => x.id === id);
        if (!o) return;
        if (status === "cancelled" && o.status !== "cancelled") {
          const ids = new Set(o.items.map((i) => i.product_id));
          s.products = s.products.map((p) => (ids.has(p.id) ? { ...p, stock: p.stock + 1 } : p));
        }
        o.status = status;
      });
      return;
    }
    check(await sb().rpc("admin_set_order_status", { order_id: id, new_status: status }));
  },

  // Drops
  async drops(): Promise<Drop[]> {
    if (isDemo) return demo.get().drops;
    return check(await sb().from("drops").select("*").order("date", { ascending: false })) as Drop[];
  },

  async saveDrop(d: Drop, originalSlug?: string) {
    if (isDemo) {
      demo.update((s) => {
        const i = s.drops.findIndex((x) => x.slug === (originalSlug ?? d.slug));
        if (i >= 0) s.drops[i] = d;
        else s.drops.unshift(d);
        if (originalSlug && originalSlug !== d.slug)
          s.products = s.products.map((p) => (p.drop_slug === originalSlug ? { ...p, drop_slug: d.slug } : p));
        s.drops.sort((a, b) => b.date.localeCompare(a.date));
      });
      return;
    }
    if (originalSlug && originalSlug !== d.slug) check(await sb().from("drops").update(d).eq("slug", originalSlug));
    else check(await sb().from("drops").upsert(d));
  },

  async deleteDrop(slug: string) {
    if (isDemo) {
      demo.update((s) => {
        s.drops = s.drops.filter((x) => x.slug !== slug);
        s.products = s.products.map((p) => (p.drop_slug === slug ? { ...p, drop_slug: null } : p));
      });
      return;
    }
    check(await sb().from("drops").delete().eq("slug", slug));
  },

  // Shipping
  async shipping(): Promise<ShippingZone[]> {
    if (isDemo) return demo.get().shipping;
    return check(await sb().from("shipping_zones").select("*").order("name_ar")) as ShippingZone[];
  },

  async saveShipping(zones: ShippingZone[]) {
    if (isDemo) {
      demo.update((s) => {
        s.shipping = zones;
      });
      return;
    }
    check(await sb().from("shipping_zones").upsert(zones));
  },

  resetDemo() {
    demo.reset();
  },
};
