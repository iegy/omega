import { getTranslations } from "next-intl/server";

import { ButtonLink } from "@/components/ui/button";
import { PendingData } from "@/components/ui/pending-data";
import { Section, SectionHeading } from "@/components/ui/section";
import type { HomeDataNamespace } from "@/types/i18n";

/**
 * Shell for a homepage block whose content comes from Firestore.
 * The heading, layout and "view all" action are final; the body is replaced by
 * the real list in the phase that connects that collection.
 */
export async function DataSection({
  namespace,
  viewAllHref,
  tone = "default",
  id,
}: {
  namespace: HomeDataNamespace;
  viewAllHref?: string;
  tone?: "default" | "muted" | "soft";
  id?: string;
}) {
  const t = await getTranslations(`home.${namespace}`);
  const tc = await getTranslations("common");

  return (
    <Section id={id} tone={tone}>
      <SectionHeading
        title={t("title")}
        subtitle={t("subtitle")}
        action={
          viewAllHref ? (
            <ButtonLink href={viewAllHref} variant="outline">
              {tc("viewAll")}
            </ButtonLink>
          ) : undefined
        }
      />
      <PendingData />
    </Section>
  );
}
