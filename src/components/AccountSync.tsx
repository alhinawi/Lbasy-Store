"use client";
import { useEffect } from "react";
import { api, useAccount } from "@/lib/account";
import { useShop } from "@/lib/store";
import type { ItemSnap } from "@/lib/snap";
import type { Order } from "@/lib/types";
const OWNER = "lbasy-local-owner";
export function AccountSync() {
  const userId = useAccount((s) => s.user?.id);
  const loading = useAccount((s) => s.loading);
  const refresh = useAccount((s) => s.refresh);
  useEffect(() => {
    void refresh();
  }, [refresh]);
  useEffect(() => {
    if (loading) return;
    let cancelled = false;
    let unsubscribe: (() => void) | undefined;
    let queue = Promise.resolve();
    async function start() {
      await useShop.persist.rehydrate();
      const previousOwner = localStorage.getItem(OWNER);
      if (previousOwner && previousOwner !== userId) {
        useShop.setState({ cart: [], favorites: [], lastOrders: [] });
        localStorage.removeItem(OWNER);
      }
      if (!userId) return;
      try {
        // Only merge choices from anonymous browsing. Never merge another account's local data.
        if (!previousOwner) {
          const local = useShop.getState();
          const writes = [
            ...local.cart.map((i) => api("/account/saved/cart/" + i.id, "PUT")),
            ...local.favorites.map((i) =>
              api("/account/saved/favorites/" + i.id, "PUT"),
            ),
          ];
          const results = await Promise.allSettled(writes);
          if (results.some((r) => r.status === "rejected"))
            useShop
              .getState()
              .showToast(
                "بعض القطع مش متاحة. راجع شنطتك / Some items are unavailable. Check your bag.",
              );
        }
        const saved = await api<{ cart: ItemSnap[]; favorites: ItemSnap[] }>(
          "/account/saved",
        );
        const { orders } = await api<{ orders: Order[] }>("/account/orders");
        if (cancelled) return;
        localStorage.setItem(OWNER, userId);
        useShop.setState({ ...saved, lastOrders: orders });
        unsubscribe = useShop.subscribe((state, prev) => {
          for (const kind of ["cart", "favorites"] as const) {
            const changes = [
              ...state[kind]
                .filter((i) => !prev[kind].some((p) => p.id === i.id))
                .map((i) => ({ id: i.id, method: "PUT" })),
              ...prev[kind]
                .filter((i) => !state[kind].some((p) => p.id === i.id))
                .map((i) => ({ id: i.id, method: "DELETE" })),
            ];
            for (const change of changes)
              queue = queue
                .then(async () => {
                  if (cancelled || useAccount.getState().user?.id !== userId)
                    return;
                  await api(
                    "/account/saved/" + kind + "/" + change.id,
                    change.method,
                  );
                })
                .catch(() => {
                  if (!cancelled)
                    useShop
                      .getState()
                      .showToast(
                        "تعذر حفظ التغيير. جرّب تاني / Could not save. Try again.",
                      );
                });
          }
        });
      } catch {
        if (!cancelled)
          useShop
            .getState()
            .showToast("تعذر تحميل حسابك / Could not load your account");
      }
    }
    void start();
    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [userId, loading]);
  return null;
}
