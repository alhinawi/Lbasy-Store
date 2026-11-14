import Link from "next/link";
import { isSampleCatalog } from "@/lib/data";
import { ProductImage } from "./ProductImage";
import { FavoriteButton } from "./FavoriteButton";
import { formatPrice, href, pick, t } from "@/lib/i18n";
import type { Lang, Product } from "@/lib/types";
import { snap } from "@/lib/snap";

export function ProductCard({ p, lang, priority = false }: { p: Product; lang: Lang; priority?: boolean }) {
  const d = t(lang);
  const sold = p.stock < 1;
  const off = p.compare_at_price && p.compare_at_price > p.price ? Math.round((1 - p.price / p.compare_at_price) * 100) : 0;
  return (
    <Link href={href(lang, `/product/${p.slug}`)} className="fashion-product-card group block">
      <div className="fashion-product-image relative aspect-[4/5] overflow-hidden rounded-2xl bg-sand">
        <ProductImage
          src={p.images[0]}
          alt={`${p.brand} ${pick(p, "name", lang)}`}
          fill
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
          className={`object-cover transition duration-500 group-hover:scale-[1.03] ${sold ? "opacity-60 grayscale-[40%]" : ""}`}
          priority={priority}
          quality={70}
        />
        {p.images[1] && !sold && (
          <ProductImage
            src={p.images[1]}
            alt=""
            fill
            sizes="(min-width: 1024px) 25vw, 33vw"
            className="hidden object-cover opacity-0 transition duration-500 group-hover:opacity-100 md:block"
            quality={70}
          />
        )}
        <div className="absolute inset-x-2 top-2 flex items-start justify-between gap-2">
          <div className="flex flex-col items-start gap-1">
            {sold ? (
              <span className="rounded-full bg-ink px-2.5 py-1 text-[11px] font-bold text-cream">{d.sold}</span>
            ) : off ? (
              <span className="rounded-full bg-clay px-2.5 py-1 text-[11px] font-bold text-cream">-{off}%</span>
            ) : null}
          </div>
          <FavoriteButton item={snap(p)} />
        </div>
        <span className="absolute bottom-2 start-2 rounded-full bg-cream/90 px-2.5 py-1 text-[11px] font-semibold text-ink backdrop-blur">
          {p.size}
        </span>
      </div>
      <div className="mt-2.5 px-0.5">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-[11px] font-bold uppercase tracking-[0.12em] text-muted">{p.brand}</span>
          <span className="shrink-0 text-[11px] text-muted">{isSampleCatalog()?(lang==="ar"?"أكد التوفر":"Check availability"):d.conditions[p.condition]}</span>
        </div>
        <h3 className="mt-0.5 truncate text-sm text-ink">{pick(p, "name", lang)}</h3>
        <div className="mt-1 flex items-baseline gap-2">
          <span className={`price-label text-[15px] font-bold ${sold ? "text-muted line-through" : "text-ink"}`}>{formatPrice(p.price, lang)}</span>
          {!sold && off > 0 && <span className="text-xs text-muted line-through">{formatPrice(p.compare_at_price!, lang)}</span>}
        </div>
      </div>
    </Link>
  );
}
