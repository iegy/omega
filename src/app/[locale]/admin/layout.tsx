import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";

import { AdminAuthProvider } from "@/features/auth/auth-provider";
import { routing } from "@/i18n/routing";

/**
 * `/admin` root.
 *
 * Holds only the authentication provider so `/admin/login` and the guarded
 * dashboard share one session. The dashboard chrome lives in
 * `(dashboard)/layout.tsx`, behind `AdminGate`.
 */
export const metadata: Metadata = {
  // The dashboard must never be indexed (spec BU) — also blocked in robots.txt.
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  return <AdminAuthProvider>{children}</AdminAuthProvider>;
}
