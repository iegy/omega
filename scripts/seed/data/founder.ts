import type { Founder } from "../../../src/types/founder";

/**
 * `founder/profile` (spec 17–19).
 *
 * Every qualification below is reproduced exactly as supplied. Nothing is added:
 *  - no graduation dates, honours, rankings or extra credentials
 *  - no invented biography beyond the founder's role and the listed degrees
 *  - `vision` and `message` stay `null` — the clinic has not supplied wording,
 *    and inventing a personal quote for a real person is not acceptable.
 * The dashboard (Phase 11) fills these in when the founder provides them.
 */
export const founderSeed: Founder = {
  nameAr: "د. محمود زايد",
  nameEn: "Dr. Mahmoud Zayed",

  titleAr: "مؤسس عيادات أوميجا كير التخصصية",
  titleEn: "Founder of Omega Care Specialized Clinics",

  bioAr:
    "مؤسس عيادات أوميجا كير التخصصية، بخلفية أكاديمية تجمع بين الصيدلة وإدارة الرعاية الصحية وإدارة الأعمال.",
  bioEn:
    "Founder of Omega Care Specialized Clinics, with an academic background spanning pharmacy, healthcare management and business administration.",

  visionAr: null,
  visionEn: null,
  messageAr: null,
  messageEn: null,

  // Approved local brand asset (spec 30) — no upload in this phase.
  imageUrl: "/brand/founder-mahmoud-zayed.jpeg",
  imageDeleteUrl: null,

  qualifications: [
    {
      id: "sdba-supply-chain-logistics",
      titleAr: "دكتوراه إدارة الأعمال في سلاسل الإمداد واللوجستيات (s.DBA)",
      titleEn:
        "s.DBA — Doctorate of Business Administration in Supply Chain and Logistics",
      institutionAr: "IBAS — سويسرا",
      institutionEn: "IBAS — Switzerland",
      year: null,
      sortOrder: 10,
    },
    {
      id: "mba-healthcare-quality-management",
      titleAr: "ماجستير إدارة الأعمال في إدارة جودة الرعاية الصحية (MBA)",
      titleEn:
        "Master of Business Administration in Healthcare Quality Management",
      institutionAr: "الأكاديمية العربية للعلوم والتكنولوجيا (AAST) — مصر",
      institutionEn: "AAST — Egypt",
      year: null,
      sortOrder: 20,
    },
    {
      id: "hospital-management-diploma",
      titleAr: "دبلوم إدارة المستشفيات",
      titleEn: "Hospital Management Diploma",
      institutionAr: "معهد الفيحاء — دبي",
      institutionEn: "Elfaihaa Institute — Dubai",
      year: null,
      sortOrder: 30,
    },
    {
      id: "clinical-pharmacy-diploma",
      titleAr: "دبلوم الصيدلة الإكلينيكية",
      titleEn: "Clinical Pharmacy Diploma",
      institutionAr: "جامعة طنطا — مصر",
      institutionEn: "Tanta University — Egypt",
      year: null,
      sortOrder: 40,
    },
    {
      id: "bachelor-of-pharmacy",
      titleAr: "بكالوريوس الصيدلة",
      titleEn: "Bachelor of Pharmacy",
      institutionAr: "جامعة الإسكندرية — مصر",
      institutionEn: "Alexandria University — Egypt",
      year: null,
      sortOrder: 50,
    },
  ],

  // No milestones supplied — the timeline stays empty rather than fabricated.
  timeline: [],

  active: true,
  showOnHomepage: true,

  seoTitleAr: "د. محمود زايد – مؤسس عيادات أوميجا كير",
  seoTitleEn: "Dr. Mahmoud Zayed – Founder of Omega Care",
  seoDescriptionAr:
    "التعريف بمؤسس عيادات أوميجا كير التخصصية ومؤهلاته الأكاديمية في الصيدلة وإدارة الرعاية الصحية وإدارة الأعمال.",
  seoDescriptionEn:
    "About the founder of Omega Care Specialized Clinics and his academic background in pharmacy, healthcare management and business administration.",
};
