import {
  CalendarPlus,
  MessageCircle,
  Phone,
  Stethoscope,
  TestTube,
  Truck,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { telHref, whatsappHref } from "@/lib/contact";
import { getSiteSettings } from "@/services/settings";
import type { QuickActionKey } from "@/types/i18n";

interface QuickAction {
  key: QuickActionKey;
  icon: LucideIcon;
  href: string | null;
  external?: boolean;
  tone: "teal" | "brand" | "accent" | "positive";
}

const tones = {
  teal: "bg-teal-50 text-teal-700 group-hover:bg-teal-600 group-hover:text-white",
  brand: "bg-brand-50 text-brand-700 group-hover:bg-brand-700 group-hover:text-white",
  accent:
    "bg-accent-50 text-accent-700 group-hover:bg-accent-500 group-hover:text-white",
  positive:
    "bg-positive-50 text-positive-700 group-hover:bg-positive-600 group-hover:text-white",
} as const;

export async function QuickActionsSection() {
  const t = await getTranslations("home.quickActions");
  const settings = await getSiteSettings();

  const actions: QuickAction[] = [
    { key: "bookDoctor", icon: CalendarPlus, href: "/booking", tone: "accent" },
    {
      key: "todaysDoctors",
      icon: Stethoscope,
      href: "/doctors?availability=today",
      tone: "teal",
    },
    {
      key: "contact",
      icon: Phone,
      href: telHref(settings.contact.phone),
      external: true,
      tone: "teal",
    },
    {
      key: "whatsapp",
      icon: MessageCircle,
      href: whatsappHref(settings.contact.whatsapp),
      external: true,
      tone: "positive",
    },
    { key: "lab", icon: TestTube, href: "/labs", tone: "brand" },
    {
      key: "sampleRequest",
      icon: Truck,
      href: "/labs#sample-collection",
      tone: "brand",
    },
  ];

  const cardClass =
    "group flex flex-col items-center gap-3 rounded-card border border-ink-200/70 bg-surface p-4 text-center shadow-soft transition-[transform,box-shadow,border-color] duration-300 ease-soft hover:-translate-y-0.5 hover:border-teal-600/25 hover:shadow-card sm:p-5";

  return (
    <section className="relative z-10 -mt-8 sm:-mt-10">
      <div className="container-page">
        <h2 className="sr-only">{t("title")}</h2>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {actions
            .filter((action): action is QuickAction & { href: string } =>
              Boolean(action.href),
            )
            .map(({ key, icon: Icon, href, external, tone }) => {
              const content = (
                <>
                  <span
                    className={`flex size-11 items-center justify-center rounded-2xl transition-colors duration-300 ${tones[tone]}`}
                  >
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <span className="text-xs leading-snug font-semibold text-ink-700 sm:text-sm">
                    {t(key)}
                  </span>
                </>
              );

              return (
                <li key={key}>
                  {external ? (
                    <a
                      href={href}
                      target={href.startsWith("http") ? "_blank" : undefined}
                      rel="noopener noreferrer"
                      className={cardClass}
                    >
                      {content}
                    </a>
                  ) : (
                    <Link href={href} className={cardClass}>
                      {content}
                    </Link>
                  )}
                </li>
              );
            })}
        </ul>
      </div>
    </section>
  );
}
