// Shared locale config. Safe to import from both server and client code.

export const locales = ["en", "pt"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

export const LOCALE_COOKIE = "NEXT_LOCALE";

export const localeInfo: Record<
  Locale,
  { label: string; name: string; bcp47: string; deepl: string }
> = {
  en: { label: "EN", name: "English (US)", bcp47: "en-US", deepl: "EN-US" },
  pt: { label: "PT", name: "Português (BR)", bcp47: "pt-BR", deepl: "PT-BR" },
};

export const hasLocale = (value: string): value is Locale =>
  (locales as readonly string[]).includes(value);
