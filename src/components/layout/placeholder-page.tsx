import { getTranslations } from "next-intl/server";

import { PageHeader, type Crumb } from "@/components/ui/page-header";
import { PendingData } from "@/components/ui/pending-data";
import { Section } from "@/components/ui/section";
import type { PagesNamespace } from "@/types/i18n";

/**
 * Route shell for a page whose content arrives in a later phase.
 * The header, breadcrumbs, metadata and layout are production code; only the
 * body is a documented placeholder, so nothing here pretends to be finished.
 */
export async function PlaceholderPage({
  namespace,
  crumbs,
  tone = "soft",
}: {
  namespace: PagesNamespace;
  crumbs?: Crumb[];
  tone?: "soft" | "brand";
}) {
  const t = await getTranslations(`pages.${namespace}`);

  return (
    <>
      <PageHeader
        title={t("title")}
        subtitle={t("subtitle")}
        crumbs={crumbs}
        tone={tone}
      />
      <Section>
        <PendingData />
      </Section>
    </>
  );
}
