import { Construction } from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";

import { EmptyState } from "@/components/ui/states";
import { adminNavigation } from "@/config/navigation";
import { PermissionGate } from "@/features/auth/permission-gate";
import type { Permission } from "@/types/admin";
import type { AdminNavKey } from "@/types/i18n";

function permissionFor(navKey: AdminNavKey): Permission {
  return (
    adminNavigation.find((item) => item.key === navKey)?.permission ?? "dashboard:view"
  );
}

/**
 * Heading + authorisation wrapper shared by the dashboard routes.
 *
 * `PermissionGate` re-checks the capability at the page level, so navigating
 * directly to a URL is not enough to see a screen the role does not include.
 *
 * A route with no `children` is one whose screen belongs to a later phase; it
 * says so rather than rendering an empty page.
 */
export async function AdminPageShell({
  navKey,
  children,
}: {
  navKey: AdminNavKey;
  children?: ReactNode;
}) {
  const tn = await getTranslations("admin.nav");
  const tp = await getTranslations("admin.pending");

  return (
    <PermissionGate permission={permissionFor(navKey)}>
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-ink-900 sm:text-2xl">{tn(navKey)}</h2>

        {children ?? (
          <EmptyState
            title={tp("title")}
            description={tp("description")}
            icon={<Construction className="size-5" aria-hidden />}
          />
        )}
      </div>
    </PermissionGate>
  );
}
