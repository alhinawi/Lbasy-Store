"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Banknote, CreditCard, Loader2, MessageCircle } from "lucide-react";
import { useLang } from "./LangProvider";
import { ProductImage } from "./ProductImage";
import { useHydrated, useShop } from "@/lib/store";
import { formatPrice, href, pick } from "@/lib/i18n";
import { supabaseConfigured } from "@/lib/config";
import { site, whatsappLink } from "@/lib/config";
import { isEgyptMobile } from "@/lib/validate";
import { saveDemoOrder } from "@/lib/demo";
import { paymentProviders } from "@/lib/payments";
import type { Order, ShippingZone } from "@/lib/types";

function Field({ k, label, error, children }: { k: string; label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={k} className="label">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-clay">{error}</p>}
    </div>
  );
}

type Errors = Partial<Record<"customer_name" | "phone" | "phone2" | "governorate" | "city" | "address", string>>;

export function CheckoutForm({ zones }: { zones: ShippingZone[] }) {
  const { lang, d } = useLang();
  const router = useRouter();
  const hydrated = useHydrated();
  const cart = useShop((s) => s.cart);
  const removeFromCart = useShop((s) => s.removeFromCart);
  const clearCart = useShop((s) => s.clearCart);
  const rememberOrder = useShop((s) => s.rememberOrder);

  const [f, setF] = useState({ customer_name: "", phone: "", phone2: "", governorate: "", city: "", address: "", notes: "" });
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const zone = zones.find((z) => z.code === f.governorate);
  const subtotal = cart.reduce((s, i) => s + i.price, 0);
  const shipping = zone?.fee ?? 0;
  const total = subtotal + shipping;
  const onlineEnabled = paymentProviders.find((p) => p.id === "online")?.enabled;

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setF({ ...f, [k]: e.target.value });
    if (errors[k as keyof Errors]) setErrors({ ...errors, [k]: undefined });
  };

  const validate = () => {
    const e: Errors = {};
    if (f.customer_name.trim().length < 3) e.customer_name = d.required;
    if (!f.phone.trim()) e.phone = d.required;
    else if (!isEgyptMobile(f.phone)) e.phone = d.phoneInvalid;
    if (f.phone2.trim() && !isEgyptMobile(f.phone2)) e.phone2 = d.phoneInvalid;
    if (!f.governorate) e.governorate = d.required;
    if (!f.city.trim()) e.city = d.required;
    if (f.address.trim().length < 6) e.address = d.required;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const waText = () => {
    const lines = cart.map((i, n) => `${n + 1}. ${i.brand} - ${lang === "ar" ? i.name_ar : i.name_en} (${i.size}) - ${formatPrice(i.price, lang)}\n${site.url}${href(lang, `/product/${i.slug}`)}`);
    const who = [f.customer_name, f.phone, zone ? pick(zone, "name", lang) : "", f.city, f.address].filter(Boolean).join(" - ");
    return [d.waCartIntro, ...lines, `${d.total}: ${formatPrice(total, lang)}`, who].filter(Boolean).join("\n\n");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    if (!validate()) {
      document.querySelector("[aria-invalid=true]")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...f, item_ids: cart.map((i) => i.id), payment_method: "cod" }),
      });
      const data = await res.json();
      if (res.status === 409 && data.sold) {
        (data.sold as string[]).forEach((id) => removeFromCart(id));
        setMsg(d.soldWhileShopping);
        return;
      }
      if (!res.ok) throw new Error(data.error);
      const order = data.order as Order;
      rememberOrder(order);
      if (data.demo) saveDemoOrder(order);
      clearCart();
      router.push(`${href(lang, `/order/${order.number}`)}`);
    } catch {
      setMsg(d.orderFailed);
    } finally {
      setBusy(false);
    }
  };

  if (!hydrated) return <div className="container-x min-h-[50vh] pt-8" />;
  if (cart.length === 0)
    return (
      <div className="container-x flex min-h-[50vh] flex-col items-center justify-center text-center">
        <h1 className="h-display text-3xl">{d.cartEmpty}</h1>
        {msg && <p className="mt-3 text-sm text-clay">{msg}</p>}
        <Link href={href(lang, "/shop")} className="btn-primary mt-6">{d.heroCta}</Link>
      </div>
    );

  if (!supabaseConfigured) return <section className="container-x py-12 min-h-[50vh]"><h1 className="h-display text-3xl">{lang==="ar"?"أكد لُقطتك معانا":"Confirm your find"}</h1><p className="my-5 max-w-xl text-sm leading-8">{lang==="ar"?"ابعت اختياراتك على واتساب. هنأكدلك التوفر والسعر والحالة والمقاسات وتكلفة الشحن قبل اعتماد أي طلب. إضافة القطعة للسلة مش حجز، ومفيش أي دفع أونلاين هنا.":"Send your choices on WhatsApp. We will confirm availability, price, condition, measurements and shipping before any order is final. Adding an item to the bag does not reserve it. No online payment is taken here."}</p><a className="btn-wa" href={whatsappLink(waText())} target="_blank" rel="noopener"><MessageCircle size={18}/>{lang==="ar"?"تأكيد التوفر على واتساب":"Check availability on WhatsApp"}</a></section>;

  return (
    <form onSubmit={submit} noValidate className="container-x pb-10 pt-6">
      <h1 className="h-display text-4xl">{d.checkoutTitle}</h1>
      <div className="mt-6 grid gap-8 md:grid-cols-[1.4fr_1fr]">
        <div className="space-y-4">
          <Field k="customer_name" label={d.fullName} error={errors.customer_name}>
            <input id="customer_name" autoComplete="name" value={f.customer_name} onChange={set("customer_name")} className="field" aria-invalid={!!errors.customer_name} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field k="phone" label={d.phone} error={errors.phone}>
              <input id="phone" type="tel" inputMode="tel" autoComplete="tel" dir="ltr" placeholder="01XXXXXXXXX" value={f.phone} onChange={set("phone")} className="field text-start rtl:text-right" aria-invalid={!!errors.phone} />
            </Field>
            <Field k="phone2" label={d.phone2} error={errors.phone2}>
              <input id="phone2" type="tel" inputMode="tel" dir="ltr" value={f.phone2} onChange={set("phone2")} className="field rtl:text-right" aria-invalid={!!errors.phone2} />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field k="governorate" label={d.governorate} error={errors.governorate}>
              <select id="governorate" value={f.governorate} onChange={set("governorate")} className="field" aria-invalid={!!errors.governorate}>
                <option value="">{d.chooseGov}</option>
                {zones.map((z) => (
                  <option key={z.code} value={z.code}>
                    {pick(z, "name", lang)} — {formatPrice(z.fee, lang)}
                  </option>
                ))}
              </select>
            </Field>
            <Field k="city" label={d.city} error={errors.city}>
              <input id="city" autoComplete="address-level2" value={f.city} onChange={set("city")} className="field" aria-invalid={!!errors.city} />
            </Field>
          </div>
          <Field k="address" label={d.address} error={errors.address}>
            <textarea id="address" rows={2} autoComplete="street-address" placeholder={d.addressPh} value={f.address} onChange={set("address")} className="field resize-none" aria-invalid={!!errors.address} />
          </Field>
          <div>
            <label htmlFor="notes" className="label">{d.orderNotes}</label>
            <input id="notes" value={f.notes} onChange={set("notes")} className="field" />
          </div>

          <fieldset className="pt-2">
            <legend className="label">{d.payment}</legend>
            <div className="space-y-2.5">
              <label className="flex cursor-pointer items-start gap-3 rounded-2xl border-2 border-ink bg-cream p-4">
                <input type="radio" name="pay" defaultChecked className="mt-1 accent-[var(--color-ink)]" />
                <Banknote className="mt-0.5 h-5 w-5 shrink-0 text-sea" />
                <span>
                  <span className="block font-semibold">{d.cod}</span>
                  <span className="block text-xs text-muted">{d.codText}</span>
                </span>
              </label>
              <label className={`flex items-center gap-3 rounded-2xl border border-line p-4 ${onlineEnabled ? "" : "opacity-55"}`}>
                <input type="radio" name="pay" disabled={!onlineEnabled} />
                <CreditCard className="h-5 w-5 shrink-0" />
                <span className="font-semibold">{d.online}</span>
                {!onlineEnabled && <span className="ms-auto rounded-full bg-sand px-2.5 py-0.5 text-xs">{d.soon}</span>}
              </label>
            </div>
          </fieldset>
        </div>

        <aside className="h-fit rounded-2xl border border-line bg-cream p-5 md:sticky md:top-24">
          <ul className="space-y-3">
            {cart.map((i) => (
              <li key={i.id} className="flex items-center gap-3">
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
          <dl className="mt-5 space-y-2.5 border-t border-line pt-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted">{d.subtotal}</dt>
              <dd>{formatPrice(subtotal, lang)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">{d.shipping}{zone ? ` (${pick(zone, "name", lang)})` : ""}</dt>
              <dd>{zone ? formatPrice(shipping, lang) : "—"}</dd>
            </div>
            <div className="flex justify-between border-t border-line pt-3 text-base font-bold">
              <dt>{d.total}</dt>
              <dd>{formatPrice(total, lang)}</dd>
            </div>
          </dl>
          {msg && <p className="mt-4 rounded-xl bg-clay/10 p-3 text-sm text-clay-dark">{msg}</p>}
          <button type="submit" disabled={busy} className="btn-clay mt-5 w-full py-3.5 text-base">
            {busy ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {d.placing}
              </>
            ) : (
              <>
                {d.placeOrder} · {formatPrice(total, lang)}
              </>
            )}
          </button>
          <a href={whatsappLink(waText())} target="_blank" rel="noopener" className="btn-wa mt-2.5 w-full">
            <MessageCircle className="h-4 w-4" />
            {d.orWhatsapp}
          </a>
        </aside>
      </div>
    </form>
  );
}
