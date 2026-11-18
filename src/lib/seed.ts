// SAMPLE DATA: used by the unconnected storefront, demo admin and backend seed generator.
// Every product here is a demo piece so the store looks complete before real stock is added.
import type { Drop, ShippingZone } from "./types";

export const sampleDrops: Drop[] = [
  {
    slug: "nov-2026-port-said",
    title_ar: "شحنة نوفمبر",
    title_en: "The November drop",
    subtitle_ar: "جواكت وتريكوهات شتوي لسه واصلين من بورسعيد",
    subtitle_en: "Winter jackets and knits, fresh from Port Said",
    date: "2026-11-12",
    cover: "/catalog/9968422.webp",
    published: true,
  },
  {
    slug: "oct-2026-denim",
    title_ar: "شحنة الجينز والشوزات",
    title_en: "Denim & sneakers drop",
    subtitle_ar: "جينزات أصلية وكوتشيات متنقية واحدة واحدة",
    subtitle_en: "Original denim and hand-picked sneakers",
    date: "2026-10-29",
    cover: "/catalog/1082526.webp",
    published: true,
  },
  {
    slug: "oct-2026-summer-end",
    title_ar: "آخر الصيف",
    title_en: "End of summer",
    subtitle_ar: "فساتين وقمصان خفيفة بأسعار ماتتفوتش",
    subtitle_en: "Light dresses and shirts at prices you won't skip",
    date: "2026-10-15",
    cover: "/catalog/35568689.webp",
    published: true,
  },
];

// Keep the existing export for storefront, demo admin and backend consumers.
export { catalogProducts as sampleProducts } from "./catalog";

export const sampleShipping: ShippingZone[] = [
  { code: "PTS", name_ar: "بورسعيد", name_en: "Port Said", fee: 40, days: "1-2", active: true },
  { code: "C", name_ar: "القاهرة", name_en: "Cairo", fee: 60, days: "2-3", active: true },
  { code: "GZ", name_ar: "الجيزة", name_en: "Giza", fee: 60, days: "2-3", active: true },
  { code: "KB", name_ar: "القليوبية", name_en: "Qalyubia", fee: 65, days: "2-3", active: true },
  { code: "ALX", name_ar: "الإسكندرية", name_en: "Alexandria", fee: 65, days: "2-3", active: true },
  { code: "DK", name_ar: "الدقهلية", name_en: "Dakahlia", fee: 55, days: "1-2", active: true },
  { code: "DT", name_ar: "دمياط", name_en: "Damietta", fee: 50, days: "1-2", active: true },
  { code: "SHR", name_ar: "الشرقية", name_en: "Sharqia", fee: 55, days: "1-2", active: true },
  { code: "IS", name_ar: "الإسماعيلية", name_en: "Ismailia", fee: 50, days: "1-2", active: true },
  { code: "SUZ", name_ar: "السويس", name_en: "Suez", fee: 55, days: "2-3", active: true },
  { code: "GH", name_ar: "الغربية", name_en: "Gharbia", fee: 60, days: "2-3", active: true },
  { code: "MNF", name_ar: "المنوفية", name_en: "Monufia", fee: 60, days: "2-3", active: true },
  { code: "KFS", name_ar: "كفر الشيخ", name_en: "Kafr El Sheikh", fee: 60, days: "2-3", active: true },
  { code: "BH", name_ar: "البحيرة", name_en: "Beheira", fee: 65, days: "2-3", active: true },
  { code: "FYM", name_ar: "الفيوم", name_en: "Faiyum", fee: 75, days: "3-4", active: true },
  { code: "BNS", name_ar: "بني سويف", name_en: "Beni Suef", fee: 75, days: "3-4", active: true },
  { code: "MN", name_ar: "المنيا", name_en: "Minya", fee: 80, days: "3-4", active: true },
  { code: "AST", name_ar: "أسيوط", name_en: "Asyut", fee: 85, days: "3-5", active: true },
  { code: "SHG", name_ar: "سوهاج", name_en: "Sohag", fee: 85, days: "3-5", active: true },
  { code: "KN", name_ar: "قنا", name_en: "Qena", fee: 90, days: "3-5", active: true },
  { code: "LX", name_ar: "الأقصر", name_en: "Luxor", fee: 90, days: "3-5", active: true },
  { code: "ASN", name_ar: "أسوان", name_en: "Aswan", fee: 95, days: "4-6", active: true },
  { code: "BA", name_ar: "البحر الأحمر", name_en: "Red Sea", fee: 100, days: "4-6", active: true },
  { code: "MT", name_ar: "مطروح", name_en: "Matrouh", fee: 100, days: "4-6", active: true },
  { code: "WAD", name_ar: "الوادي الجديد", name_en: "New Valley", fee: 120, days: "5-7", active: true },
  { code: "SIN", name_ar: "شمال سيناء", name_en: "North Sinai", fee: 110, days: "4-6", active: true },
  { code: "JS", name_ar: "جنوب سيناء", name_en: "South Sinai", fee: 110, days: "4-6", active: true },
];
