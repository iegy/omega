import { Sparkles } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";

import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Section, SectionHeading } from "@/components/ui/section";
import type { Locale } from "@/i18n/routing";
import { getAestheticsCatalogue } from "@/services/public-content";
import { localizedText } from "@/types/common";

/**
 * Aesthetics & laser teaser, listing the clinic's real aesthetics services as
 * chips. Names come straight from Firestore — including "إزالة السنط بجهاز
 * مجاليف", where «مجاليف» is the device the clinic uses, not a misspelling.
 */
export async function AestheticsSection() {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("home.aesthetics");
  const tc = await getTranslations("common");

  const group = await getAestheticsCatalogue();
  const services = group?.services ?? [];

  return (
    <Section tone="soft">
      <div className="grid items-start gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <div>
          <span className="mb-4 inline-flex size-12 items-center justify-center rounded-2xl bg-brand-100 text-brand-700">
            <Sparkles className="size-5.5" aria-hidden />
          </span>
          <SectionHeading title={t("title")} subtitle={t("subtitle")} />

          {services.length > 0 ? (
            <ul className="flex flex-wrap gap-2">
              {services.slice(0, 10).map((service) => (
                <li key={service.id}>
                  <Badge tone="brand">
                    {localizedText(service.nameAr, service.nameEn, locale)}
                  </Badge>
                </li>
              ))}
              {services.length > 10 ? (
                <li className="self-center text-sm font-medium text-muted-foreground">
                  +{services.length - 10}
                </li>
              ) : null}
            </ul>
          ) : null}
        </div>

        <div className="flex lg:justify-end">
          <ButtonLink href="/aesthetics" variant="primary" size="lg">
            {tc("viewAll")}
          </ButtonLink>
        </div>
      </div>
    </Section>
  );
}
