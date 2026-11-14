import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Listing } from "@/components/Listing";
import { categories, genders, href, t } from "@/lib/i18n";
import { filtersFromSearch } from "@/lib/params";
import type { Category, Gender, Lang } from "@/lib/types";

function parse(slug: string[] | undefined) {
  const segs = slug ?? [];
  let gender: Gender | undefined;
  let category: Category | undefined;
  if (segs.length > 2) return null;
  for (const s of segs) {
    if (!gender && !category && (genders as string[]).includes(s) && s !== "unisex") gender = s as Gender;
    else if (!category && (categories as string[]).includes(s)) category = s as Category;
    else return null;
  }
  return { gender, category };
}

function titleFor(lang: Lang, gender?: Gender, category?: Category) {
  const d = t(lang);
  if (gender && category) return lang === "ar" ? `${d.categories[category]} ${d.genders[gender]}` : `${d.genders[gender]}'s ${d.categories[category].toLowerCase()}`;
  if (category) return d.categories[category];
  if (gender) return d.genders[gender];
  return d.nav.shop;
}

export async function generateMetadata({ params }: PageProps<"/[lang]/shop/[[...slug]]">): Promise<Metadata> {
  const { lang, slug } = await params;
  const parsed = parse(slug);
  if (!parsed) return {};
  const title = titleFor(lang as Lang, parsed.gender, parsed.category);
  const path = `/shop${slug?.length ? `/${slug.join("/")}` : ""}`;
  return {
    title,
    alternates: { canonical: href(lang as Lang, path), languages: { ar: path, en: `/en${path}` } },
  };
}

export default async function ShopPage({ params, searchParams }: PageProps<"/[lang]/shop/[[...slug]]">) {
  const { lang: l, slug } = await params;
  const lang = l as Lang;
  const d = t(lang);
  const parsed = parse(slug);
  if (!parsed) notFound();
  const filters = { ...filtersFromSearch(await searchParams), ...parsed };
  const title = titleFor(lang, parsed.gender, parsed.category);
  const base = parsed.gender ? `/shop/${parsed.gender}` : "/shop";

  return (
    <div className="container-x pt-6">
      <nav className="mb-2 flex flex-wrap gap-1.5 text-xs text-muted">
        <Link href={href(lang)} className="hover:text-ink">{d.nav.home}</Link>
        <span>/</span>
        <Link href={href(lang, "/shop")} className="hover:text-ink">{d.nav.shop}</Link>
        {parsed.gender && parsed.category && (
          <>
            <span>/</span>
            <Link href={href(lang, `/shop/${parsed.gender}`)} className="hover:text-ink">{d.genders[parsed.gender]}</Link>
          </>
        )}
      </nav>
      <h1 className="h-display mb-5 text-4xl">{title}</h1>
      {!parsed.gender && !parsed.category && (
        <div className="mb-3 flex gap-2">
          {(["women", "men", "kids"] as Gender[]).map((g) => (
            <Link key={g} href={href(lang, `/shop/${g}`)} className="chip px-4 py-2 text-sm hover:border-ink">
              {d.genders[g]}
            </Link>
          ))}
        </div>
      )}
      <Listing lang={lang} filters={filters} basePath={base} />
    </div>
  );
}
