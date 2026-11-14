import type { Metadata } from "next";
import { Listing } from "@/components/Listing";
import { SearchBox } from "@/components/SearchBox";
import { t } from "@/lib/i18n";
import { filtersFromSearch } from "@/lib/params";
import type { Lang } from "@/lib/types";

export const metadata: Metadata = { robots: { index: false } };

export default async function SearchPage({ params, searchParams }: PageProps<"/[lang]/search">) {
  const lang = (await params).lang as Lang;
  const d = t(lang);
  const filters = filtersFromSearch(await searchParams);
  return (
    <div className="container-x pt-6">
      <SearchBox initial={filters.q ?? ""} />
      <h1 className="h-display mb-5 mt-6 text-3xl">{filters.q ? d.searchFor(filters.q) : d.nav.search}</h1>
      {filters.q ? <Listing lang={lang} filters={filters} showCategoryChips={false} /> : null}
    </div>
  );
}
