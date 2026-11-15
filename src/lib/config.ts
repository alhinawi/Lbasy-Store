export const site = {
  name_ar: "لباسي",
  name_en: "Lbasy",
  url: (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, ""),
  // Egyptian number in international format without + (e.g. 201012345678). Uses the current store contact by default.
  whatsapp: (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "201028928248").replace(/\D/g, ""),
  instagram: process.env.NEXT_PUBLIC_INSTAGRAM_URL || "",
  facebook: process.env.NEXT_PUBLIC_FACEBOOK_URL || "",
  currency: "EGP",
};

export const supabaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

export const demoAdminPassword = process.env.NEXT_PUBLIC_DEMO_ADMIN_PASSWORD || "lbasy2026";

export function whatsappLink(text: string) {
  const base = site.whatsapp ? `https://wa.me/${site.whatsapp}` : "https://wa.me/";
  return `${base}?text=${encodeURIComponent(text)}`;
}
