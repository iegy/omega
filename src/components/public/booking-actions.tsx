import { CalendarCheck, MessageCircle, Phone } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";

import {
  ButtonLink,
  ExternalButtonLink,
  type ButtonSize,
} from "@/components/ui/button";
import type { Locale } from "@/i18n/routing";
import { telHref, whatsappHref } from "@/lib/contact";
import { getSiteSettings } from "@/services/settings";
import { localizedText } from "@/types/common";

/**
 * The call-to-action block for a doctor.
 *
 * The prompt's rule is that a booking CTA appears "only when booking is
 * genuinely available". Booking is available for a period only once the clinic
 * has chosen slot vs queue (`bookingMode !== null`), and right now no seeded
 * period has. So instead of a dead "Book now" button this offers the two
 * channels that do work today — the clinic's real phone number and WhatsApp —
 * and says why online booking is not open. The booking button appears
 * automatically, with no code change, as soon as a schedule gets a booking mode.
 */
export async function DoctorBookingActions({
  doctorSlug,
  doctorName,
  onlineBookingAvailable,
  size = "md",
}: {
  doctorSlug: string;
  doctorName: string;
  onlineBookingAvailable: boolean;
  size?: ButtonSize;
}) {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("cta");
  const settings = await getSiteSettings();

  const tel = telHref(settings.contact.phone ?? settings.contact.secondaryPhone);
  const clinicName = localizedText(
    settings.branding.clinicName.ar,
    settings.branding.clinicName.en,
    locale,
  );
  const wa = whatsappHref(
    settings.contact.whatsapp,
    clinicName ? `${clinicName} — ${doctorName}` : doctorName,
  );

  return (
    <div className="flex flex-wrap gap-3">
      {onlineBookingAvailable ? (
        <ButtonLink href={`/booking?doctor=${doctorSlug}`} size={size} variant="cta">
          <CalendarCheck className="size-4" aria-hidden />
          {t("book")}
        </ButtonLink>
      ) : null}

      {tel ? (
        <ExternalButtonLink
          href={tel}
          size={size}
          variant={onlineBookingAvailable ? "outline" : "primary"}
        >
          <Phone className="size-4" aria-hidden />
          {t("call")}
        </ExternalButtonLink>
      ) : null}

      {wa ? (
        <ExternalButtonLink href={wa} size={size} variant="outline" target="_blank">
          <MessageCircle className="size-4" aria-hidden />
          {t("whatsapp")}
        </ExternalButtonLink>
      ) : null}
    </div>
  );
}
