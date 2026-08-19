import { CalendarCheck, ShieldCheck, Stethoscope, TestTube } from "lucide-react";
import Image from "next/image";
import { getLocale, getTranslations } from "next-intl/server";

import { ButtonLink } from "@/components/ui/button";
import type { Locale } from "@/i18n/routing";
import { getSiteSettings } from "@/services/settings";
import { pickLocale } from "@/types/site";

export async function HeroSection() {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("home.whyUs.items");
  const settings = await getSiteSettings();
  const { hero, branding } = settings;

  const pillars = [
    { key: "doctors", icon: Stethoscope },
    { key: "diagnostics", icon: ShieldCheck },
    { key: "lab", icon: TestTube },
  ] as const;

  return (
    <section className="relative isolate overflow-hidden brand-gradient text-white">
      {/* soft light bloom, no heavy animation */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 h-80 w-80 rounded-full bg-white/12 blur-3xl end-[-4rem]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-[-6rem] h-72 w-72 rounded-full bg-positive-500/15 blur-3xl start-[-3rem]"
      />

      <div className="container-page relative grid gap-12 py-16 sm:py-20 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:py-26">
        <div className="max-w-2xl">
          <p className="inline-flex items-center gap-2 rounded-pill bg-white/12 px-3 py-1.5 text-xs font-semibold ring-1 ring-inset ring-white/20 sm:text-sm">
            <CalendarCheck className="size-4" aria-hidden />
            {pickLocale(branding.clinicName, locale)}
          </p>

          <h1 className="mt-5 text-3xl leading-[1.15] font-extrabold sm:text-4xl lg:text-5xl">
            {pickLocale(hero.title, locale)}
          </h1>

          <p className="mt-5 max-w-xl text-base leading-relaxed text-white/85 sm:text-lg">
            {pickLocale(hero.subtitle, locale)}
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href={hero.primaryCtaHref} variant="cta" size="lg">
              {pickLocale(hero.primaryCtaLabel, locale)}
            </ButtonLink>
            <ButtonLink href={hero.secondaryCtaHref} variant="white" size="lg">
              {pickLocale(hero.secondaryCtaLabel, locale)}
            </ButtonLink>
          </div>

          <ul className="mt-10 grid gap-4 sm:grid-cols-3">
            {pillars.map(({ key, icon: Icon }) => (
              <li key={key} className="flex items-start gap-2.5 text-sm text-white/85">
                <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl bg-white/12">
                  <Icon className="size-4" aria-hidden />
                </span>
                <span className="font-medium">{t(`${key}.title`)}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Visual: brand mark card. Replaced by `hero.imageUrl` once uploaded. */}
        <div className="relative mx-auto w-full max-w-md lg:max-w-none">
          <div className="relative aspect-4/3 overflow-hidden rounded-[2rem] bg-white/95 p-8 shadow-lift ring-1 ring-white/25">
            <Image
              src={hero.imageUrl ?? branding.logoUrl ?? "/brand/omega-care-logo.png"}
              alt={pickLocale(branding.clinicName, locale)}
              fill
              priority
              sizes="(max-width: 1024px) 90vw, 520px"
              className={hero.imageUrl ? "object-cover" : "object-contain p-4"}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
