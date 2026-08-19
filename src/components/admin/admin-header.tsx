"use client";

import { ExternalLink, LogOut, Menu, ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { AdminMobileDrawer } from "@/components/admin/admin-sidebar";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAdminAuth, useCurrentAdmin } from "@/features/auth/auth-provider";
import { Link, useRouter } from "@/i18n/navigation";

export function AdminHeader() {
  const t = useTranslations("admin");
  const tAuth = useTranslations("auth");
  const tc = useTranslations("common");
  const { signOut } = useAdminAuth();
  const admin = useCurrentAdmin();
  const router = useRouter();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await signOut();
      // After logout the administrator always lands on the login screen (spec 8).
      router.replace("/admin/login");
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <>
      <header className="sticky top-0 z-50 flex h-16 items-center justify-between gap-3 border-b border-ink-200 bg-white/90 px-4 backdrop-blur sm:px-6">
        <div className="flex min-w-0 items-center gap-2">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label={tc("openMenu")}
            className="inline-flex size-10 shrink-0 items-center justify-center rounded-full text-ink-700 hover:bg-ink-100 lg:hidden"
          >
            <Menu className="size-5" aria-hidden />
          </button>
          <h1 className="truncate text-base font-bold text-ink-900">{t("title")}</h1>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {admin ? (
            <div className="hidden items-center gap-2 md:flex">
              <span className="max-w-52 truncate text-xs text-ink-500" dir="ltr">
                {admin.email}
              </span>
              <Badge tone="teal">
                <ShieldCheck className="size-3.5" aria-hidden />
                {tAuth(`roles.${admin.role}`)}
              </Badge>
            </div>
          ) : null}

          <LanguageSwitcher />

          <Link
            href="/"
            className="hidden items-center gap-1.5 rounded-pill px-3 py-2 text-sm font-medium text-ink-600 transition-colors hover:bg-ink-100 hover:text-teal-700 lg:inline-flex"
          >
            <ExternalLink className="size-4" aria-hidden />
            {t("backToSite")}
          </Link>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            disabled={signingOut}
            aria-label={tAuth("signOut")}
          >
            <LogOut className="size-4" aria-hidden />
            <span className="hidden sm:inline">
              {signingOut ? tAuth("signingOut") : tAuth("signOut")}
            </span>
          </Button>
        </div>
      </header>

      <AdminMobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
}
