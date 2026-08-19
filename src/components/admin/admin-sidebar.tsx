"use client";

import {
  CalendarDays,
  DatabaseBackup,
  FileText,
  Gauge,
  LayoutGrid,
  Settings,
  Stethoscope,
  Tags,
  TestTube,
  Ticket,
  UserRound,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";

import { adminNavigation } from "@/config/navigation";
import { useCan } from "@/features/auth/auth-provider";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import type { AdminNavKey } from "@/types/i18n";

const icons: Record<AdminNavKey, LucideIcon> = {
  overview: Gauge,
  appointments: CalendarDays,
  doctors: Stethoscope,
  specialties: Tags,
  services: LayoutGrid,
  offers: Ticket,
  lab: TestTube,
  founder: UserRound,
  content: FileText,
  settings: Settings,
  backup: DatabaseBackup,
};

/** Navigation entries the current role is allowed to open (spec 5 / 29). */
function useVisibleNavigation() {
  const can = useCan();
  return adminNavigation.filter((item) => can(item.permission));
}

export function AdminNavList({ onNavigate }: { onNavigate?: () => void }) {
  const t = useTranslations("admin.nav");
  const pathname = usePathname();
  const items = useVisibleNavigation();

  return (
    <ul className="space-y-1">
      {items.map((item) => {
        const Icon = icons[item.key] ?? LayoutGrid;
        const active =
          item.href === "/admin"
            ? pathname === "/admin"
            : pathname.startsWith(item.href);

        return (
          <li key={item.key}>
            <Link
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-teal-600 text-white shadow-soft"
                  : "text-ink-600 hover:bg-white hover:text-teal-700",
              )}
            >
              <Icon className="size-4.5 shrink-0" aria-hidden />
              {t(item.key)}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function AdminSidebar() {
  const t = useTranslations("admin");

  return (
    <aside className="hidden w-64 shrink-0 border-e border-ink-200 bg-surface-muted lg:block">
      <div className="sticky top-0 flex h-dvh flex-col">
        <div className="px-5 py-5">
          <p className="text-sm font-extrabold text-brand-700">{t("brand")}</p>
        </div>
        <nav aria-label={t("title")} className="flex-1 overflow-y-auto px-3 pb-6">
          <AdminNavList />
        </nav>
      </div>
    </aside>
  );
}

export function AdminMobileDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const t = useTranslations("admin");
  const tc = useTranslations("common");

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-60 lg:hidden">
      <button
        type="button"
        aria-label={tc("close")}
        onClick={onClose}
        className="absolute inset-0 bg-ink-900/45 backdrop-blur-sm"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t("title")}
        className="absolute inset-y-0 flex w-[min(18rem,85vw)] flex-col bg-white shadow-lift start-0"
      >
        <div className="flex items-center justify-between border-b border-ink-200 px-4 py-3">
          <p className="text-sm font-extrabold text-brand-700">{t("brand")}</p>
          <button
            type="button"
            onClick={onClose}
            aria-label={tc("closeMenu")}
            className="inline-flex size-10 items-center justify-center rounded-full text-ink-600 hover:bg-ink-100"
          >
            <X className="size-5" aria-hidden />
          </button>
        </div>
        <nav aria-label={t("title")} className="flex-1 overflow-y-auto p-3">
          <AdminNavList onNavigate={onClose} />
        </nav>
      </div>
    </div>
  );
}
