import { ArrowRight, CalendarCheck, Sparkles, Stethoscope, TestTube } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { EntityImage } from "@/components/public/entity-image";
import { Badge } from "@/components/ui/badge";
import { InteractiveCard } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { formatPrice } from "@/lib/clinic-format";
import type { Service, ServiceCategory, Specialty } from "@/types/catalog";
import { localizedText } from "@/types/common";
import type { LabUnit } from "@/types/lab";

/**
 * Cards for the catalogue collections.
 *
 * The clinic supplied names only — no specialty descriptions, no service
 * descriptions, no catalogue prices and no images. Rather than pad the layout
 * with invented copy, these cards stay deliberately compact and lead with the
 * one genuinely useful secondary fact each record has: how many doctors work in
 * a specialty, or which category a service belongs to.
 */

/** "1 doctor" / "2 doctors" / "N doctors" — Arabic needs the dual form. */
export function useCountLabel(
  namespace: "specialtyPage" | "servicePage",
  base: "doctorsCount" | "servicesCount",
) {
  const t = useTranslations(namespace);

  return (count: number): string => {
    if (count === 1) return t(`${base}One`);
    if (count === 2) return t(`${base}Two`);
    return t(`${base}Many`, { count });
  };
}

/* -------------------------------------------------------------------------- */
/*  Specialty                                                                  */
/* -------------------------------------------------------------------------- */

export function SpecialtyCard({
  specialty,
  doctorCount,
}: {
  specialty: Specialty;
  doctorCount: number;
}) {
  const locale = useLocale() as Locale;
  const countLabel = useCountLabel("specialtyPage", "doctorsCount");

  const name =
    localizedText(specialty.nameAr, specialty.nameEn, locale) ?? specialty.slug;
  const description = localizedText(
    specialty.descriptionAr,
    specialty.descriptionEn,
    locale,
  );

  return (
    <InteractiveCard className="h-full">
      <Link
        href={`/specialties/${specialty.slug}`}
        className="flex h-full flex-col gap-3 p-5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
      >
        <span className="flex size-11 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
          <Stethoscope className="size-5" aria-hidden />
        </span>

        <h3 className="text-base leading-snug font-bold text-ink-900 group-hover:text-teal-700">
          {name}
        </h3>

        {description ? (
          <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        ) : null}

        <p className="mt-auto flex items-center justify-between gap-2 pt-2 text-sm">
          <span className="text-muted-foreground">
            {doctorCount > 0 ? countLabel(doctorCount) : null}
          </span>
          <ArrowRight
            className="size-4 shrink-0 text-teal-700 rtl:rotate-180"
            aria-hidden
          />
        </p>
      </Link>
    </InteractiveCard>
  );
}

/* -------------------------------------------------------------------------- */
/*  Service                                                                    */
/* -------------------------------------------------------------------------- */

export function ServiceCard({
  service,
  category,
}: {
  service: Service;
  category?: ServiceCategory | null;
}) {
  const locale = useLocale() as Locale;
  const t = useTranslations("servicePage");

  const name = localizedText(service.nameAr, service.nameEn, locale) ?? service.slug;
  const description = localizedText(
    service.descriptionAr,
    service.descriptionEn,
    locale,
  );
  const price = service.showPrice ? formatPrice(service.price, locale) : null;
  const categoryName = category
    ? localizedText(category.nameAr, category.nameEn, locale)
    : null;

  return (
    <InteractiveCard className="h-full overflow-hidden">
      <Link
        href={`/services/${service.slug}`}
        className="flex h-full flex-col focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
      >
        {service.imageUrl ? (
          <EntityImage
            src={service.imageUrl}
            alt={name}
            name={name}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 380px"
            className="aspect-16/9 w-full"
          />
        ) : null}

        <div className="flex flex-1 flex-col gap-3 p-5">
          <div className="flex flex-wrap items-center gap-2">
            {categoryName ? <Badge tone="teal">{categoryName}</Badge> : null}
            {service.featured ? (
              <Badge tone="accent">
                <Sparkles className="size-3" aria-hidden />
              </Badge>
            ) : null}
          </div>

          <h3 className="text-base leading-snug font-bold text-ink-900 group-hover:text-teal-700">
            {name}
          </h3>

          {description ? (
            <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">
              {description}
            </p>
          ) : null}

          <div className="mt-auto flex items-center justify-between gap-2 pt-2">
            {price ? (
              <p className="text-sm font-bold text-teal-700 tabular-nums">{price}</p>
            ) : service.requiresBooking ? (
              <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <CalendarCheck className="size-3.5 text-teal-600" aria-hidden />
                {t("requiresBooking")}
              </p>
            ) : (
              <span />
            )}
            <ArrowRight
              className="size-4 shrink-0 text-teal-700 rtl:rotate-180"
              aria-hidden
            />
          </div>
        </div>
      </Link>
    </InteractiveCard>
  );
}

/* -------------------------------------------------------------------------- */
/*  Laboratory unit — not a link: the clinic supplied no per-unit test list     */
/* -------------------------------------------------------------------------- */

export function LabUnitCard({ unit }: { unit: LabUnit }) {
  const locale = useLocale() as Locale;

  const name = localizedText(unit.nameAr, unit.nameEn, locale) ?? unit.slug;
  const description = localizedText(unit.descriptionAr, unit.descriptionEn, locale);

  return (
    <div className="flex h-full flex-col gap-3 rounded-card border border-ink-200/70 bg-surface p-5 shadow-soft">
      <span className="flex size-11 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
        <TestTube className="size-5" aria-hidden />
      </span>
      <h3 className="text-base leading-snug font-bold text-ink-900">{name}</h3>
      {description ? (
        <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
      ) : null}
    </div>
  );
}
