"use client";

import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, type ReactNode } from "react";

import { Card, CardBody } from "@/components/ui/card";
import { useRouter } from "@/i18n/navigation";

import { useAdminAuth } from "./auth-provider";
import { UnauthorizedNotice } from "./unauthorized-notice";

/**
 * Authorisation gate for `/admin/**` (spec 9).
 *
 * It does more than hide the sidebar: the dashboard subtree is not rendered at
 * all until `admins/{uid}` confirms an `active` account, so no dashboard screen
 * ever mounts for an unauthorised visitor.
 *
 * Because this project uses the Firebase *client* SDK (no service account, no
 * Admin SDK — Spark plan, and no private key in the repo), the definitive
 * boundary is `firestore.rules`: a tampered client can render whatever it likes
 * but still cannot read or write a single document it is not entitled to.
 */
export function AdminGate({ children }: { children: ReactNode }) {
  const t = useTranslations("auth");
  const { session } = useAdminAuth();
  const router = useRouter();

  useEffect(() => {
    if (session.status === "signedOut") router.replace("/admin/login");
  }, [session.status, router]);

  if (session.status === "authorized") return <>{children}</>;

  return (
    <div className="flex min-h-dvh items-center justify-center brand-gradient-soft px-4 py-12">
      <div className="w-full max-w-md">
        <Card>
          <CardBody>
            {session.status === "loading" || session.status === "signedOut" ? (
              <p className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" aria-hidden />
                {t("loadingSession")}
              </p>
            ) : (
              <UnauthorizedNotice session={session} />
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
