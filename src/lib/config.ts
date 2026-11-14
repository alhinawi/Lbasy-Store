export const site = {
  name_ar: "لباسي",
  name_en: "Lbasy",
  url: (process.env.NEXT_PUBLIC_SITE_URL || "https://lbasy.vercel.app").replace(/\/$/, ""),
  // Egyptian number in international format without + (e.g. 201012345678). Empty = WhatsApp lets the customer pick the chat.
  whatsapp: (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "").replace(/\D/g, ""),
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
