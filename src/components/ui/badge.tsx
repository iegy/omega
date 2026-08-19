import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type BadgeTone = "teal" | "brand" | "accent" | "positive" | "neutral";

const tones: Record<BadgeTone, string> = {
  teal: "bg-teal-50 text-teal-700 ring-teal-600/15",
  brand: "bg-brand-50 text-brand-700 ring-brand-700/15",
  accent: "bg-accent-50 text-accent-700 ring-accent-600/20",
  positive: "bg-positive-50 text-positive-700 ring-positive-600/20",
  neutral: "bg-ink-100 text-ink-600 ring-ink-300/40",
};

export function Badge({
  children,
  tone = "teal",
  className,
}: {
  children: ReactNode;
  tone?: BadgeTone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-pill px-2.5 py-1 text-xs font-semibold ring-1 ring-inset",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
