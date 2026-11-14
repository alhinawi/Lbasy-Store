"use client";

import { useSyncExternalStore } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Order } from "./types";
import type { ItemSnap } from "./snap";
export type { ItemSnap } from "./snap";
export { snap } from "./snap";

interface ShopState {
  cart: ItemSnap[];
  favorites: ItemSnap[];
  lastOrders: Order[];
  toast: { id: number; text: string; href?: string; cta?: string } | null;
  addToCart: (i: ItemSnap) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  toggleFavorite: (i: ItemSnap) => void;
  rememberOrder: (o: Order) => void;
  showToast: (text: string, href?: string, cta?: string) => void;
  hideToast: () => void;
}

export const useShop = create<ShopState>()(
  persist(
    (set, get) => ({
      cart: [],
      favorites: [],
      lastOrders: [],
      toast: null,
      addToCart: (i) => {
        // Pieces are one-of-a-kind, so the cart never holds the same item twice.
        if (get().cart.some((c) => c.id === i.id)) return;
        set({ cart: [...get().cart, i] });
      },
      removeFromCart: (id) => set({ cart: get().cart.filter((c) => c.id !== id) }),
      clearCart: () => set({ cart: [] }),
      toggleFavorite: (i) => {
        const has = get().favorites.some((f) => f.id === i.id);
        set({ favorites: has ? get().favorites.filter((f) => f.id !== i.id) : [i, ...get().favorites] });
      },
      rememberOrder: (o) => set({ lastOrders: [o, ...get().lastOrders].slice(0, 10) }),
      showToast: (text, href, cta) => set({ toast: { id: Date.now(), text, href, cta } }),
      hideToast: () => set({ toast: null }),
    }),
    {
      name: "lbasy-shop",
      partialize: (s) => ({ cart: s.cart, favorites: s.favorites, lastOrders: s.lastOrders }),
    },
  ),
);

/** True after the persisted store has loaded in the browser. */
const noopSubscribe = () => () => {};
export function useHydrated() {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}
