import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { LoginScreen } from "@/features/auth/login-screen";
import type { Locale } from "@/i18n/routing";

interface PageProps {
  params: Promise<{ locale: Locale }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth" });

  return {
    title: t("loginTitle"),
    description: t("loginSubtitle"),
    robots: { index: false, follow: false },
  };
}

export default async function AdminLoginPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <LoginScreen />;
}
