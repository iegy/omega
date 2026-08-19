import {
  ArrowRight,
  FlaskConical,
  Sparkles,
  Stethoscope,
  TestTube,
  UserRound,
} from "lucide-react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { ButtonLink } from "@/components/ui/button";
import { InteractiveCard } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Section, SectionHeading } from "@/components/ui/section";
import { LocationSection } from "@/features/home/sections/location-section";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { buildPageMetadata } from "@/lib/page-metadata";
import { getPublicCatalogDataset } from "@/services/catalog";
import { getPublicDoctorsDataset } from "@/services/doctors";
import { getPublicLabDataset } from "@/services/lab";
import { getSiteSettings } from "@/services/settings";
import { pickLocale } from "@/types/site";

interface PageProps {
  params: Promise<{ locale: Locale }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return buildPageMetadata({ locale, pathname: "/about", namespace: "about" });
}

/**
 * `/about`, assembled entirely from stored data.
 *
 * The prose is `footer.about` from `clinicSettings/site`, so editing it in
 * Admin → Settings updates this page too. The figures are **counts of the
 * records published on this site**, not marketing statistics: no patient
 * numbers, no years of experience, no success rates, no branch count — none of
 * which the clinic supplied, and none of which may be invented.
 */
export default async function AboutPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const tn = await getTranslations("nav");
  const tp = await getTranslations("pages.about");
  const t = await getTranslations("aboutPage");

  const [settings, { doctors }, { services, specialties }, { units: labUnits }] =
    await Promise.all([
      getSiteSettings(),
      getPublicDoctorsDataset(),
      getPublicCatalogDataset(),
      getPublicLabDataset(),
    ]);

  const about = pickLocale(settings.footer.about, locale);

  const facts = [
    { value: doctors.length, label: t("doctorsFact"), icon: Stethoscope },
    { value: specialties.length, label: t("specialtiesFact"), icon: UserRound },
    { value: services.length, label: t("servicesFact"), icon: FlaskConical },
    { value: labUnits.length, label: t("labUnitsFact"), icon: TestTube },
  ].filter((fact) => fact.value > 0);

  const links = [
    { href: "/doctors", label: t("doctorsLink"), icon: Stethoscope },
    { href: "/specialties", label: t("specialtiesLink"), icon: UserRound },
    { href: "/services", label: t("servicesLink"), icon: FlaskConical },
    { href: "/labs", label: t("labLink"), icon: TestTube },
    { href: "/aesthetics", label: t("aestheticsLink"), icon: Sparkles },
    { href: "/founder", label: t("founderLink"), icon: UserRound },
  ];

  return (
    <>
      <PageHeader
        title={tp("title")}
        subtitle={tp("subtitle")}
        crumbs={[{ label: tn("home"), href: "/" }, { label: tn("about") }]}
      />

      <Section>
        <SectionHeading title={t("introTitle")} />
        <p className="max-w-3xl text-base leading-relaxed text-ink-700 sm:text-lg">
          {about}
        </p>
      </Section>

      {facts.length > 0 ? (
        <Section tone="muted">
          <SectionHeading title={t("factsTitle")} subtitle={t("factsNote")} />
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {facts.map(({ value, label, icon: Icon }) => (
              <li
                key={label}
                className="rounded-card border border-ink-200/70 bg-surface p-5 text-center shadow-soft"
              >
                <span className="mx-auto mb-3 flex size-11 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
                  <Icon className="size-5" aria-hidden />
                </span>
                <p className="text-3xl font-extrabold text-ink-900 tabular-nums">
                  {value}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">{label}</p>
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      <Section>
        <SectionHeading title={t("exploreTitle")} />
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {links.map(({ href, label, icon: Icon }) => (
            <li key={href}>
              <InteractiveCard>
                <Link
                  href={href}
                  className="flex items-center gap-3 p-5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
                    <Icon className="size-4.5" aria-hidden />
                  </span>
                  <span className="flex-1 font-semibold text-ink-800 group-hover:text-teal-700">
                    {label}
                  </span>
                  <ArrowRight
                    className="size-4 shrink-0 text-teal-700 rtl:rotate-180"
                    aria-hidden
                  />
                </Link>
              </InteractiveCard>
            </li>
          ))}
        </ul>

        <div className="mt-8">
          <ButtonLink href="/contact">{tn("contact")}</ButtonLink>
        </div>
      </Section>

      <LocationSection />
    </>
  );
}
