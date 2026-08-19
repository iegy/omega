import { MapPin, MessageCircle, Phone } from "lucide-react";
import Image from "next/image";

import { FacebookIcon, TikTokIcon } from "@/components/ui/brand-icons";
import { getLocale, getTranslations } from "next-intl/server";

import { mainNavigation } from "@/config/navigation";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { mapsViewHref, telHref, whatsappHref } from "@/lib/contact";
import { getSiteSettings } from "@/services/settings";
import { pickLocale } from "@/types/site";

export async function SiteFooter() {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("footer");
  const tn = await getTranslations("nav");
  const tc = await getTranslations("common");
  const settings = await getSiteSettings();

  const { branding, contact, location, social, footer } = settings;
  const phoneLink = telHref(contact.phone);
  const secondaryLink = telHref(contact.secondaryPhone);
  const waLink = whatsappHref(contact.whatsapp);
  const mapLink = mapsViewHref(
    location.latitude,
    location.longitude,
    location.mapsUrl,
  );
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-ink-200 bg-ink-900 text-ink-200">
      <div className="container-page py-12 sm:py-16">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr_1fr]">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3">
              <span className="relative size-14 shrink-0 rounded-2xl bg-white p-1.5">
                <Image
                  src={branding.logoUrl ?? "/brand/omega-care-mark.png"}
                  alt=""
                  fill
                  sizes="64px"
                  className="object-contain p-1"
                />
              </span>
              <span className="flex flex-col leading-tight">
                <span className="text-base font-extrabold text-white">
                  {pickLocale(branding.clinicName, locale)}
                </span>
                <span className="text-xs text-positive-400">
                  {pickLocale(branding.tagline, locale)}
                </span>
              </span>
            </div>
            <p className="mt-5 max-w-md text-sm leading-relaxed text-ink-400">
              {pickLocale(footer.about, locale)}
            </p>

            <div className="mt-6 flex items-center gap-3">
              {social.facebook ? (
                <a
                  href={social.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook"
                  className="inline-flex size-10 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-teal-600"
                >
                  <FacebookIcon className="size-4.5" />
                </a>
              ) : null}
              {social.tiktok ? (
                <a
                  href={social.tiktok}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="TikTok"
                  className="inline-flex size-10 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-teal-600"
                >
                  <TikTokIcon className="size-4.5" />
                </a>
              ) : null}
              {waLink ? (
                <a
                  href={waLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={tc("whatsapp")}
                  className="inline-flex size-10 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-positive-600"
                >
                  <MessageCircle className="size-4.5" aria-hidden />
                </a>
              ) : null}
            </div>
          </div>

          {/* Quick links */}
          <nav aria-label={t("quickLinks")}>
            <h2 className="text-sm font-bold text-white">{t("quickLinks")}</h2>
            <ul className="mt-4 grid grid-cols-2 gap-y-2.5 text-sm sm:grid-cols-1">
              {mainNavigation
                .filter((item) => item.inFooter)
                .map((item) => (
                  <li key={item.key}>
                    <Link
                      href={item.href}
                      className="text-ink-400 transition-colors hover:text-white"
                    >
                      {item.badgeKey ? t("storeSoon") : tn(item.key)}
                    </Link>
                  </li>
                ))}
            </ul>
          </nav>

          {/* Contact */}
          <div>
            <h2 className="text-sm font-bold text-white">{t("contactUs")}</h2>
            <ul className="mt-4 space-y-3 text-sm text-ink-400">
              {phoneLink ? (
                <li>
                  <a
                    href={phoneLink}
                    className="inline-flex items-center gap-2 transition-colors hover:text-white"
                  >
                    <Phone className="size-4 shrink-0" aria-hidden />
                    <span dir="ltr">{contact.phone}</span>
                  </a>
                </li>
              ) : null}
              {secondaryLink ? (
                <li>
                  <a
                    href={secondaryLink}
                    className="inline-flex items-center gap-2 transition-colors hover:text-white"
                  >
                    <Phone className="size-4 shrink-0" aria-hidden />
                    <span dir="ltr">{contact.secondaryPhone}</span>
                  </a>
                </li>
              ) : null}
              {contact.labPhones.length > 0 ? (
                <li>
                  <span className="block text-xs font-semibold text-ink-300">
                    {t("labPhones")}
                  </span>
                  <span className="mt-1 flex flex-wrap gap-x-3 gap-y-1" dir="ltr">
                    {contact.labPhones.map((number) => (
                      <a
                        key={number}
                        href={telHref(number) ?? "#"}
                        className="transition-colors hover:text-white"
                      >
                        {number}
                      </a>
                    ))}
                  </span>
                </li>
              ) : null}
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden />
                <span>
                  {pickLocale(location.address, locale)}
                  {mapLink ? (
                    <>
                      {" — "}
                      <a
                        href={mapLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-teal-300 underline-offset-2 hover:underline"
                      >
                        {tc("address")}
                      </a>
                    </>
                  ) : null}
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 text-xs text-ink-400 sm:flex-row">
          <p>
            © {year} {pickLocale(footer.copyright, locale)}
          </p>
          <p className="flex items-center gap-2">
            <span className="relative size-6">
              <Image
                src={branding.labLogoUrl ?? "/brand/mawada-atef-lab-logo.jpeg"}
                alt=""
                fill
                sizes="24px"
                className="rounded object-contain"
              />
            </span>
            {tn("labs")}
          </p>
        </div>
      </div>
    </footer>
  );
}
