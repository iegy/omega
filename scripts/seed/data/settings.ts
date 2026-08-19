import type {
  BrandingSettings,
  ContactSettings,
  FooterContent,
  HeroContent,
  HomepageSection,
  LocationSettings,
  PaymentMethodSettings,
  SeoDefaults,
  SocialLinks,
} from "../../../src/types/site";
import { HOMEPAGE_SECTION_KEYS } from "../../../src/types/site";

/* -------------------------------------------------------------------------- */
/*  clinicSettings/site                                                        */
/* -------------------------------------------------------------------------- */

/**
 * Official Google Maps place URL for Omega Care, supplied by the clinic owner.
 *
 * Cross-check: the place coordinates embedded in this URL
 * (`!3d31.391331!4d30.4159575`) match the confirmed clinic coordinates below
 * exactly, so the link and the pin agree.
 *
 * `mapsViewHref()` prefers this URL and falls back to the coordinates when it is
 * absent, so the coordinate-based helpers stay unchanged and keep working.
 */
export const OFFICIAL_MAPS_URL: string | null =
  "https://www.google.com/maps/place/%D8%B9%D9%8A%D8%A7%D8%AF%D8%A7%D8%AA+%D8%A7%D9%88%D9%85%D9%8A%D8%AC%D8%A7+%D9%83%D9%8A%D8%B1%E2%80%AD/@31.3913321,30.4153138,234m/data=!3m1!1e3!4m14!1m7!3m6!1s0x14f6890075182147:0x21dcf21b8906a515!2z2LnZitin2K_Yp9iqINin2YjZhdmK2KzYpyDZg9mK2LE!8m2!3d31.391331!4d30.4159575!16s%2Fg%2F11ld41dr7l!3m5!1s0x14f6890075182147:0x21dcf21b8906a515!8m2!3d31.391331!4d30.4159575!16s%2Fg%2F11ld41dr7l?hl=en&entry=ttu&g_ep=EgoyMDI2MDgxMi4wIKXMDSoASAFQAw%3D%3D";

/**
 * Everything the public site renders that is not a catalogue record.
 *
 * `payments` and `social` deliberately live in their own documents
 * (`paymentMethods/default`, `socialLinks/default`) so the stricter
 * super-admin-only write rule on payment numbers is enforced at the collection
 * level. `getSiteSettings()` merges the three into one object for the UI.
 */
export interface SiteSettingsDocument {
  branding: BrandingSettings;
  contact: ContactSettings;
  location: LocationSettings;
  hero: HeroContent;
  footer: FooterContent;
  seo: SeoDefaults;
  lastBackupAt: string | null;
}

