import "server-only";
import { sampleDrops, sampleProducts, sampleShipping } from "./seed";
import { serverSupabase } from "./supabase";
import type { Drop, Product, ProductFilters, ShippingZone } from "./types";

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u064B-\u0652\u0640]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/[ڤ]/g, "ف")
    .replace(/['’`.&-]/g, "")
    .trim();

// A few Arabic spellings people type for common brands.
const brandAliases: Record<string, string> = {
  ليفايز: "levis", ليفيز: "levis", زارا: "zara", نايك: "nike", اديداس: "adidas", بوما: "puma",
  مانجو: "mango", تومي: "tommy", كالفن: "calvin", كارهارت: "carhartt", باربور: "barbour",
  تيمبرلاند: "timberland", كونفرس: "converse", يونيكلو: "uniqlo", شامبيون: "champion",
  ديكيز: "dickies", مايكل: "michael", رالف: "ralph", بولو: "polo", نورث: "north", كولومبيا: "columbia",
  جاب: "gap", دكتور: "martens", مارتنز: "martens",
};

function matchesQuery(p: Product, q: string) {
  const terms = norm(q).split(/\s+/).filter(Boolean);
  const hay = norm(
    [p.name_ar, p.name_en, p.brand, p.category, p.gender, p.color_ar, p.color_en, p.material_ar, p.material_en, p.size].join(" "),
  );
  return terms.every((term) => hay.includes(term) || (brandAliases[term] && hay.includes(brandAliases[term])));
}

function applyFilters(list: Product[], f: ProductFilters) {
  let out = list.filter((p) => {
    if (f.gender && !(p.gender === f.gender || (p.gender === "unisex" && f.gender !== "kids"))) return false;
    if (f.category && p.category !== f.category) return false;
    if (f.size?.length && !f.size.includes(p.size)) return false;
    if (f.brand?.length && !f.brand.includes(p.brand)) return false;
    if (f.condition?.length && !f.condition.includes(p.condition)) return false;
    if (f.min != null && p.price < f.min) return false;
    if (f.max != null && p.price > f.max) return false;
    if (f.drop && p.drop_slug !== f.drop) return false;
    if (f.available && p.stock < 1) return false;
    if (f.q && !matchesQuery(p, f.q)) return false;
    return true;
  });
  const sort = f.sort ?? "new";
  out = [...out].sort((a, b) => {
    // Available pieces first, sold ones sink to the end.
    const avail = Number(b.stock > 0) - Number(a.stock > 0);
    if (avail) return avail;
    if (sort === "price_asc") return a.price - b.price;
    if (sort === "price_desc") return b.price - a.price;
    return b.created_at.localeCompare(a.created_at);
  });
  return out;
}

async function allProducts(): Promise<Product[]> {
  const sb = serverSupabase();
  if (!sb) return sampleProducts;
  const { data, error } = await sb
    .from("products")
    .select("*")
    .eq("published", true)
    .order("created_at", { ascending: false })
    .limit(2000);
  if (error) {
    console.error("[lbasy] products query failed", error.message);
    return [];
  }
  return (data ?? []) as Product[];
}

export async function getProducts(filters: ProductFilters = {}) {
  return applyFilters(await allProducts(), filters);
}

export async function getFacets(base: ProductFilters = {}) {
  const list = applyFilters(await allProducts(), { gender: base.gender, category: base.category, drop: base.drop, q: base.q });
  const count = <K extends string>(vals: K[]) => {
    const m = new Map<K, number>();
    vals.forEach((v) => m.set(v, (m.get(v) ?? 0) + 1));
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  };
  const sizeOrder = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "3XL"];
  const sizes = count(list.map((p) => p.size)).sort((a, b) => {
    const ia = sizeOrder.indexOf(a[0]);
    const ib = sizeOrder.indexOf(b[0]);
    if (ia !== -1 || ib !== -1) return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
    return a[0].localeCompare(b[0], "en", { numeric: true });
  });
  return {
    categories: count(list.map((p) => p.category)),
    sizes,
    brands: count(list.map((p) => p.brand)).sort((a, b) => a[0].localeCompare(b[0])),
    conditions: count(list.map((p) => p.condition)),
    priceMax: Math.max(0, ...list.map((p) => p.price)),
  };
}

export async function getProduct(slug: string) {
  const sb = serverSupabase();
  if (!sb) return sampleProducts.find((p) => p.slug === slug) ?? null;
  const { data } = await sb.from("products").select("*").eq("slug", slug).eq("published", true).maybeSingle();
  return (data as Product) ?? null;
}

export async function getSimilar(p: Product, limit = 4) {
  const list = await allProducts();
  return list
    .filter((x) => x.id !== p.id && x.stock > 0)
    .map((x) => ({
      x,
      score: (x.category === p.category ? 3 : 0) + (x.gender === p.gender ? 2 : 0) + (x.brand === p.brand ? 1 : 0),
    }))
    .sort((a, b) => b.score - a.score || b.x.created_at.localeCompare(a.x.created_at))
    .slice(0, limit)
    .map((s) => s.x);
}

export async function getDrops(): Promise<Drop[]> {
  const sb = serverSupabase();
  if (!sb) return sampleDrops;
  const { data } = await sb.from("drops").select("*").eq("published", true).order("date", { ascending: false });
  return (data ?? []) as Drop[];
}

export async function getDrop(slug: string) {
  return (await getDrops()).find((d) => d.slug === slug) ?? null;
}

export async function getShipping(): Promise<ShippingZone[]> {
  const sb = serverSupabase();
  if (!sb) return sampleShipping;
  const { data } = await sb.from("shipping_zones").select("*").eq("active", true).order("fee");
  return (data ?? []) as ShippingZone[];
}

export function isSampleCatalog() {
  return !serverSupabase();
}
