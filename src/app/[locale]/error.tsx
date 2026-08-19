"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";

export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("errorPage");

  useEffect(() => {
    // Raw Firebase / runtime errors are never shown to patients (spec CI).
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6 py-20 text-center">
      <span className="flex size-16 items-center justify-center rounded-3xl bg-accent-50 text-accent-700">
        <AlertTriangle className="size-7" aria-hidden />
      </span>
      <h1 className="mt-6 text-2xl font-bold text-ink-900 sm:text-3xl">
        {t("title")}
      </h1>
      <p className="mt-3 max-w-md text-base leading-relaxed text-muted-foreground">
        {t("description")}
      </p>
      {error.digest ? (
        <p className="mt-3 text-xs text-ink-400" dir="ltr">
          ref: {error.digest}
        </p>
      ) : null}
      <Button onClick={reset} className="mt-8">
        <RotateCcw className="size-4" aria-hidden />
        {t("retry")}
      </Button>
    </div>
  );
}
