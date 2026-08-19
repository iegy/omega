import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { PlaceholderPage } from "@/components/layout/placeholder-page";
import type { Locale } from "@/i18n/routing";
import { buildPageMetadata } from "@/lib/page-metadata";

interface PageProps {
  params: Promise<{ locale: Locale }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return buildPageMetadata({
    locale,
    pathname: "/booking",
    namespace: "booking",
  });
}

export default async function BookingPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const tn = await getTranslations("nav");
  const tp = await getTranslations("pages.booking");

  return (
    <PlaceholderPage
      namespace="booking"
      crumbs={[{ label: tn("home"), href: "/" }, { label: tp("title") }]}
    />
  );
}
