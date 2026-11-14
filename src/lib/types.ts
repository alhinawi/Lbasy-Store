export type Lang = "ar" | "en";

export type Gender = "men" | "women" | "kids" | "unisex";

export type Category =
  | "jackets"
  | "coats"
  | "jeans"
  | "pants"
  | "shirts"
  | "tshirts"
  | "knitwear"
  | "hoodies"
  | "dresses"
  | "shoes"
  | "bags";

export type Condition = "like_new" | "very_good" | "good";

export type MeasureKey =
  | "chest"
  | "waist"
  | "hips"
  | "length"
  | "shoulder"
  | "sleeve"
  | "inseam"
  | "insole"
  | "width"
  | "height"
  | "depth";

export type Measurements = Partial<Record<MeasureKey, number>>;

export interface Product {
  id: string;
  slug: string;
  name_ar: string;
  name_en: string;
  brand: string;
  gender: Gender;
  category: Category;
  size: string;
  measurements: Measurements;
  condition: Condition;
  material_ar: string;
  material_en: string;
  color_ar: string;
  color_en: string;
  notes_ar?: string | null;
  notes_en?: string | null;
  price: number;
  compare_at_price?: number | null;
  stock: number;
  images: string[];
  drop_slug?: string | null;
  featured?: boolean;
  created_at: string;
}

export interface Drop {
  slug: string;
  title_ar: string;
  title_en: string;
  subtitle_ar: string;
  subtitle_en: string;
  date: string;
  cover: string;
  published: boolean;
}

export interface ShippingZone {
  code: string;
  name_ar: string;
  name_en: string;
  fee: number;
  days: string;
  active: boolean;
}

export type OrderStatus = "new" | "confirmed" | "shipped" | "delivered" | "cancelled";

export interface OrderItem {
  product_id: string;
  slug: string;
  name_ar: string;
  name_en: string;
  brand: string;
  size: string;
  price: number;
  image: string;
}

export interface Order {
  id: string;
  number: string;
  created_at: string;
  customer_name: string;
  phone: string;
  phone2?: string | null;
  governorate: string;
  city: string;
  address: string;
  notes?: string | null;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  total: number;
  payment_method: "cod" | "online";
  status: OrderStatus;
}

export interface ProductFilters {
  gender?: Gender;
  category?: Category;
  size?: string[];
  brand?: string[];
  condition?: Condition[];
  min?: number;
  max?: number;
  q?: string;
  drop?: string;
  sort?: "new" | "price_asc" | "price_desc";
  available?: boolean;
}
