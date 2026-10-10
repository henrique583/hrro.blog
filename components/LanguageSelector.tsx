"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { BR, US } from "country-flag-icons/react/3x2";
import { LuChevronDown, LuCheck } from "react-icons/lu";
import { LOCALE_COOKIE, localeInfo, locales, type Locale } from "@/lib/i18n";

const flags: Record<Locale, typeof US> = { en: US, pt: BR };

function rememberLocale(locale: Locale) {
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=31536000; samesite=lax`;
}

function Flag({ locale }: { locale: Locale }) {
  const Icon = flags[locale];
  return <Icon className="h-3.5 w-[21px] shrink-0 rounded-[2px]" aria-hidden />;
}

export default function LanguageSelector({ locale, label }: { locale: Locale; label: string }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();

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
    router.push(`/${next}${rest ? `/${rest}` : ""}`);
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`${label}: ${localeInfo[locale].name}`}
        onClick={() => setOpen((o) => !o)}
        className="glass glass-interactive flex cursor-pointer items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium"
      >
        <Flag locale={locale} />
        {localeInfo[locale].label}
        <LuChevronDown className={`size-3.5 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden />
      </button>

      {open && (
        <div
          role="menu"
          aria-label={label}
          className="glass glass-dense absolute right-0 z-50 mt-2 min-w-48 rounded-2xl p-1.5"
        >
          {locales.map((l) => (
            <button
              key={l}
              type="button"
              role="menuitemradio"
              aria-checked={l === locale}
              lang={localeInfo[l].bcp47}
              onClick={() => select(l)}
              className="flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-left text-sm hover:bg-white/10"
            >
              <Flag locale={l} />
              <span className="flex-1">{localeInfo[l].name}</span>
              {l === locale && <LuCheck className="size-4" aria-hidden />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
