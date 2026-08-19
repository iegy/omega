import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";

import { ButtonLink } from "@/components/ui/button";
import { Section, SectionHeading } from "@/components/ui/section";
import type { HomeDataNamespace, HomeSectionEmptyKey } from "@/types/i18n";

/**
 * Shared shell for a homepage block backed by a Firestore collection.
 *
 * Replaces the Phase 1 `DataSection` placeholder. When the collection is
 * genuinely empty the block still renders its heading plus a short factual line
 * — the homepage order is controlled from the dashboard, so an enabled section
 * that silently vanished would look like a fault rather than a choice.
 */
export async function HomeCollectionSection({
  namespace,
  emptyKey,
  viewAllHref,
  tone = "default",
  isEmpty,
  children,
}: {
  namespace: HomeDataNamespace;
  /** Key inside the `homeSections` message namespace. */
  emptyKey: HomeSectionEmptyKey;
  viewAllHref?: string;
  tone?: "default" | "muted" | "soft";
  isEmpty: boolean;
  children: ReactNode;
}) {
  const t = await getTranslations(`home.${namespace}`);
  const tc = await getTranslations("common");
  const te = await getTranslations("homeSections");

  return (
    <Section id={namespace} tone={tone}>
      <SectionHeading
        title={t("title")}
        subtitle={t("subtitle")}
        action={
          viewAllHref && !isEmpty ? (
            <ButtonLink href={viewAllHref} variant="outline">
              {tc("viewAll")}
            </ButtonLink>
          ) : undefined
        }
      />
      {isEmpty ? (
        <p className="rounded-card border border-dashed border-ink-200 bg-surface-muted/60 px-5 py-8 text-center text-sm text-muted-foreground">
          {te(emptyKey)}
        </p>
      ) : (
        children
      )}
    </Section>
  );
}
