import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { SpecialtyCard } from "@/components/public/catalog-cards";
import { PageHeader } from "@/components/ui/page-header";
import { Section } from "@/components/ui/section";
import { EmptyState } from "@/components/ui/states";
import type { Locale } from "@/i18n/routing";
import { buildPageMetadata } from "@/lib/page-metadata";
import { getSpecialtiesDirectory } from "@/services/public-content";

interface PageProps {
  params: Promise<{ locale: Locale }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return buildPageMetadata({
    locale,
    pathname: "/specialties",
    namespace: "specialties",
  });
}

export default async function SpecialtiesPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const tn = await getTranslations("nav");
  const tp = await getTranslations("pages.specialties");
  const ts = await getTranslations("states.empty");

  const directory = await getSpecialtiesDirectory();

  return (
    <>
      <PageHeader
        title={tp("title")}
        subtitle={tp("subtitle")}
        crumbs={[{ label: tn("home"), href: "/" }, { label: tn("specialties") }]}
      />

      <Section>
        {directory.length === 0 ? (
          <EmptyState title={ts("title")} description={ts("description")} />
        ) : (
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {directory.map(({ specialty, doctors }) => (
              <li key={specialty.id}>
                <SpecialtyCard specialty={specialty} doctorCount={doctors.length} />
              </li>
            ))}
          </ul>
        )}
      </Section>
    </>
  );
}
