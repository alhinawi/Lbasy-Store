import Link from "next/link";
import { Suspense } from "react";
import { ProductCard } from "./ProductCard";
import { FilterBar } from "./FilterBar";
import { getFacets, getProducts } from "@/lib/data";
import { href, t } from "@/lib/i18n";
import type { Lang, ProductFilters } from "@/lib/types";

export async function Listing({
  lang,
  filters,
  basePath,
  showCategoryChips = true,
}: {
  lang: Lang;
  filters: ProductFilters;
  basePath?: string;
  showCategoryChips?: boolean;
}) {
  const d = t(lang);
  const [products, facets] = await Promise.all([getProducts(filters), getFacets(filters)]);
  return (
    <>
      {showCategoryChips && basePath !== undefined && facets.categories.length > 1 && !filters.category && (
        <div className="no-scrollbar -mx-4 mb-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
          {facets.categories.map(([c, n]) => (
            <Link key={c} href={href(lang, `${basePath}/${c}`)} className="chip shrink-0 hover:border-ink">
              {d.categories[c]} <span className="opacity-50">{n}</span>
            </Link>
          ))}
        </div>
      )}
      <Suspense fallback={<div className="h-11" />}>
        <FilterBar facets={facets} total={products.length} />
      </Suspense>
      {products.length === 0 ? (
        <p className="mt-16 text-center text-muted">{d.noResults}</p>
      ) : (
        <div className="mt-5 grid grid-cols-2 gap-x-3 gap-y-7 sm:grid-cols-3 lg:grid-cols-4 lg:gap-x-5">
          {products.map((p, i) => (
            <ProductCard key={p.id} p={p} lang={lang} priority={i < 4} />
          ))}
        </div>
      )}
    </>
  );
}
