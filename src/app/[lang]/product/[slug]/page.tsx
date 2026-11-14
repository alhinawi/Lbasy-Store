import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Info, Ruler, Truck } from "lucide-react";
import { Gallery } from "@/components/Gallery";
import { BuyBox } from "@/components/BuyBox";
import { ProductCard } from "@/components/ProductCard";
import { SectionHead } from "@/components/Section";
import { getBuildSlugs, getProduct, getSimilar, isSampleCatalog } from "@/lib/data";
import { conditions, formatPrice, href, pick, t } from "@/lib/i18n";
import { snap } from "@/lib/snap";
import { site } from "@/lib/config";
import type { Lang, MeasureKey } from "@/lib/types";


export async function generateStaticParams() {
  return (await getBuildSlugs()).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/[lang]/product/[slug]">): Promise<Metadata> {
  const { lang: l, slug } = await params;
  const lang = l as Lang;
  const p = await getProduct(slug);
  if (!p) return {};
  const d = t(lang);
  const name = pick(p, "name", lang);
  const title = `${p.brand} ${name} - ${d.size} ${p.size}`;
  const description = `${d.conditions[p.condition]} · ${formatPrice(p.price, lang)} · ${pick(p, "material", lang)}. ${d.brandTagline}.`;
  const path = `/product/${p.slug}`;
  return {
    title,
    description,
    alternates: { canonical: href(lang, path), languages: { ar: path, en: `/en${path}` } },
    openGraph: { title, description, type: "website", images: [{ url: `/og/product/${p.slug}?lang=${lang}`, width: 1200, height: 630, alt: title }] },
    twitter: { card: "summary_large_image", title, description, images: [`/og/product/${p.slug}?lang=${lang}`] },
  };
}

