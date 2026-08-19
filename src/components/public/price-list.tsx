import { useLocale, useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import type { Locale } from "@/i18n/routing";
import { formatPrice } from "@/lib/clinic-format";
import { localizedText } from "@/types/common";
import type { DoctorServicePrice } from "@/types/doctor";

/**
 * A doctor's own priced items.
 *
 * Rows the caller passes in have already been filtered to "publicly visible and
 * priced" by `visiblePrices()` in `services/public-content.ts`. Rows the clinic
 * has confirmed as a *service* but not yet priced are handled by
 * `UnpricedServiceList` below: the patient still learns the service exists, and
 * the amount is confirmed at reception — no number is guessed.
 */
export function PriceList({ prices }: { prices: DoctorServicePrice[] }) {
  const locale = useLocale() as Locale;
  const t = useTranslations("price");

  if (prices.length === 0) return null;

  return (
    <ul className="divide-y divide-ink-200/70 overflow-hidden rounded-card border border-ink-200/70 bg-surface">
      {prices.map((price) => {
        const name = localizedText(price.nameAr, price.nameEn, locale) ?? "";
        const description = localizedText(
          price.descriptionAr,
          price.descriptionEn,
          locale,
        );
        const amount = formatPrice(price.price, locale);

        return (
          <li
            key={price.id}
            className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 p-4"
          >
            <div className="min-w-0">
              <p className="flex flex-wrap items-center gap-2 font-medium text-ink-800">
                {name}
                <Badge tone="neutral">{t(`kind.${price.kind}`)}</Badge>
              </p>
              {description ? (
                <p className="mt-1 text-sm text-muted-foreground">{description}</p>
              ) : null}
            </div>
            <p className="shrink-0 text-base font-bold text-teal-700 tabular-nums">
              {amount ?? t("onRequest")}
            </p>
          </li>
        );
      })}
    </ul>
  );
}

/**
 * Items the doctor genuinely offers whose price the clinic has not published.
 * Rendered as a plain list with an honest "confirmed at reception" line rather
 * than an empty price column that reads like a loading bug.
 */
export function UnpricedServiceList({ prices }: { prices: DoctorServicePrice[] }) {
  const locale = useLocale() as Locale;
  const t = useTranslations("price");

  if (prices.length === 0) return null;

  return (
    <>
      <ul className="flex flex-wrap gap-2">
        {prices.map((price) => {
          const name = localizedText(price.nameAr, price.nameEn, locale);
          if (!name) return null;
          return (
            <li key={price.id}>
              <Badge tone="teal">{name}</Badge>
            </li>
          );
        })}
      </ul>
      <p className="mt-3 text-sm text-muted-foreground">{t("onRequest")}</p>
    </>
  );
}
