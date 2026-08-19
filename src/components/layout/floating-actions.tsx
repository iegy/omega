"use client";

import { CalendarCheck, MessageCircle, Phone } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

/**
 * Mobile-only floating bar (spec CO). It sits above the safe-area inset and
 * leaves the page scrollable, so it never covers primary navigation.
 */
export function FloatingActions({
  phoneHref,
  whatsappHref,
}: {
  phoneHref: string | null;
  whatsappHref: string | null;
}) {
  const t = useTranslations("floating");

  const itemClass =
    "flex flex-1 flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 text-[0.7rem] font-semibold transition-colors";

  return (
    <div
      aria-label={t("label")}
      className={cn(
        "fixed inset-x-3 bottom-3 z-40 sm:hidden",
        "rounded-3xl border border-ink-200 bg-white/95 p-1.5 shadow-lift backdrop-blur",
        "pb-[max(0.375rem,env(safe-area-inset-bottom))]",
      )}
    >
      <div className="flex items-stretch gap-1">
        <Link
          href="/booking"
          className={cn(itemClass, "bg-accent-500 text-white hover:bg-accent-600")}
        >
          <CalendarCheck className="size-5" aria-hidden />
          {t("book")}
        </Link>
        {whatsappHref ? (
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(itemClass, "text-positive-700 hover:bg-positive-50")}
          >
            <MessageCircle className="size-5" aria-hidden />
            {t("whatsapp")}
          </a>
        ) : null}
        {phoneHref ? (
          <a
            href={phoneHref}
            className={cn(itemClass, "text-teal-700 hover:bg-teal-50")}
          >
            <Phone className="size-5" aria-hidden />
            {t("call")}
          </a>
        ) : null}
      </div>
    </div>
  );
}
