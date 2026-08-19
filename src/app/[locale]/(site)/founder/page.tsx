import { Award } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { EntityImage } from "@/components/public/entity-image";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Section, SectionHeading } from "@/components/ui/section";
import type { Locale } from "@/i18n/routing";
import { createPageMetadata } from "@/lib/seo";
import { getFounder } from "@/services/founder";
import { getSiteSettings } from "@/services/settings";
import { localizedText } from "@/types/common";

interface PageProps {
  params: Promise<{ locale: Locale }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const [founder, settings] = await Promise.all([getFounder(), getSiteSettings()]);

  if (!founder) {
    const t = await getTranslations({ locale, namespace: "pages.founder" });
    return createPageMetadata({
      locale,
      pathname: "/founder",
      title: t("title"),
      description: t("subtitle"),
      imageUrl: settings.seo.ogImageUrl,
    });
  }

  const name = localizedText(founder.nameAr, founder.nameEn, locale) ?? "";

  return createPageMetadata({
    locale,
    pathname: "/founder",
    title: localizedText(founder.seoTitleAr, founder.seoTitleEn, locale) ?? name,
    description:
      localizedText(founder.seoDescriptionAr, founder.seoDescriptionEn, locale) ??
      localizedText(founder.bioAr, founder.bioEn, locale) ??
      name,
    imageUrl: founder.imageUrl ?? settings.seo.ogImageUrl,
  });
}

/**
 * `/founder`, driven entirely by `founder/profile`.
 *
 * `vision` and `message` are `null` in the clinic's data. Their sections are
 * omitted rather than filled with an invented quotation attributed to a real
 * person (spec CV). Qualification `year` is `null` for all five entries — the
 * award dates were explicitly withheld — so no date is rendered.
 */
export default async function FounderPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const tn = await getTranslations("nav");
  const tp = await getTranslations("pages.founder");
  const t = await getTranslations("founderPage");
  const tcta = await getTranslations("cta");

  const founder = await getFounder();

  const name =
    (founder ? localizedText(founder.nameAr, founder.nameEn, locale) : null) ??
    tp("title");
  const title = founder ? localizedText(founder.titleAr, founder.titleEn, locale) : null;
  const bio = founder ? localizedText(founder.bioAr, founder.bioEn, locale) : null;
  const vision = founder
    ? localizedText(founder.visionAr, founder.visionEn, locale)
    : null;
  const message = founder
    ? localizedText(founder.messageAr, founder.messageEn, locale)
    : null;
  const qualifications = founder?.qualifications ?? [];
  const timeline = founder?.timeline ?? [];

  return (
    <>
      <PageHeader
        title={name}
        subtitle={title ?? tp("subtitle")}
        tone="brand"
        crumbs={[{ label: tn("home"), href: "/" }, { label: tn("founder") }]}
        actions={
          <ButtonLink href="/about" variant="white">
            {tcta("aboutOmega")}
          </ButtonLink>
        }
      />

      <Section>
        <div className="grid gap-10 lg:grid-cols-[0.75fr_1.25fr]">
          <EntityImage
            src={founder?.imageUrl ?? "/brand/founder-mahmoud-zayed.jpeg"}
            alt={name}
            name={name}
            priority
            sizes="(max-width: 1024px) 80vw, 320px"
            className="mx-auto aspect-4/5 w-full max-w-80 rounded-[1.75rem] shadow-card ring-1 ring-ink-200"
          />

          <div className="space-y-10">
            {bio ? (
              <p className="text-base leading-relaxed text-ink-700 sm:text-lg">{bio}</p>
            ) : null}

            {qualifications.length > 0 ? (
              <div>
                <h2 className="mb-4 text-lg font-bold text-ink-900">
                  {t("qualificationsTitle")}
                </h2>
                <ul className="space-y-3">
                  {qualifications.map((qualification) => {
                    const qualificationTitle = localizedText(
                      qualification.titleAr,
                      qualification.titleEn,
                      locale,
                    );
                    const institution = localizedText(
                      qualification.institutionAr,
                      qualification.institutionEn,
                      locale,
                    );

                    return (
                      <li
                        key={qualification.id}
                        className="flex items-start gap-3 rounded-card border border-ink-200/70 bg-surface p-4"
                      >
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
                          <Award className="size-4" aria-hidden />
                        </span>
                        <div className="min-w-0">
                          <p className="font-semibold text-ink-800">
                            {qualificationTitle}
                          </p>
                          {institution ? (
                            <p className="mt-0.5 text-sm text-muted-foreground">
                              {institution}
                              {qualification.year ? ` · ${qualification.year}` : ""}
                            </p>
                          ) : null}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ) : null}
          </div>
        </div>
      </Section>

      {vision || message ? (
        <Section tone="muted">
          <div className="grid gap-6 lg:grid-cols-2">
            {vision ? (
              <Card>
                <CardBody>
                  <SectionHeading title={t("visionTitle")} />
                  <p className="text-base leading-relaxed text-ink-700">{vision}</p>
                </CardBody>
              </Card>
            ) : null}
            {message ? (
              <Card>
                <CardBody>
                  <SectionHeading title={t("messageTitle")} />
                  <blockquote className="text-base leading-relaxed text-ink-700">
                    {message}
                  </blockquote>
                </CardBody>
              </Card>
            ) : null}
          </div>
        </Section>
      ) : null}

      {timeline.length > 0 ? (
        <Section>
          <ol className="space-y-4 border-s border-ink-200 ps-6">
            {timeline.map((entry) => (
              <li key={entry.id} className="relative">
                <span
                  aria-hidden
                  className="absolute top-2 size-2.5 rounded-full bg-teal-600 start-[-1.8125rem]"
                />
                <p className="font-semibold text-ink-800">
                  {localizedText(entry.titleAr, entry.titleEn, locale)}
                  {entry.year ? (
                    <span className="ms-2 text-sm font-normal text-muted-foreground">
                      {entry.year}
                    </span>
                  ) : null}
                </p>
                {localizedText(entry.descriptionAr, entry.descriptionEn, locale) ? (
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {localizedText(entry.descriptionAr, entry.descriptionEn, locale)}
                  </p>
                ) : null}
              </li>
            ))}
          </ol>
        </Section>
      ) : null}
    </>
  );
}
