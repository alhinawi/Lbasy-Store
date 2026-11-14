"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Heart, Menu, Search, ShoppingBag, X } from "lucide-react";
import { useLang } from "./LangProvider";
import { Wordmark } from "./Logo";
import { href, switchLangPath } from "@/lib/i18n";
import { useHydrated, useShop } from "@/lib/store";

export function Header() {
  const { lang, d } = useLang();
  const pathname = usePathname();
  const router = useRouter();
  const hydrated = useHydrated();
  const cartCount = useShop((s) => s.cart.length);
  const favCount = useShop((s) => s.favorites.length);
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [q, setQ] = useState("");

  useEffect(() => {
    setOpen(false);
    setSearchOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
  }, [open]);

  const links = [
    { to: href(lang, "/shop"), label: d.nav.shop },
    { to: href(lang, "/shop/women"), label: d.nav.women },
    { to: href(lang, "/shop/men"), label: d.nav.men },
    { to: href(lang, "/shop/kids"), label: d.nav.kids },
    { to: href(lang, "/drops"), label: d.nav.drops },
  ];
  const other = lang === "ar" ? "en" : "ar";

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!q.trim()) return;
    router.push(`${href(lang, "/search")}?q=${encodeURIComponent(q.trim())}`);
  };

  const Badge = ({ n }: { n: number }) =>
    hydrated && n > 0 ? (
      <span className="absolute -top-1 -end-1 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-clay px-1 text-[10px] font-bold text-cream">
        {n}
      </span>
    ) : null;

  return (
    <>
      <div className="bg-ink text-center text-[11px] font-medium tracking-wide text-cream/90">
        <div className="container-x py-2">{d.announce}</div>
      </div>
      <header className="sticky top-0 z-40 border-b border-line/70 bg-paper/90 backdrop-blur-md">
        <div className="container-x flex h-16 items-center gap-2">
          <button
            className="-ms-2 grid h-10 w-10 place-items-center rounded-full md:hidden"
            onClick={() => setOpen(true)}
            aria-label={d.nav.menu}
          >
            <Menu className="h-5 w-5" />
          </button>
          <Link href={href(lang)} className="shrink-0" aria-label={lang === "ar" ? "لباسي" : "Lbasy"}>
            <Wordmark lang={lang} />
          </Link>
          <nav className="ms-8 hidden items-center gap-6 text-sm font-medium md:flex">
            {links.map((l) => (
              <Link
                key={l.to}
                href={l.to}
                className={`transition hover:text-clay ${pathname === l.to ? "text-clay" : "text-ink-soft"}`}
              >
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="ms-auto flex items-center gap-0.5">
            <button
              className="grid h-10 w-10 place-items-center rounded-full hover:bg-sand"
              onClick={() => setSearchOpen((v) => !v)}
              aria-label={d.nav.search}
            >
              <Search className="h-5 w-5" />
            </button>
            <Link
              href={switchLangPath(pathname, other)}
              className="hidden h-10 place-items-center rounded-full px-2 text-xs font-bold tracking-wider text-ink-soft hover:bg-sand sm:grid"
              hrefLang={other}
            >
              {other === "en" ? "EN" : "عربي"}
            </Link>
            <Link href={href(lang, "/favorites")} className="relative grid h-10 w-10 place-items-center rounded-full hover:bg-sand" aria-label={d.nav.favorites}>
              <Heart className="h-5 w-5" />
              <Badge n={favCount} />
            </Link>
            <Link href={href(lang, "/cart")} className="relative grid h-10 w-10 place-items-center rounded-full hover:bg-sand" aria-label={d.nav.cart}>
              <ShoppingBag className="h-5 w-5" />
              <Badge n={cartCount} />
            </Link>
          </div>
        </div>
        {searchOpen && (
          <form onSubmit={submit} className="container-x animate-slide-in pb-3">
            <div className="relative">
              <Search className="pointer-events-none absolute start-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={d.searchPh}
                className="field rounded-full ps-11"
                enterKeyHint="search"
                type="search"
              />
            </div>
          </form>
        )}
      </header>

      {open && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-ink/40" onClick={() => setOpen(false)} />
          <div className="animate-slide-in absolute inset-y-0 start-0 flex w-[84%] max-w-sm flex-col bg-paper p-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <Wordmark lang={lang} />
              <button className="grid h-10 w-10 place-items-center rounded-full hover:bg-sand" onClick={() => setOpen(false)} aria-label={d.nav.close}>
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="mt-8 flex flex-col">
              {[{ to: href(lang), label: d.nav.home }, ...links, { to: href(lang, "/favorites"), label: d.nav.favorites }].map((l) => (
                <Link key={l.to} href={l.to} className="border-b border-line py-4 font-display text-2xl">
                  {l.label}
                </Link>
              ))}
            </nav>
            <Link href={switchLangPath(pathname, other)} className="btn-ghost mt-auto" hrefLang={other}>
              {other === "en" ? "English" : "عربي"}
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
