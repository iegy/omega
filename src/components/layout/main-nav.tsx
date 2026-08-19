"use client";

import { ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

import { mainNavigation } from "@/config/navigation";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

/**
 * Items always visible on extra-large screens; the rest collapse into "more".
 * Six keeps the row within 1280px even with the longer English labels.
 */
const PRIMARY_COUNT = 6;

function useIsActive() {
  const pathname = usePathname();
  return (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function MainNav({ className }: { className?: string }) {
  const t = useTranslations("nav");
  const tc = useTranslations("common");
  const isActive = useIsActive();
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  const items = mainNavigation.filter((item) => item.inHeader);
  const primary = items.slice(0, PRIMARY_COUNT);
  const overflow = items.slice(PRIMARY_COUNT);

  useEffect(() => {
    if (!moreOpen) return;
    function onPointerDown(event: MouseEvent) {
      if (!moreRef.current?.contains(event.target as Node)) setMoreOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setMoreOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [moreOpen]);

  const linkClass = (active: boolean) =>
    cn(
      "relative rounded-pill px-2.5 py-2 text-sm font-medium whitespace-nowrap transition-colors",
      active ? "text-teal-700" : "text-ink-600 hover:text-teal-700",
      "after:absolute after:inset-x-2.5 after:-bottom-0.5 after:h-0.5 after:rounded-full after:bg-teal-600 after:transition-transform after:duration-300",
      active ? "after:scale-x-100" : "after:scale-x-0",
    );

  return (
    <nav
      className={cn("items-center gap-0.5", className)}
      aria-label={t("mainLabel")}
    >
      {primary.map((item) => (
        <Link
          key={item.key}
          href={item.href}
          className={linkClass(isActive(item.href))}
          aria-current={isActive(item.href) ? "page" : undefined}
        >
          {t(item.key)}
        </Link>
      ))}

      {overflow.length > 0 ? (
        <div className="relative" ref={moreRef}>
          <button
            type="button"
            onClick={() => setMoreOpen((open) => !open)}
            aria-expanded={moreOpen}
            aria-haspopup="true"
            className={cn(
              "flex items-center gap-1 rounded-pill px-2.5 py-2 text-sm font-medium whitespace-nowrap transition-colors",
              overflow.some((item) => isActive(item.href))
                ? "text-teal-700"
                : "text-ink-600 hover:text-teal-700",
            )}
          >
            {t("more")}
            <ChevronDown
              className={cn(
                "size-4 transition-transform duration-200",
                moreOpen && "rotate-180",
              )}
              aria-hidden
            />
          </button>

          {moreOpen ? (
            <div
              className="absolute top-full z-50 mt-2 min-w-52 overflow-hidden rounded-2xl border border-ink-200 bg-white p-1.5 shadow-card end-0"
              role="menu"
            >
              {overflow.map((item) => (
                <Link
                  key={item.key}
                  href={item.href}
                  role="menuitem"
                  onClick={() => setMoreOpen(false)}
                  className={cn(
                    "flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive(item.href)
                      ? "bg-teal-50 text-teal-700"
                      : "text-ink-600 hover:bg-ink-50 hover:text-teal-700",
                  )}
                >
                  {t(item.key)}
                  {item.badgeKey ? (
                    <span className="rounded-pill bg-accent-50 px-2 py-0.5 text-[0.65rem] font-semibold text-accent-700">
                      {tc(item.badgeKey)}
                    </span>
                  ) : null}
                </Link>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </nav>
  );
}

export function MobileNavList({ onNavigate }: { onNavigate?: () => void }) {
  const t = useTranslations("nav");
  const tc = useTranslations("common");
  const isActive = useIsActive();

  return (
    <ul className="flex flex-col gap-1">
      {mainNavigation.map((item) => (
        <li key={item.key}>
          <Link
            href={item.href}
            onClick={onNavigate}
            aria-current={isActive(item.href) ? "page" : undefined}
            className={cn(
              "flex items-center justify-between gap-3 rounded-xl px-4 py-3 text-base font-medium transition-colors",
              isActive(item.href)
                ? "bg-teal-50 text-teal-700"
                : "text-ink-700 hover:bg-ink-50",
            )}
          >
            {t(item.key)}
            {item.badgeKey ? (
              <span className="rounded-pill bg-accent-50 px-2 py-0.5 text-[0.65rem] font-semibold text-accent-700">
                {tc(item.badgeKey)}
              </span>
            ) : null}
          </Link>
        </li>
      ))}
    </ul>
  );
}
