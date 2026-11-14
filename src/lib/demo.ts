"use client";

// Demo mode: when Supabase is not connected yet, the admin works on a copy of the sample
// data kept in this browser's localStorage. Nothing reaches a server.
import { sampleDrops, sampleProducts, sampleShipping } from "./seed";
import type { Drop, Order, Product, ShippingZone } from "./types";

const KEY = "lbasy-demo-v1";

interface DemoState {
  products: Product[];
  drops: Drop[];
  shipping: ShippingZone[];
  orders: Order[];
}

function read(): DemoState {
  if (typeof window === "undefined") return { products: sampleProducts, drops: sampleDrops, shipping: sampleShipping, orders: [] };
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as DemoState;
  } catch {
    /* ignore broken storage */
  }
  return { products: sampleProducts, drops: sampleDrops, shipping: sampleShipping, orders: [] };
}

function write(s: DemoState) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    // Storage full, usually from big photos. Drop the oldest orders and retry once.
    s.orders = s.orders.slice(0, 20);
    localStorage.setItem(KEY, JSON.stringify(s));
  }
}

export const demo = {
  get: read,
  update(fn: (s: DemoState) => void) {
    const s = read();
    fn(s);
    write(s);
    return s;
  },
  reset() {
    localStorage.removeItem(KEY);
  },
};

export function saveDemoOrder(o: Order) {
  demo.update((s) => {
    s.orders = [o, ...s.orders.filter((x) => x.id !== o.id)];
    const ids = new Set(o.items.map((i) => i.product_id));
    s.products = s.products.map((p) => (ids.has(p.id) ? { ...p, stock: 0 } : p));
  });
}
