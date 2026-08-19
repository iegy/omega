import type { Metadata } from "next";

import { SITE_URL } from "@/config/constants";
import { getPathname } from "@/i18n/navigation";
import { localeHtmlLang, routing, type Locale } from "@/i18n/routing";

function absoluteUrl(locale: Locale, pathname: string): string {
  const path = getPathname({ href: pathname, locale });
  return `${SITE_URL}${path === "/" ? "" : path}` || SITE_URL;
}

export interface PageMetadataInput {
  locale: Locale;
  /** Locale-agnostic pathname, e.g. `/doctors` — never include the locale prefix. */
  pathname: string;
  title: string;
  description: string;
  /** Absolute or root-relative image used for OpenGraph / Twitter cards. */
  imageUrl?: string | null;
  keywords?: string | null;
  /** Set for admin / utility routes that must stay out of the index. */
  noIndex?: boolean;
}

/**
 * Central metadata builder: canonical URL, hreflang alternates, OpenGraph and
 * Twitter cards for every page (spec BU).
 */
export function createPageMetadata({
  locale,
  pathname,
  title,
  description,
  imageUrl,
  keywords,
  noIndex = false,
}: PageMetadataInput): Metadata {
  const canonical = absoluteUrl(locale, pathname);

  const languages: Record<string, string> = {};
  for (const candidate of routing.locales) {
    languages[localeHtmlLang[candidate]] = absoluteUrl(candidate, pathname);
  }
  languages["x-default"] = absoluteUrl(routing.defaultLocale, pathname);

  const image = imageUrl
    ? imageUrl.startsWith("http")
      ? imageUrl
      : `${SITE_URL}${imageUrl}`
    : undefined;

  return {
    title,
    description,
    keywords: keywords ?? undefined,
    alternates: { canonical, languages },
    robots: noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true },
    openGraph: {
      type: "website",
      url: canonical,
      title,
      description,
      siteName: "Omega Care",
      locale: localeHtmlLang[locale],
      images: image ? [{ url: image }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: image ? [image] : undefined,
    },
  };
}
