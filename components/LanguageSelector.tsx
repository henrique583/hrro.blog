"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { BR, US } from "country-flag-icons/react/3x2";
import { LuChevronDown, LuCheck } from "react-icons/lu";
import { LOCALE_COOKIE, localeInfo, locales, type Locale } from "@/lib/i18n";

const flags: Record<Locale, typeof US> = { en: US, pt: BR };

function rememberLocale(locale: Locale) {
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=31536000; samesite=lax`;
}

function Flag({ locale, className }: { locale: Locale; className: string }) {
  const Icon = flags[locale];
  return <Icon className={`shrink-0 rounded-[2px] ${className}`} aria-hidden />;
}

export default function LanguageSelector({ locale, label }: { locale: Locale; label: string }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function select(next: Locale) {
    setOpen(false);
    if (next === locale) return;
    rememberLocale(next);
    const rest = pathname.split("/").slice(2).join("/");
    // A full page load rather than a client-side navigation: each language is
    // its own root layout (<html lang>, <head>), which React can't swap in place.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- intentional, see above
    window.location.assign(`/${next}${rest ? `/${rest}` : ""}`);
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`${label}: ${localeInfo[locale].name}`}
        onClick={() => setOpen((o) => !o)}
        // A small pill with a white border, so it reads as a control rather
        // than another nav link.
        className="flex cursor-pointer items-center gap-2 rounded-full border border-white/70 px-3 py-1 text-base font-medium sm:px-3.5 sm:py-1.5 sm:text-lg text-foreground/90 transition-colors hover:border-white hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      >
        <Flag locale={locale} className="h-3.5 w-[21px] sm:h-4 sm:w-6" />
        {localeInfo[locale].label}
        <LuChevronDown className={`size-4 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden />
      </button>

      {open && (
        <div
          role="menu"
          aria-label={label}
          className="absolute right-0 z-50 mt-2 w-max rounded-xl border border-white/15 bg-[#0b141e] p-1.5 shadow-xl shadow-black/50"
        >
          {locales.map((l) => (
            <button
              key={l}
              type="button"
              role="menuitemradio"
              aria-checked={l === locale}
              lang={localeInfo[l].bcp47}
              onClick={() => select(l)}
              className="flex w-full cursor-pointer items-center gap-3 whitespace-nowrap rounded-lg px-3 py-2 text-left text-sm hover:bg-white/10"
            >
              <Flag locale={l} className="h-3.5 w-[21px]" />
              <span className="flex-1">{localeInfo[l].name}</span>
              {/* Every row reserves the checkmark's space, so the menu is always
                  wide enough for whichever language is selected. */}
              {l === locale ? (
                <LuCheck className="size-4 shrink-0" aria-hidden />
              ) : (
                <span className="size-4 shrink-0" aria-hidden />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
