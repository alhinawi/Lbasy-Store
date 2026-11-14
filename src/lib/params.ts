import type { Condition, ProductFilters } from "./types";

type SP = Record<string, string | string[] | undefined>;

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
const many = (v: string | string[] | undefined) => (one(v) ? one(v)!.split(",").filter(Boolean) : undefined);
const num = (v: string | string[] | undefined) => {
  const n = Number(one(v));
  return one(v) && Number.isFinite(n) ? n : undefined;
};

export function filtersFromSearch(sp: SP): ProductFilters {
  const sort = one(sp.sort);
  return {
    size: many(sp.size),
    brand: many(sp.brand),
    condition: many(sp.condition) as Condition[] | undefined,
    min: num(sp.min),
    max: num(sp.max),
    q: one(sp.q)?.slice(0, 80),
    available: one(sp.available) === "1",
    sort: sort === "price_asc" || sort === "price_desc" ? sort : "new",
  };
}
