"use client";

import Link from "next/link";
import { CheckCircle2, MessageCircle } from "lucide-react";
import { useLang } from "./LangProvider";
import { ProductImage } from "./ProductImage";
import { useHydrated, useShop } from "@/lib/store";
import { formatPrice, href } from "@/lib/i18n";
import { whatsappLink } from "@/lib/config";
import { sampleShipping } from "@/lib/seed";

export function OrderConfirmation({ number }: { number: string }) {
  const { lang, d } = useLang();
  const hydrated = useHydrated();
  const order = useShop((s) => s.lastOrders.find((o) => o.number === number));

  if (!hydrated) return <div className="container-x min-h-[50vh]" />;
  if (!order)
    return (
      <div className="container-x flex min-h-[50vh] flex-col items-center justify-center text-center">
        <p className="text-muted">{d.noOrder}</p>
        <Link href={href(lang)} className="btn-primary mt-5">{d.backHome}</Link>
      </div>
    );

  const zone = sampleShipping.find((z) => z.code === order.governorate);
  const govName = zone ? (lang === "ar" ? zone.name_ar : zone.name_en) : order.governorate;
  const wa = whatsappLink(`${d.waGeneral}\n${d.orderNumber}: ${order.number}`);

  return (
    <div className="container-x max-w-2xl pt-10">
      <div className="animate-fade-up text-center">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-sea-light">
          <CheckCircle2 className="h-8 w-8 text-sea" />
        </span>
        <h1 className="h-display mt-5 text-4xl">{d.thanks}</h1>
        <p className="mt-2 text-muted">{d.thanksText}</p>
        <p className="mt-5 inline-flex items-center gap-2 rounded-full border border-line bg-cream px-4 py-2 text-sm">
          {d.orderNumber}
          <strong dir="ltr" className="tracking-wider">{order.number}</strong>
        </p>
      </div>

      <div className="mt-8 rounded-2xl border border-line bg-cream p-5">
        <ul className="space-y-3">
          {order.items.map((i) => (
            <li key={i.product_id} className="flex items-center gap-3">
              <div className="relative aspect-[4/5] w-14 shrink-0 overflow-hidden rounded-lg bg-sand">
                <ProductImage src={i.image} alt="" fill sizes="56px" className="object-cover" quality={70} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm">{lang === "ar" ? i.name_ar : i.name_en}</p>
                <p className="text-xs text-muted">{i.brand} · {i.size}</p>
              </div>
              <span className="text-sm font-semibold">{formatPrice(i.price, lang)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-5 space-y-2 border-t border-line pt-4 text-sm">
          <div className="flex justify-between"><dt className="text-muted">{d.subtotal}</dt><dd>{formatPrice(order.subtotal, lang)}</dd></div>
          <div className="flex justify-between"><dt className="text-muted">{d.shipping}</dt><dd>{formatPrice(order.shipping, lang)}</dd></div>
          <div className="flex justify-between border-t border-line pt-3 text-base font-bold"><dt>{d.total} · {d.cod}</dt><dd>{formatPrice(order.total, lang)}</dd></div>
        </dl>
        <div className="mt-5 rounded-xl bg-paper p-4 text-sm leading-7">
          <p className="text-xs text-muted">{d.deliverTo}</p>
          <p className="font-semibold">{order.customer_name} · <span dir="ltr">{order.phone}</span></p>
          <p>{govName}، {order.city}، {order.address}</p>
          {zone && <p className="mt-1 text-xs text-muted">{d.expected} {zone.days} {d.days}</p>}
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
        <a href={wa} target="_blank" rel="noopener" className="btn-wa flex-1">
          <MessageCircle className="h-4 w-4" />
          {d.trackWhatsapp}
        </a>
        <Link href={href(lang, "/shop")} className="btn-ghost flex-1">{d.continueShopping}</Link>
      </div>
    </div>
  );
}
