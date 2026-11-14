import type { Metadata } from "next";
import { CheckoutForm } from "@/components/CheckoutForm";
import { getShipping } from "@/lib/data";

export const metadata: Metadata = { title: "إتمام الطلب / Checkout", robots: { index: false } };

export default async function CheckoutPage() {
  const zones = await getShipping();
  return <CheckoutForm zones={zones} />;
}
