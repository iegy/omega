import { ArrowRight } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { EntityImage } from "@/components/public/entity-image";
import {
  ScheduleChips,
  ScheduleSummaryLine,
} from "@/components/public/schedule-view";
import { Badge } from "@/components/ui/badge";
import { InteractiveCard } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { formatPrice } from "@/lib/clinic-format";
import type { DoctorListing } from "@/services/public-content";
import { localizedText } from "@/types/common";

export function DoctorCard({ listing }: { listing: DoctorListing }) {
  const locale = useLocale() as Locale;
  const t = useTranslations("doctor");
  const { doctor, specialties, schedules, consultation } = listing;

  const name = localizedText(doctor.nameAr, doctor.nameEn, locale) ?? doctor.slug;
  const title = localizedText(doctor.titleAr, doctor.titleEn, locale);
  const price = formatPrice(consultation?.price ?? null, locale);

  return (
    <InteractiveCard className="flex h-full flex-col overflow-hidden">
      <Link
        href={`/doctors/${doctor.slug}`}
        className="flex flex-1 flex-col focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
      >
        <div className="flex items-start gap-4 p-5">
          <EntityImage
            src={doctor.imageUrl}
            alt={name}
            name={name}
            sizes="80px"
            className="size-20 shrink-0 rounded-2xl ring-1 ring-ink-200/70"
          />

          <div className="min-w-0 flex-1">
            <h3 className="text-base leading-snug font-bold text-ink-900 group-hover:text-teal-700">
              {name}
            </h3>
            {title ? (
              <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                {title}
              </p>
            ) : null}
          </div>
        </div>

        <div className="mt-auto space-y-3 px-5 pb-5">
          {specialties.length > 0 ? (
            <ul className="flex flex-wrap gap-1.5">
              {specialties.map((specialty) => (
                <li key={specialty.id}>
                  <Badge tone="brand">
                    {localizedText(specialty.nameAr, specialty.nameEn, locale)}
                  </Badge>
                </li>
              ))}
            </ul>
          ) : null}

          <ScheduleChips schedules={schedules} />
          <ScheduleSummaryLine schedules={schedules} />

          <div className="flex items-center justify-between gap-3 border-t border-ink-200/60 pt-3">
            {price ? (
              <p className="text-sm text-muted-foreground">
                {t("consultationFrom")}{" "}
                <span className="font-bold text-teal-700 tabular-nums">{price}</span>
              </p>
            ) : (
              <span />
            )}
            <span className="flex items-center gap-1 text-sm font-semibold text-teal-700">
              {t("viewProfile")}
              <ArrowRight className="size-4 rtl:rotate-180" aria-hidden />
            </span>
          </div>
        </div>
      </Link>
    </InteractiveCard>
  );
}
