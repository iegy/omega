import { MessageCircle, Phone, TestTube } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { FacebookIcon, TikTokIcon } from "@/components/ui/brand-icons";
import { ExternalButtonLink } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Section } from "@/components/ui/section";
import { LocationSection } from "@/features/home/sections/location-section";
import type { Locale } from "@/i18n/routing";
import { telHref, whatsappHref } from "@/lib/contact";
import { buildPageMetadata } from "@/lib/page-metadata";
import { getSiteSettings } from "@/services/settings";

interface PageProps {
  params: Promise<{ locale: Locale }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return buildPageMetadata({ locale, pathname: "/contact", namespace: "contact" });
}

export default async function ContactPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const tn = await getTranslations("nav");
  const tp = await getTranslations("pages.contact");
  const tc = await getTranslations("common");
  const tf = await getTranslations("footer");
  const settings = await getSiteSettings();
  const { contact, social } = settings;

  const phones = [
    { label: tc("phone"), value: contact.phone },
    { label: tc("secondaryPhone"), value: contact.secondaryPhone },
  ].filter((entry): entry is { label: string; value: string } => Boolean(entry.value));

  const waLink = whatsappHref(contact.whatsapp);

  return (
    <>
      <PageHeader
        title={tp("title")}
        subtitle={tp("subtitle")}
        crumbs={[{ label: tn("home"), href: "/" }, { label: tn("contact") }]}
      />

      <Section>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {phones.map((entry) => (
            <Card key={entry.value}>
              <CardBody>
                <span className="mb-4 flex size-11 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
                  <Phone className="size-5" aria-hidden />
                </span>
                <p className="text-sm font-semibold text-ink-800">{entry.label}</p>
                <a
                  href={telHref(entry.value) ?? "#"}
                  dir="ltr"
                  className="mt-1 block text-lg font-bold text-teal-700 hover:underline"
                >
                  {entry.value}
                </a>
              </CardBody>
            </Card>
          ))}

          {waLink ? (
            <Card>
              <CardBody>
                <span className="mb-4 flex size-11 items-center justify-center rounded-2xl bg-positive-50 text-positive-700">
                  <MessageCircle className="size-5" aria-hidden />
                </span>
                <p className="text-sm font-semibold text-ink-800">{tc("whatsapp")}</p>
                <a
                  href={waLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  dir="ltr"
                  className="mt-1 block text-lg font-bold text-positive-700 hover:underline"
                >
                  {contact.whatsapp}
                </a>
              </CardBody>
            </Card>
          ) : null}

          {contact.labPhones.length > 0 ? (
            <Card className="sm:col-span-2 lg:col-span-1">
              <CardBody>
                <span className="mb-4 flex size-11 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
                  <TestTube className="size-5" aria-hidden />
                </span>
                <p className="text-sm font-semibold text-ink-800">{tf("labPhones")}</p>
                <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1" dir="ltr">
                  {contact.labPhones.map((number) => (
                    <a
                      key={number}
                      href={telHref(number) ?? "#"}
                      className="text-lg font-bold text-brand-700 hover:underline"
                    >
                      {number}
                    </a>
                  ))}
                </div>
              </CardBody>
            </Card>
          ) : null}
        </div>

        {social.facebook || social.tiktok ? (
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <span className="text-sm font-semibold text-ink-700">{tf("followUs")}</span>
            {social.facebook ? (
              <ExternalButtonLink
                href={social.facebook}
                target="_blank"
                variant="outline"
                size="sm"
              >
                <FacebookIcon className="size-4" />
                Facebook
              </ExternalButtonLink>
            ) : null}
            {social.tiktok ? (
              <ExternalButtonLink
                href={social.tiktok}
                target="_blank"
                variant="outline"
                size="sm"
              >
                <TikTokIcon className="size-4" />
                TikTok
              </ExternalButtonLink>
            ) : null}
          </div>
        ) : null}
      </Section>

      <LocationSection />
    </>
  );
}
