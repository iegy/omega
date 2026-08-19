import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { ServiceCard } from "@/components/public/catalog-cards";
import { PageHeader } from "@/components/ui/page-header";
import { Section, SectionHeading } from "@/components/ui/section";
import { EmptyState } from "@/components/ui/states";
import type { Locale } from "@/i18n/routing";
import { buildPageMetadata } from "@/lib/page-metadata";
import { getServicesCatalogue } from "@/services/public-content";
import { localizedText } from "@/types/common";

interface PageProps {
  params: Promise<{ locale: Locale }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return buildPageMetadata({ locale, pathname: "/services", namespace: "services" });
}

/**
 * The service catalogue, grouped by the clinic's own categories.
 *
 * Only categories that hold at least one active service are rendered — the
 * clinic keeps a couple of categories reserved for later, and an empty heading
 * reads like a bug rather than a plan.
 */
export default async function ServicesPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const tn = await getTranslations("nav");
  const tp = await getTranslations("pages.services");
  const ts = await getTranslations("states.empty");
  const t = await getTranslations("servicePage");

  const { groups, uncategorized } = await getServicesCatalogue();
  const isEmpty = groups.length === 0 && uncategorized.length === 0;

  const countLabel = (count: number) =>
    count === 1
      ? t("servicesCountOne")
      : count === 2
        ? t("servicesCountTwo")
        : t("servicesCountMany", { count });

  return (
    <>
      <PageHeader
        title={tp("title")}
        subtitle={tp("subtitle")}
        crumbs={[{ label: tn("home"), href: "/" }, { label: tn("services") }]}
      />

      {isEmpty ? (
        <Section>
          <EmptyState title={ts("title")} description={ts("description")} />
        </Section>
      ) : (
        groups.map((group, index) => {
          const categoryName =
            localizedText(group.category.nameAr, group.category.nameEn, locale) ??
            group.category.slug;
          const categoryDescription = localizedText(
            group.category.descriptionAr,
            group.category.descriptionEn,
            locale,
          );

          return (
            <Section
              key={group.category.id}
              id={group.category.slug}
              tone={index % 2 === 0 ? "default" : "muted"}
            >
              <SectionHeading
                eyebrow={countLabel(group.services.length)}
                title={categoryName}
                subtitle={categoryDescription ?? undefined}
              />
              <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {group.services.map((service) => (
                  <li key={service.id}>
                    <ServiceCard service={service} category={group.category} />
                  </li>
                ))}
              </ul>
            </Section>
          );
        })
      )}

      {uncategorized.length > 0 ? (
        <Section tone={groups.length % 2 === 0 ? "default" : "muted"}>
          <SectionHeading title={t("allServices")} />
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {uncategorized.map((service) => (
              <li key={service.id}>
                <ServiceCard service={service} />
              </li>
            ))}
          </ul>
        </Section>
      ) : null}
    </>
  );
}
