import { CURRENCY_CODE } from "@/config/constants";
import type { Locale } from "@/i18n/routing";
import type { DayOfWeek, MoneyEgp, TimeOfDay } from "@/types/common";

/**
 * Presentation helpers for the clinic's own data types.
 *
 * Every function here is pure and locale-aware, and every one of them treats
 * `null` as "the clinic has not supplied this" — it returns `null` so the
 * caller can hide the element instead of rendering a guess (spec CV).
 */

/* -------------------------------------------------------------------------- */
/*  Money                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * `350` → `٣٥٠ ج.م` / `EGP 350`.
 *
 * Arabic uses Egyptian-Arabic digits, which is what patients see on the
 * clinic's own printed price lists.
 */
export function formatPrice(price: MoneyEgp | null, locale: Locale): string | null {
  if (price === null || !Number.isFinite(price)) return null;

  return new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-EG", {
    style: "currency",
    currency: CURRENCY_CODE,
    maximumFractionDigits: Number.isInteger(price) ? 0 : 2,
  }).format(price);
}

/* -------------------------------------------------------------------------- */
/*  Days of the week                                                           */
/* -------------------------------------------------------------------------- */

/**
 * `0 = Sunday`, matching `DayOfWeek` and Firestore.
 *
 * A fixed reference week (2024-01-07 was a Sunday) is used so `Intl` produces
 * the correct localized name without depending on today's date — which matters
 * because the value is rendered inside statically prerendered pages.
 */
const REFERENCE_SUNDAY_UTC = Date.UTC(2024, 0, 7);

export function dayName(
  day: DayOfWeek,
  locale: Locale,
  width: "long" | "short" = "long",
): string {
  const date = new Date(REFERENCE_SUNDAY_UTC + day * 86_400_000);
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-GB", {
    weekday: width,
    timeZone: "UTC",
  }).format(date);
}

/** Sunday → Saturday, the order the clinic publishes its schedules in. */
export const WEEK_ORDER: DayOfWeek[] = [0, 1, 2, 3, 4, 5, 6];

/* -------------------------------------------------------------------------- */
/*  Times                                                                      */
/* -------------------------------------------------------------------------- */

/** `"14:00"` → `٢:٠٠ م` / `2:00 pm`. Returns `null` for malformed input. */
export function formatTime(time: TimeOfDay | null, locale: Locale): string | null {
  if (!time) return null;

  const match = /^(\d{1,2}):(\d{2})$/.exec(time.trim());
  if (!match) return null;

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;

  const date = new Date(Date.UTC(2024, 0, 7, hours, minutes));
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-GB", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "UTC",
  }).format(date);
}

/**
 * Formats a working period.
 *
 * `endTime === null` is real, published clinic data: several doctors are
 * advertised as "من الساعة 12 ظهرًا" with no stated finish. The caller supplies
 * the `openEnded` label so the copy stays translatable, and nothing invents a
 * closing time.
 */
export function formatTimeRange(
  startTime: TimeOfDay,
  endTime: TimeOfDay | null,
  locale: Locale,
  openEndedLabel: (from: string) => string,
): string | null {
  const from = formatTime(startTime, locale);
  if (!from) return null;

  const to = formatTime(endTime, locale);
  if (!to) return openEndedLabel(from);

  // The dash is direction-neutral inside an RTL paragraph.
  return `${from} – ${to}`;
}
