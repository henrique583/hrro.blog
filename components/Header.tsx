import Link from "next/link";
import type { Dictionary } from "@/app/[lang]/dictionaries";
import type { Locale } from "@/lib/i18n";
import LanguageSelector from "./LanguageSelector";
import MobileNav from "./MobileNav";

export default function Header({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const links = [
    { href: `/${locale}/blog`, label: dict.nav.blog },
    { href: `/${locale}/projects`, label: dict.nav.projects },
    { href: `/${locale}/about`, label: dict.nav.about },
  ];

  return (
    // Soft shadow to separate the header from the page below it.
    <header
      className="relative z-40 bg-background"
      style={{ boxShadow: "0 6px 24px rgb(0 0 0 / 0.55), 0 1px 0 rgb(255 255 255 / 0.04)" }}
    >
      {/* Phones: logo, language selector and a hamburger menu. Larger screens:
          one row, with the selector sitting the same distance from BLOG as the
          links are from each other (so PROJECTS sits centered between its
          neighbors). No letter-spacing, which would add uneven trailing space
          after each word. */}
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-5 sm:gap-8 sm:px-10 sm:py-7">
        <Link href={`/${locale}`} aria-label={dict.nav.home} className="mr-auto text-lg sm:text-[22px]">
          HRRO
        </Link>
        <LanguageSelector locale={locale} label={dict.nav.language} />
        <nav className="hidden items-center gap-8 text-[22px] uppercase sm:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="whitespace-nowrap text-foreground/85 transition-colors hover:text-white"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <MobileNav links={links} labels={{ open: dict.nav.openMenu, close: dict.nav.closeMenu }} />
      </div>
    </header>
  );
}
