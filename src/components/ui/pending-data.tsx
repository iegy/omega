import { DatabaseZap } from "lucide-react";
import { useTranslations } from "next-intl";

import { EmptyState } from "@/components/ui/states";

/**
 * Honest placeholder used while a section's Firestore data source is not wired
 * yet. It is a single component so that removing it in the data phases is a
 * mechanical, greppable change — never a silently fake UI.
 */
export function PendingData({ className }: { className?: string }) {
  const t = useTranslations("states.awaitingData");

  return (
    <EmptyState
      title={t("title")}
      description={t("description")}
      icon={<DatabaseZap className="size-5" aria-hidden />}
      className={className}
    />
  );
}
