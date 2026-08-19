import { setRequestLocale } from "next-intl/server";

import { AdminPageShell } from "@/components/admin/admin-page-shell";
import { DoctorsScreen } from "@/features/admin/doctors/doctors-screen";
import type { Locale } from "@/i18n/routing";

interface PageProps {
  params: Promise<{ locale: Locale }>;
}

export default async function AdminDoctorsPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <AdminPageShell navKey="doctors">
      <DoctorsScreen />
    </AdminPageShell>
  );
}
