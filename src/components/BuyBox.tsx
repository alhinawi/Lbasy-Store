"use client";

import Link from "next/link";
import { Check, MessageCircle, Share2, ShoppingBag } from "lucide-react";
import { useLang } from "./LangProvider";
import { FavoriteButton } from "./FavoriteButton";
import { useHydrated, useShop, type ItemSnap } from "@/lib/store";
import { formatPrice, href } from "@/lib/i18n";
import { site, whatsappLink } from "@/lib/config";

export function BuyBox({ item, sold }: { item: ItemSnap; sold: boolean }) {
  const { lang, d } = useLang();
  const hydrated = useHydrated();
  const inCart = useShop((s) => s.cart.some((c) => c.id === item.id));
  const add = useShop((s) => s.addToCart);
  const toast = useShop((s) => s.showToast);
  const url = `${site.url}${href(lang, `/product/${item.slug}`)}`;
  const name = lang === "ar" ? item.name_ar : item.name_en;
  const wa = whatsappLink(d.waProduct(name, item.brand, item.size, formatPrice(item.price, lang), url));

  const share = async () => {
    try {
      if (navigator.share) await navigator.share({ title: `${item.brand} ${name}`, url });
      else {
        await navigator.clipboard.writeText(url);
        toast(d.copied);
      }
    } catch {
      /* user closed the share sheet */
    }
  };

  const showInCart = hydrated && inCart;

  return (
    <>
      <div className="mt-6 flex gap-2.5">
        {sold ? (
          <button disabled className="btn flex-1 bg-line text-muted">{d.sold}</button>
        ) : showInCart ? (
          <Link href={href(lang, "/cart")} className="btn-primary flex-1">
            <Check className="h-4 w-4" />
            {d.inCart} · {d.goToCart}
          </Link>
        ) : (
          <button
            className="btn-clay flex-1"
            onClick={() => {
              add(item);
              toast(d.addedToCart, href(lang, "/cart"), d.goToCart);
            }}
          >
            <ShoppingBag className="h-4 w-4" />
            {d.addToCart}
          </button>
        )}
        <FavoriteButton item={item} className="h-12 w-12 border border-line" />
        <button onClick={share} className="grid h-12 w-12 shrink-0 place-items-center rounded-full border border-line bg-cream" aria-label={d.share}>
          <Share2 className="h-[18px] w-[18px]" />
        </button>
      </div>
      {!sold && (
        <a href={wa} target="_blank" rel="noopener" className="btn-wa mt-2.5 w-full">
          <MessageCircle className="h-4 w-4" />
          {d.orderWhatsapp}
        </a>
      )}

      {/* Sticky bar on mobile */}
      {!sold && (
        <div className="fixed inset-x-0 bottom-0 z-30 max-w-full border-t border-line bg-paper/95 px-4 py-3 backdrop-blur md:hidden">
          <div className="mx-auto flex w-full min-w-0 max-w-full items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs text-muted">{item.brand} · {item.size}</p>
              <p className="font-bold">{formatPrice(item.price, lang)}</p>
            </div>
            {showInCart ? (
              <Link href={href(lang, "/cart")} className="btn-primary max-w-[60%] shrink-0 whitespace-normal text-center">{d.goToCart}</Link>
            ) : (
              <button
                className="btn-clay max-w-[60%] shrink-0 whitespace-normal text-center"
                onClick={() => {
                  add(item);
                  toast(d.addedToCart, href(lang, "/cart"), d.goToCart);
                }}
              >
                {d.addToCart}
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
