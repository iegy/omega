import { defineRouting } from "next-intl/routing";

/**
 * Omega Care is an Arabic-first platform.
 *
 * - `ar` is the default locale and is served WITHOUT a URL prefix  ->  /doctors
 * - `en` is served with a prefix                                  ->  /en/doctors
 *
 * This keeps the canonical Arabic URLs clean (matching the agreed route map)
 * while still giving the English version its own indexable URLs + hreflang.
 */
export const routing = defineRouting({
  locales: ["ar", "en"],
  defaultLocale: "ar",
  localePrefix: "as-needed",
  localeDetection: false,
});

export type Locale = (typeof routing.locales)[number];

export const localeDirection: Record<Locale, "rtl" | "ltr"> = {
  ar: "rtl",
  en: "ltr",
};

export const localeLabel: Record<Locale, string> = {
  ar: "العربية",
  en: "English",
};

/** Locale codes used for `hreflang` / OpenGraph. */
export const localeHtmlLang: Record<Locale, string> = {
  ar: "ar-EG",
  en: "en",
};

export function isLocale(value: string): value is Locale {
  return (routing.locales as readonly string[]).includes(value);
}
