"use client";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  ShieldCheck,
  ShoppingBag,
  Heart,
  LogOut,
  UserRound,
  Eye,
  EyeOff,
} from "lucide-react";
import { useLang } from "./LangProvider";
import { api, useAccount } from "@/lib/account";
import { useShop } from "@/lib/store";
import { href, formatPrice } from "@/lib/i18n";
import type { Order } from "@/lib/types";
export function AccountView() {
  const { lang } = useLang();
  const ar = lang === "ar";
  const { user, loading, available, googleEnabled, refresh } = useAccount();
  const [signup, setSignup] = useState(false),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [show, setShow] = useState(false),
    [orders, setOrders] = useState<Order[]>([]);
  useEffect(() => {
    if (user)
      api<{ orders: Order[] }>("/account/orders")
        .then((r) => setOrders(r.orders))
        .catch(() =>
          setMessage(ar ? "تعذر تحميل الطلبات" : "Could not load orders"),
        );
  }, [user, ar]);
  const tr = (a: string, e: string) => (ar ? a : e);
  const search = useSearchParams();
  const oauthError = search.get("error");
  const visibleMessage =
    message ||
    (oauthError === "link_required"
      ? tr(
          "الإيميل ده ليه حساب بكلمة سر. ادخل بكلمة سرك.",
          "This email already has a password account. Sign in with your password.",
        )
      : oauthError
        ? tr(
            "الدخول بجوجل مكملش. جرّب تاني.",
            "Google sign-in did not finish. Please try again.",
          )
        : "");
  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setBusy(true);
    setMessage("");
    try {
      await api("/auth/" + (signup ? "signup" : "login"), "POST", {
        email: form.get("email"),
        password: form.get("password"),
        ...(signup ? { name: form.get("name") } : {}),
      });
      await refresh();
    } catch (err) {
      const code = err instanceof Error ? err.message : "";
      setMessage(
        code === "rate_limit"
          ? tr(
              "محاولات كتير. استنى 15 دقيقة وجرب تاني.",
              "Too many attempts. Try again in 15 minutes.",
            )
          : code === "account_unavailable"
            ? tr(
                "الإيميل ده مش متاح. جرّب تسجل دخول.",
                "That email is unavailable. Try signing in.",
              )
            : tr(
                "راجع بياناتك وجرب تاني. كلمة السر 10 حروف على الأقل.",
                "Check your details. Passwords need at least 10 characters.",
              ),
      );
    } finally {
      setBusy(false);
    }
  };
  if (loading)
    return (
      <div className="container-x py-20 text-center" role="status">
        {tr("بنحمّل حسابك...", "Loading your account...")}
      </div>
    );
  if (user)
    return (
      <section className="container-x py-10 md:py-16">
        <div className="flex flex-wrap items-center justify-between gap-5 border-b border-line pb-8">
          <div>
            <p className="editorial-kicker">YOUR LBASY</p>
            <h1 className="h-display mt-4 break-words text-3xl sm:text-4xl">
              {tr("أهلًا،", "Welcome,")} <bdi>{user.name}</bdi>
            </h1>
            <p className="mt-3 break-all text-sm text-muted" dir="ltr">
              {user.email}
            </p>
          </div>
          <button
            className="btn-primary"
            onClick={async () => {
              try {
                await api("/auth/logout", "POST");
                useShop.setState({ cart: [], favorites: [], lastOrders: [] });
                await refresh();
              } catch {
                setMessage(
                  tr("الخروج متمش. جرّب تاني.", "Sign-out failed. Try again."),
                );
              }
            }}
          >
            <LogOut size={16} />
            {tr("خروج", "Sign out")}
          </button>
        </div>
        <div className="my-8 grid gap-4 sm:grid-cols-2">
          <Link href={href(lang, "/cart")} className="account-tile">
            <ShoppingBag />
            <span>{tr("شنطتك", "Your bag")}</span>
            <ArrowUpRight />
          </Link>
          <Link href={href(lang, "/favorites")} className="account-tile">
            <Heart />
            <span>{tr("لُقطك المفضلة", "Your saved finds")}</span>
            <ArrowUpRight />
          </Link>
        </div>
        {user.role === "admin" && (
          <Link href="/admin" className="btn-primary mb-8">
            {tr("لوحة التحكم", "Store dashboard")}
          </Link>
        )}
        <h2 className="h-display text-3xl">{tr("طلباتك", "Your orders")}</h2>
        {visibleMessage && (
          <p role="alert" className="my-4 text-clay">
            {visibleMessage}
          </p>
        )}
        {orders.length === 0 ? (
          <div className="mt-5 border border-line p-8">
            <p>
              {tr(
                "أول لُقطة مستنياك. لما تعمل طلب هتلاقيه هنا.",
                "Your first find is waiting. Your orders will appear here.",
              )}
            </p>
            <Link href={href(lang, "/shop")} className="editorial-link mt-6">
              {tr("شوف القطع", "Explore the edit")}
              <ArrowUpRight size={16} />
            </Link>
          </div>
        ) : (
          <div className="mt-5 space-y-4">
            {orders.map((o) => (
              <article className="border border-line p-5" key={o.id}>
                <div className="flex flex-wrap justify-between gap-3">
                  <Link
                    className="underline"
                    href={href(lang, "/order/" + o.number)}
                  >
                    {o.number}
                  </Link>
                  <span>{formatPrice(o.total, lang)}</span>
                </div>
                <p className="mt-3 text-sm">
                  {
                    {
                      new: tr("جديد", "New"),
                      confirmed: tr("اتأكد", "Confirmed"),
                      shipped: tr("في الطريق", "Shipped"),
                      delivered: tr("وصل", "Delivered"),
                      cancelled: tr("اتلغى", "Cancelled"),
                    }[o.status]
                  }
                </p>
              </article>
            ))}
          </div>
        )}
      </section>
    );
  return (
    <section className="account-shell">
      <div className="account-story">
        <Image
          fill
          unoptimized
          sizes="50vw"
          src="/editorial/woman.webp"
          alt={tr("ستايل لباسي", "The LBASY edit")}
        />
        <div>
          <span className="editorial-kicker">ONE OF A KIND. ALL YOURS.</span>
          <h2>{tr("لُقطتك ليها حكاية.", "Your next chapter, pre-loved.")}</h2>
          <p>
            {tr(
              "احفظ اللي عجبك، كمّل شنطتك من أي جهاز، وتابع طلباتك في مكان واحد.",
              "Save your finds, pick up your bag on any device, and keep your orders together.",
            )}
          </p>
        </div>
      </div>
      <div className="account-form-wrap">
        <div className="account-form">
          <UserRound size={24} />
          <p className="editorial-kicker mt-6">THE LBASY CLUB</p>
          <h1 className="h-display mt-3 text-4xl">
            {signup
              ? tr("حكايتك تبدأ هنا", "Make it yours")
              : tr("نوّرت لباسي", "Welcome back")}
          </h1>
          <p className="mt-3 text-sm leading-7 text-muted">
            {tr(
              "حسابك للُقط اللي تستاهل تتلبس تاني.",
              "A home for your one-of-a-kind finds.",
            )}
          </p>
          {!available && (
            <p role="alert" className="my-5 border border-line p-4 text-sm">
              {tr(
                "الحسابات لسه بتتجهز. تقدر تكمّل تتفرج على القطع.",
                "Accounts are being connected. You can still explore the store.",
              )}
            </p>
          )}
          <div className="account-tabs">
            <button
              className={!signup ? "active" : ""}
              onClick={() => {
                setSignup(false);
                setMessage("");
              }}
            >
              {tr("دخول", "Sign in")}
            </button>
            <button
              className={signup ? "active" : ""}
              onClick={() => {
                setSignup(true);
                setMessage("");
              }}
            >
              {tr("حساب جديد", "Create account")}
            </button>
          </div>
          <form onSubmit={submit} className="space-y-5">
            {signup && (
              <div>
                <label className="label" htmlFor="name">
                  {tr("اسمك", "Your name")}
                </label>
                <input
                  className="field"
                  id="name"
                  name="name"
                  required
                  maxLength={80}
                  autoComplete="name"
                />
              </div>
            )}
            <div>
              <label className="label" htmlFor="email">
                {tr("الإيميل", "Email address")}
              </label>
              <input
                className="field"
                type="email"
                dir="ltr"
                id="email"
                name="email"
                autoComplete="email"
                required
                maxLength={254}
              />
            </div>
            <div>
              <label className="label" htmlFor="password">
                {tr("كلمة السر", "Password")}
              </label>
              <div className="relative">
                <input
                  className="field pe-12"
                  type={show ? "text" : "password"}
                  id="password"
                  dir="ltr"
                  name="password"
                  minLength={10}
                  maxLength={128}
                  autoComplete={signup ? "new-password" : "current-password"}
                  required
                />
                <button
                  type="button"
                  className="absolute end-4 top-3"
                  aria-label={tr(
                    "إظهار أو إخفاء كلمة السر",
                    "Show or hide password",
                  )}
                  onClick={() => setShow(!show)}
                >
                  {show ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {signup && (
                <p className="mt-2 text-xs text-muted">
                  {tr(
                    "10 حروف على الأقل. اختار كلمة سر مختلفة عن حساباتك التانية.",
                    "At least 10 characters. Use a password unique to this account.",
                  )}
                </p>
              )}
            </div>
            {visibleMessage && (
              <p role="alert" className="text-sm text-clay">
                {visibleMessage}
              </p>
            )}
            <button
              className="btn-primary w-full"
              disabled={busy || !available}
            >
              {busy
                ? tr("لحظة...", "One moment...")
                : signup
                  ? tr("اعمل حسابك", "Create your account")
                  : tr("ادخل حسابك", "Sign in")}
              <ArrowUpRight size={17} />
            </button>
          </form>
          {googleEnabled && (
            <a
              href={"/api/backend/auth/google?lang=" + lang}
              className="btn mt-4 w-full border border-line"
            >
              {tr("كمّل بجوجل", "Continue with Google")}
            </a>
          )}
          <p className="mt-6 flex gap-2 text-xs leading-6 text-muted">
            <ShieldCheck className="shrink-0" size={16} />
            {tr(
              "كلمة سرك متشفّرة. الدفع عند الاستلام وبس.",
              "Your password is securely hashed. Cash on delivery only.",
            )}
          </p>
          <Link href={href(lang, "/shop")} className="editorial-link mt-7">
            {tr("كمّل تتفرّج", "Back to the edit")}
            <ArrowUpRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}
