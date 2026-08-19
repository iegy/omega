import type { Metadata } from "next";
import { Fragment } from "react";
import { setRequestLocale } from "next-intl/server";

import { JsonLd } from "@/components/seo/json-ld";
import { homepageSectionRenderers } from "@/features/home/section-registry";
import type { Locale } from "@/i18n/routing";
import { createPageMetadata } from "@/lib/seo";
import { medicalClinicSchema } from "@/lib/structured-data";
import { getHomepageSections, getSiteSettings } from "@/services/settings";
import { pickLocale } from "@/types/site";

interface PageProps {
  params: Promise<{ locale: Locale }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const settings = await getSiteSettings();
  const title = pickLocale(settings.seo.title, locale);

  const base = createPageMetadata({
    locale,
    pathname: "/",
    title,
    description: pickLocale(settings.seo.description, locale),
    keywords: pickLocale(settings.seo.keywords, locale),
    imageUrl: settings.seo.ogImageUrl,
  });

  // The layout applies a "%s | Clinic name" template; the homepage owns its
  // full title, so it opts out to avoid repeating the clinic name.
  return { ...base, title: { absolute: title } };
}

export default async function HomePage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [sections, settings] = await Promise.all([
    getHomepageSections(),
    getSiteSettings(),
  ]);

  return (
    <>
      <JsonLd data={medicalClinicSchema(settings, locale)} />
      {sections.map((section) => (
        <Fragment key={section.key}>
          {homepageSectionRenderers[section.key]()}
        </Fragment>
      ))}
    </>
  );
}
