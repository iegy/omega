"use client";

import { Search, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useDeferredValue, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  normalizeSearchText,
  type DoctorFilterRow,
  type SpecialtyOption,
} from "@/features/doctors/doctor-search";
import { EmptyState } from "@/components/ui/states";
import type { Locale } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { localizedText } from "@/types/common";

/**
 * Client-side filtering for `/doctors`.
 *
 * Deliberately dependency-free: 17 doctors is far too small to justify shipping
 * a search library to a Cloudflare Worker with a 3 MiB budget. The whole list is
 * already in the prerendered HTML, so filtering is a synchronous array pass and
 * the page stays statically rendered with zero extra Firestore reads.
 */

export function DoctorDirectory({
  rows,
  specialties,
  cards,
}: {
  rows: DoctorFilterRow[];
  specialties: SpecialtyOption[];
  /** Server-rendered `<DoctorCard>` per row, keyed identically to `rows`. */
  cards: Record<string, React.ReactNode>;
}) {
  const locale = useLocale() as Locale;
  const t = useTranslations("directory");

  const [term, setTerm] = useState("");
  const [specialtyId, setSpecialtyId] = useState<string>("");
  const deferredTerm = useDeferredValue(term);

  const visible = useMemo(() => {
    const needle = normalizeSearchText(deferredTerm);
    return rows.filter((row) => {
      if (specialtyId && !row.specialtyIds.includes(specialtyId)) return false;
      if (needle && !row.haystack.includes(needle)) return false;
      return true;
    });
  }, [rows, deferredTerm, specialtyId]);

  const filtersActive = term !== "" || specialtyId !== "";

  const countLabel =
    visible.length === 1
      ? t("resultsOne")
      : visible.length === 2
        ? t("resultsTwo")
        : t("resultsMany", { count: visible.length });

  const fieldClass =
    "h-11 w-full rounded-full border border-ink-200 bg-surface px-4 text-sm text-ink-800 " +
    "outline-none transition-colors placeholder:text-ink-400 " +
    "focus-visible:border-teal-600 focus-visible:ring-2 focus-visible:ring-teal-600/20";

  return (
    <div>
      <div className="mb-6 grid gap-3 sm:grid-cols-[1.4fr_1fr_auto] sm:items-end">
        <div>
          <label
            htmlFor="doctor-search"
            className="mb-1.5 block text-sm font-medium text-ink-700"
          >
            {t("searchLabel")}
          </label>
          <div className="relative">
            <Search
              className="pointer-events-none absolute top-1/2 size-4 -translate-y-1/2 text-ink-400 start-4"
              aria-hidden
            />
            <input
              id="doctor-search"
              type="search"
              value={term}
              onChange={(event) => setTerm(event.target.value)}
              placeholder={t("searchPlaceholder")}
              className={cn(fieldClass, "ps-11")}
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="doctor-specialty"
            className="mb-1.5 block text-sm font-medium text-ink-700"
          >
            {t("specialtyLabel")}
          </label>
          <select
            id="doctor-specialty"
            value={specialtyId}
            onChange={(event) => setSpecialtyId(event.target.value)}
            className={fieldClass}
          >
            <option value="">{t("allSpecialties")}</option>
            {specialties.map((specialty) => (
              <option key={specialty.id} value={specialty.id}>
                {localizedText(specialty.nameAr, specialty.nameEn, locale)}
              </option>
            ))}
          </select>
        </div>

        {filtersActive ? (
          <Button
            variant="ghost"
            onClick={() => {
              setTerm("");
              setSpecialtyId("");
            }}
          >
            <X className="size-4" aria-hidden />
            {t("clear")}
          </Button>
        ) : (
          <span className="hidden sm:block" />
        )}
      </div>

      <p aria-live="polite" className="mb-5 text-sm text-muted-foreground">
        {countLabel}
      </p>

      {visible.length === 0 ? (
        <EmptyState
          title={t("noResultsTitle")}
          description={t("noResultsDescription")}
          icon={<Search className="size-5" aria-hidden />}
        />
      ) : (
        <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((row) => (
            <li key={row.key}>{cards[row.key]}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
