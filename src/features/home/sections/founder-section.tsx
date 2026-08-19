import { getLocale, getTranslations } from "next-intl/server";

import { EntityImage } from "@/components/public/entity-image";
import { ButtonLink } from "@/components/ui/button";
import { Section, SectionHeading } from "@/components/ui/section";
import type { Locale } from "@/i18n/routing";
import { getFounder } from "@/services/founder";
import { localizedText } from "@/types/common";

/**
 * Homepage founder teaser (spec AR), driven by `founder/profile`.
 *
 * Hidden entirely when the document is inactive or has `showOnHomepage: false`,
 * so the clinic controls it from Admin → Founder without touching the homepage
 * section list. Nothing is invented: if the bio is empty the paragraph is simply
 * not rendered.
 */
export async function FounderSection() {
  const founder = await getFounder();
  if (!founder || !founder.showOnHomepage) return null;

  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("home.founder");
  const tcta = await getTranslations("cta");

  const name = localizedText(founder.nameAr, founder.nameEn, locale);
  if (!name) return null;

  const title = localizedText(founder.titleAr, founder.titleEn, locale);
  const bio = localizedText(founder.bioAr, founder.bioEn, locale);

  return (
    <Section tone="muted">
      <div className="grid items-center gap-10 lg:grid-cols-[0.8fr_1.2fr]">
        <EntityImage
          src={founder.imageUrl}
          alt={name}
          name={name}
          sizes="(max-width: 1024px) 70vw, 288px"
          className="mx-auto aspect-4/5 w-full max-w-72 rounded-[1.75rem] shadow-card ring-1 ring-ink-200"
        />

        <div>
          <SectionHeading eyebrow={t("title")} title={name} subtitle={title ?? undefined} />
          {bio ? (
            <p className="max-w-xl text-base leading-relaxed text-muted-foreground">
              {bio}
            </p>
          ) : null}
          <div className="mt-7">
            <ButtonLink href="/founder">{tcta("meetFounder")}</ButtonLink>
          </div>
        </div>
      </div>
    </Section>
  );
}
