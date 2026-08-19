import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/lib/utils";

export function Card({
  className,
  children,
  ...props
}: { children: ReactNode } & Omit<ComponentProps<"div">, "children">) {
  return (
    <div
      className={cn(
        "rounded-card border border-ink-200/70 bg-surface shadow-soft",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardBody({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return <div className={cn("p-5 sm:p-6", className)}>{children}</div>;
}

export function InteractiveCard({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "group rounded-card border border-ink-200/70 bg-surface shadow-soft",
        "transition-[box-shadow,transform,border-color] duration-300 ease-soft",
        "hover:-translate-y-0.5 hover:border-teal-600/25 hover:shadow-card",
        className,
      )}
    >
      {children}
    </div>
  );
}
