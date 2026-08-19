"use client";

import { Globe } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";

import { usePathname, useRouter } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";
import { cn } from "@/lib/utils";

export function LanguageSwitcher({
  className,
  variant = "default",
}: {
  className?: string;
  variant?: "default" | "inverted";
}) {
  const t = useTranslations("languageSwitcher");
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function switchTo(next: Locale) {
    if (next === locale) return;
    startTransition(() => {
      // `usePathname()` from `@/i18n/navigation` already returns the
      // locale-agnostic path with dynamic segments resolved.
      router.replace(pathname, { locale: next });
    });
  }

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-pill p-0.5",
        variant === "inverted"
          ? "bg-white/15 text-white"
          : "bg-ink-100 text-ink-600",
        isPending && "opacity-60",
        className,
      )}
      role="group"
      aria-label={t("label")}
    >
      <Globe className="ms-2 size-3.5 shrink-0 opacity-70" aria-hidden />
      {routing.locales.map((candidate) => {
        const isActive = candidate === locale;
        return (
          <button
            key={candidate}
            type="button"
            lang={candidate}
            onClick={() => switchTo(candidate)}
            aria-current={isActive ? "true" : undefined}
            className={cn(
              "rounded-pill px-2.5 py-1 text-xs font-semibold transition-colors",
              isActive
                ? variant === "inverted"
                  ? "bg-white text-teal-700"
                  : "bg-white text-teal-700 shadow-sm"
                : "hover:text-teal-700",
            )}
          >
            {t(candidate)}
          </button>
        );
      })}
    </div>
  );
}
