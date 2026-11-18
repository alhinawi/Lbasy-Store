"use client";
import { create } from "zustand";
import type { User } from "@/backend/env";
export async function api<T = Record<string, unknown>>(
  path: string,
  method = "GET",
  body?: unknown,
  extra?: Record<string, string>,
): Promise<T> {
  const r = await fetch("/api/backend" + path, {
    method,
    credentials: "same-origin",
    cache: "no-store",
    headers: { "Content-Type": "application/json", ...extra },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data.error || "server");
  return data as T;
}
export const useAccount = create<{
  user: User | null;
  loading: boolean;
  available: boolean;
  googleEnabled: boolean;
  refresh: () => Promise<void>;
}>((set) => ({
  user: null,
  loading: true,
  available: false,
  googleEnabled: false,
  refresh: async () => {
    try {
      const data = await api<{ user: User | null; googleEnabled: boolean }>(
        "/auth/me",
      );
      set({ ...data, available: true, loading: false });
    } catch {
      set({ user: null, available: false, loading: false });
    }
  },
}));
