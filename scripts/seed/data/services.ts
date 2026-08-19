import type { Service, ServiceCategory } from "../../../src/types/catalog";
import { categoryId, serviceId } from "../ids";
import { doctorIdBySlug } from "./doctors";
import { specialtyIdBySlug } from "./specialties";

export type CategorySeed = Omit<ServiceCategory, "id" | "createdAt" | "updatedAt"> & {
  docId: string;
};
export type ServiceSeed = Omit<Service, "id" | "createdAt" | "updatedAt"> & {
  docId: string;
};

/* -------------------------------------------------------------------------- */
/*  Categories (spec AZ)                                                       */
/* -------------------------------------------------------------------------- */

const CATEGORY_INPUTS: { slug: string; nameAr: string; nameEn: string }[] = [
  { slug: "medical", nameAr: "خدمات طبية", nameEn: "Medical Services" },
  { slug: "diagnostics", nameAr: "خدمات تشخيصية", nameEn: "Diagnostics" },
  { slug: "cardiology", nameAr: "خدمات القلب", nameEn: "Cardiology" },
  { slug: "pulmonology", nameAr: "وظائف التنفس", nameEn: "Pulmonology" },
  { slug: "audiology", nameAr: "السمعيات", nameEn: "Audiology" },
  {
    slug: "neurodiagnostics",
    nameAr: "تشخيص الأعصاب والعضلات",
    nameEn: "Neurology Diagnostics",
  },
  { slug: "aesthetics", nameAr: "التجميل والليزر", nameEn: "Aesthetics & Laser" },
  {
    slug: "weight-management",
    nameAr: "السمنة والنحافة",
    nameEn: "Weight Management",
  },
  { slug: "laboratory", nameAr: "المعمل", nameEn: "Laboratory" },
];

export const categorySeeds: CategorySeed[] = CATEGORY_INPUTS.map((input, index) => ({
  docId: categoryId(input.slug),
  slug: input.slug,
  nameAr: input.nameAr,
  nameEn: input.nameEn,
  descriptionAr: null,
  descriptionEn: null,
  active: true,
  sortOrder: (index + 1) * 10,
}));

/* -------------------------------------------------------------------------- */
/*  Services                                                                   */
/* -------------------------------------------------------------------------- */

interface ServiceInput {
  slug: string;
  nameAr: string;
  nameEn: string;
  category: string;
  /** Doctor slugs who provide this service, when the clinic data makes it clear. */
  doctors?: string[];
  specialties?: string[];
  featured?: boolean;
}

/**
 * Catalogue prices are ALL `null` (spec 11): the clinic supplied prices per
 * doctor, not per catalogue entry, so the amounts live in `doctorServicePrices`.
 * Putting a number here would either duplicate or invent one.
 */
