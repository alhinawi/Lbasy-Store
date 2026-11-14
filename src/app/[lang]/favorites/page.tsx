import type { Metadata } from "next";
import { FavoritesView } from "@/components/FavoritesView";

export const metadata: Metadata = { title: "المفضلة / Favorites", robots: { index: false } };

export default function FavoritesPage() {
  return <FavoritesView />;
}
