import Link from "next/link";
import type { Dictionary } from "@/app/[lang]/dictionaries";
import type { Locale } from "@/lib/i18n";
import LanguageSelector from "./LanguageSelector";

export default function Header({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const links = [
    { href: `/${locale}/blog`, label: dict.nav.blog },
    { href: `/${locale}/projects`, label: dict.nav.projects },
    { href: `/${locale}/about`, label: dict.nav.about },
  ];

  return (
    <header className="sticky top-0 z-40 bg-background">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-3 px-4 py-5 sm:px-10 sm:py-7">
        <Link
          href={`/${locale}`}
          aria-label={dict.nav.home}
          className="text-2xl tracking-wide sm:text-3xl"
        >
          HRRO
        </Link>
        <div className="flex items-center gap-4 sm:gap-6">
          <LanguageSelector locale={locale} label={dict.nav.language} />
          <nav className="flex items-center gap-4 text-base uppercase tracking-wide sm:gap-6 sm:text-3xl">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-foreground/90 transition-colors hover:text-white"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
}
