import { Tag } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { OfferCard } from "@/components/public/offer-card";
import { ButtonLink } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { Section } from "@/components/ui/section";
import { EmptyState } from "@/components/ui/states";
import type { Locale } from "@/i18n/routing";
import { buildPageMetadata } from "@/lib/page-metadata";
import { getPublicLiveOffers } from "@/services/catalog";

interface PageProps {
  params: Promise<{ locale: Locale }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return buildPageMetadata({ locale, pathname: "/offers", namespace: "offers" });
}

/**
 * `/offers` — live offers only.
 *
 * `getPublicLiveOffers()` reads the cached `promotions` dataset and re-checks
 * the stored date window against today, so an offer that expires inside the
 * 30-minute cache window still disappears on time. The clinic currently has zero confirmed
 * offers, and zero is the correct number: no placeholder "20% OFF" is generated
 * to make the page look busy. Full offer management arrives in Phase 9.
 */
export default async function OffersPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const tn = await getTranslations("nav");
  const tp = await getTranslations("pages.offers");
  const t = await getTranslations("offersPage");

  const offers = await getPublicLiveOffers();

  return (
    <>
      <PageHeader
        title={tp("title")}
        subtitle={tp("subtitle")}
        crumbs={[{ label: tn("home"), href: "/" }, { label: tn("offers") }]}
      />

      <Section>
        {offers.length === 0 ? (
          <EmptyState
            title={t("noneTitle")}
            description={t("noneDescription")}
            icon={<Tag className="size-5" aria-hidden />}
            action={
              <ButtonLink href="/services" variant="outline">
                {tn("services")}
              </ButtonLink>
            }
          />
        ) : (
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {offers.map((offer) => (
              <li key={offer.id}>
                <OfferCard offer={offer} />
              </li>
            ))}
          </ul>
        )}
      </Section>
    </>
  );
}
