import type { Metadata } from "next";
import { Inter } from "next/font/google";
import ColorSelector from "@/components/ColorSelector";
import Header from "@/components/Header";
import InlineScript from "@/components/InlineScript";
import Waves from "@/components/Waves";
import { localeInfo, locales } from "@/lib/i18n";
import { waveColorScript } from "@/lib/wave-color";
import { getDictionary, getLocale } from "./dictionaries";
import "../globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export async function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDictionary();
  return {
    title: { default: dict.meta.title, template: `%s · ${dict.meta.title}` },
    description: dict.meta.description,
    alternates: {
      languages: Object.fromEntries(locales.map((l) => [localeInfo[l].bcp47, `/${l}`])),
    },
  };
}

export default async function RootLayout({ children }: LayoutProps<"/[lang]">) {
  const locale = await getLocale();
  const dict = await getDictionary();

  return (
    // The inline script sets --wave-color on <html> before hydration.
    <html lang={localeInfo[locale].bcp47} className={`${inter.variable} antialiased`} suppressHydrationWarning>
      <head>
        <InlineScript html={waveColorScript} />
      </head>
      <body className="flex min-h-dvh flex-col">
        <Header locale={locale} dict={dict} />
        {/* The waves span from below the header to the bottom of the page. */}
        <div className="relative flex-1">
          <Waves />
          <div className="relative z-10 px-4 pt-4 pb-24">
            <ColorSelector labels={dict.colors} />
            <main className="mx-auto mt-8 max-w-[590px]">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}
