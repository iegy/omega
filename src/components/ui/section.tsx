import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function Section({
  id,
  children,
  className,
  tone = "default",
}: {
  id?: string;
  children: ReactNode;
  className?: string;
  tone?: "default" | "muted" | "soft";
}) {
  const tones = {
    default: "bg-surface",
    muted: "bg-surface-muted",
    soft: "brand-gradient-soft",
  } as const;

  return (
    <section
      id={id}
      className={cn("scroll-mt-24 py-14 sm:py-18 lg:py-22", tones[tone], className)}
    >
      <div className="container-page">{children}</div>
    </section>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = "start",
  action,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: "start" | "center";
  action?: ReactNode;
}) {
  return (
    <div
      className={cn(
        "mb-8 flex flex-col gap-4 sm:mb-10",
        align === "center"
          ? "items-center text-center"
          : "sm:flex-row sm:items-end sm:justify-between",
      )}
    >
      <div className={cn("max-w-2xl", align === "center" && "mx-auto")}>
        {eyebrow ? (
          <p className="mb-2 text-sm font-semibold text-teal-600">{eyebrow}</p>
        ) : null}
        <h2 className="text-2xl leading-tight text-ink-900 sm:text-3xl lg:text-[2.15rem]">
          {title}
        </h2>
        {subtitle ? (
          <p className="mt-3 text-base leading-relaxed text-muted-foreground">
            {subtitle}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
