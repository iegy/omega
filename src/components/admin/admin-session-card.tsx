"use client";

import { ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { Card, CardBody } from "@/components/ui/card";
import { useCurrentAdmin } from "@/features/auth/auth-provider";
import { rolePermissions } from "@/types/admin";

/**
 * Confirms, on the overview screen, exactly which authorised account and role
 * the current session resolved to — the visible proof that authentication is
 * wired to `admins/{uid}` and not to the browser.
 */
export function AdminSessionCard() {
  const t = useTranslations("auth");
  const admin = useCurrentAdmin();

  if (!admin) return null;

  return (
    <Card>
      <CardBody className="flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-muted-foreground">
            {t("signedInAs")}
          </p>
          <p className="mt-1 truncate text-base font-bold text-ink-900" dir="ltr">
            {admin.displayName ?? admin.email}
          </p>
          {admin.displayName ? (
            <p className="truncate text-xs text-ink-500" dir="ltr">
              {admin.email}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col items-start gap-1.5">
          <span className="text-xs font-semibold text-muted-foreground">
            {t("roleLabel")}
          </span>
          <Badge tone="teal">
            <ShieldCheck className="size-3.5" aria-hidden />
            {t(`roles.${admin.role}`)}
          </Badge>
          <span className="text-[0.7rem] text-ink-400" dir="ltr">
            {rolePermissions[admin.role].length} permissions
          </span>
        </div>
      </CardBody>
    </Card>
  );
}
