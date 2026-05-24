import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import { notFound } from "next/navigation";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "../globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { LocalBusinessJsonLd } from "@/components/JsonLd";
import { CookieBanner } from "@/components/layout/CookieBanner";
import { LOCALES, getDictionary, hasLocale } from "./dictionaries";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  weight: ["400", "500", "600"],
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.majorillegarden.nl"),
  title: {
    default: "Majorille Garden · Marokkaanse wellness in Amsterdam",
    template: "%s · Majorille Garden",
  },
  description:
    "Marokkaans geïnspireerde wellness in Amsterdam: warme zandbad-therapie, bio head spa, traditionele massage, kruidenstempel en biologische producten.",
  openGraph: {
    siteName: "Majorille Garden",
    type: "website",
  },
  alternates: {
    languages: { nl: "/nl", en: "/en" },
  },
};

export async function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

export default async function RootLayout(
  props: LayoutProps<"/[lang]">,
) {
  const { lang } = await props.params;
  if (!hasLocale(lang)) notFound();
  const dict = await getDictionary(lang);

  return (
    <html
      lang={lang}
      className={`${fraunces.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-cream text-deep-brown">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:px-4 focus:py-2 focus:bg-deep-brown focus:text-cream"
        >
          {lang === "nl" ? "Naar inhoud" : "Skip to content"}
        </a>
        <Header locale={lang} nav={dict.nav} />
        <main id="main" className="flex-1 pt-[76px] lg:pt-[88px]">{props.children}</main>
        <Footer locale={lang} dict={dict} />
        <CookieBanner locale={lang} />
        <LocalBusinessJsonLd locale={lang} />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
