import { getTranslations } from "next-intl/server";

import { ButtonLink } from "@/components/ui/button";

export async function BookingCtaSection() {
  const t = await getTranslations("home.bookingCta");
  const tcta = await getTranslations("cta");

  return (
    <section className="py-14 sm:py-18">
      <div className="container-page">
        <div className="relative isolate overflow-hidden rounded-[2rem] brand-gradient px-6 py-12 text-center text-white sm:px-12 sm:py-16">
          <div
            aria-hidden
            className="pointer-events-none absolute -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl end-[-2rem]"
          />
          <h2 className="relative text-2xl leading-tight font-extrabold sm:text-3xl lg:text-4xl">
            {t("title")}
          </h2>
          <p className="relative mx-auto mt-4 max-w-2xl text-base leading-relaxed text-white/85 sm:text-lg">
            {t("subtitle")}
          </p>
          <div className="relative mt-8 flex flex-wrap justify-center gap-3">
            <ButtonLink href="/booking" variant="cta" size="lg">
              {tcta("book")}
            </ButtonLink>
            <ButtonLink href="/doctors" variant="white" size="lg">
              {tcta("browseDoctors")}
            </ButtonLink>
          </div>
        </div>
      </div>
    </section>
  );
}
