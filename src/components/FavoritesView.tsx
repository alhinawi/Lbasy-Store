"use client";

import Link from "next/link";
import { useEffect } from "react";
import { api } from "@/lib/account";
import { Heart } from "lucide-react";
import { useLang } from "./LangProvider";
import { CardCarousel } from "./CardCarousel";
import { FavoriteButton } from "./FavoriteButton";
import { useHydrated, useShop } from "@/lib/store";
import { formatPrice, href } from "@/lib/i18n";

export function FavoritesView() {
  const { lang, d } = useLang();
  const hydrated = useHydrated();
  const favs = useShop((s) => s.favorites);
  const missing = favs
    .filter((i) => !i.images?.length)
    .map((i) => i.id)
    .sort()
    .join(",");
  useEffect(() => {
    if (!missing) return;
    let cancelled = false;
    api<{ items: { id: string; images: string[] }[] }>(
      "/catalog/images?ids=" + encodeURIComponent(missing),
    )
      .then(({ items }) => {
        if (cancelled) return;
        useShop.setState((s) => ({
          favorites: s.favorites.map((i) => {
            const current = items.find((x) => x.id === i.id);
            return current ? { ...i, images: current.images } : i;
          }),
        }));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [missing]);

  return (
    <div className="container-x pt-6">
      <h1 className="h-display text-4xl">{d.favorites}</h1>
      {hydrated && favs.length === 0 && (
        <div className="flex min-h-[40vh] flex-col items-center justify-center text-center">
          <span className="grid h-20 w-20 place-items-center rounded-full bg-sand">
            <Heart className="h-8 w-8 text-muted" />
          </span>
          <p className="mt-5 max-w-xs text-muted">{d.favEmpty}</p>
          <Link href={href(lang, "/shop")} className="btn-primary mt-6">
            {d.heroCta}
          </Link>
        </div>
      )}
      {hydrated && favs.length > 0 && (
        <div className="mt-6 grid grid-cols-2 gap-x-3 gap-y-7 sm:grid-cols-3 lg:grid-cols-4 lg:gap-x-5">
          {favs.map((i) => (
            <article key={i.id} className="group block min-w-0">
              <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-sand">
                <CardCarousel
                  images={i.images?.length ? i.images : [i.image]}
                  alt={lang === "ar" ? i.name_ar : i.name_en}
                  url={href(lang, `/product/${i.slug}`)}
                  lang={lang}
                  sold={i.stock < 1}
                />
                <FavoriteButton item={i} className="absolute end-2 top-2" />
                <span className="pointer-events-none absolute bottom-9 start-2 rounded-full bg-cream/90 px-2.5 py-1 text-[11px] font-semibold">
                  {i.size}
                </span>
              </div>
              <Link href={href(lang, `/product/${i.slug}`)} className="block">
                <p className="mt-2.5 text-[11px] font-bold uppercase tracking-[0.12em] text-muted">
                  {i.brand}
                </p>
                <h3 className="truncate text-sm">
                  {lang === "ar" ? i.name_ar : i.name_en}
                </h3>
                <p className="mt-1 text-[15px] font-bold">
                  {formatPrice(i.price, lang)}
                </p>
              </Link>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
