"use client";

import { Lock } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { EmptyState } from "@/components/ui/states";
import type { Permission } from "@/types/admin";

import { useCan } from "./auth-provider";

/**
 * Per-screen authorisation inside the dashboard.
 *
 * Components never compare role strings (spec 5) — they declare the capability
 * they need and this gate resolves it against the session's role.
 */
export function PermissionGate({
  permission,
  children,
}: {
  permission: Permission;
  children: ReactNode;
}) {
  const can = useCan();
  const t = useTranslations("auth.noPermission");

  if (can(permission)) return <>{children}</>;

  return (
    <EmptyState
      title={t("title")}
      description={t("description")}
      icon={<Lock className="size-5" aria-hidden />}
    />
  );
}