const GENERAL_SERVICES: ServiceInput[] = [
  {
    slug: "ultrasound",
    nameAr: "سونار",
    nameEn: "Ultrasound",
    category: "diagnostics",
    featured: true,
  },
  {
    slug: "echocardiography",
    nameAr: "إيكو",
    nameEn: "Echocardiography",
    category: "cardiology",
    doctors: ["mohamed-saad-hebala"],
    specialties: ["cardiology"],
    featured: true,
  },
  {
    slug: "pediatric-echocardiography",
    nameAr: "إيكو قلب الأطفال",
    nameEn: "Pediatric Echocardiography",
    category: "cardiology",
    doctors: ["mohamed-ibrahim-abdel-galil"],
    specialties: ["pediatric-cardiology"],
    featured: true,
  },
  {
    slug: "ecg",
    nameAr: "رسم قلب",
    nameEn: "ECG",
    category: "cardiology",
    doctors: ["mohamed-saad-hebala", "mohamed-ibrahim-abdel-galil"],
    specialties: ["cardiology", "pediatric-cardiology"],
  },
  {
    slug: "stress-ecg",
    nameAr: "رسم قلب بالمجهود",
    nameEn: "Stress ECG (Exercise Test)",
    category: "cardiology",
    doctors: ["mohamed-saad-hebala"],
    specialties: ["cardiology"],
  },
  {
    slug: "pulmonary-function-test",
    nameAr: "قياس وظائف التنفس",
    nameEn: "Pulmonary Function Test",
    category: "pulmonology",
    specialties: ["respiratory-asthma"],
  },
  {
    slug: "lung-efficiency-test",
    nameAr: "قياس كفاءة الرئتين",
    nameEn: "Lung Efficiency Assessment",
    category: "pulmonology",
    specialties: ["respiratory-asthma"],
  },
  {
    slug: "inbody-analysis",
    nameAr: "InBody لتحليل الجسم",
    nameEn: "InBody Body Composition Analysis",
    category: "weight-management",
    doctors: ["yosra-sharaf"],
    specialties: ["obesity-weight-management"],
    featured: true,
  },
  {
    slug: "nerve-conduction-study",
    nameAr: "رسم الأعصاب",
    nameEn: "Nerve Conduction Study",
    category: "neurodiagnostics",
    doctors: ["abdelrahman-el-shenawy"],
    specialties: ["nerve-conduction-emg"],
  },
  {
    slug: "electromyography",
    nameAr: "تخطيط العضلات",
    nameEn: "Electromyography (EMG)",
    category: "neurodiagnostics",
    doctors: ["abdelrahman-el-shenawy"],
    specialties: ["nerve-conduction-emg"],
  },
  {
    slug: "sensory-evoked-potential",
    nameAr: "الجهد الحسي",
    nameEn: "Sensory Evoked Potential",
    category: "neurodiagnostics",
    doctors: ["abdelrahman-el-shenawy"],
    specialties: ["nerve-conduction-emg"],
  },
  {
    slug: "audiometry",
    nameAr: "قياس السمع",
    nameEn: "Audiometry",
    category: "audiology",
    doctors: ["ibrahim-abd-el-salam"],
    specialties: ["audiology-balance"],
  },
  {
    slug: "balance-testing",
    nameAr: "قياس الاتزان",
    nameEn: "Balance Testing",
    category: "audiology",
    doctors: ["ibrahim-abd-el-salam"],
    specialties: ["audiology-balance"],
  },
  {
    slug: "tympanometry",
    nameAr: "ضغط الأذن",
    nameEn: "Tympanometry",
    category: "audiology",
    doctors: ["ibrahim-abd-el-salam"],
    specialties: ["audiology-balance"],
  },
];

/**
 * Aesthetics & laser unit (spec 12 / T).
 *
 * `InBody` appears in the clinic's aesthetics list too, but it is already a
 * catalogue entry under weight management above — one service, one document, so
 * the dashboard never has to keep two copies in sync.
 */
