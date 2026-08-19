import { CalendarClock, Tag } from "lucide-react";
import { useFormatter, useLocale, useTranslations } from "next-intl";

import { EntityImage } from "@/components/public/entity-image";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { Locale } from "@/i18n/routing";
import { formatPrice } from "@/lib/clinic-format";
import type { Offer } from "@/types/catalog";
import { localizedText } from "@/types/common";

/**
 * A single live offer.
 *
 * The discount line is derived strictly from the stored fields — no offer text
 * is generated. `discountValue`, `originalPrice` and `offerPrice` are each
 * nullable, and a null simply removes that line rather than defaulting to a
 * headline percentage. No offer is ever fabricated for visual balance.
 */
export function OfferCard({ offer }: { offer: Offer }) {
  const locale = useLocale() as Locale;
  const t = useTranslations("offersPage");
  const format = useFormatter();

  const title = localizedText(offer.titleAr, offer.titleEn, locale) ?? "";
  const description = localizedText(offer.descriptionAr, offer.descriptionEn, locale);

  const offerPrice = formatPrice(offer.offerPrice, locale);
  const originalPrice = formatPrice(offer.originalPrice, locale);

  let discountLabel: string | null = null;
  if (offer.discountType === "percentage" && offer.discountValue !== null) {
    discountLabel = t("discountPercentage", { value: offer.discountValue });
  } else if (offer.discountType === "fixed" && offer.discountValue !== null) {
    const amount = formatPrice(offer.discountValue, locale);
    if (amount) discountLabel = t("discountFixed", { value: amount });
  } else if (offer.discountType === "special_price" && offerPrice) {
    discountLabel = t("specialPrice");
  }

  const formatDay = (iso: string) =>
    format.dateTime(new Date(`${iso}T00:00:00Z`), {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    });

  return (
    <Card className="flex h-full flex-col overflow-hidden">
      {offer.imageUrl ? (
        <EntityImage
          src={offer.imageUrl}
          alt={title}
          name={title}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 380px"
          className="aspect-16/9 w-full"
        />
      ) : null}

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex flex-wrap items-center gap-2">
          {discountLabel ? (
            <Badge tone="accent">
              <Tag className="size-3" aria-hidden />
              {discountLabel}
            </Badge>
          ) : null}
          {offer.featured ? <Badge tone="brand">★</Badge> : null}
        </div>

        <h3 className="text-base leading-snug font-bold text-ink-900">{title}</h3>

        {description ? (
          <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
        ) : null}

        {offerPrice ? (
          <p className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-teal-700 tabular-nums">
              {offerPrice}
            </span>
            {originalPrice ? (
              <span className="text-sm text-muted-foreground line-through tabular-nums">
                {t("wasPrice", { price: originalPrice })}
              </span>
            ) : null}
          </p>
        ) : null}

        {offer.endDate ? (
          <p className="mt-auto flex items-center gap-1.5 pt-2 text-xs text-muted-foreground">
            <CalendarClock className="size-3.5 shrink-0" aria-hidden />
            {t("validUntil", { date: formatDay(offer.endDate) })}
          </p>
        ) : null}
      </div>
    </Card>
  );
}
