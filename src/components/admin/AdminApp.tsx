"use client";

import { useEffect, useState } from "react";
import { ExternalLink, Layers, Loader2, LogOut, Package, ShoppingCart, Truck } from "lucide-react";
import { LogoMark } from "../Logo";
import { adminApi, isDemo } from "@/lib/adminApi";
import { OrdersPanel } from "./OrdersPanel";
import { ProductsPanel } from "./ProductsPanel";
import { DropsPanel } from "./DropsPanel";
import { ShippingPanel } from "./ShippingPanel";

type Tab = "orders" | "products" | "drops" | "shipping";

const tabs: { id: Tab; label: string; icon: typeof Package }[] = [
  { id: "orders", label: "الطلبات", icon: ShoppingCart },
  { id: "products", label: "القطع", icon: Package },
  { id: "drops", label: "الشحنات", icon: Layers },
  { id: "shipping", label: "الشحن", icon: Truck },
];

export function AdminApp() {
  const [user, setUser] = useState<string | null | undefined>(undefined);
  const [tab, setTab] = useState<Tab>("orders");

  useEffect(() => {
    adminApi.session().then(setUser).catch(() => setUser(null));
  }, []);

  if (user === undefined)
    return (
      <div className="grid min-h-dvh place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted" />
      </div>
    );
  if (!user) return <Login onDone={setUser} />;

  return (
    <div className="min-h-dvh pb-20 md:pb-0">
      <header className="sticky top-0 z-30 bg-ink text-cream">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4">
          <LogoMark className="h-7 w-7" />
          <span className="font-display text-lg">لوحة التحكم</span>
          <nav className="ms-6 hidden gap-1 md:flex">
            {tabs.map((t) => (
              <button key={t.id} onClick={() => setTab(t.id)} className={`rounded-full px-4 py-1.5 text-sm ${tab === t.id ? "bg-cream text-ink" : "text-cream/70 hover:text-cream"}`}>
                {t.label}
              </button>
            ))}
          </nav>
          <a href="/" target="_blank" className="ms-auto grid h-9 w-9 place-items-center rounded-full hover:bg-cream/10" aria-label="افتح المتجر">
            <ExternalLink className="h-4 w-4" />
          </a>
          <button
            onClick={async () => {
              await adminApi.signOut();
              setUser(null);
            }}
            className="grid h-9 w-9 place-items-center rounded-full hover:bg-cream/10"
            aria-label="خروج"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
        {isDemo && (
          <div className="bg-gold/90 px-4 py-1.5 text-center text-xs font-medium text-ink">
            وضع تجربة: التعديلات بتتحفظ على الجهاز ده بس ومش بتظهر للزباين، لحد ما توصّل سوبابيز.
          </div>
        )}
      </header>

      <main className="mx-auto max-w-6xl px-4 py-5">
        {tab === "orders" && <OrdersPanel />}
        {tab === "products" && <ProductsPanel />}
        {tab === "drops" && <DropsPanel />}
        {tab === "shipping" && <ShippingPanel />}
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-line bg-cream md:hidden">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`flex flex-col items-center gap-0.5 py-2.5 text-[11px] ${tab === t.id ? "text-clay" : "text-muted"}`}>
            <t.icon className="h-5 w-5" />
            {t.label}
          </button>
        ))}
      </nav>
    </div>
  );
}

function Login({ onDone }: { onDone: (u: string) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  return (
    <div className="grid min-h-dvh place-items-center px-4">
      <form
        className="w-full max-w-sm rounded-[24px] border border-line bg-cream p-6"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setErr("");
          const r = await adminApi.signIn(email.trim(), password);
          setBusy(false);
          if (r === "ok") onDone(email || "demo");
          else setErr(r === "not_admin" ? "الحساب ده مش متسجّل كـأدمن." : "البيانات مش صح.");
        }}
      >
        <div className="flex items-center gap-2">
          <LogoMark className="h-9 w-9" />
          <h1 className="font-display text-2xl">لوحة تحكم لباسي</h1>
        </div>
        {!isDemo && (
          <div className="mt-6">
            <label className="label" htmlFor="email">الإيميل</label>
            <input id="email" type="email" dir="ltr" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} className="field" required />
          </div>
        )}
        <div className="mt-4">
          <label className="label" htmlFor="pw">كلمة السر</label>
          <input id="pw" type="password" dir="ltr" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className="field" required />
        </div>
        {isDemo && <p className="mt-3 text-xs leading-6 text-muted">وضع التجربة شغال لحد ما توصّل سوبابيز. كلمة السر مكتوبة في ملف الشرح.</p>}
        {err && <p className="mt-3 text-sm text-clay">{err}</p>}
        <button disabled={busy} className="btn-primary mt-6 w-full">
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          دخول
        </button>
      </form>
    </div>
  );
}
