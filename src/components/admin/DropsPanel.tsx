"use client";

import { useEffect, useRef, useState } from "react";
import { ImagePlus, Loader2, Plus, Trash2 } from "lucide-react";
import { adminApi } from "@/lib/adminApi";
import type { Drop, Product } from "@/lib/types";

const blank = (): Drop => ({
  slug: "",
  title_ar: "",
  title_en: "",
  subtitle_ar: "",
  subtitle_en: "",
  date: new Date().toISOString().slice(0, 10),
  cover: "",
  published: true,
});

export function DropsPanel() {
  const [drops, setDrops] = useState<Drop[] | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [edit, setEdit] = useState<{ d: Drop; original?: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const load = () =>
    Promise.all([adminApi.drops(), adminApi.products()])
      .then(([d, p]) => {
        setDrops(d);
        setProducts(p);
      })
      .catch((e) => setErr(String(e.message ?? e)));
  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    if (!edit) return;
    const d = { ...edit.d };
    if (!d.title_ar.trim()) return setErr("اكتب اسم الشحنة بالعربي.");
    d.slug = d.slug || `${d.date}-${Math.random().toString(36).slice(2, 6)}`;
    d.title_en = d.title_en || d.title_ar;
    d.subtitle_en = d.subtitle_en || d.subtitle_ar;
    if (!d.cover) {
      const first = products.find((p) => p.drop_slug === edit.original);
      d.cover = first?.images[0] ?? "/brand/hero-wide.webp";
    }
    setBusy(true);
    setErr("");
    try {
      await adminApi.saveDrop(d, edit.original);
      setEdit(null);
      load();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (slug: string) => {
    if (!confirm("تخفي الشحنة من المتجر؟ كل بياناتها هتفضل محفوظة.")) return;
    const drop=drops?.find(d=>d.slug===slug);
    if(drop) await adminApi.saveDrop({...drop,published:false},slug).catch((e) => setErr(e.message));
    setEdit(null);
    load();
  };

  const upload = async (files: FileList | null) => {
    if (!files?.[0] || !edit) return;
    setBusy(true);
    try {
      const url = await adminApi.uploadImage(files[0], "drops");
      setEdit({ ...edit, d: { ...edit.d, cover: url } });
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const F = (k: keyof Drop, label: string, dir?: "ltr") =>
    edit && (
      <div>
        <label className="label">{label}</label>
        <input dir={dir} value={String(edit.d[k] ?? "")} onChange={(e) => setEdit({ ...edit, d: { ...edit.d, [k]: e.target.value } })} className="field py-2.5" />
      </div>
    );

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl">الشحنات</h1>
        <button onClick={() => setEdit({ d: blank() })} className="btn-clay py-2.5">
          <Plus className="h-4 w-4" /> شحنة جديدة
        </button>
      </div>
      <p className="mt-1 text-sm text-muted">أحدث شحنة بتظهر في الرئيسية تحت «لسه واصل من بورسعيد».</p>
      {err && <p className="mt-4 rounded-xl bg-clay/10 p-3 text-sm text-clay-dark">{err}</p>}

      {edit && (
        <div className="mt-4 rounded-2xl border-2 border-ink bg-cream p-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {F("title_ar", "اسم الشحنة بالعربي *")}
            {F("title_en", "اسم الشحنة بالإنجليزي", "ltr")}
            {F("subtitle_ar", "وصف قصير بالعربي")}
            {F("subtitle_en", "وصف قصير بالإنجليزي", "ltr")}
            <div>
              <label className="label">تاريخ النزول</label>
              <input type="date" value={edit.d.date} onChange={(e) => setEdit({ ...edit, d: { ...edit.d, date: e.target.value } })} className="field py-2.5" />
            </div>
            <div>
              <label className="label">صورة الغلاف</label>
              <div className="flex items-center gap-3">
                {edit.d.cover && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={edit.d.cover} alt="" className="h-12 w-20 rounded-lg object-cover" />
                )}
                <button type="button" onClick={() => fileRef.current?.click()} className="btn-ghost py-2">
                  <ImagePlus className="h-4 w-4" /> {edit.d.cover ? "غيّر" : "ارفع"}
                </button>
                <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => upload(e.target.files)} />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={edit.d.published} onChange={(e) => setEdit({ ...edit, d: { ...edit.d, published: e.target.checked } })} className="h-5 w-5 accent-[var(--color-clay)]" />
              ظاهرة في المتجر
            </label>
          </div>
          <div className="mt-4 flex gap-2">
            {edit.original && (
              <button onClick={() => remove(edit.original!)} className="btn-ghost text-clay" aria-label="إخفاء الشحنة">
                <Trash2 className="h-4 w-4" />
              </button>
            )}
            <button onClick={() => setEdit(null)} className="btn-ghost flex-1">إلغاء</button>
            <button onClick={save} disabled={busy} className="btn-primary flex-[2]">
              {busy && <Loader2 className="h-4 w-4 animate-spin" />} احفظ
            </button>
          </div>
          <p className="mt-3 text-xs text-muted">علشان تحط قطع في الشحنة، افتح القطعة واختار الشحنة من خانة «الشحنة».</p>
        </div>
      )}

      {!drops && !err && <Loader2 className="mx-auto mt-10 h-6 w-6 animate-spin text-muted" />}
      <ul className="mt-4 grid gap-3 sm:grid-cols-2">
        {drops?.map((dr) => {
          const items = products.filter((p) => p.drop_slug === dr.slug);
          const left = items.filter((p) => p.stock > 0).length;
          return (
            <li key={dr.slug}>
              <button onClick={() => setEdit({ d: dr, original: dr.slug })} className="flex w-full items-center gap-3 rounded-2xl border border-line bg-cream p-3 text-start hover:border-ink/40">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={dr.cover} alt="" className="h-16 w-24 shrink-0 rounded-xl bg-sand object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{dr.title_ar}</p>
                  <p className="text-xs text-muted">{new Date(dr.date).toLocaleDateString("ar-EG", { day: "numeric", month: "long" })}</p>
                  <p className="mt-1 text-xs">
                    {items.length} قطعة · <span className="text-sea">{left} متاحة</span>
                    {!dr.published && <span className="ms-2 rounded-full bg-line px-2 py-0.5">مخفية</span>}
                  </p>
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
