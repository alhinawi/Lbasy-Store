"use client";

import { useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { adminApi } from "@/lib/adminApi";
import type { ShippingZone } from "@/lib/types";

export function ShippingPanel() {
  const [zones, setZones] = useState<ShippingZone[] | null>(null);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState("");
  const [bulk, setBulk] = useState("");

  useEffect(() => {
    adminApi.shipping().then(setZones).catch((e) => setErr(String(e.message ?? e)));
  }, []);

  const update = (code: string, patch: Partial<ShippingZone>) => {
    setZones((z) => z!.map((x) => (x.code === code ? { ...x, ...patch } : x)));
    setDirty(true);
    setSaved(false);
  };

  const save = async () => {
    if (!zones) return;
    setBusy(true);
    setErr("");
    try {
      await adminApi.saveShipping(zones);
      setDirty(false);
      setSaved(true);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="pb-24">
      <h1 className="font-display text-3xl">أسعار الشحن</h1>
      <p className="mt-1 text-sm text-muted">سعر الشحن لكل محافظة بالجنيه، ومدة التوصيل بالأيام. المحافظة المقفولة مش بتظهر في الطلب.</p>

      <div className="mt-4 flex items-end gap-2 rounded-2xl border border-line bg-cream p-3">
        <div className="flex-1">
          <label className="label text-xs">غيّر كل الأسعار بـ (+ أو -)</label>
          <input dir="ltr" inputMode="numeric" placeholder="+10" value={bulk} onChange={(e) => setBulk(e.target.value)} className="field py-2" />
        </div>
        <button
          className="btn-ghost py-2.5"
          onClick={() => {
            const n = Number(bulk);
            if (!zones || !Number.isFinite(n) || !n) return;
            setZones(zones.map((z) => ({ ...z, fee: Math.max(0, z.fee + n) })));
            setDirty(true);
            setBulk("");
          }}
        >
          طبّق
        </button>
      </div>

      {err && <p className="mt-4 rounded-xl bg-clay/10 p-3 text-sm text-clay-dark">{err}</p>}
      {!zones && !err && <Loader2 className="mx-auto mt-10 h-6 w-6 animate-spin text-muted" />}

      <ul className="mt-4 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-cream">
        {zones?.map((z) => (
          <li key={z.code} className={`flex items-center gap-3 px-4 py-2.5 ${z.active ? "" : "opacity-50"}`}>
            <input type="checkbox" checked={z.active} onChange={(e) => update(z.code, { active: e.target.checked })} className="h-5 w-5 accent-[var(--color-sea)]" aria-label={`تشغيل ${z.name_ar}`} />
            <span className="flex-1 text-sm font-medium">{z.name_ar}</span>
            <label className="flex items-center gap-1 text-xs text-muted">
              <input dir="ltr" inputMode="numeric" value={z.fee} onChange={(e) => update(z.code, { fee: Number(e.target.value.replace(/\D/g, "")) || 0 })} className="w-16 rounded-lg border border-line bg-paper px-2 py-1.5 text-center text-sm text-ink" />
              ج
            </label>
            <label className="flex items-center gap-1 text-xs text-muted">
              <input dir="ltr" value={z.days} onChange={(e) => update(z.code, { days: e.target.value })} className="w-14 rounded-lg border border-line bg-paper px-2 py-1.5 text-center text-sm text-ink" />
              يوم
            </label>
          </li>
        ))}
      </ul>

      <div className="fixed inset-x-0 bottom-[57px] z-20 border-t border-line bg-paper/95 px-4 py-3 backdrop-blur md:bottom-0">
        <div className="mx-auto flex max-w-6xl">
          <button onClick={save} disabled={!dirty || busy} className="btn-primary flex-1">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <Check className="h-4 w-4" /> : null}
            {saved && !dirty ? "اتحفظت" : "احفظ الأسعار"}
          </button>
        </div>
      </div>
    </div>
  );
}
