"use client";

import { Loader2, Plus, RefreshCw, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState } from "@/components/ui/states";
import type { AppErrorCode } from "@/lib/errors";
import { cn } from "@/lib/utils";

/**
 * Shared chrome for every "list of records" screen in the dashboard.
 *
 * Deliberately renders **cards, not a table**. Reception staff work from a
 * phone; a table of clinic records at 390 px either scrolls sideways or shrinks
 * text past readability. Each row is a card that reflows, and the actions stay
 * reachable with one thumb.
 */

export function AdminToolbar({
  search,
  onSearchChange,
  onAdd,
  addLabel,
  count,
  showHidden,
  onShowHiddenChange,
  busy,
  onReload,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  onAdd?: () => void;
  addLabel?: string;
  count: number;
  showHidden?: boolean;
  onShowHiddenChange?: (value: boolean) => void;
  busy?: boolean;
  onReload?: () => void;
}) {
  const t = useTranslations("adminList");

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-0 flex-1">
          <Search
            className="pointer-events-none absolute top-1/2 size-4 -translate-y-1/2 text-ink-400 start-3.5"
            aria-hidden
          />
          <input
            type="search"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={t("searchPlaceholder")}
            aria-label={t("search")}
            className="h-11 w-full rounded-xl border border-ink-200 bg-white ps-10 pe-3.5 text-sm outline-none focus-visible:border-teal-600 focus-visible:ring-2 focus-visible:ring-teal-600/20"
          />
        </div>

        {onReload ? (
          <Button variant="ghost" onClick={onReload} disabled={busy} aria-label={t("retry")}>
            <RefreshCw className={cn("size-4", busy && "animate-spin")} aria-hidden />
          </Button>
        ) : null}

        {onAdd ? (
          <Button onClick={onAdd}>
            <Plus className="size-4" aria-hidden />
            {addLabel ?? t("add")}
          </Button>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">{t("count", { count })}</p>

        {onShowHiddenChange ? (
          <label className="flex cursor-pointer items-center gap-2 text-sm text-ink-700">
            <input
              type="checkbox"
              checked={showHidden ?? false}
              onChange={(event) => onShowHiddenChange(event.target.checked)}
              className="size-4 accent-teal-600"
            />
            {t("showHidden")}
          </label>
        ) : null}
      </div>
    </div>
  );
}

/** Loading / error / empty, so no screen has to reimplement the three states. */
export function AdminListState({
  loading,
  error,
  isEmpty,
  onRetry,
  children,
}: {
  loading: boolean;
  error: AppErrorCode | null;
  isEmpty: boolean;
  onRetry: () => void;
  children: ReactNode;
}) {
  const t = useTranslations("adminList");
  const te = useTranslations("errors");

  if (loading) {
    return (
      <p
        role="status"
        className="flex items-center justify-center gap-2 py-14 text-sm text-muted-foreground"
      >
        <Loader2 className="size-4 animate-spin" aria-hidden />
        {t("loading")}
      </p>
    );
  }

  if (error) {
    return (
      <ErrorState
        title={t("loadFailed")}
        description={te(error)}
        action={
          <Button variant="outline" onClick={onRetry}>
            {t("retry")}
          </Button>
        }
      />
    );
  }

  if (isEmpty) {
    return <EmptyState title={t("empty")} description={t("emptyHint")} />;
  }

  return <>{children}</>;
}

/** One record in a list, with its title, meta line and actions. */
export function AdminRecordCard({
  title,
  subtitle,
  active,
  meta,
  actions,
  leading,
}: {
  title: string;
  subtitle?: string | null;
  active?: boolean;
  meta?: ReactNode;
  actions?: ReactNode;
  leading?: ReactNode;
}) {
  const t = useTranslations("adminList");

  return (
    <li className="rounded-card border border-ink-200/70 bg-white p-4 shadow-soft">
      <div className="flex flex-wrap items-start gap-3">
        {leading}

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-bold text-ink-900">{title}</h3>
            {active === false ? (
              <Badge tone="neutral">{t("inactive")}</Badge>
            ) : active === true ? (
              <Badge tone="positive">{t("active")}</Badge>
            ) : null}
          </div>

          {subtitle ? (
            <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
              {subtitle}
            </p>
          ) : null}

          {meta ? <div className="mt-2">{meta}</div> : null}
        </div>

        {actions ? (
          <div className="flex shrink-0 flex-wrap items-center gap-1.5">{actions}</div>
        ) : null}
      </div>
    </li>
  );
}

export function AdminRecordList({ children }: { children: ReactNode }) {
  return <ul className="space-y-3">{children}</ul>;
}