export const siteSettingsSeed: SiteSettingsDocument = {
  branding: {
    clinicName: {
      ar: "عيادات أوميجا كير التخصصية",
      en: "Omega Care Specialized Clinics",
    },
    tagline: {
      ar: "كل احتياجاتك الطبية في مكان واحد",
      en: "Your healthcare needs, all in one place",
    },
    // Approved local brand assets (spec 30) — ImgBB uploads start in Phase 12.
    logoUrl: "/brand/omega-care-logo.png",
    logoMarkUrl: "/brand/omega-care-mark.png",
    logoMonoUrl: "/brand/omega-care-logo-mono.png",
    labLogoUrl: "/brand/mawada-atef-lab-logo.jpeg",
    faviconUrl: "/brand/omega-care-mark.png",
  },

  contact: {
    phone: "0452935000",
    secondaryPhone: "01050607699",
    whatsapp: "01050607688",
    labPhones: ["0452930999", "01555129217"],
    email: null,
  },

  location: {
    address: {
      ar: "رشيد – شارع السكة الجديدة – أمام المطافي – بجوار 99",
      en: "Rashid (Rosetta) – El Sekka El Gedida St. – opposite the Fire Station – beside 99",
    },
    latitude: 31.391331,
    longitude: 30.4159575,
    mapsUrl: OFFICIAL_MAPS_URL,
    // Derived from `mapsUrl` / the coordinates by `directionsHref()`.
    directionsUrl: null,
  },

  hero: {
    title: {
      ar: "كل احتياجاتك الطبية في مكان واحد",
      en: "Your healthcare needs, all in one place",
    },
    subtitle: {
      ar: "نخبة من الأطباء والاستشاريين في مختلف التخصصات، خدمات تشخيصية وطبية وتجميلية، ومعامل طبية متخصصة في رشيد.",
      en: "A multidisciplinary team of doctors and consultants, diagnostic, medical and aesthetic services, and specialized laboratory services in Rashid.",
    },
    primaryCtaLabel: { ar: "احجز موعدك", en: "Book Appointment" },
    primaryCtaHref: "/booking",
    secondaryCtaLabel: { ar: "تصفح الأطباء", en: "Browse Doctors" },
    secondaryCtaHref: "/doctors",
    imageUrl: null,
  },

  footer: {
    about: {
      ar: "مجمع طبي متكامل في رشيد يضم عيادات تخصصية، خدمات تشخيصية وأجهزة طبية، وحدة تجميل وليزر، ومعامل مودة عاطف.",
      en: "An integrated medical complex in Rashid with specialized clinics, diagnostic services and medical devices, an aesthetics & laser unit, and Mawoda Atef Lab.",
    },
    copyright: {
      ar: "جميع الحقوق محفوظة لعيادات أوميجا كير التخصصية",
      en: "All rights reserved — Omega Care Specialized Clinics",
    },
  },

  seo: {
    title: {
      ar: "عيادات أوميجا كير التخصصية – رشيد",
      en: "Omega Care Specialized Clinics – Rashid",
    },
    description: {
      ar: "مجمع طبي متكامل في رشيد: أطباء واستشاريون في مختلف التخصصات، خدمات تشخيصية، تجميل وليزر، ومعامل مودة عاطف. احجز موعدك إلكترونيًا.",
      en: "An integrated medical complex in Rashid: consultants across specialties, diagnostic services, aesthetics & laser, and Mawoda Atef Lab. Book online.",
    },
    keywords: {
      ar: "عيادات رشيد، عيادات تخصصية رشيد، معمل تحاليل رشيد، ليزر رشيد، أوميجا كير",
      en: "Rashid clinics, specialized clinics Rashid, Omega Care Rashid, Mawoda Atef Lab",
    },
    ogImageUrl: "/brand/omega-care-logo.png",
  },

  lastBackupAt: null,
};

/* -------------------------------------------------------------------------- */
/*  paymentMethods/default  (spec 7)                                           */
/* -------------------------------------------------------------------------- */

export const paymentMethodsSeed: PaymentMethodSettings = {
  cashEnabled: true,
  walletEnabled: true,
  instapayEnabled: true,
  walletNumber: "01008650036",
  instapayNumber: "01008650036",
  instructions: {
    ar: "بعد التحويل أدخل رقم الهاتف المُحوَّل منه ورقم العملية إن وُجد، وسيتم تأكيد الدفع من إدارة العيادة.",
    en: "After transferring, enter the sending phone number and the transaction reference if available. Payment is verified by the clinic.",
  },
};

/* -------------------------------------------------------------------------- */
/*  socialLinks/default  (spec 24)                                             */
/* -------------------------------------------------------------------------- */

/** Only the confirmed channels — Instagram / YouTube stay null until supplied. */
export const socialLinksSeed: SocialLinks = {
  facebook: "https://www.facebook.com/omega.care.clinics",
  tiktok: "https://www.tiktok.com/@omega.care.clinic",
  instagram: null,
  youtube: null,
};

/* -------------------------------------------------------------------------- */
/*  siteContent/store  (spec 23 — content only, no commerce collections)       */
/* -------------------------------------------------------------------------- */

export const storeContentSeed = {
  brandName: "OMEGA STORE",
  statusAr: "قريبًا",
  statusEn: "Coming Soon",
  titleAr: "متجر أوميجا",
  titleEn: "Omega Store",
  bodyAr:
    "نعمل حاليًا على تجهيز متجر أوميجا كير للمستلزمات الطبية ومنتجات العناية والتجميل.",
  bodyEn: "Our medical supplies and beauty care store is coming soon.",
  active: true,
};

/* -------------------------------------------------------------------------- */
/*  homepageSections/{key}  (spec 20)                                          */
/* -------------------------------------------------------------------------- */

/**
 * Section order and visibility.
 *
 * `testimonials` ships disabled: no real patient reviews have been supplied and
 * the project forbids inventing them. `offers` stays enabled but resolves to an
 * empty state until the clinic confirms a real offer — enabling the section
 * without offers shows nothing, which is honest, and avoids a second edit later.
 */
const DISABLED_SECTIONS = new Set<string>(["testimonials"]);

export const homepageSectionSeeds: HomepageSection[] = HOMEPAGE_SECTION_KEYS.map(
  (key, index) => ({
    key,
    enabled: !DISABLED_SECTIONS.has(key),
    sortOrder: (index + 1) * 10,
  }),
);
