import { z } from "zod";
import { categories } from "../lib/i18n";
import type { Category } from "../lib/types";
const text = (max = 120) => z.string().trim().min(1).max(max);
export const email = z.string().trim().toLowerCase().email().max(254);
export const credentials = z.object({
  email,
  password: z.string().min(10).max(128),
  name: text(80).optional(),
});
export const productSchema = z
  .object({
    id: text(),
    slug: z
      .string()
      .regex(/^[a-z0-9-]+$/)
      .max(160),
    name_ar: text(),
    name_en: text(),
    brand: text(),
    gender: z.enum(["men", "women", "kids", "unisex"]),
    category: z.enum(categories as [Category, ...Category[]]),
    size: text(30),
    measurements: z.record(z.string(), z.number().min(0).max(1000)),
    condition: z.enum(["like_new", "very_good", "good"]),
    material_ar: text(),
    material_en: text(),
    color_ar: text(),
    color_en: text(),
    notes_ar: z.string().max(2000).nullable().optional(),
    notes_en: z.string().max(2000).nullable().optional(),
    price: z.number().int().nonnegative().max(1000000),
    compare_at_price: z.number().int().nonnegative().nullable().optional(),
    stock: z.number().int().min(0).max(1),
    images: z
      .array(
        z
          .string()
          .max(250000)
          .refine(
            (s) =>
              /^https:\/\//.test(s) ||
              /^\/(?!\/)/.test(s) ||
              /^data:image\/(webp|jpeg|png);base64,/.test(s),
          ),
      )
      .min(1)
      .max(12),
    drop_slug: z.string().max(160).nullable().optional(),
    featured: z.boolean().optional(),
    published: z.boolean().optional(),
    _revision: z.number().int().positive().optional(),
    created_at: z.string().max(40),
  })
  .refine((p) => JSON.stringify(p).length <= 1800000);
export const dropSchema = z.object({
  slug: z
    .string()
    .regex(/^[a-z0-9-]+$/)
    .max(160),
  title_ar: text(),
  title_en: text(),
  subtitle_ar: text(500),
  subtitle_en: text(500),
  date: text(40),
  cover: z
    .string()
    .max(250000)
    .refine(
      (s) =>
        /^https:\/\//.test(s) ||
        /^\/(?!\/)/.test(s) ||
        /^data:image\/(webp|jpeg|png);base64,/.test(s),
    ),
  published: z.boolean(),
});
export const shippingSchema = z
  .array(
    z.object({
      code: text(30),
      name_ar: text(),
      name_en: text(),
      fee: z.number().int().nonnegative().max(10000),
      days: text(80),
      active: z.boolean(),
    }),
  )
  .max(100);
export const checkoutSchema = z.object({
  customer_name: text(120).min(3),
  phone: text(30),
  phone2: z.string().max(30).optional(),
  governorate: text(30),
  city: text(),
  address: text(500).min(6),
  notes: z.string().max(500).optional(),
  item_ids: z.array(text()).min(1).max(30),
  payment_method: z.literal("cod"),
});
