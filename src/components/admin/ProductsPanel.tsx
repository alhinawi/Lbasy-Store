"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Plus, Search } from "lucide-react";
import { adminApi } from "@/lib/adminApi";
import { categories, dicts, formatPrice } from "@/lib/i18n";
import type { Drop, Product } from "@/lib/types";
import { ProductEditor } from "./ProductEditor";
import { Stat } from "./OrdersPanel";

const d = dicts.ar;

export function ProductsPanel() {
  const [products, setProducts] = useState<
    | (Product & {
        published?: boolean;
        _revision?: number;
        inventory_confirmed?: boolean;
      })[]
    | null
  >(null);
  const [drops, setDrops] = useState<Drop[]>([]);
  const [editing, setEditing] = useState<Product | "new" | null>(null);
  const [q, setQ] = useState("");
  const [show, setShow] = useState<"all" | "available" | "sold">("all");
  const [cat, setCat] = useState("");
  const [err, setErr] = useState("");

  const fetchAll = () =>
    Promise.all([adminApi.products(), adminApi.drops()])
      .then(([p, dr]) => {
        setErr("");
        setProducts(p);
        setDrops(dr);
      })
      .catch((e) => setErr(String(e.message ?? e)));
  const load = () => void fetchAll();
  useEffect(() => {
    void fetchAll();
  }, []);

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return (products ?? []).filter((p) => {
      if (show === "available" && p.stock < 1) return false;
      if (show === "sold" && p.stock > 0) return false;
      if (cat && p.category !== cat) return false;
      if (
        s &&
        !`${p.name_ar} ${p.name_en} ${p.brand} ${p.size}`
          .toLowerCase()
          .includes(s)
      )
        return false;
      return true;
    });
  }, [products, q, show, cat]);

  if (editing)
    return (
      <ProductEditor
        initial={editing === "new" ? null : editing}
        drops={drops}
        onClose={(changed) => {
          setEditing(null);
          if (changed) load();
        }}
      />
    );

  const avail = (products ?? []).filter((p) => p.stock > 0);
  const stockValue = avail.reduce((s, p) => s + p.price * p.stock, 0);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl">القطع</h1>
        <button onClick={() => setEditing("new")} className="btn-clay py-2.5">
          <Plus className="h-4 w-4" /> قطعة جديدة
        </button>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2">
        <Stat label="متاحة" value={String(avail.length)} />
        <Stat
          label="اتباعت"
          value={String((products?.length ?? 0) - avail.length)}
        />
        <Stat label="قيمة المتاح" value={formatPrice(stockValue, "ar")} />
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="دوّر بالاسم أو البراند أو المقاس"
            className="field py-2.5 ps-10"
          />
        </div>
        <select
          value={cat}
          onChange={(e) => setCat(e.target.value)}
          className="field py-2.5 sm:w-44"
        >
          <option value="">كل الأنواع</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {d.categories[c]}
            </option>
          ))}
        </select>
        <div className="flex gap-1.5">
          {(["all", "available", "sold"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setShow(s)}
              className={`chip py-2 ${show === s ? "chip-on" : ""}`}
            >
              {s === "all" ? "الكل" : s === "available" ? "متاح" : "اتباع"}
            </button>
          ))}
        </div>
      </div>

      {err && (
        <p className="mt-4 rounded-xl bg-clay/10 p-3 text-sm text-clay-dark">
          {err}
        </p>
      )}
      {!products && !err && (
        <Loader2 className="mx-auto mt-10 h-6 w-6 animate-spin text-muted" />
      )}

      <ul className="mt-4 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((p) => (
          <li key={p.id}>
            <button
              onClick={() => setEditing(p)}
              className="flex w-full items-center gap-3 rounded-2xl border border-line bg-cream p-2.5 text-start transition hover:border-ink/40"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.images[0]}
                alt=""
                className={`h-20 w-16 shrink-0 rounded-xl bg-sand object-cover ${p.stock < 1 ? "opacity-50" : ""}`}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[11px] font-bold uppercase tracking-wider text-muted">
                  {p.brand}
                </p>
                <p className="truncate text-sm font-medium">{p.name_ar}</p>
                <p className="mt-0.5 text-xs text-muted">
                  {d.genders[p.gender]} · {d.categories[p.category]} · {p.size}
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-sm font-bold">
                    {formatPrice(p.price, "ar")}
                  </span>
                  {p.stock < 1 && (
                    <span className="rounded-full bg-ink px-2 py-0.5 text-[10px] font-bold text-cream">
                      اتباعت
                    </span>
                  )}
                  {p.published === false && (
                    <span className="rounded-full bg-line px-2 py-0.5 text-[10px] font-bold">
                      مخفية
                    </span>
                  )}
                </div>
              </div>
            </button>
            <button
              className="mt-2 w-full border border-line p-2 text-xs"
              onClick={async () => {
                if (
                  !confirm(
                    p.inventory_confirmed
                      ? "توقف استقبال طلبات على القطعة دي؟"
                      : "القطعة دي موجودة عندك فعلًا بنفس الصور والمقاس والحالة والسعر؟ التأكيد بيفعّل استقبال طلبات حقيقية عليها.",
                  )
                )
                  return;
                try {
                  await adminApi.confirmInventory(
                    p.id,
                    p._revision!,
                    !p.inventory_confirmed,
                  );
                  load();
                } catch (e) {
                  setErr((e as Error).message);
                }
              }}
            >
              {p.inventory_confirmed
                ? "المخزون متأكد · وقف الطلبات"
                : "تأكيد المخزون الحقيقي قبل الطلب"}
            </button>
          </li>
        ))}
      </ul>
      {products && list.length === 0 && (
        <p className="mt-10 text-center text-muted">مفيش قطع بالبحث ده.</p>
      )}
    </div>
  );
}
