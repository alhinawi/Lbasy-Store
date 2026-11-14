"use client";

import Link from "next/link";
import { useLang } from "@/components/LangProvider";
import { href } from "@/lib/i18n";

export default function NotFound() {
  const { lang, d } = useLang();
  return (
    <div className="container-x flex min-h-[55vh] flex-col items-center justify-center text-center">
      <p className="font-display text-7xl text-line">404</p>
      <h1 className="h-display mt-2 text-3xl">{d.notFound}</h1>
      <p className="mt-2 max-w-sm text-muted">{d.notFoundText}</p>
      <div className="mt-6 flex gap-3">
        <Link href={href(lang)} className="btn-ghost">{d.backHome}</Link>
        <Link href={href(lang, "/shop")} className="btn-primary">{d.heroCta}</Link>
      </div>
    </div>
  );
}
