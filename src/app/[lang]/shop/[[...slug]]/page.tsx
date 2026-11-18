import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
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
      {parsed.gender === "kids" && (
        <section className="mb-8 grid overflow-hidden border border-line sm:grid-cols-2" aria-label={lang === "ar" ? "ستايل الأطفال" : "Kids editorial"}>
          <div className="relative h-80 bg-cream sm:h-96">
            <Image src="/editorial/kids-denim.webp" alt={lang === "ar" ? "طفل يرتدي جاكيت وبنطلون جينز" : "Child wearing a denim jacket and jeans"} fill sizes="(max-width: 700px) 90vw, 45vw" className="object-cover object-[50%_35%]" />
          </div>
          <div className="flex flex-col justify-center gap-4 p-7 sm:p-10">
            <span className="editorial-kicker">THE LITTLE REWEAR EDIT</span>
            <h2 className="text-3xl">{lang === "ar" ? "ستايل صغير. حكايات كبيرة." : "Little pieces. Big stories."}</h2>
            <p className="text-sm leading-7">{lang === "ar" ? "اختيارات للأطفال، قطعة قطعة. شوف المقاس والحالة في تفاصيل كل قطعة." : "One-of-a-kind finds for kids. Check each listing for its size and condition."}</p>
            <small className="text-xs text-muted">{lang === "ar" ? "صورة ستايل توضيحية، مش تصوير لمنتج معروض للبيع." : "Editorial style photograph, not an image of a listed product."}</small>
          </div>
        </section>
      )}
      <Listing lang={lang} filters={filters} basePath={base} />
    </div>
  );
}
