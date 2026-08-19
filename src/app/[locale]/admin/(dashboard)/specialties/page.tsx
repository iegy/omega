import { setRequestLocale } from "next-intl/server";

import { AdminPageShell } from "@/components/admin/admin-page-shell";
import { ServiceCategoriesScreen } from "@/features/admin/specialties/categories-screen";
import { SpecialtiesScreen } from "@/features/admin/specialties/specialties-screen";
import type { Locale } from "@/i18n/routing";

interface PageProps {
  params: Promise<{ locale: Locale }>;
}

/**
 * Specialties and service categories share a screen: both are short reference
 * lists that the doctor and service forms select from, and keeping them
 * together is one fewer place to look for "why is this option missing".
 */
export default async function AdminSpecialtiesPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <AdminPageShell navKey="specialties">
      <div className="space-y-10">
        <SpecialtiesScreen />
        <div className="border-t border-ink-200/70 pt-8">
          <ServiceCategoriesScreen />
        </div>
      </div>
    </AdminPageShell>
  );
}
