import { MapPin, Phone } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";

import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { Logo } from "@/components/layout/logo";
import { MainNav } from "@/components/layout/main-nav";
import { MobileMenu } from "@/components/layout/mobile-menu";
import { ButtonLink } from "@/components/ui/button";
import type { Locale } from "@/i18n/routing";
import { telHref, whatsappHref } from "@/lib/contact";
import { getSiteSettings } from "@/services/settings";
import { pickLocale } from "@/types/site";

export async function SiteHeader() {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("cta");
  const settings = await getSiteSettings();

  const name = pickLocale(settings.branding.clinicName, locale);
  const tagline = pickLocale(settings.branding.tagline, locale);
  const address = pickLocale(settings.location.address, locale);
  const phone = settings.contact.phone;
  const phoneLink = telHref(phone);
  const whatsappLink = whatsappHref(settings.contact.whatsapp);

  return (
    <header className="sticky top-0 z-50 border-b border-ink-200/70 bg-white/85 backdrop-blur-md">
      {/* Slim utility strip */}
      <div className="hidden bg-teal-700 text-white xl:block">
        <div className="container-page flex h-9 items-center justify-between gap-6 text-xs">
          <div className="flex items-center gap-5">
            {phoneLink ? (
              <a
                href={phoneLink}
                className="inline-flex items-center gap-1.5 transition-opacity hover:opacity-80"
              >
                <Phone className="size-3.5" aria-hidden />
                <span dir="ltr">{phone}</span>
              </a>
            ) : null}
            <span className="inline-flex items-center gap-1.5 text-white/85">
              <MapPin className="size-3.5" aria-hidden />
              {address}
            </span>
          </div>
          <LanguageSwitcher variant="inverted" />
        </div>
      </div>

      {/* Main bar */}
      <div className="container-page flex h-16 items-center justify-between gap-3 sm:h-18 sm:gap-4">
        <Logo
          src={
            settings.branding.logoMarkUrl ??
            settings.branding.logoUrl ??
            "/brand/omega-care-mark.png"
          }
          name={name}
          tagline={tagline}
          className="min-w-0 flex-1 xl:flex-none"
        />

        <MainNav className="hidden xl:flex" />

        <div className="flex shrink-0 items-center gap-2">
          {/* Mobile keeps the switcher inside the drawer; desktop uses the top strip. */}
          <LanguageSwitcher className="hidden sm:inline-flex xl:hidden" />
          <ButtonLink
            href="/booking"
            variant="cta"
            size="sm"
            className="hidden sm:inline-flex xl:h-11 xl:px-5"
          >
            {t("book")}
          </ButtonLink>
          <MobileMenu phoneHref={phoneLink} whatsappHref={whatsappLink} />
        </div>
      </div>
    </header>
  );
}
