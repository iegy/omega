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
  // Confirmation pages carry patient-specific state and stay out of the index.
  return buildPageMetadata({
    locale,
    pathname: "/booking/success",
    namespace: "bookingSuccess",
    noIndex: true,
  });
}

export default async function BookingSuccessPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const tn = await getTranslations("nav");
  const tp = await getTranslations("pages");

  return (
    <PlaceholderPage
      namespace="bookingSuccess"
      crumbs={[
        { label: tn("home"), href: "/" },
        { label: tp("booking.title"), href: "/booking" },
        { label: tp("bookingSuccess.title") },
      ]}
    />
  );
}
