import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import type { Locale } from "@/i18n/routing";
import { createPageMetadata } from "@/lib/seo";
import { getSiteSettings } from "@/services/settings";
import type { PagesNamespace } from "@/types/i18n";

/**
 * Builds page metadata from the `pages.<namespace>` message keys.
 * Data-driven pages (doctor / service / specialty details) override the title
 * and description with the record's own SEO fields once Firestore is wired.
 */
export async function buildPageMetadata({
  locale,
  pathname,
  namespace,
  noIndex,
}: {
  locale: Locale;
  pathname: string;
  namespace: PagesNamespace;
  noIndex?: boolean;
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: `pages.${namespace}` });
  const settings = await getSiteSettings();

  return createPageMetadata({
    locale,
    pathname,
    title: t("title"),
    description: t("subtitle"),
    imageUrl: settings.seo.ogImageUrl,
    noIndex,
  });
}
