import Image from "next/image";

import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export function Logo({
  src,
  name,
  tagline,
  className,
  showText = true,
  size = "md",
}: {
  src: string;
  name: string;
  tagline?: string;
  className?: string;
  showText?: boolean;
  size?: "sm" | "md" | "lg";
}) {
  const dimensions = {
    sm: "size-9",
    md: "size-11 sm:size-12",
    lg: "size-14",
  } as const;

  return (
    <Link
      href="/"
      className={cn("flex min-w-0 items-center gap-2.5 sm:gap-3", className)}
      aria-label={name}
    >
      <span className={cn("relative shrink-0", dimensions[size])}>
        <Image
          src={src}
          alt=""
          fill
          sizes="64px"
          priority
          className="object-contain"
        />
      </span>
      {showText ? (
        <span className="flex min-w-0 flex-col leading-tight">
          <span className="truncate text-sm font-extrabold tracking-tight text-brand-700 sm:text-base">
            {name}
          </span>
          {tagline ? (
            <span className="hidden truncate text-[0.7rem] text-teal-600 sm:block sm:text-xs">
              {tagline}
            </span>
          ) : null}
        </span>
      ) : null}
    </Link>
  );
}
