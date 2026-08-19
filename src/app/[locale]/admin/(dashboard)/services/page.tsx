import { setRequestLocale } from "next-intl/server";

import { AdminPageShell } from "@/components/admin/admin-page-shell";
import type { Locale } from "@/i18n/routing";

interface PageProps {
  params: Promise<{ locale: Locale }>;
}

export default async function AdminServicesPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <AdminPageShell navKey="services" />;
}
