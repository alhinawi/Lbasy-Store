import type { MetadataRoute } from "next";
import { site } from "@/lib/config";
import { getDrops, getProducts } from "@/lib/data";
import { categories } from "@/lib/i18n";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, drops] = await Promise.all([getProducts(), getDrops()]);
  const both = (path: string, extra: Partial<MetadataRoute.Sitemap[number]> = {}) => ({
    url: `${site.url}${path === "/" ? "" : path}`,
    alternates: { languages: { ar: `${site.url}${path === "/" ? "" : path}`, en: `${site.url}/en${path === "/" ? "" : path}` } },
    ...extra,
  });
  return [
    both("/", { changeFrequency: "daily", priority: 1 }),
    both("/shop", { changeFrequency: "daily", priority: 0.9 }),
    ...["women", "men", "kids"].map((g) => both(`/shop/${g}`, { changeFrequency: "daily", priority: 0.8 })),
    ...categories.map((c) => both(`/shop/${c}`, { changeFrequency: "daily", priority: 0.7 })),
    both("/drops", { changeFrequency: "weekly", priority: 0.7 }),
    ...drops.map((d) => both(`/drops/${d.slug}`, { lastModified: d.date, priority: 0.6 })),
    ...products
      .filter((p) => p.stock > 0)
      .map((p) => both(`/product/${p.slug}`, { lastModified: p.created_at, priority: 0.6 })),
  ];
}
