import type { Product } from "./types";

export interface ItemSnap {
  id: string;
  slug: string;
  name_ar: string;
  name_en: string;
  brand: string;
  size: string;
  price: number;
  compare_at_price?: number | null;
  condition: Product["condition"];
  image: string;
  images?: string[];
  stock: number;
}

export const snap = (p: Product): ItemSnap => ({
  id: p.id,
  slug: p.slug,
  name_ar: p.name_ar,
  name_en: p.name_en,
  brand: p.brand,
  size: p.size,
  price: p.price,
  compare_at_price: p.compare_at_price,
  condition: p.condition,
  image: p.images[0] ?? "",
  images: p.images,
  stock: p.stock,
});