const AESTHETICS_SERVICES: ServiceInput[] = [
  {
    slug: "laser-hair-removal",
    nameAr: "ليزر إزالة الشعر",
    nameEn: "Laser Hair Removal",
    category: "aesthetics",
    featured: true,
  },
  {
    slug: "fractional-laser",
    nameAr: "ليزر فراكشنال",
    nameEn: "Fractional Laser",
    category: "aesthetics",
  },
  {
    slug: "hydrafacial",
    nameAr: "هيدرافيشيال",
    nameEn: "HydraFacial",
    category: "aesthetics",
    featured: true,
  },
  { slug: "oxygeneo", nameAr: "أوكسيجينيو", nameEn: "OxyGeneo", category: "aesthetics" },
  {
    slug: "skin-mesotherapy",
    nameAr: "ميزوثيرابي للبشرة",
    nameEn: "Skin Mesotherapy",
    category: "aesthetics",
  },
  {
    slug: "hair-mesotherapy",
    nameAr: "ميزوثيرابي للشعر",
    nameEn: "Hair Mesotherapy",
    category: "aesthetics",
  },
  {
    slug: "prp-skin",
    nameAr: "PRP للبشرة",
    nameEn: "PRP for Skin",
    category: "aesthetics",
  },
  {
    slug: "prp-hair",
    nameAr: "PRP للشعر",
    nameEn: "PRP for Hair",
    category: "aesthetics",
  },
  {
    slug: "cold-peeling",
    nameAr: "التقشير البارد",
    nameEn: "Cold Peeling",
    category: "aesthetics",
  },
  {
    slug: "chemical-peeling",
    nameAr: "التقشير الكيميائي",
    nameEn: "Chemical Peeling",
    category: "aesthetics",
  },
  {
    slug: "laser-peeling",
    nameAr: "التقشير بالليزر",
    nameEn: "Laser Peeling",
    category: "aesthetics",
  },
  { slug: "dermapen", nameAr: "ديرمابن", nameEn: "Dermapen", category: "aesthetics" },
  {
    slug: "green-peel",
    nameAr: "جرين بيل",
    nameEn: "Green Peel",
    category: "aesthetics",
  },
  {
    slug: "facial-cleansing",
    nameAr: "تنظيف البشرة",
    nameEn: "Facial Cleansing",
    category: "aesthetics",
  },
  {
    slug: "deep-facial-cleansing",
    nameAr: "تنظيف عميق للبشرة",
    nameEn: "Deep Facial Cleansing",
    category: "aesthetics",
  },
  {
    slug: "ultrasonic-skin-cleaning",
    nameAr: "تنظيف البشرة بالموجات فوق الصوتية",
    nameEn: "Ultrasonic Skin Cleaning",
    category: "aesthetics",
  },
  {
    // Real device name confirmed by the clinic (spec 13) — not a typo.
    slug: "wart-removal-magaleef",
    nameAr: "إزالة السنط بجهاز مجاليف",
    nameEn: "Wart Removal using Magaleef Device",
    category: "aesthetics",
    featured: true,
  },
  {
    slug: "cryo-slimming",
    nameAr: "جلسات Cryo للتنحيف",
    nameEn: "Cryo Slimming Sessions",
    category: "weight-management",
  },
  {
    slug: "cavitation-slimming",
    nameAr: "Cavitation للتنحيف",
    nameEn: "Cavitation Slimming",
    category: "weight-management",
  },
  {
    slug: "slimming-mesotherapy",
    nameAr: "ميزوثيرابي للتخسيس",
    nameEn: "Slimming Mesotherapy",
    category: "weight-management",
  },
];

function resolveDoctors(slugs: string[] | undefined): string[] {
  return (slugs ?? []).map((slug) => {
    const id = doctorIdBySlug.get(slug);
    if (!id) throw new Error(`Unknown doctor slug in service seed: ${slug}`);
    return id;
  });
}

function resolveSpecialties(slugs: string[] | undefined): string[] {
  return (slugs ?? []).map((slug) => {
    const id = specialtyIdBySlug.get(slug);
    if (!id) throw new Error(`Unknown specialty slug in service seed: ${slug}`);
    return id;
  });
}

const ALL_SERVICE_INPUTS = [...GENERAL_SERVICES, ...AESTHETICS_SERVICES];

export const serviceSeeds: ServiceSeed[] = ALL_SERVICE_INPUTS.map((input, index) => ({
  docId: serviceId(input.slug),
  slug: input.slug,
  nameAr: input.nameAr,
  nameEn: input.nameEn,
  descriptionAr: null,
  descriptionEn: null,
  categoryId: categoryId(input.category),
  imageUrl: null,
  imageDeleteUrl: null,
  price: null,
  showPrice: true,
  active: true,
  featured: input.featured ?? false,
  requiresBooking: true,
  doctorIds: resolveDoctors(input.doctors),
  specialtyIds: resolveSpecialties(input.specialties),
  sortOrder: (index + 1) * 10,
  seoTitleAr: null,
  seoTitleEn: null,
  seoDescriptionAr: null,
  seoDescriptionEn: null,
}));
