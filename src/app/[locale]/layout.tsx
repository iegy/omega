import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { Toaster } from "sonner";

import "@/app/globals.css";

import { SITE_URL } from "@/config/constants";
import { arabicFont, latinFont } from "@/config/fonts";
import { localeDirection, localeHtmlLang, routing, type Locale } from "@/i18n/routing";
import { createPageMetadata } from "@/lib/seo";
import { getSiteSettings } from "@/services/settings";
import { pickLocale } from "@/types/site";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export const viewport: Viewport = {
  themeColor: "#0c7183",
  width: "device-width",
  initialScale: 1,
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  const settings = await getSiteSettings();
  const base = createPageMetadata({
    locale,
    pathname: "/",
    title: pickLocale(settings.seo.title, locale),
    description: pickLocale(settings.seo.description, locale),
    keywords: pickLocale(settings.seo.keywords, locale),
    imageUrl: settings.seo.ogImageUrl,
  });

  return {
    ...base,
    metadataBase: new URL(SITE_URL),
    title: {
      default: pickLocale(settings.seo.title, locale),
      template: `%s | ${pickLocale(settings.branding.clinicName, locale)}`,
    },
    applicationName: "Omega Care",
    formatDetection: { telephone: true },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  // Enables static rendering for this locale.
  setRequestLocale(locale);

  const typedLocale = locale as Locale;

  return (
    <html
      lang={localeHtmlLang[typedLocale]}
      dir={localeDirection[typedLocale]}
      className={`${arabicFont.variable} ${latinFont.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-dvh bg-background text-foreground antialiased">
        <NextIntlClientProvider>
          {children}
          <Toaster
            position="top-center"
            dir={localeDirection[typedLocale]}
            richColors
            closeButton
          />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
