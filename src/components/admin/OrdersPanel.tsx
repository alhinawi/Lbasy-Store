"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown, Loader2, MessageCircle, Phone, RefreshCw } from "lucide-react";
import { adminApi } from "@/lib/adminApi";
import { dicts, formatPrice, orderStatuses } from "@/lib/i18n";
import { sampleShipping } from "@/lib/seed";
import type { Order, OrderStatus } from "@/lib/types";

const d = dicts.ar;
const statusColor: Record<OrderStatus, string> = {
  new: "bg-clay text-cream",
  confirmed: "bg-gold text-ink",
  shipped: "bg-sea text-cream",
  delivered: "bg-sea-light text-sea",
  cancelled: "bg-line text-muted",
};

export function OrdersPanel() {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [filter, setFilter] = useState<OrderStatus | "all">("all");
  const [open, setOpen] = useState<string | null>(null);
  const [err, setErr] = useState("");

  const fetchOrders = () =>
    adminApi
      .orders()
      .then((o) => {
        setErr("");
        setOrders(o);
      })
      .catch((e) => setErr(String(e.message ?? e)));
  const load = () => void fetchOrders();
  useEffect(() => {
    void fetchOrders();
  }, []);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: orders?.length ?? 0 };
    orders?.forEach((o) => (c[o.status] = (c[o.status] ?? 0) + 1));
    return c;
  }, [orders]);

  const list = (orders ?? []).filter((o) => filter === "all" || o.status === filter);
  const revenue = (orders ?? []).filter((o) => o.status === "delivered").reduce((s, o) => s + o.subtotal, 0);

  const setStatus = async (o: Order, s: OrderStatus) => {
    if (s === "cancelled" && !confirm("تلغي الطلب؟ القطع مش هترجع متاحة تلقائيًا. راجعها الأول ورجّع المخزون بنفسك لو ينفع.")) return;
    try {
      await adminApi.setOrderStatus(o.id, s);
      load();
    } catch (e) {
      alert((e as Error).message);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl">الطلبات</h1>
        <button onClick={load} className="btn-ghost py-2"><RefreshCw className="h-4 w-4" /> تحديث</button>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2">
        <Stat label="طلبات جديدة" value={String(counts.new ?? 0)} />
        <Stat label="في الطريق" value={String((counts.confirmed ?? 0) + (counts.shipped ?? 0))} />
        <Stat label="مبيعات اتسلّمت" value={formatPrice(revenue, "ar")} />
      </div>
      <div className="no-scrollbar mt-4 flex gap-2 overflow-x-auto">
        {(["all", ...orderStatuses] as const).map((s) => (
          <button key={s} onClick={() => setFilter(s)} className={`chip shrink-0 ${filter === s ? "chip-on" : ""}`}>
            {s === "all" ? "الكل" : d.statuses[s]} <span className="opacity-60">{counts[s] ?? 0}</span>
          </button>
        ))}
      </div>

      {err && <p className="mt-4 rounded-xl bg-clay/10 p-3 text-sm text-clay-dark">{err}</p>}
      {!orders && !err && <Loader2 className="mx-auto mt-10 h-6 w-6 animate-spin text-muted" />}
      {orders && list.length === 0 && <p className="mt-10 text-center text-muted">مفيش طلبات هنا لسه.</p>}

      <ul className="mt-4 space-y-2.5">
        {list.map((o) => {
          const zone = sampleShipping.find((z) => z.code === o.governorate);
          const isOpen = open === o.id;
          const wa = `https://wa.me/2${o.phone}?text=${encodeURIComponent(`أهلًا ${o.customer_name}، معاك لباسي بخصوص طلبك رقم ${o.number}`)}`;
          return (
            <li key={o.id} className="overflow-hidden rounded-2xl border border-line bg-cream">
              <button onClick={() => setOpen(isOpen ? null : o.id)} className="flex w-full items-center gap-3 p-4 text-start">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold" dir="ltr">{o.number}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${statusColor[o.status]}`}>{d.statuses[o.status]}</span>
                  </div>
                  <p className="mt-0.5 truncate text-sm text-muted">
                    {o.customer_name} · {zone?.name_ar ?? o.governorate} · {o.items.length} قطع
                  </p>
                </div>
                <div className="text-end">
                  <p className="font-bold">{formatPrice(o.total, "ar")}</p>
                  <p className="text-[11px] text-muted">{new Date(o.created_at).toLocaleString("ar-EG", { dateStyle: "short", timeStyle: "short" })}</p>
                </div>
                <ChevronDown className={`h-4 w-4 shrink-0 transition ${isOpen ? "rotate-180" : ""}`} />
              </button>
              {isOpen && (
                <div className="border-t border-line p-4 text-sm">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-1 leading-7">
                      <p><span className="text-muted">الموبايل: </span><span dir="ltr">{o.phone}</span>{o.phone2 && <> · <span dir="ltr">{o.phone2}</span></>}</p>
                      <p><span className="text-muted">العنوان: </span>{zone?.name_ar}، {o.city}، {o.address}</p>
                      {o.notes && <p><span className="text-muted">ملاحظات: </span>{o.notes}</p>}
                      <p><span className="text-muted">الشحن: </span>{formatPrice(o.shipping, "ar")} · <span className="text-muted">القطع: </span>{formatPrice(o.subtotal, "ar")}</p>
                      <div className="flex gap-2 pt-2">
                        <a href={`tel:${o.phone}`} className="btn-ghost py-2"><Phone className="h-4 w-4" /> اتصل</a>
                        <a href={wa} target="_blank" rel="noopener" className="btn-wa py-2"><MessageCircle className="h-4 w-4" /> واتساب</a>
                      </div>
                    </div>
                    <ul className="space-y-2">
                      {o.items.map((i) => (
                        <li key={i.product_id} className="flex items-center gap-3">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={i.image} alt="" className="h-14 w-11 rounded-lg bg-sand object-cover" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate">{i.name_ar}</p>
                            <p className="text-xs text-muted">{i.brand} · {i.size}</p>
                          </div>
                          <span className="font-semibold">{formatPrice(i.price, "ar")}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  {o.status !== "cancelled" && (
                    <div className="mt-4 flex flex-wrap gap-2 border-t border-line pt-4">
                      <span className="self-center text-xs text-muted">غيّر الحالة:</span>
                      {orderStatuses
                        .filter((s) => s !== o.status)
                        .map((s) => (
                          <button key={s} onClick={() => setStatus(o, s)} className={`chip ${s === "cancelled" ? "text-clay" : ""}`}>
                            {d.statuses[s]}
                          </button>
                        ))}
                    </div>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-line bg-cream p-3">
      <p className="text-[11px] text-muted">{label}</p>
      <p className="mt-0.5 truncate text-lg font-bold">{value}</p>
    </div>
  );
}
