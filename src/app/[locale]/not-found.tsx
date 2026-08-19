import { Compass } from "lucide-react";
import { useTranslations } from "next-intl";

import { ButtonLink } from "@/components/ui/button";

export default function LocaleNotFound() {
  const t = useTranslations("notFound");

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center brand-gradient-soft px-6 py-20 text-center">
      <span className="flex size-16 items-center justify-center rounded-3xl bg-white text-teal-700 shadow-soft">
        <Compass className="size-7" aria-hidden />
      </span>
      <p className="mt-6 text-6xl font-extrabold text-teal-700">404</p>
      <h1 className="mt-3 text-2xl font-bold text-ink-900 sm:text-3xl">
        {t("title")}
      </h1>
      <p className="mt-3 max-w-md text-base leading-relaxed text-muted-foreground">
        {t("description")}
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <ButtonLink href="/">{t("home")}</ButtonLink>
        <ButtonLink href="/doctors" variant="outline">
          {t("doctors")}
        </ButtonLink>
      </div>
    </div>
  );
}
