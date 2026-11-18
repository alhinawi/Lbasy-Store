import Link from "next/link";
import { isSampleCatalog } from "@/lib/data";
import { CardCarousel } from "./CardCarousel";
import { FavoriteButton } from "./FavoriteButton";
import { formatPrice, href, pick, t } from "@/lib/i18n";
import type { Lang, Product } from "@/lib/types";
import { snap } from "@/lib/snap";

export function ProductCard({
  p,
  lang,
  priority = false,
}: {
  p: Product;
  lang: Lang;
  priority?: boolean;
}) {
  const d = t(lang);
  const sold = p.stock < 1;
  const off =
    p.compare_at_price && p.compare_at_price > p.price
      ? Math.round((1 - p.price / p.compare_at_price) * 100)
      : 0;
  return (
    <article className="fashion-product-card group block min-w-0">
      <div className="fashion-product-image relative aspect-[4/5] overflow-hidden rounded-2xl bg-sand">
        <CardCarousel
          images={p.images}
          alt={`${p.brand} ${pick(p, "name", lang)}`}
          url={href(lang, `/product/${p.slug}`)}
          lang={lang}
          sold={sold}
          priority={priority}
        />
        <div className="pointer-events-none absolute inset-x-2 top-2 flex items-start justify-between gap-2">
          <div className="flex flex-col items-start gap-1">
            {sold ? (
              <span className="rounded-full bg-ink px-2.5 py-1 text-[11px] font-bold text-cream">
                {d.sold}
              </span>
            ) : off ? (
              <span className="rounded-full bg-clay px-2.5 py-1 text-[11px] font-bold text-cream">
                -{off}%
              </span>
            ) : null}
          </div>
          <div className="pointer-events-auto">
            <FavoriteButton item={snap(p)} />
          </div>
        </div>
        <span className="pointer-events-none absolute bottom-9 start-2 rounded-full bg-cream/90 px-2.5 py-1 text-[11px] font-semibold text-ink backdrop-blur">
          {p.size}
        </span>
      </div>
      <Link
        href={href(lang, `/product/${p.slug}`)}
        className="mt-2.5 block px-0.5"
      >
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-[11px] font-bold uppercase tracking-[0.12em] text-muted">
            {p.brand}
          </span>
          <span className="shrink-0 text-[11px] text-muted">
            {isSampleCatalog()
              ? lang === "ar"
                ? "أكد التوفر"
                : "Check availability"
              : d.conditions[p.condition]}
          </span>
        </div>
        <h3 className="mt-0.5 truncate text-sm text-ink">
          {pick(p, "name", lang)}
        </h3>
        <div className="mt-1 flex items-baseline gap-2">
          <span
            className={`price-label text-[15px] font-bold ${sold ? "text-muted line-through" : "text-ink"}`}
          >
            {formatPrice(p.price, lang)}
          </span>
          {!sold && off > 0 && (
            <span className="text-xs text-muted line-through">
              {formatPrice(p.compare_at_price!, lang)}
            </span>
          )}
        </div>
      </Link>
    </article>
  );
}
