import {
  HOMEPAGE_SECTION_KEYS,
  type HomepageSection,
  type SiteSettings,
} from "@/types/site";

/**
 * ⚠️  These are FALLBACK / SEED values only.
 *
 * No component may import this file directly. Everything reads the site
 * configuration through `getSiteSettings()` (src/services/settings.ts), which
 * from Phase 2 onwards resolves `clinicSettings/site` in Firestore and only
 * falls back to this object when the document does not exist yet
 * (first deploy / local development without credentials).
 *
 * Keeping the values here — rather than inline in JSX — is what makes the
 * "no hardcoded business data" rule (spec BE) enforceable.
 */

const defaultHomepageSections: HomepageSection[] = HOMEPAGE_SECTION_KEYS.map(
  (key, index) => ({
    key,
    // Testimonials stay off until real, verified reviews exist (spec BQ / CV).
    enabled: key !== "testimonials",
    sortOrder: (index + 1) * 10,
  }),
);

export const defaultSiteSettings: SiteSettings = {
  branding: {
    clinicName: {
      ar: "عيادات أوميجا كير التخصصية",
      en: "Omega Care Specialized Clinics",
    },
    tagline: {
      ar: "كل احتياجاتك الطبية في مكان واحد",
      en: "All your medical needs in one place",
    },
    logoUrl: "/brand/omega-care-logo.png",
    logoMarkUrl: "/brand/omega-care-mark.png",
    logoMonoUrl: "/brand/omega-care-logo-mono.png",
    labLogoUrl: "/brand/mawada-atef-lab-logo.jpeg",
    faviconUrl: "/brand/omega-care-logo.png",
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
    mapsUrl: null,
    directionsUrl: null,
  },

  social: {
    facebook: "https://www.facebook.com/omega.care.clinics",
    tiktok: "https://www.tiktok.com/@omega.care.clinic",
    instagram: null,
    youtube: null,
  },

  payments: {
    cashEnabled: true,
    walletEnabled: true,
    instapayEnabled: true,
    walletNumber: "01008650036",
    instapayNumber: "01008650036",
    instructions: {
      ar: "بعد التحويل أدخل رقم الهاتف المُحوَّل منه ورقم العملية إن وُجد، وسيتم تأكيد الدفع من الإدارة.",
      en: "After transferring, enter the sending phone number and the transaction reference if available. Payment is verified by the clinic.",
    },
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
      en: "An integrated medical complex in Rashid with specialized clinics, diagnostic services and medical devices, an aesthetics & laser unit, and Mawada Atef Lab.",
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
      en: "An integrated medical complex in Rashid: consultants across specialties, diagnostic services, aesthetics & laser, and Mawada Atef Lab. Book online.",
    },
    keywords: {
      ar: "عيادات رشيد، عيادات تخصصية رشيد، معمل تحاليل رشيد، ليزر رشيد، أوميجا كير",
      en: "Rashid clinics, specialized clinics Rashid, Omega Care Rashid, Mawada Atef Lab",
    },
    ogImageUrl: "/brand/omega-care-logo.png",
  },

  homepageSections: defaultHomepageSections,

  lastBackupAt: null,
};
