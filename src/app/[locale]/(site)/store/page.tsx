import { Bell, ShoppingBag, Sparkles, Stethoscope } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { ButtonLink } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Locale } from "@/i18n/routing";
import { buildPageMetadata } from "@/lib/page-metadata";

interface PageProps {
  params: Promise<{ locale: Locale }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return buildPageMetadata({ locale, pathname: "/store", namespace: "store" });
}

/**
 * Spec AT — the store is a premium "coming soon" page only.
 * No products, cart, checkout, orders or e-commerce collections are created.
 */
export default async function StorePage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const tp = await getTranslations("pages.store");
  const tc = await getTranslations("common");
  const tcta = await getTranslations("cta");
  const tn = await getTranslations("nav");

  return (
    <section className="relative isolate flex min-h-[70vh] items-center overflow-hidden brand-gradient text-white">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 h-80 w-80 rounded-full bg-white/12 blur-3xl end-[-4rem]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-[-6rem] h-72 w-72 rounded-full bg-accent-500/20 blur-3xl start-[-3rem]"
      />

      <div className="container-page relative py-20 text-center">
        <span className="mx-auto mb-6 flex size-16 items-center justify-center rounded-3xl bg-white/12 ring-1 ring-inset ring-white/20">
          <ShoppingBag className="size-7" aria-hidden />
        </span>

        <p className="text-sm font-bold tracking-[0.25em] text-white/70 uppercase">
          Omega Store
        </p>
        <h1 className="mx-auto mt-3 max-w-3xl text-3xl leading-tight font-extrabold sm:text-4xl lg:text-5xl">
          {tp("title")}
        </h1>

        <div className="mt-5 flex justify-center">
          <Badge tone="accent" className="bg-white/15 text-white ring-white/25">
            <Bell className="size-3.5" aria-hidden />
            {tc("comingSoon")}
          </Badge>
        </div>

        <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-white/85 sm:text-lg">
          {tp("subtitle")}
        </p>

        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <ButtonLink href="/booking" variant="cta" size="lg">
            {tcta("book")}
          </ButtonLink>
          <ButtonLink href="/services" variant="white" size="lg">
            <Stethoscope className="size-4" aria-hidden />
            {tn("services")}
          </ButtonLink>
        </div>

        <p className="mt-12 flex items-center justify-center gap-2 text-xs text-white/60">
          <Sparkles className="size-3.5" aria-hidden />
          {tp("note")}
        </p>
      </div>
    </section>
  );
}
