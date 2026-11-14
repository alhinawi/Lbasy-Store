import Link from "next/link";
import { Wordmark } from "./Logo";
import { href, t, categories } from "@/lib/i18n";
import { site, whatsappLink } from "@/lib/config";
import type { Lang } from "@/lib/types";

export function Footer({ lang, sample }: { lang: Lang; sample: boolean }) {
  const d = t(lang);
  return (
    <footer className="mt-20 bg-ink text-cream/80">
      <div className="container-x grid gap-10 py-14 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <div className="inline-block rounded-2xl bg-paper px-3 py-2">
            <Wordmark lang={lang} />
          </div>
          <p className="mt-5 max-w-sm text-sm leading-7">{d.footerAbout}</p>
          <a href={whatsappLink(d.waGeneral)} target="_blank" rel="noopener" className="btn-wa mt-6">
            {d.waCta}
          </a>
        </div>
        <div>
          <h3 className="font-display text-lg text-cream">{d.footerShop}</h3>
          <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2.5 text-sm">
            <li><Link href={href(lang, "/shop/women")} className="hover:text-cream">{d.nav.women}</Link></li>
            <li><Link href={href(lang, "/shop/men")} className="hover:text-cream">{d.nav.men}</Link></li>
            <li><Link href={href(lang, "/shop/kids")} className="hover:text-cream">{d.nav.kids}</Link></li>
            <li><Link href={href(lang, "/drops")} className="hover:text-cream">{d.nav.drops}</Link></li>
            {categories.slice(0, 6).map((c) => (
              <li key={c}>
                <Link href={href(lang, `/shop/${c}`)} className="hover:text-cream">{d.categories[c]}</Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="font-display text-lg text-cream">{d.footerHelp}</h3>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li>{d.trust[2].t}</li>
            <li>{d.trust[3].t}</li>
            <li><Link href={href(lang, "/#condition")} className="hover:text-cream">{d.conditionGuide}</Link></li>
            {site.instagram && <li><a href={site.instagram} target="_blank" rel="noopener" className="hover:text-cream">Instagram</a></li>}
            {site.facebook && <li><a href={site.facebook} target="_blank" rel="noopener" className="hover:text-cream">Facebook</a></li>}
          </ul>
        </div>
      </div>
      <div className="border-t border-cream/10">
        <div className="container-x flex flex-col gap-1 py-5 text-xs text-cream/50 sm:flex-row sm:justify-between">
          <span>© {new Date().getFullYear()} {lang === "ar" ? site.name_ar : site.name_en}. {d.rights}</span>
          {sample && <span>{d.sampleNote}</span>}
        </div>
      </div>
    </footer>
  );
}
