/**
 * Payment methods. Cash on delivery is the default and the only active method today.
 *
 * To add online payment later (Paymob, Fawry, Kashier, Stripe...):
 * 1. Add a provider object below with `id: "online"` and a `start()` that creates the
 *    payment on the server (a new route under app/api/payments/<provider>) and returns the
 *    URL to redirect the customer to.
 * 2. Handle the provider's webhook in that route and mark the order as paid.
 * 3. Set NEXT_PUBLIC_ONLINE_PAYMENT=1 so the option shows up enabled at checkout.
 */
export interface PaymentProvider {
  id: "cod" | "online";
  enabled: boolean;
  start?: (orderNumber: string, total: number) => Promise<{ redirectUrl: string }>;
}

export const paymentProviders: PaymentProvider[] = [
  { id: "cod", enabled: true },
  { id: "online", enabled: process.env.NEXT_PUBLIC_ONLINE_PAYMENT === "1" },
];
