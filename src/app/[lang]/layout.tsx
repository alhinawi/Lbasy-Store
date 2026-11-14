import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import "../globals.css";
import { body, kufi } from "../fonts";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Toast } from "@/components/Toast";
import { LangProvider } from "@/components/LangProvider";
import { isLang, t } from "@/lib/i18n";
import { site } from "@/lib/config";
import { isSampleCatalog } from "@/lib/data";

export function generateStaticParams() {
  return [{ lang: "ar" }, { lang: "en" }];
}

export const viewport: Viewport = {
  themeColor: "#f6f1e7",
  width: "device-width",
  initialScale: 1,
};

export async function generateMetadata({ params }: LayoutProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  const ar = lang !== "en";
  const name = ar ? site.name_ar : site.name_en;
  const title = ar ? "لباسي | بالة بورسعيد أونلاين - براندات أجنبية مستعملة" : "Lbasy | Port Said bala online - pre-loved foreign brands";
  const description = t(ar ? "ar" : "en").heroText;
  return {
    metadataBase: new URL(site.url),
    title: { default: title, template: `%s | ${name}` },
    description,
    applicationName: name,
    alternates: {
      canonical: ar ? "/" : "/en",
      languages: { ar: "/", en: "/en", "x-default": "/" },
    },
    openGraph: {
      type: "website",
      siteName: name,
      locale: ar ? "ar_EG" : "en_US",
      title,
      description,
      images: [{ url: "/brand/og.png", width: 1200, height: 630, alt: name }],
    },
    twitter: { card: "summary_large_image", title, description, images: ["/brand/og.png"] },
    icons: { icon: "/icon.svg", apple: "/brand/apple-icon.png" },
    manifest: "/manifest.webmanifest",
  };
}

export default async function LangLayout({ children, params }: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  return (
    <html lang={lang} dir={lang === "ar" ? "rtl" : "ltr"} className={`${body.variable} ${kufi.variable}`}>
      <body className="min-h-dvh">
        <LangProvider lang={lang}>
          <Header />
          <main>{children}</main>
          <Footer lang={lang} sample={isSampleCatalog()} />
          <Toast />
        </LangProvider>
      </body>
    </html>
  );
}
