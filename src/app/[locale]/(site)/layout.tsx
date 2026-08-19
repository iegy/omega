import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { FloatingActions } from "@/components/layout/floating-actions";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { routing } from "@/i18n/routing";
import { telHref, whatsappHref } from "@/lib/contact";
import { getSiteSettings } from "@/services/settings";

/**
 * The public pages are prerendered, but their content now comes from Firestore
 * (`clinicSettings/site`, `homepageSections`). Revalidating every 5 minutes means
 * a dashboard edit goes live without a redeploy while visitors still get a
 * static, cached response. On-demand revalidation lands with the dashboard write
 * flows in Phase 11.
 */
export const revalidate = 300;

export default async function SiteLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  // Required in every layout and page so next-intl can render statically.
  setRequestLocale(locale);

  const t = await getTranslations("common");
  const settings = await getSiteSettings();

  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:z-100 focus:rounded-full focus:bg-teal-700 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white focus:start-3"
      >
        {t("skipToContent")}
      </a>

      <SiteHeader />

      {/* Bottom padding leaves room for the mobile floating bar. */}
      <main id="main" className="flex-1 pb-24 sm:pb-0">
        {children}
      </main>

      <SiteFooter />

      <FloatingActions
        phoneHref={telHref(settings.contact.phone)}
        whatsappHref={whatsappHref(settings.contact.whatsapp)}
      />
    </div>
  );
}
