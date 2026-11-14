"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { useLang } from "./LangProvider";
import type { Condition } from "@/lib/types";

interface Facets {
  sizes: [string, number][];
  brands: [string, number][];
  conditions: [Condition, number][];
  priceMax: number;
}

const list = (v: string | null) => (v ? v.split(",").filter(Boolean) : []);

export function FilterBar({ facets, total }: { facets: Facets; total: number }) {
  const { d } = useLang();
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [open, setOpen] = useState(false);

  const [sizes, setSizes] = useState<string[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [conds, setConds] = useState<string[]>([]);
  const [min, setMin] = useState("");
  const [max, setMax] = useState("");
  const [avail, setAvail] = useState(false);

  const sync = () => {
    setSizes(list(sp.get("size")));
    setBrands(list(sp.get("brand")));
    setConds(list(sp.get("condition")));
    setMin(sp.get("min") ?? "");
    setMax(sp.get("max") ?? "");
    setAvail(sp.get("available") === "1");
  };
  useEffect(sync, [sp]);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
  }, [open]);

  const activeCount =
    list(sp.get("size")).length +
    list(sp.get("brand")).length +
    list(sp.get("condition")).length +
    (sp.get("min") ? 1 : 0) +
    (sp.get("max") ? 1 : 0) +
    (sp.get("available") === "1" ? 1 : 0);

  const push = (next: URLSearchParams) => {
    const s = next.toString();
    router.push(s ? `${pathname}?${s}` : pathname, { scroll: false });
  };

  const apply = () => {
    const next = new URLSearchParams(sp.toString());
    const setOrDel = (k: string, v: string) => (v ? next.set(k, v) : next.delete(k));
    setOrDel("size", sizes.join(","));
    setOrDel("brand", brands.join(","));
    setOrDel("condition", conds.join(","));
    setOrDel("min", min.replace(/\D/g, ""));
    setOrDel("max", max.replace(/\D/g, ""));
    setOrDel("available", avail ? "1" : "");
    setOpen(false);
    push(next);
  };

  const clear = () => {
    const next = new URLSearchParams();
    if (sp.get("q")) next.set("q", sp.get("q")!);
    if (sp.get("sort")) next.set("sort", sp.get("sort")!);
    setOpen(false);
    push(next);
  };

  const toggle = (arr: string[], set: (v: string[]) => void, v: string) =>
    set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  const Chips = ({ items, sel, set, label }: { items: [string, number][]; sel: string[]; set: (v: string[]) => void; label: (v: string) => string }) => (
    <div className="flex flex-wrap gap-2">
      {items.map(([v, n]) => (
        <button key={v} type="button" onClick={() => toggle(sel, set, v)} className={`chip ${sel.includes(v) ? "chip-on" : ""}`}>
          {label(v)}
          <span className="opacity-50">{n}</span>
        </button>
      ))}
    </div>
  );

  return (
    <>
      <div className="flex items-center gap-2">
        <button onClick={() => setOpen(true)} className="btn-ghost py-2.5">
          <SlidersHorizontal className="h-4 w-4" />
          {d.filters}
          {activeCount > 0 && (
            <span className="grid h-5 min-w-5 place-items-center rounded-full bg-clay px-1 text-[10px] text-cream">{activeCount}</span>
          )}
        </button>
        <span className="text-sm text-muted">{d.results(total)}</span>
        <label className="ms-auto">
          <span className="sr-only">{d.sort}</span>
          <select
            value={sp.get("sort") ?? "new"}
            onChange={(e) => {
              const next = new URLSearchParams(sp.toString());
              if (e.target.value === "new") next.delete("sort");
              else next.set("sort", e.target.value);
              push(next);
            }}
            className="rounded-full border border-line bg-cream px-3 py-2.5 text-sm font-medium"
          >
            <option value="new">{d.sortNew}</option>
            <option value="price_asc">{d.sortPriceAsc}</option>
            <option value="price_desc">{d.sortPriceDesc}</option>
          </select>
        </label>
      </div>

      {open && (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-ink/40" onClick={() => setOpen(false)} />
          <div className="animate-slide-in absolute inset-x-0 bottom-0 flex max-h-[88dvh] flex-col rounded-t-[28px] bg-paper shadow-2xl sm:inset-y-0 sm:end-0 sm:start-auto sm:max-h-none sm:w-[420px] sm:rounded-none">
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <h2 className="font-display text-xl">{d.filters}</h2>
              <button onClick={() => setOpen(false)} className="grid h-9 w-9 place-items-center rounded-full hover:bg-sand" aria-label={d.nav.close}>
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 space-y-7 overflow-y-auto px-5 py-5">
              <label className="flex items-center justify-between">
                <span className="text-sm font-semibold">{d.availableOnly}</span>
                <input type="checkbox" checked={avail} onChange={(e) => setAvail(e.target.checked)} className="h-5 w-5 accent-[var(--color-clay)]" />
              </label>
              {facets.sizes.length > 0 && (
                <div>
                  <h3 className="mb-3 text-sm font-semibold">{d.size}</h3>
                  <Chips items={facets.sizes} sel={sizes} set={setSizes} label={(v) => v} />
                </div>
              )}
              {facets.conditions.length > 0 && (
                <div>
                  <h3 className="mb-3 text-sm font-semibold">{d.condition}</h3>
                  <Chips items={facets.conditions} sel={conds} set={setConds} label={(v) => d.conditions[v as Condition]} />
                </div>
              )}
              <div>
                <h3 className="mb-3 text-sm font-semibold">{d.price}</h3>
                <div className="flex items-center gap-3">
                  <input inputMode="numeric" value={min} onChange={(e) => setMin(e.target.value)} placeholder={`${d.minPrice} 0`} className="field py-2.5" />
                  <span className="text-muted">–</span>
                  <input inputMode="numeric" value={max} onChange={(e) => setMax(e.target.value)} placeholder={`${d.maxPrice} ${facets.priceMax}`} className="field py-2.5" />
                </div>
              </div>
              {facets.brands.length > 0 && (
                <div>
                  <h3 className="mb-3 text-sm font-semibold">{d.brand}</h3>
                  <Chips items={facets.brands} sel={brands} set={setBrands} label={(v) => v} />
                </div>
              )}
            </div>
            <div className="flex gap-3 border-t border-line px-5 py-4">
              <button onClick={clear} className="btn-ghost flex-1">{d.clear}</button>
              <button onClick={apply} className="btn-primary flex-[2]">{d.apply}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
