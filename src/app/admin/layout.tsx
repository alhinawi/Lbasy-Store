import type { Metadata, Viewport } from "next";
import "../globals.css";
import { body, kufi } from "../fonts";

export const metadata: Metadata = {
  title: "لوحة التحكم | لباسي",
  robots: { index: false, follow: false },
  icons: { icon: "/icon.svg" },
};

export const viewport: Viewport = { themeColor: "#17150f", width: "device-width", initialScale: 1 };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={`${body.variable} ${kufi.variable}`}>
      <body className="min-h-dvh bg-paper">{children}</body>
    </html>
  );
}
