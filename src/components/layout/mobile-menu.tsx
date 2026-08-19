"use client";

import { Menu, Phone, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { MobileNavList } from "@/components/layout/main-nav";
import { buttonClass } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

export function MobileMenu({
  phoneHref,
  whatsappHref,
}: {
  phoneHref: string | null;
  whatsappHref: string | null;
}) {
  const t = useTranslations("common");
  const tn = useTranslations("nav");
  const tcta = useTranslations("cta");
  const [open, setOpen] = useState(false);

  // Lock scroll + close on Escape while the drawer is open.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t("openMenu")}
        aria-expanded={open}
        className="inline-flex size-11 items-center justify-center rounded-full text-ink-700 transition-colors hover:bg-ink-100 xl:hidden"
      >
        <Menu className="size-6" aria-hidden />
      </button>

      {open ? (
        <div className="fixed inset-0 z-60 xl:hidden">
          <button
            type="button"
            aria-label={t("close")}
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-ink-900/45 backdrop-blur-sm"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label={tn("mobileLabel")}
            className="absolute inset-y-0 end-0 flex w-[min(22rem,88vw)] flex-col bg-white shadow-lift"
          >
            <div className="flex items-center justify-between border-b border-ink-200 px-4 py-3">
              <LanguageSwitcher />
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={t("closeMenu")}
                className="inline-flex size-10 items-center justify-center rounded-full text-ink-600 transition-colors hover:bg-ink-100"
              >
                <X className="size-5" aria-hidden />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3">
              <MobileNavList onNavigate={() => setOpen(false)} />
            </div>

            <div className="space-y-2 border-t border-ink-200 p-4">
              <Link
                href="/booking"
                onClick={() => setOpen(false)}
                className={buttonClass("cta", "md", "w-full")}
              >
                {tcta("book")}
              </Link>
              {phoneHref ? (
                <a
                  href={phoneHref}
                  className={buttonClass("outline", "md", "w-full")}
                >
                  <Phone className="size-4" aria-hidden />
                  {tcta("call")}
                </a>
              ) : null}
              {whatsappHref ? (
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonClass("subtle", "md", "w-full")}
                >
                  {tcta("whatsapp")}
                </a>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
