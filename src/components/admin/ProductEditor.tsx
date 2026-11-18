"use client";

import { useRef, useState } from "react";
import { ArrowRight, ImagePlus, Loader2, Archive, X, ChevronRight, ChevronLeft } from "lucide-react";
import { adminApi } from "@/lib/adminApi";
import { categories, conditions, dicts, genders } from "@/lib/i18n";
import type { Category, Drop, MeasureKey, Product } from "@/lib/types";

const d = dicts.ar;

const measureSets: Record<Category, MeasureKey[]> = {
  jackets: ["chest", "length", "shoulder", "sleeve"],
  coats: ["chest", "length", "shoulder", "sleeve"],
  knitwear: ["chest", "length", "sleeve"],
  hoodies: ["chest", "length", "sleeve"],
  shirts: ["chest", "length", "shoulder", "sleeve"],
  tshirts: ["chest", "length", "shoulder"],
  jeans: ["waist", "hips", "inseam", "length"],
  pants: ["waist", "hips", "inseam", "length"],
  dresses: ["chest", "waist", "length"],
  shoes: ["insole"],
  bags: ["width", "height", "depth"],
  accessories: ["width", "length"],
  skirts: ["waist", "hips", "length"],
  shorts: ["waist", "hips", "inseam", "length"],
  sets: ["chest", "waist", "length"],
};

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);

const empty = (): Product & { published: boolean } => ({
  id: crypto.randomUUID(),
  slug: "",
  name_ar: "",
  name_en: "",
  brand: "",
  gender: "women",
  category: "jackets",
  size: "",
  measurements: {},
  condition: "very_good",
  material_ar: "",
  material_en: "",
  color_ar: "",
  color_en: "",
  notes_ar: "",
  notes_en: "",
  price: 0,
  compare_at_price: null,
  stock: 1,
  images: [],
  drop_slug: null,
  featured: false,
  created_at: new Date().toISOString(),
  published: true,
});

