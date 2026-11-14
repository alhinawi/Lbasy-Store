import Image from "next/image";
import Link from "next/link";
import { BadgeCheck, Camera, Ruler, Truck, Wallet, Ship, Sparkles, Scissors } from "lucide-react";
import { ProductCard } from "@/components/ProductCard";
import { ProductImage } from "@/components/ProductImage";
import { SectionHead } from "@/components/Section";
import { getDrops, getProducts } from "@/lib/data";
import { conditions, formatDate, href, pick, t } from "@/lib/i18n";
import { whatsappLink } from "@/lib/config";
import type { Lang } from "@/lib/types";


export default async function Home({ params }: PageProps<"/[lang]">) {
  const lang = (await params).lang as Lang;
  const d = t(lang);
  const [all, drops] = await Promise.all([getProducts(), getDrops()]);
  const available = all.filter((p) => p.stock > 0);
  const latestDrop = drops[0];
  const dropItems = latestDrop ? all.filter((p) => p.drop_slug === latestDrop.slug) : [];
  const newArrivals = available.slice(0, 8);
  const picks = available.filter((p) => p.featured).slice(0, 4);

  const tile = (slug: string) => all.find((p) => p.slug === slug)?.images[0] ?? "/brand/hero-portrait.webp";
  const tiles = [
    { to: "/shop/women", label: d.nav.women, img: tile("zara-wool-coat-camel") },
    { to: "/shop/men", label: d.nav.men, img: tile("carhartt-detroit-jacket-brown") },
    { to: "/shop/kids", label: d.nav.kids, img: tile("columbia-kids-puffer-red") },
    { to: "/shop/shoes", label: d.categories.shoes, img: tile("dr-martens-1460-cherry") },
    { to: "/shop/bags", label: d.categories.bags, img: tile("michael-kors-leather-tote") },
    { to: "/shop/jeans", label: d.categories.jeans, img: tile("levis-501-mid-blue") },
  ];
  const trustIcons = [Camera, Ruler, Wallet, Truck];
  const howIcons = [Ship, Sparkles, Scissors];

  return (
    <>
      {/* Hero */}
      <section className="container-x pt-4 sm:pt-6">
        <div className="relative overflow-hidden rounded-[28px] bg-ink">
          <div className="relative aspect-[4/5] sm:aspect-[16/8]">
            <Image
              src="/brand/hero-portrait.webp"
              alt=""
              fill
              priority
              sizes="100vw"
              className="object-cover sm:hidden"
              quality={75}
            />
            <Image
              src="/brand/hero-wide.webp"
              alt=""
              fill
              priority
              sizes="(min-width: 1152px) 1152px, 100vw"
              className="hidden object-cover sm:block"
              quality={75}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/35 to-ink/5" />
          </div>
          <div className="absolute inset-x-0 bottom-0 p-6 sm:p-10">
            <span className="inline-flex items-center gap-2 rounded-full bg-cream/15 px-3 py-1.5 text-[11px] font-semibold text-cream backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-gold" />
              {d.brandTagline}
            </span>
            <h1 className="h-display mt-4 max-w-xl text-[40px] text-cream sm:text-6xl">{d.heroTitle}</h1>
            <p className="mt-3 max-w-md text-sm leading-7 text-cream/80 sm:text-base">{d.heroText}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href={href(lang, "/shop")} className="btn bg-cream text-ink hover:bg-paper">
                {d.heroCta}
              </Link>
              {latestDrop && (
                <Link href={href(lang, `/drops/${latestDrop.slug}`)} className="btn border border-cream/40 text-cream hover:bg-cream/10">
                  {d.heroCta2}
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="container-x mt-6">
        <div className="no-scrollbar -mx-4 flex snap-x gap-3 overflow-x-auto px-4 sm:mx-0 sm:grid sm:grid-cols-4 sm:px-0">
          {d.trust.map((x, i) => {
            const Icon = trustIcons[i];
            return (
              <div key={x.t} className="flex min-w-[68%] snap-start items-center gap-3 rounded-2xl border border-line bg-cream p-4 sm:min-w-0">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-sea-light text-sea">
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold">{x.t}</p>
                  <p className="text-xs text-muted">{x.d}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Just landed drop */}
      {latestDrop && (
        <section className="container-x mt-14">
          <div className="overflow-hidden rounded-[28px] bg-sea text-cream">
            <div className="grid gap-6 p-6 sm:grid-cols-[1fr_1.6fr] sm:p-8">
              <div className="flex flex-col">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gold">{d.justLanded}</p>
                <h2 className="h-display mt-2 text-3xl sm:text-4xl">{pick(latestDrop, "title", lang)}</h2>
                <p className="mt-2 text-sm leading-7 text-cream/75">{pick(latestDrop, "subtitle", lang)}</p>
                <div className="ticket mt-5 flex items-center justify-between rounded-xl bg-cream/10 px-5 py-3 text-sm">
                  <span>
                    {d.landed} {formatDate(latestDrop.date, lang)}
                  </span>
                  <span className="font-bold">{d.pieces(dropItems.length)}</span>
                </div>
                <Link href={href(lang, `/drops/${latestDrop.slug}`)} className="btn mt-5 self-start bg-cream text-sea hover:bg-paper">
                  {d.shopDrop}
                </Link>
              </div>
              <div className="no-scrollbar -mx-6 flex snap-x gap-3 overflow-x-auto px-6 sm:mx-0 sm:px-0">
                {dropItems.slice(0, 8).map((p) => (
                  <Link key={p.id} href={href(lang, `/product/${p.slug}`)} className="w-[42%] shrink-0 snap-start sm:w-[30%]">
                    <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-cream/10">
                      <ProductImage src={p.images[0]} alt={pick(p, "name", lang)} fill sizes="(min-width: 640px) 20vw, 42vw" className={`object-cover ${p.stock < 1 ? "opacity-50" : ""}`} quality={70} />
                      {p.stock < 1 && <span className="absolute start-2 top-2 rounded-full bg-ink px-2 py-0.5 text-[10px] font-bold">{d.sold}</span>}
                    </div>
                    <p className="mt-2 truncate text-[11px] font-bold uppercase tracking-wider text-cream/60">{p.brand}</p>
                    <p className="text-sm font-semibold">{new Intl.NumberFormat(lang === "ar" ? "ar-EG" : "en-EG").format(p.price)} {lang === "ar" ? "ج" : "EGP"}</p>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Categories */}
      <section className="container-x mt-14">
        <SectionHead title={d.shopByCategory} lang={lang} />
        <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-6 sm:gap-4">
          {tiles.map((c) => (
            <Link key={c.to} href={href(lang, c.to)} className="group relative aspect-[3/4] overflow-hidden rounded-2xl bg-sand">
              <ProductImage src={c.img} alt="" fill sizes="(min-width: 640px) 16vw, 33vw" className="object-cover transition duration-500 group-hover:scale-105" quality={70} />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/75 via-ink/10 to-transparent" />
              <span className="absolute inset-x-0 bottom-0 p-2.5 text-center font-display text-base text-cream sm:text-lg">{c.label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* New arrivals */}
      <section className="container-x mt-14">
        <SectionHead title={d.newArrivals} eyebrow={d.brandTagline} more={href(lang, "/shop")} moreLabel={d.viewAll} lang={lang} />
        <div className="grid grid-cols-2 gap-x-3 gap-y-7 sm:grid-cols-3 lg:grid-cols-4 lg:gap-x-5">
          {newArrivals.map((p) => (
            <ProductCard key={p.id} p={p} lang={lang} />
          ))}
        </div>
      </section>

      {/* How we source */}
      <section className="mt-16 bg-sand/70 py-14">
        <div className="container-x">
          <SectionHead title={d.howTitle} lang={lang} />
          <div className="grid gap-3 sm:grid-cols-3">
            {d.how.map((s, i) => {
              const Icon = howIcons[i];
              return (
                <div key={s.t} className="rounded-2xl bg-cream p-5">
                  <div className="flex items-center gap-3">
                    <span className="grid h-11 w-11 place-items-center rounded-full bg-clay text-cream">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="font-display text-4xl text-line">{new Intl.NumberFormat(lang === "ar" ? "ar-EG" : "en").format(i + 1)}</span>
                  </div>
                  <h3 className="mt-4 text-lg font-semibold">{s.t}</h3>
                  <p className="mt-1 text-sm leading-7 text-muted">{s.d}</p>
                </div>
              );
            })}
          </div>

          <div id="condition" className="mt-10 scroll-mt-24 rounded-2xl border border-line bg-paper p-5 sm:p-6">
            <h3 className="flex items-center gap-2 font-display text-xl">
              <BadgeCheck className="h-5 w-5 text-sea" />
              {d.conditionGuide}
            </h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {conditions.map((c, i) => (
                <div key={c} className="flex gap-3">
                  <span className="mt-1 flex gap-0.5">
                    {[0, 1, 2].map((k) => (
                      <span key={k} className={`h-2.5 w-1.5 rounded-full ${k < 3 - i ? "bg-sea" : "bg-line"}`} />
                    ))}
                  </span>
                  <div>
                    <p className="text-sm font-semibold">{d.conditions[c]}</p>
                    <p className="text-xs leading-6 text-muted">{d.conditionHelp[c]}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Picks */}
      {picks.length > 0 && (
        <section className="container-x mt-14">
          <SectionHead title={d.editorsPicks} more={href(lang, "/shop")} moreLabel={d.viewAll} lang={lang} />
          <div className="grid grid-cols-2 gap-x-3 gap-y-7 sm:grid-cols-4 lg:gap-x-5">
            {picks.map((p) => (
              <ProductCard key={p.id} p={p} lang={lang} />
            ))}
          </div>
        </section>
      )}

      {/* WhatsApp */}
      <section className="container-x mt-14">
        <div className="grain flex flex-col items-start gap-4 rounded-[28px] border border-line bg-cream p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div>
            <h2 className="h-display text-2xl sm:text-3xl">{d.waTitle}</h2>
            <p className="mt-2 max-w-lg text-sm leading-7 text-muted">{d.waText}</p>
          </div>
          <a href={whatsappLink(d.waGeneral)} target="_blank" rel="noopener" className="btn-wa shrink-0">
            {d.waCta}
          </a>
        </div>
      </section>
    </>
  );
}
