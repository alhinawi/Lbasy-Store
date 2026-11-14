import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Listing } from "@/components/Listing";
import { getDrop } from "@/lib/data";
import { formatDate, href, pick, t } from "@/lib/i18n";
import { filtersFromSearch } from "@/lib/params";
import type { Lang } from "@/lib/types";

export async function generateMetadata({ params }: PageProps<"/[lang]/drops/[slug]">): Promise<Metadata> {
  const { lang: l, slug } = await params;
  const lang = l as Lang;
  const drop = await getDrop(slug);
  if (!drop) return {};
  const path = `/drops/${slug}`;
  return {
    title: pick(drop, "title", lang),
    description: pick(drop, "subtitle", lang),
    alternates: { canonical: href(lang, path), languages: { ar: path, en: `/en${path}` } },
    openGraph: { images: [drop.cover] },
  };
}

export default async function DropPage({ params, searchParams }: PageProps<"/[lang]/drops/[slug]">) {
  const { lang: l, slug } = await params;
  const lang = l as Lang;
  const d = t(lang);
  const drop = await getDrop(slug);
  if (!drop) notFound();
  const filters = { ...filtersFromSearch(await searchParams), drop: slug };
  return (
    <div className="container-x pt-6">
      <nav className="mb-2 flex gap-1.5 text-xs text-muted">
        <Link href={href(lang, "/drops")} className="hover:text-ink">{d.allDrops}</Link>
      </nav>
      <p className="eyebrow">{d.landed} {formatDate(drop.date, lang)}</p>
      <h1 className="h-display mt-1 text-4xl">{pick(drop, "title", lang)}</h1>
      <p className="mb-6 mt-2 text-muted">{pick(drop, "subtitle", lang)}</p>
      <Listing lang={lang} filters={filters} showCategoryChips={false} />
    </div>
  );
}