export function ProductEditor({ initial, drops, onClose }: { initial: Product | null; drops: Drop[]; onClose: (changed: boolean) => void }) {
  const [p, setP] = useState<Product & { published?: boolean }>(() =>
    initial ? { published: true, ...initial } : { ...empty(), drop_slug: drops[0]?.slug ?? null },
  );
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(0);
  const [err, setErr] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const set = <K extends keyof Product>(k: K, v: Product[K]) => setP((x) => ({ ...x, [k]: v }));
  const isNew = !initial;

  const addFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setErr("");
    const list = Array.from(files).slice(0, 8 - p.images.length);
    setUploading(list.length);
    for (const f of list) {
      try {
        const url = await adminApi.uploadImage(f, p.id);
        setP((x) => ({ ...x, images: [...x.images, url] }));
      } catch (e) {
        setErr(`الصورة ماترفعتش: ${(e as Error).message}`);
      }
      setUploading((n) => n - 1);
    }
    if (fileRef.current) fileRef.current.value = "";
  };

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= p.images.length) return;
    const imgs = [...p.images];
    [imgs[i], imgs[j]] = [imgs[j], imgs[i]];
    set("images", imgs);
  };

  const save = async () => {
    setErr("");
    if (!p.name_ar.trim() || !p.brand.trim() || !p.size.trim() || !p.price) {
      setErr("لازم الاسم بالعربي والبراند والمقاس والسعر.");
      return;
    }
    if (p.images.length === 0) {
      setErr("ضيف صورة واحدة على الأقل.");
      return;
    }
    const slug = p.slug || `${slugify(`${p.brand} ${p.name_en || p.category}`) || "item"}-${p.id.slice(0, 5)}`;
    const clean = Object.fromEntries(Object.entries(p.measurements).filter(([k, v]) => v && measureSets[p.category].includes(k as MeasureKey)));
    setBusy(true);
    try {
      await adminApi.saveProduct({
        ...p,
        slug,
        name_en: p.name_en || p.name_ar,
        material_en: p.material_en || p.material_ar,
        color_en: p.color_en || p.color_ar,
        notes_ar: p.notes_ar || null,
        notes_en: p.notes_en || null,
        compare_at_price: p.compare_at_price || null,
        drop_slug: p.drop_slug || null,
        measurements: clean,
      });
      onClose(true);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const archive = async () => {
    if (!confirm("تخفي القطعة دي من المتجر؟ هتفضل محفوظة في لوحة الإدارة وتقدر تنشرها تاني.\nHide this piece from the store? It stays saved in admin and can be published again.")) return;
    setBusy(true);
    try {
      await adminApi.saveProduct({ ...p, published: false });
      onClose(true);
    } catch (e) {
      setErr((e as Error).message);
      setBusy(false);
    }
  };

  const Input = ({ k, label, dir, type = "text", ph }: { k: keyof Product; label: string; dir?: "ltr"; type?: string; ph?: string }) => (
    <div>
      <label className="label">{label}</label>
      <input
        type={type}
        inputMode={type === "number" ? "numeric" : undefined}
        dir={dir}
        placeholder={ph}
        value={(p[k] as string | number | null | undefined) ?? ""}
        onChange={(e) => set(k, (type === "number" ? (e.target.value === "" ? null : Number(e.target.value)) : e.target.value) as never)}
        className="field py-2.5"
      />
    </div>
  );

  return (
    <div className="pb-28">
      <button onClick={() => onClose(false)} className="mb-3 inline-flex items-center gap-1 text-sm text-muted hover:text-ink">
        <ArrowRight className="h-4 w-4" /> رجوع للقطع
      </button>
      <h1 className="font-display text-3xl">{isNew ? "قطعة جديدة" : "تعديل القطعة"}</h1>

      <section className="mt-5 rounded-2xl border border-line bg-cream p-4">
        <h2 className="font-semibold">الصور</h2>
        <p className="text-xs text-muted">أول صورة هي اللي بتظهر في المتجر. لحد ٨ صور، وبتتصغّر لوحدها قبل الرفع.</p>
        <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5">
          {p.images.map((src, i) => (
            <div key={src.slice(-40) + i} className="relative aspect-[4/5] overflow-hidden rounded-xl bg-sand">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="h-full w-full object-cover" />
              {i === 0 && <span className="absolute start-1.5 top-1.5 rounded-full bg-ink px-2 py-0.5 text-[10px] text-cream">الرئيسية</span>}
              <button onClick={() => set("images", p.images.filter((_, j) => j !== i))} className="absolute end-1.5 top-1.5 grid h-7 w-7 place-items-center rounded-full bg-cream/90" aria-label="شيل">
                <X className="h-4 w-4" />
              </button>
              <div className="absolute inset-x-1.5 bottom-1.5 flex justify-between">
                <button onClick={() => move(i, -1)} className="grid h-7 w-7 place-items-center rounded-full bg-cream/90 disabled:opacity-30" disabled={i === 0} aria-label="قدّم">
                  <ChevronRight className="h-4 w-4" />
                </button>
                <button onClick={() => move(i, 1)} className="grid h-7 w-7 place-items-center rounded-full bg-cream/90 disabled:opacity-30" disabled={i === p.images.length - 1} aria-label="أخّر">
                  <ChevronLeft className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
          {Array.from({ length: uploading }).map((_, i) => (
            <div key={`u${i}`} className="grid aspect-[4/5] place-items-center rounded-xl bg-sand">
              <Loader2 className="h-5 w-5 animate-spin text-muted" />
            </div>
          ))}
          {p.images.length + uploading < 8 && (
            <button onClick={() => fileRef.current?.click()} className="grid aspect-[4/5] place-items-center rounded-xl border-2 border-dashed border-line text-muted hover:border-ink hover:text-ink">
              <span className="flex flex-col items-center gap-1 text-xs">
                <ImagePlus className="h-6 w-6" /> ضيف صور
              </span>
            </button>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => addFiles(e.target.files)} />
      </section>

      <section className="mt-4 grid gap-4 rounded-2xl border border-line bg-cream p-4 sm:grid-cols-2">
        {Input({ k: "name_ar", label: "الاسم بالعربي *", ph: "جاكيت جينز أزرق" })}
        {Input({ k: "name_en", label: "الاسم بالإنجليزي", dir: "ltr", ph: "Blue denim jacket" })}
        {Input({ k: "brand", label: "البراند *", dir: "ltr", ph: "Levi's" })}
        {Input({ k: "size", label: "المقاس *", dir: "ltr", ph: "M / W32 / 42" })}
        <div>
          <label className="label">القسم</label>
          <select value={p.gender} onChange={(e) => set("gender", e.target.value as Product["gender"])} className="field py-2.5">
            {genders.map((g) => <option key={g} value={g}>{d.genders[g]}</option>)}
          </select>
        </div>
        <div>
          <label className="label">النوع</label>
          <select value={p.category} onChange={(e) => set("category", e.target.value as Category)} className="field py-2.5">
            {categories.map((c) => <option key={c} value={c}>{d.categories[c]}</option>)}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="label">الحالة</label>
          <div className="flex flex-wrap gap-2">
            {conditions.map((c) => (
              <button key={c} type="button" onClick={() => set("condition", c)} className={`chip px-4 py-2 text-sm ${p.condition === c ? "chip-on" : ""}`}>
                {d.conditions[c]}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-4 rounded-2xl border border-line bg-cream p-4">
        <h2 className="font-semibold">المقاسات بالسنتيمتر</h2>
        <p className="text-xs text-muted">افرد القطعة على الأرض وقيس. الخانات بتتغيّر حسب النوع.</p>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {measureSets[p.category].map((m) => (
            <div key={m}>
              <label className="label text-xs">{d.measures[m]}</label>
              <input
                inputMode="decimal"
                dir="ltr"
                value={p.measurements[m] ?? ""}
                onChange={(e) => {
                  const v = e.target.value.replace(/[^\d.]/g, "");
                  set("measurements", { ...p.measurements, [m]: v ? Number(v) : undefined });
                }}
                className="field py-2.5"
              />
            </div>
          ))}
        </div>
      </section>

      <section className="mt-4 grid gap-4 rounded-2xl border border-line bg-cream p-4 sm:grid-cols-2">
        {Input({ k: "material_ar", label: "الخامة بالعربي", ph: "قطن 100%" })}
        {Input({ k: "material_en", label: "الخامة بالإنجليزي", dir: "ltr", ph: "100% cotton" })}
        {Input({ k: "color_ar", label: "اللون بالعربي", ph: "أزرق" })}
        {Input({ k: "color_en", label: "اللون بالإنجليزي", dir: "ltr", ph: "Blue" })}
        <div className="sm:col-span-2">
          <label className="label">ملحوظات على القطعة (لو فيها عيب صغير قوله)</label>
          <textarea rows={2} value={p.notes_ar ?? ""} onChange={(e) => set("notes_ar", e.target.value)} className="field resize-none py-2.5" />
        </div>
        <div className="sm:col-span-2">
          <label className="label">الملحوظات بالإنجليزي</label>
          <textarea rows={2} dir="ltr" value={p.notes_en ?? ""} onChange={(e) => set("notes_en", e.target.value)} className="field resize-none py-2.5" />
        </div>
      </section>

      <section className="mt-4 grid gap-4 rounded-2xl border border-line bg-cream p-4 sm:grid-cols-3">
        {Input({ k: "price", label: "السعر بالجنيه *", type: "number", dir: "ltr" })}
        {Input({ k: "compare_at_price", label: "السعر قبل الخصم", type: "number", dir: "ltr" })}
        <div>
          <label className="label">الكمية</label>
          <div className="flex gap-2">
            <button type="button" onClick={() => set("stock", 1)} className={`chip flex-1 justify-center py-2.5 text-sm ${p.stock > 0 ? "chip-on" : ""}`}>متاحة</button>
            <button type="button" onClick={() => set("stock", 0)} className={`chip flex-1 justify-center py-2.5 text-sm ${p.stock < 1 ? "chip-on" : ""}`}>اتباعت</button>
          </div>
        </div>
        <div>
          <label className="label">الشحنة</label>
          <select value={p.drop_slug ?? ""} onChange={(e) => set("drop_slug", e.target.value || null)} className="field py-2.5">
            <option value="">من غير شحنة</option>
            {drops.map((dr) => <option key={dr.slug} value={dr.slug}>{dr.title_ar}</option>)}
          </select>
        </div>
        <label className="flex items-center gap-2 self-end pb-3 text-sm">
          <input type="checkbox" checked={!!p.featured} onChange={(e) => set("featured", e.target.checked)} className="h-5 w-5 accent-[var(--color-clay)]" />
          تظهر في «اختياراتنا»
        </label>
        <label className="flex items-center gap-2 self-end pb-3 text-sm">
          <input type="checkbox" checked={p.published !== false} onChange={(e) => setP((x) => ({ ...x, published: e.target.checked }))} className="h-5 w-5 accent-[var(--color-clay)]" />
          ظاهرة في المتجر
        </label>
      </section>

      {err && <p className="mt-4 rounded-xl bg-clay/10 p-3 text-sm text-clay-dark">{err}</p>}

      <div className="fixed inset-x-0 bottom-[57px] z-20 border-t border-line bg-paper/95 px-4 py-3 backdrop-blur md:bottom-0">
        <div className="mx-auto flex max-w-6xl gap-2">
          {!isNew && (
            <button onClick={archive} disabled={busy} className="btn-ghost text-clay" aria-label="إخفاء القطعة / Hide piece" title="إخفاء القطعة / Hide piece">
              <Archive className="h-4 w-4" />
            </button>
          )}
          <button onClick={() => onClose(false)} className="btn-ghost flex-1">إلغاء</button>
          <button onClick={save} disabled={busy || uploading > 0} className="btn-clay flex-[2]">
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            {isNew ? "انشر القطعة" : "احفظ التعديلات"}
          </button>
        </div>
      </div>
    </div>
  );
}