export default async function ProductPage({ params }: PageProps<"/[lang]/product/[slug]">) {
  const { lang: l, slug } = await params;
  const lang = l as Lang;
  const d = t(lang);
  const p = await getProduct(slug);
  if (!p) notFound();
  const similar = await getSimilar(p);
  const sold = p.stock < 1;
  const name = pick(p, "name", lang);
  const notes = pick(p, "notes", lang);
  const off = p.compare_at_price && p.compare_at_price > p.price ? Math.round((1 - p.price / p.compare_at_price) * 100) : 0;
  const measures = Object.entries(p.measurements ?? {}).filter(([, v]) => v) as [MeasureKey, number][];
  const condIdx = conditions.indexOf(p.condition);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `${p.brand} ${p.name_en}`,
    brand: { "@type": "Brand", name: p.brand },
    image: p.images.map((i) => (i.startsWith("http") ? i : `${site.url}${i}`)),
    sku: p.id,
    size: p.size,
    color: p.color_en,
    material: p.material_en,
    itemCondition: "https://schema.org/UsedCondition",
    offers: {
      "@type": "Offer",
      price: p.price,
      priceCurrency: "EGP",
      availability: sold ? "https://schema.org/SoldOut" : "https://schema.org/InStock",
      url: `${site.url}${href(lang, `/product/${p.slug}`)}`,
    },
  };

  return (
    <div className="container-x pb-24 pt-4 md:pb-0 md:pt-6">
      {!isSampleCatalog() && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />}
      <nav className="mb-3 hidden flex-wrap gap-1.5 text-xs text-muted sm:flex">
        <Link href={href(lang)} className="hover:text-ink">{d.nav.home}</Link>
        <span>/</span>
        <Link href={href(lang, `/shop/${p.gender === "unisex" ? "" : p.gender}`.replace(/\/$/, ""))} className="hover:text-ink">{d.genders[p.gender]}</Link>
        <span>/</span>
        <Link href={href(lang, `/shop/${p.category}`)} className="hover:text-ink">{d.categories[p.category]}</Link>
      </nav>

      <div className="grid gap-6 md:grid-cols-2 md:gap-10">
        <Gallery images={p.images} alt={`${p.brand} ${name}`} sold={sold} soldLabel={d.sold} />

        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-[0.16em] text-muted">{p.brand}</span>
            {!sold && <span className="rounded-full bg-sea-light px-2.5 py-0.5 text-[11px] font-semibold text-sea">{isSampleCatalog()?(lang==="ar"?"أكد التوفر على واتساب":"Confirm availability"):d.onlyOne}</span>}
          </div>
          <h1 className="h-display mt-1.5 text-[30px] sm:text-4xl">{name}</h1>
          <div className="mt-3 flex flex-wrap items-baseline gap-3">
            <span className={`text-2xl font-bold ${sold ? "text-muted line-through" : ""}`}>{formatPrice(p.price, lang)}</span>
            {off > 0 && !sold && (
              <>
                <span className="text-base text-muted line-through">{formatPrice(p.compare_at_price!, lang)}</span>
                <span className="rounded-full bg-clay px-2.5 py-0.5 text-xs font-bold text-cream">{d.save(off)}</span>
              </>
            )}
          </div>

          <dl className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line text-sm">
            {[
              [d.size, p.size],
              [d.condition, isSampleCatalog()?(lang==="ar"?"أكدها مع المتجر":"Confirm with the store"):d.conditions[p.condition]],
              [d.material, pick(p, "material", lang)],
              [d.color, pick(p, "color", lang)],
            ].map(([k, v]) => (
              <div key={k} className="bg-cream p-3.5">
                <dt className="text-xs text-muted">{k}</dt>
                <dd className="mt-0.5 font-semibold">{v}</dd>
              </div>
            ))}
          </dl>

          <BuyBox item={snap(p)} sold={sold} />

          <p className="mt-4 flex items-start gap-2 text-xs leading-6 text-muted">
            <Truck className="mt-0.5 h-4 w-4 shrink-0" />
            {d.shippingNote}
          </p>

          {measures.length > 0 && (
            <section className="mt-8">
              <h2 className="flex items-center gap-2 font-display text-xl">
                <Ruler className="h-5 w-5 text-clay" />
                {d.measurements}
              </h2>
              <table className="mt-3 w-full overflow-hidden rounded-2xl text-sm">
                <tbody>
                  {measures.map(([k, v], i) => (
                    <tr key={k} className={i % 2 ? "bg-paper" : "bg-cream"}>
                      <td className="px-4 py-3 text-ink-soft">{d.measures[k]}</td>
                      <td className="px-4 py-3 text-end font-semibold" dir="ltr">{v} cm</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="mt-2 text-xs leading-6 text-muted">{d.measureHint}</p>
            </section>
          )}

          <section className="mt-8 rounded-2xl border border-line bg-cream p-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">{isSampleCatalog()?(lang==="ar"?"تأكد من حالة القطعة":"Confirm the item condition"):`${d.condition}: ${d.conditions[p.condition]}`}</h2>
              <span className="flex gap-0.5">
                {[0, 1, 2].map((k) => (
                  <span key={k} className={`h-3 w-2 rounded-full ${k < 3 - condIdx ? "bg-sea" : "bg-line"}`} />
                ))}
              </span>
            </div>
            <p className="mt-1 text-sm text-muted">{isSampleCatalog()?(lang==="ar"?"اسأل المتجر عن تفاصيل الحالة وأي آثار استعمال قبل اعتماد الطلب.":"Ask the store about condition and any signs of wear before confirming your order."):d.conditionHelp[p.condition]}</p>
            {notes && (
              <p className="mt-3 flex gap-2 border-t border-line pt-3 text-sm leading-7">
                <Info className="mt-1 h-4 w-4 shrink-0 text-clay" />
                <span>{notes}</span>
              </p>
            )}
          </section>
        </div>
      </div>

      {similar.length > 0 && (
        <section className="mt-16">
          <SectionHead title={d.similar} lang={lang} more={href(lang, `/shop/${p.category}`)} moreLabel={d.viewAll} />
          <div className="grid grid-cols-2 gap-x-3 gap-y-7 sm:grid-cols-4 lg:gap-x-5">
            {similar.map((s) => (
              <ProductCard key={s.id} p={s} lang={lang} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
