"use client";

import { Info, Loader2, ShieldCheck } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useEffect } from "react";

import { Card, CardBody } from "@/components/ui/card";
import { Link, useRouter } from "@/i18n/navigation";

import { useAdminAuth } from "./auth-provider";
import { LoginForm } from "./login-form";
import { UnauthorizedNotice } from "./unauthorized-notice";

/**
 * `/admin/login`.
 *
 * Already-authorised administrators are bounced straight to the dashboard; the
 * denied / inactive / error outcomes are rendered here so the person sees why
 * they cannot get in without being trapped in a redirect loop.
 */
export function LoginScreen() {
  const t = useTranslations("auth");
  const tAdmin = useTranslations("admin");
  const { session } = useAdminAuth();
  const router = useRouter();

  useEffect(() => {
    if (session.status === "authorized") router.replace("/admin");
  }, [session.status, router]);

  return (
    <div className="flex min-h-dvh items-center justify-center brand-gradient-soft px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-7 flex flex-col items-center text-center">
          <span className="relative mb-4 size-16">
            <Image
              src="/brand/omega-care-mark.png"
              alt=""
              fill
              sizes="64px"
              priority
              className="object-contain"
            />
          </span>
          <h1 className="text-2xl font-extrabold text-ink-900">{t("loginTitle")}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t("loginSubtitle")}</p>
        </div>

        <Card>
          <CardBody>
            {session.status === "loading" ? (
              <p className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" aria-hidden />
                {t("loadingSession")}
              </p>
            ) : session.status === "authorized" ? (
              <p className="flex items-center justify-center gap-2 py-8 text-sm text-teal-700">
                <ShieldCheck className="size-4" aria-hidden />
                {t("goToDashboard")}
              </p>
            ) : session.status === "signedOut" ? (
              <LoginForm />
            ) : (
              <UnauthorizedNotice session={session} />
            )}
          </CardBody>
        </Card>

        <p className="mt-6 flex items-start justify-center gap-2 text-center text-xs leading-relaxed text-muted-foreground">
          <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          {t("patientsNote")}
        </p>

        <p className="mt-4 text-center text-sm">
          <Link href="/" className="font-medium text-teal-700 hover:underline">
            {tAdmin("backToSite")}
          </Link>
        </p>
      </div>
    </div>
  );
}
