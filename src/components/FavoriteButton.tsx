"use client";

import { Heart } from "lucide-react";
import { useHydrated, useShop, type ItemSnap } from "@/lib/store";
import { useLang } from "./LangProvider";

export function FavoriteButton({ item, className = "" }: { item: ItemSnap; className?: string }) {
  const { d } = useLang();
  const hydrated = useHydrated();
  const on = useShop((s) => s.favorites.some((f) => f.id === item.id));
  const toggle = useShop((s) => s.toggleFavorite);
  const active = hydrated && on;
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(item);
      }}
      aria-pressed={active}
      aria-label={d.favorites}
      className={`grid h-9 w-9 place-items-center rounded-full bg-cream/90 shadow-sm backdrop-blur transition active:scale-90 ${className}`}
    >
      <Heart className={`h-[18px] w-[18px] transition ${active ? "fill-clay text-clay" : "text-ink"}`} />
    </button>
  );
}
