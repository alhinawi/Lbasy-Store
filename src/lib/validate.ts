export const normalizePhone = (s: string) =>
  s
    .replace(/[٠-٩]/g, (c) => String(c.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (c) => String(c.charCodeAt(0) - 0x06f0))
    .replace(/[^\d+]/g, "")
    .replace(/^\+?20/, "0");

export const isEgyptMobile = (s: string) => /^01[0125]\d{8}$/.test(normalizePhone(s));

export interface CheckoutInput {
  customer_name: string;
  phone: string;
  phone2?: string;
  governorate: string;
  city: string;
  address: string;
  notes?: string;
  item_ids: string[];
  payment_method: "cod" | "online";
}

export function validateCheckout(x: Partial<CheckoutInput>): string | null {
  if (!x.customer_name || x.customer_name.trim().length < 3) return "customer_name";
  if (!x.phone || !isEgyptMobile(x.phone)) return "phone";
  if (x.phone2 && !isEgyptMobile(x.phone2)) return "phone2";
  if (!x.governorate) return "governorate";
  if (!x.city || !x.city.trim()) return "city";
  if (!x.address || x.address.trim().length < 6) return "address";
  if (!x.item_ids?.length || x.item_ids.length > 30) return "items";
  return null;
}
