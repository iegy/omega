import { getRequestConfig } from "next-intl/server";

import { TIMEZONE } from "@/config/constants";

import { isLocale, routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = requested && isLocale(requested) ? requested : routing.defaultLocale;

  return {
    locale,
    timeZone: TIMEZONE,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
