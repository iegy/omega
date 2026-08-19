import { CalendarDays, Clock, Info } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import type { Locale } from "@/i18n/routing";
import { dayName, formatTime, formatTimeRange } from "@/lib/clinic-format";
import { cn } from "@/lib/utils";
import { localizedText, type DayOfWeek } from "@/types/common";
import type { DoctorSchedule } from "@/types/doctor";

/**
 * Renders a doctor's published weekly periods.
 *
 * Two pieces of real clinic data drive the design:
 *
 * - `endTime === null` for 18 of the 41 seeded periods, because the clinic
 *   advertises them as "من الساعة 12 ظهرًا" with no closing time. Those render
 *   as "من ٢:٠٠ م" rather than inventing a finish.
 * - `bookingMode === null` on every period so far — the clinic has not decided
 *   slots vs queue. The badge says so plainly instead of implying bookability.
 */

function groupByDay(
  schedules: DoctorSchedule[],
): { day: DayOfWeek; periods: DoctorSchedule[] }[] {
  const byDay = new Map<DayOfWeek, DoctorSchedule[]>();

  for (const schedule of schedules) {
    const bucket = byDay.get(schedule.dayOfWeek);
    if (bucket) bucket.push(schedule);
    else byDay.set(schedule.dayOfWeek, [schedule]);
  }

  return [...byDay.entries()]
    .sort(([a], [b]) => a - b)
    .map(([day, periods]) => ({
      day,
      periods: [...periods].sort((a, b) => a.startTime.localeCompare(b.startTime)),
    }));
}

function ModeBadge({ mode }: { mode: DoctorSchedule["bookingMode"] }) {
  const t = useTranslations("schedule");

  if (mode === "slot") return <Badge tone="teal">{t("modeSlot")}</Badge>;
  if (mode === "queue") return <Badge tone="brand">{t("modeQueue")}</Badge>;
  return <Badge tone="neutral">{t("modePending")}</Badge>;
}

/* -------------------------------------------------------------------------- */
/*  Compact chips — used on cards                                              */
/* -------------------------------------------------------------------------- */

export function ScheduleChips({
  schedules,
  className,
  max = 7,
}: {
  schedules: DoctorSchedule[];
  className?: string;
  max?: number;
}) {
  const locale = useLocale() as Locale;
  const days = groupByDay(schedules);

  if (days.length === 0) return null;

  const shown = days.slice(0, max);
  const hidden = days.length - shown.length;

  return (
    <ul className={cn("flex flex-wrap items-center gap-1.5", className)}>
      {shown.map(({ day }) => (
        <li
          key={day}
          className="rounded-pill bg-teal-50 px-2 py-0.5 text-xs font-semibold text-teal-700"
        >
          {dayName(day, locale, "short")}
        </li>
      ))}
      {hidden > 0 ? (
        <li className="text-xs font-medium text-muted-foreground">+{hidden}</li>
      ) : null}
    </ul>
  );
}

/** "الأحد ١٠:٠٠ ص – ٢:٠٠ م" — the single earliest period, for card summaries. */
export function ScheduleSummaryLine({
  schedules,
  className,
}: {
  schedules: DoctorSchedule[];
  className?: string;
}) {
  const locale = useLocale() as Locale;
  const t = useTranslations("schedule");
  const first = groupByDay(schedules)[0]?.periods[0];

  if (!first) return null;

  const range = formatTimeRange(first.startTime, first.endTime, locale, (from) =>
    t("openEnded", { from }),
  );
  if (!range) return null;

  return (
    <p
      className={cn(
        "flex items-center gap-1.5 text-sm text-muted-foreground",
        className,
      )}
    >
      <Clock className="size-3.5 shrink-0 text-teal-600" aria-hidden />
      <span>{range}</span>
    </p>
  );
}

/* -------------------------------------------------------------------------- */
/*  Full weekly table — used on the doctor profile                             */
/* -------------------------------------------------------------------------- */

export function WeeklySchedule({ schedules }: { schedules: DoctorSchedule[] }) {
  const locale = useLocale() as Locale;
  const t = useTranslations("schedule");
  const td = useTranslations("doctor");
  const days = groupByDay(schedules);

  if (days.length === 0) {
    return <p className="text-sm text-muted-foreground">{td("noSchedule")}</p>;
  }

  return (
    <ul className="divide-y divide-ink-200/70 overflow-hidden rounded-card border border-ink-200/70 bg-surface">
      {days.map(({ day, periods }) => (
        <li key={day} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-start sm:gap-6">
          <p className="flex min-w-36 items-center gap-2 font-semibold text-ink-800">
            <CalendarDays className="size-4 shrink-0 text-teal-600" aria-hidden />
            {dayName(day, locale, "long")}
          </p>

          <div className="flex-1 space-y-2">
            {periods.map((period) => {
              const range = formatTimeRange(
                period.startTime,
                period.endTime,
                locale,
                (from) => t("openEnded", { from }),
              );
              const note = localizedText(period.noteAr, period.noteEn, locale);

              return (
                <div key={period.id} className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                  <span className="flex items-center gap-1.5 text-sm font-medium text-ink-700">
                    <Clock className="size-3.5 shrink-0 text-teal-600" aria-hidden />
                    {range ?? formatTime(period.startTime, locale)}
                  </span>
                  <ModeBadge mode={period.bookingMode} />
                  {note ? (
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Info className="size-3.5 shrink-0" aria-hidden />
                      {note}
                    </span>
                  ) : null}
                </div>
              );
            })}
          </div>
        </li>
      ))}
    </ul>
  );
}
