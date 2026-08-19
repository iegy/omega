import { ChevronLeft } from "lucide-react";
import type { ReactNode } from "react";

import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export interface Crumb {
  label: string;
  href?: string;
}

export function PageHeader({
  title,
  subtitle,
  crumbs,
  actions,
  tone = "soft",
}: {
  title: string;
  subtitle?: string;
  crumbs?: Crumb[];
  actions?: ReactNode;
  tone?: "soft" | "brand";
}) {
  const isBrand = tone === "brand";

  return (
    <header
      className={cn(
        "border-b border-ink-200/70",
        isBrand ? "brand-gradient text-white" : "brand-gradient-soft",
      )}
    >
      <div className="container-page py-10 sm:py-14">
        {crumbs && crumbs.length > 0 ? (
          <nav aria-label="breadcrumb" className="mb-4">
            <ol
              className={cn(
                "flex flex-wrap items-center gap-1 text-sm",
                isBrand ? "text-white/75" : "text-muted-foreground",
              )}
            >
              {crumbs.map((crumb, index) => (
                <li key={`${crumb.label}-${index}`} className="flex items-center gap-1">
                  {index > 0 ? (
                    <ChevronLeft
                      className="size-3.5 shrink-0 rtl:rotate-180"
                      aria-hidden
                    />
                  ) : null}
                  {crumb.href ? (
                    <Link
                      href={crumb.href}
                      className="hover:text-teal-700 hover:underline"
                    >
                      {crumb.label}
                    </Link>
                  ) : (
                    <span aria-current="page" className="font-medium">
                      {crumb.label}
                    </span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        ) : null}

        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-3xl">
            <h1
              className={cn(
                "text-3xl leading-tight sm:text-4xl lg:text-[2.75rem]",
                isBrand ? "text-white" : "text-ink-900",
              )}
            >
              {title}
            </h1>
            {subtitle ? (
              <p
                className={cn(
                  "mt-3 text-base leading-relaxed sm:text-lg",
                  isBrand ? "text-white/85" : "text-muted-foreground",
                )}
              >
                {subtitle}
              </p>
            ) : null}
          </div>
          {actions ? (
            <div className="flex shrink-0 flex-wrap gap-3">{actions}</div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
