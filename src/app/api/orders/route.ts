import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseConfigured } from "@/lib/config";
import { sampleProducts, sampleShipping } from "@/lib/seed";
import { normalizePhone, validateCheckout, type CheckoutInput } from "@/lib/validate";
import type { Order } from "@/lib/types";

export async function POST(req: Request) {
  let body: Partial<CheckoutInput>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_json" }, { status: 400 });
  }
  const bad = validateCheckout(body);
  if (bad) return NextResponse.json({ error: "invalid", field: bad }, { status: 400 });
  const input = body as CheckoutInput;
  const payload = {
    customer_name: input.customer_name.trim().slice(0, 120),
    phone: normalizePhone(input.phone),
    phone2: input.phone2 ? normalizePhone(input.phone2) : null,
    governorate: input.governorate,
    city: input.city.trim().slice(0, 120),
    address: input.address.trim().slice(0, 500),
    notes: input.notes?.trim().slice(0, 500) || null,
    item_ids: [...new Set(input.item_ids)],
    payment_method: "cod" as const,
  };

  if (supabaseConfigured) {
    // place_order runs inside Postgres: it checks every piece is still available,
    // marks them sold and creates the order in one transaction.
    const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      auth: { persistSession: false },
    });
    const { data, error } = await sb.rpc("place_order", { payload });
    if (error) {
      const m = /SOLD:([\w,-]+)/.exec(error.message);
      if (m) return NextResponse.json({ error: "sold", sold: m[1].split(",") }, { status: 409 });
      console.error("[lbasy] place_order failed", error.message);
      return NextResponse.json({ error: "server" }, { status: 500 });
    }
    return NextResponse.json({ order: data as Order, demo: false });
  }

  // Demo mode (no Supabase yet): validate against the sample catalog and return the order.
  // The browser keeps it so the confirmation page and the admin demo can show it.
  const items = payload.item_ids.map((id) => sampleProducts.find((p) => p.id === id));
  const sold = payload.item_ids.filter((id, i) => !items[i] || items[i]!.stock < 1);
  if (sold.length) return NextResponse.json({ error: "sold", sold }, { status: 409 });
  const zone = sampleShipping.find((z) => z.code === payload.governorate);
  if (!zone) return NextResponse.json({ error: "invalid", field: "governorate" }, { status: 400 });
  const subtotal = items.reduce((s, p) => s + p!.price, 0);
  const now = new Date();
  const order: Order = {
    id: crypto.randomUUID(),
    number: `LB-${now.getTime().toString(36).toUpperCase().slice(-6)}`,
    created_at: now.toISOString(),
    ...payload,
    items: items.map((p) => ({
      product_id: p!.id,
      slug: p!.slug,
      name_ar: p!.name_ar,
      name_en: p!.name_en,
      brand: p!.brand,
      size: p!.size,
      price: p!.price,
      image: p!.images[0],
    })),
    subtotal,
    shipping: zone.fee,
    total: subtotal + zone.fee,
    status: "new",
  };
  return NextResponse.json({ order, demo: true });
}
