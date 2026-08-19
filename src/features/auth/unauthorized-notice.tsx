"use client";

import { AlertTriangle, LogOut, PauseCircle, ShieldOff, WifiOff } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { Button } from "@/components/ui/button";

import { useAdminAuth } from "./auth-provider";
import type { AdminSession } from "./session";
import { sessionEmail } from "./session";

type BlockedSession = Exclude<
  AdminSession,
  { status: "loading" } | { status: "signedOut" } | { status: "authorized" }
>;

/**
 * Rendered whenever Firebase authentication succeeded but authorisation did not
 * (spec 7). Each outcome gets its own wording — "access denied" is never used to
 * describe a network or rules failure.
 */
export function UnauthorizedNotice({ session }: { session: BlockedSession }) {
  const t = useTranslations("auth");
  const tErrors = useTranslations("errors");
  const { signOut } = useAdminAuth();
  const [busy, setBusy] = useState(false);

  const email = sessionEmail(session);

  const content = (() => {
    switch (session.status) {
      case "notAuthorized":
        return {
          icon: <ShieldOff className="size-6" aria-hidden />,
          title: t("deniedTitle"),
          description: t("deniedDescription"),
          tone: "accent" as const,
        };
      case "inactive":
        return {
          icon: <PauseCircle className="size-6" aria-hidden />,
          title: t("inactiveTitle"),
          description: t("inactiveDescription"),
          tone: "accent" as const,
        };
      case "unconfigured":
        return {
          icon: <AlertTriangle className="size-6" aria-hidden />,
          title: t("notConfiguredTitle"),
          description: t("notConfiguredDescription"),
          tone: "neutral" as const,
        };
      case "error":
        return {
          icon: <WifiOff className="size-6" aria-hidden />,
          title: t("errorTitle"),
          description: tErrors(session.code),
          tone: "neutral" as const,
        };
    }
  })();

  async function handleSignOut() {
    setBusy(true);
    try {
      await signOut();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-3 py-4 text-center">
      <span
        className={
          content.tone === "accent"
            ? "flex size-14 items-center justify-center rounded-2xl bg-accent-50 text-accent-700"
            : "flex size-14 items-center justify-center rounded-2xl bg-ink-100 text-ink-600"
        }
      >
        {content.icon}
      </span>

      <h2 className="text-lg font-bold text-ink-900">{content.title}</h2>
      <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
        {content.description}
      </p>

      {email ? (
        <p className="text-xs text-ink-500">
          {t("signedInAs")}{" "}
          <span dir="ltr" className="font-semibold">
            {email}
          </span>
        </p>
      ) : null}

      {session.status !== "unconfigured" ? (
        <Button variant="outline" onClick={handleSignOut} disabled={busy} className="mt-2">
          <LogOut className="size-4" aria-hidden />
          {busy ? t("signingOut") : t("signOut")}
        </Button>
      ) : null}
    </div>
  );
}
