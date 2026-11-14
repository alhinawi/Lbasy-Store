"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Check } from "lucide-react";
import { useShop } from "@/lib/store";

export function Toast() {
  const toast = useShop((s) => s.toast);
  const hide = useShop((s) => s.hideToast);
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(hide, 3200);
    return () => clearTimeout(id);
  }, [toast, hide]);
  if (!toast) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex justify-center px-4" role="status">
      <div key={toast.id} className="animate-slide-in pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-2xl bg-ink px-4 py-3 text-sm text-cream shadow-xl">
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-clay">
          <Check className="h-4 w-4" />
        </span>
        <span className="flex-1">{toast.text}</span>
        {toast.href && (
          <Link href={toast.href} onClick={hide} className="rounded-full bg-cream px-3 py-1.5 text-xs font-bold text-ink">
            {toast.cta}
          </Link>
        )}
      </div>
    </div>
  );
}
