import { Stethoscope } from "lucide-react";
import Image from "next/image";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Image slot for a Firestore record whose picture has not been uploaded yet.
 *
 * The clinic has not supplied doctor photographs, and none may be invented or
 * stock-sourced (spec CM/CV). So instead of a broken frame this renders a
 * branded monogram built from the record's own name — recognisable, calm, and
 * obviously not a photograph. As soon as an ImgBB URL exists on the document
 * (Admin → Doctors, Phase 5) the real image takes over with no code change.
 */

/** First letter of the first two meaningful words, e.g. "د. محمد أبو زيد" → "م أ". */
function monogram(name: string): string {
  const words = name
    .replace(/^(د\.|dr\.?|prof\.?|أ\.د\.?)\s*/i, "")
    .split(/\s+/)
    .filter((word) => word.length > 1);

  const letters = words.slice(0, 2).map((word) => word[0]);
  return letters.join(" ") || name.trim().slice(0, 1);
}

export function EntityImage({
  src,
  alt,
  name,
  className,
  imageClassName,
  sizes,
  priority = false,
  fallbackIcon,
  objectFit = "cover",
}: {
  src: string | null;
  alt: string;
  /** Used to build the monogram when `src` is null. */
  name: string;
  className?: string;
  imageClassName?: string;
  sizes: string;
  priority?: boolean;
  fallbackIcon?: ReactNode;
  objectFit?: "cover" | "contain";
}) {
  if (src) {
    return (
      <div className={cn("relative overflow-hidden bg-surface-muted", className)}>
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          className={cn(
            objectFit === "cover" ? "object-cover object-top" : "object-contain p-4",
            imageClassName,
          )}
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative flex items-center justify-center overflow-hidden",
        "bg-linear-to-br from-teal-50 via-white to-brand-50",
        className,
      )}
    >
      <span aria-hidden className="flex flex-col items-center gap-1.5">
        <span className="text-2xl font-bold tracking-[0.15em] text-teal-700/85 sm:text-3xl">
          {monogram(name)}
        </span>
        <span className="text-teal-600/50">
          {fallbackIcon ?? <Stethoscope className="size-4" aria-hidden />}
        </span>
      </span>
      <span className="sr-only">{alt}</span>
    </div>
  );
}
