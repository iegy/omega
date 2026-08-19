import type { ComponentProps, ReactNode } from "react";

import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export type ButtonVariant =
  | "primary"
  | "cta"
  | "outline"
  | "ghost"
  | "subtle"
  | "white";

export type ButtonSize = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-full font-semibold " +
  "transition-[background-color,color,box-shadow,transform] duration-200 " +
  "disabled:pointer-events-none disabled:opacity-55 active:translate-y-px " +
  "whitespace-nowrap select-none";

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-teal-600 text-white shadow-soft hover:bg-teal-700 focus-visible:outline-teal-700",
  cta: "bg-accent-500 text-white shadow-soft hover:bg-accent-600 focus-visible:outline-accent-600",
  outline:
    "border border-teal-600/30 bg-white text-teal-700 hover:border-teal-600/60 hover:bg-teal-50",
  ghost: "text-ink-600 hover:bg-ink-100 hover:text-ink-800",
  subtle: "bg-teal-50 text-teal-700 hover:bg-teal-100",
  white:
    "bg-white text-teal-700 shadow-soft hover:bg-teal-50 focus-visible:outline-white",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-5 text-sm sm:text-base",
  lg: "h-13 px-7 text-base sm:text-lg",
};

export function buttonClass(
  variant: ButtonVariant = "primary",
  size: ButtonSize = "md",
  className?: string,
) {
  return cn(base, variants[variant], sizes[size], className);
}

interface CommonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children: ReactNode;
}

export function Button({
  variant,
  size,
  className,
  children,
  type = "button",
  ...props
}: CommonProps & Omit<ComponentProps<"button">, "children" | "className">) {
  return (
    <button type={type} className={buttonClass(variant, size, className)} {...props}>
      {children}
    </button>
  );
}

/** Internal, locale-aware link styled as a button. */
export function ButtonLink({
  variant,
  size,
  className,
  children,
  href,
  ...props
}: CommonProps & { href: string } & Omit<
    ComponentProps<typeof Link>,
    "children" | "className" | "href"
  >) {
  return (
    <Link href={href} className={buttonClass(variant, size, className)} {...props}>
      {children}
    </Link>
  );
}

/** External / protocol link (tel:, https:, wa.me) styled as a button. */
export function ExternalButtonLink({
  variant,
  size,
  className,
  children,
  href,
  ...props
}: CommonProps & Omit<ComponentProps<"a">, "children" | "className">) {
  return (
    <a
      href={href}
      className={buttonClass(variant, size, className)}
      rel="noopener noreferrer"
      {...props}
    >
      {children}
    </a>
  );
}
