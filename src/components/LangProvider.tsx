"use client";

import { createContext, useContext } from "react";
import { dicts, type Dict } from "@/lib/i18n";
import type { Lang } from "@/lib/types";

const Ctx = createContext<Lang>("ar");

export function LangProvider({ lang, children }: { lang: Lang; children: React.ReactNode }) {
  return <Ctx.Provider value={lang}>{children}</Ctx.Provider>;
}

export function useLang(): { lang: Lang; d: Dict } {
  const lang = useContext(Ctx);
  return { lang, d: dicts[lang] };
}
