import type { Metadata } from "next";
import { OrderConfirmation } from "@/components/OrderConfirmation";

export const metadata: Metadata = { title: "طلبك / Your order", robots: { index: false } };

export default async function OrderPage({ params }: PageProps<"/[lang]/order/[number]">) {
  const { number } = await params;
  return <OrderConfirmation number={decodeURIComponent(number)} />;
}
