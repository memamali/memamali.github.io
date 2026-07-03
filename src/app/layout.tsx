import type { Metadata, Viewport } from "next";
import { thmanyah, plexArabic } from "./fonts";
import { PreloadResources } from "@/components/PreloadResources";
import "./globals.css";

export const metadata: Metadata = {
  title: "أوتاد",
  description: "تسجيل الحضور والعرض المسرحي — مأتم الإمام علي (ع)، قرية بوري",
};

export const viewport: Viewport = {
  themeColor: "#0f2524",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ar"
      dir="rtl"
      className={`${thmanyah.variable} ${plexArabic.variable}`}
    >
      <body className="min-h-dvh antialiased">
        <PreloadResources />
        {children}
      </body>
    </html>
  );
}
