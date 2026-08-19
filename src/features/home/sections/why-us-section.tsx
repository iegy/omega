import {
  CalendarCheck,
  CreditCard,
  MapPin,
  ScanHeart,
  Stethoscope,
  TestTube,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Card, CardBody } from "@/components/ui/card";
import { Section, SectionHeading } from "@/components/ui/section";
import type { WhyUsItemKey } from "@/types/i18n";

const items: { key: WhyUsItemKey; icon: LucideIcon }[] = [
  { key: "doctors", icon: Stethoscope },
  { key: "diagnostics", icon: ScanHeart },
  { key: "lab", icon: TestTube },
  { key: "booking", icon: CalendarCheck },
  { key: "payments", icon: CreditCard },
  { key: "location", icon: MapPin },
];

export async function WhyUsSection() {
  const t = await getTranslations("home.whyUs");

  return (
    <Section tone="muted">
      <SectionHeading title={t("title")} subtitle={t("subtitle")} align="center" />
      <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {items.map(({ key, icon: Icon }) => (
          <li key={key}>
            <Card className="h-full">
              <CardBody>
                <span className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
                  <Icon className="size-5.5" aria-hidden />
                </span>
                <h3 className="text-base font-bold text-ink-900">
                  {t(`items.${key}.title`)}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {t(`items.${key}.description`)}
                </p>
              </CardBody>
            </Card>
          </li>
        ))}
      </ul>
    </Section>
  );
}
