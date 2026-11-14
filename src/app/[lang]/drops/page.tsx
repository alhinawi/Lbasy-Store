import type { Metadata } from "next";
import Link from "next/link";
import { ProductImage } from "@/components/ProductImage";
import { getDrops, getProducts } from "@/lib/data";
import { formatDate, href, pick, t } from "@/lib/i18n";
import type { Lang } from "@/lib/types";

export const revalidate = 60;

export async function generateMetadata({ params }: PageProps<"/[lang]/drops">): Promise<Metadata> {
  const lang = (await params).lang as Lang;
  return { title: t(lang).allDrops, alternates: { canonical: href(lang, "/drops"), languages: { ar: "/drops", en: "/en/drops" } } };
}

export default async function DropsPage({ params }: PageProps<"/[lang]/drops">) {
  const lang = (await params).lang as Lang;
  const d = t(lang);
  const [drops, products] = await Promise.all([getDrops(), getProducts()]);
  return (
    <div className="container-x pt-6">
      <h1 className="h-display text-4xl">{d.allDrops}</h1>
      <p className="mt-2 text-muted">{d.dropsText}</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {drops.map((drop, i) => {
          const items = products.filter((p) => p.drop_slug === drop.slug);
          const left = items.filter((p) => p.stock > 0).length;
          return (
            <Link key={drop.slug} href={href(lang, `/drops/${drop.slug}`)} className={`group overflow-hidden rounded-[24px] ${i === 0 ? "bg-sea text-cream sm:col-span-2" : "border border-line bg-cream"}`}>
              <div className={`relative ${i === 0 ? "aspect-[16/9] sm:aspect-[21/8]" : "aspect-[16/9]"}`}>
                <ProductImage src={drop.cover} alt="" fill sizes="(min-width: 640px) 50vw, 100vw" className="object-cover transition duration-700 group-hover:scale-[1.03]" quality={70} />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/70 to-transparent" />
                <span className="absolute start-4 top-4 rounded-full bg-cream px-3 py-1 text-xs font-semibold text-ink">
                  {d.landed} {formatDate(drop.date, lang)}
                </span>
              </div>
              <div className="flex items-end justify-between gap-4 p-5">
                <div>
                  <h2 className="h-display text-2xl">{pick(drop, "title", lang)}</h2>
                  <p className={`mt-1 text-sm ${i === 0 ? "text-cream/75" : "text-muted"}`}>{pick(drop, "subtitle", lang)}</p>
                </div>
                <span className={`shrink-0 text-sm font-semibold ${i === 0 ? "text-gold" : "text-clay"}`}>
                  {d.pieces(left)}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
