import type { MetadataRoute } from "next";

import { SITE_URL } from "@/config/constants";
import { getPathname } from "@/i18n/navigation";
import { localeHtmlLang, routing } from "@/i18n/routing";
import { getPublicCatalogDataset } from "@/services/catalog";
import { getPublicDoctorsDataset } from "@/services/doctors";

interface Entry {
  path: string;
  priority: number;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  lastModified?: string | null;
}

/**
 * Landing pages. `/admin/*` and `/booking/success` are deliberately absent —
 * they are also disallowed in `robots.ts`.
 */
const staticRoutes: Entry[] = [
  { path: "/", priority: 1, changeFrequency: "weekly" },
  { path: "/doctors", priority: 0.9, changeFrequency: "weekly" },
  { path: "/specialties", priority: 0.8, changeFrequency: "monthly" },
  { path: "/services", priority: 0.8, changeFrequency: "monthly" },
  { path: "/labs", priority: 0.8, changeFrequency: "monthly" },
  { path: "/aesthetics", priority: 0.7, changeFrequency: "monthly" },
  { path: "/offers", priority: 0.7, changeFrequency: "weekly" },
  { path: "/about", priority: 0.6, changeFrequency: "yearly" },
  { path: "/founder", priority: 0.6, changeFrequency: "yearly" },
  { path: "/contact", priority: 0.6, changeFrequency: "yearly" },
  { path: "/booking", priority: 0.9, changeFrequency: "monthly" },
  { path: "/store", priority: 0.3, changeFrequency: "monthly" },
];

function absolute(locale: (typeof routing.locales)[number], path: string) {
  const pathname = getPathname({ href: path, locale });
  return `${SITE_URL}${pathname === "/" ? "" : pathname}` || SITE_URL;
}

/**
 * Every public URL, in both locales, with `hreflang` alternates.
 *
 * Detail routes come from Firestore, so a doctor or service added from the
 * dashboard appears in the sitemap on the next revalidation instead of needing
 * a code change. Each entry's `lastModified` is the record's own `updatedAt`,
 * which is what tells a crawler that one doctor changed and the rest did not.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [{ doctors }, { specialties, services }] = await Promise.all([
    getPublicDoctorsDataset(),
    getPublicCatalogDataset(),
  ]);

  const entries: Entry[] = [
    ...staticRoutes,
    ...doctors.map<Entry>((doctor) => ({
      path: `/doctors/${doctor.slug}`,
      priority: 0.8,
      changeFrequency: "monthly",
      lastModified: doctor.updatedAt,
    })),
    ...specialties.map<Entry>((specialty) => ({
      path: `/specialties/${specialty.slug}`,
      priority: 0.6,
      changeFrequency: "monthly",
      lastModified: specialty.updatedAt,
    })),
    ...services.map<Entry>((service) => ({
      path: `/services/${service.slug}`,
      priority: 0.6,
      changeFrequency: "monthly",
      lastModified: service.updatedAt,
    })),
  ];

  const generatedAt = new Date();

  return entries.flatMap(({ path, priority, changeFrequency, lastModified }) =>
    routing.locales.map((locale) => ({
      url: absolute(locale, path),
      lastModified: lastModified ? new Date(lastModified) : generatedAt,
      changeFrequency,
      priority,
      alternates: {
        languages: Object.fromEntries(
          routing.locales.map((candidate) => [
            localeHtmlLang[candidate],
            absolute(candidate, path),
          ]),
        ),
      },
    })),
  );
}
