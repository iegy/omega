import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { DoctorCard } from "@/components/public/doctor-card";
import { PageHeader } from "@/components/ui/page-header";
import { Section } from "@/components/ui/section";
import { EmptyState } from "@/components/ui/states";
import { DoctorDirectory } from "@/features/doctors/doctor-directory";
import {
  buildDoctorHaystack,
  type DoctorFilterRow,
  type SpecialtyOption,
} from "@/features/doctors/doctor-search";
import type { Locale } from "@/i18n/routing";
import { buildPageMetadata } from "@/lib/page-metadata";
import { getDoctorsDirectory } from "@/services/public-content";

interface PageProps {
  params: Promise<{ locale: Locale }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return buildPageMetadata({ locale, pathname: "/doctors", namespace: "doctors" });
}

/**
 * The doctor directory.
 *
 * Every card is rendered on the server (so the full list is in the HTML and
 * indexable), then handed to a small client component that filters the already
 * rendered nodes by name and specialty. No search library, no extra reads.
 */
export default async function DoctorsPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const tn = await getTranslations("nav");
  const tp = await getTranslations("pages.doctors");
  const ts = await getTranslations("states.empty");

  const { listings, usedSpecialties } = await getDoctorsDirectory();

  const rows: DoctorFilterRow[] = listings.map(({ doctor }) => ({
    key: doctor.id,
    haystack: buildDoctorHaystack([
      doctor.nameAr,
      doctor.nameEn,
      doctor.titleAr,
      doctor.titleEn,
      doctor.slug,
    ]),
    specialtyIds: doctor.specialtyIds,
  }));

  const cards: Record<string, React.ReactNode> = {};
  for (const listing of listings) {
    cards[listing.doctor.id] = <DoctorCard listing={listing} />;
  }

  const specialtyOptions: SpecialtyOption[] = usedSpecialties.map((specialty) => ({
    id: specialty.id,
    nameAr: specialty.nameAr,
    nameEn: specialty.nameEn,
  }));

  return (
    <>
      <PageHeader
        title={tp("title")}
        subtitle={tp("subtitle")}
        crumbs={[{ label: tn("home"), href: "/" }, { label: tn("doctors") }]}
      />

      <Section>
        {listings.length === 0 ? (
          <EmptyState title={ts("title")} description={ts("description")} />
        ) : (
          <DoctorDirectory
            rows={rows}
            specialties={specialtyOptions}
            cards={cards}
          />
        )}
      </Section>
    </>
  );
}
