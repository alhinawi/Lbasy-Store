"use client";

import Link from "next/link";
import { ShoppingBag, X, Clock } from "lucide-react";
import { useLang } from "./LangProvider";
import { ProductImage } from "./ProductImage";
import { useHydrated, useShop } from "@/lib/store";
import { formatPrice, href } from "@/lib/i18n";

export function CartView() {
  const { lang, d } = useLang();
  const hydrated = useHydrated();
  const cart = useShop((s) => s.cart);
  const remove = useShop((s) => s.removeFromCart);
  const subtotal = cart.reduce((s, i) => s + i.price, 0);

  if (!hydrated) return <div className="container-x min-h-[50vh] pt-8" />;

  if (cart.length === 0)
    return (
      <div className="container-x flex min-h-[55vh] flex-col items-center justify-center pt-8 text-center">
        <span className="grid h-20 w-20 place-items-center rounded-full bg-sand">
          <ShoppingBag className="h-8 w-8 text-muted" />
        </span>
        <h1 className="h-display mt-5 text-3xl">{d.cartEmpty}</h1>
        <p className="mt-2 text-muted">{d.cartEmptyText}</p>
        <Link href={href(lang, "/shop")} className="btn-primary mt-6">{d.heroCta}</Link>
      </div>
    );

  return (
    <div className="container-x pb-32 pt-6 md:pb-0">
      <h1 className="h-display text-4xl">{d.cart}</h1>
      <p className="mt-1 text-sm text-muted">{d.results(cart.length)}</p>
      <div className="mt-6 grid gap-8 md:grid-cols-[1.5fr_1fr]">
        <ul className="divide-y divide-line border-y border-line">
          {cart.map((i) => (
            <li key={i.id} className="flex gap-4 py-4">
              <Link href={href(lang, `/product/${i.slug}`)} className="relative aspect-[4/5] w-24 shrink-0 overflow-hidden rounded-xl bg-sand">
                <ProductImage src={i.image} alt="" fill sizes="96px" className="object-cover" quality={70} />
              </Link>
              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-muted">{i.brand}</p>
                    <Link href={href(lang, `/product/${i.slug}`)} className="line-clamp-2 text-sm font-medium">
                      {lang === "ar" ? i.name_ar : i.name_en}
                    </Link>
                  </div>
                  <button onClick={() => remove(i.id)} className="grid h-8 w-8 shrink-0 place-items-center rounded-full hover:bg-sand" aria-label={d.remove}>
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <p className="mt-1 text-xs text-muted">
                  {d.size}: {i.size} · {d.conditions[i.condition]}
                </p>
                <p className="mt-auto pt-2 font-bold">{formatPrice(i.price, lang)}</p>
              </div>
            </li>
          ))}
        </ul>

        <aside className="h-fit rounded-2xl border border-line bg-cream p-5 md:sticky md:top-24">
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted">{d.subtotal}</dt>
              <dd className="font-semibold">{formatPrice(subtotal, lang)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">{d.shipping}</dt>
              <dd className="text-muted">{d.shippingAtCheckout}</dd>
            </div>
          </dl>
          <p className="mt-4 flex gap-2 rounded-xl bg-sand/70 p-3 text-xs leading-6 text-ink-soft">
            <Clock className="mt-0.5 h-4 w-4 shrink-0 text-clay" />
            {d.cartReserveNote}
          </p>
          <Link href={href(lang, "/checkout")} className="btn-clay mt-4 hidden w-full md:flex">{d.checkout}</Link>
          <Link href={href(lang, "/shop")} className="btn-ghost mt-2.5 hidden w-full md:flex">{d.continueShopping}</Link>
        </aside>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-paper/95 px-4 py-3 backdrop-blur md:hidden">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <p className="text-xs text-muted">{d.subtotal}</p>
            <p className="font-bold">{formatPrice(subtotal, lang)}</p>
          </div>
          <Link href={href(lang, "/checkout")} className="btn-clay px-8">{d.checkout}</Link>
        </div>
      </div>
    </div>
  );
}
