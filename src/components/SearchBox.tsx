"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search } from "lucide-react";
import { useLang } from "./LangProvider";
import { href } from "@/lib/i18n";

export function SearchBox({ initial }: { initial: string }) {
  const { lang, d } = useLang();
  const router = useRouter();
  const [q, setQ] = useState(initial);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (q.trim()) router.push(`${href(lang, "/search")}?q=${encodeURIComponent(q.trim())}`);
      }}
      className="relative"
    >
      <Search className="pointer-events-none absolute start-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={d.searchPh} className="field rounded-full ps-11" type="search" enterKeyHint="search" autoFocus={!initial} />
    </form>
  );
}
