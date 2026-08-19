import type { Specialty } from "../../../src/types/catalog";
import { specialtyId } from "../ids";

/** A seed record: the domain model minus the fields Firestore/the seeder owns. */
export type SpecialtySeed = Omit<Specialty, "id" | "createdAt" | "updatedAt"> & {
  docId: string;
};

interface SpecialtyInput {
  slug: string;
  nameAr: string;
  nameEn: string;
  featured?: boolean;
}

/**
 * The 19 specialties confirmed by the clinic (spec 10).
 *
 * Descriptions, icons and images are intentionally `null`: the clinic supplied
 * names only, and inventing marketing copy for a medical specialty is exactly
 * the kind of fabrication the brief forbids. The dashboard fills them in later.
 */
const INPUTS: SpecialtyInput[] = [
  {
    slug: "gastroenterology-hepatology-colorectal",
    nameAr: "الجهاز الهضمي والكبد والقولون",
    nameEn: "Gastroenterology, Hepatology & Colorectal",
    featured: true,
  },
  { slug: "endocrinology", nameAr: "الغدد", nameEn: "Endocrinology" },
  { slug: "geriatric-medicine", nameAr: "طب الشيخوخة", nameEn: "Geriatric Medicine" },
  {
    slug: "hematology-immunology",
    nameAr: "أمراض الدم والمناعة",
    nameEn: "Hematology & Immunology",
  },
  {
    slug: "respiratory-asthma",
    nameAr: "الجهاز التنفسي والربو",
    nameEn: "Respiratory Diseases & Asthma",
  },
  {
    slug: "orthopedics",
    nameAr: "العظام والكسور",
    nameEn: "Orthopedics & Fractures",
    featured: true,
  },
  {
    slug: "vascular-surgery",
    nameAr: "جراحة الأوعية الدموية",
    nameEn: "Vascular Surgery",
  },
  { slug: "urology", nameAr: "المسالك البولية", nameEn: "Urology", featured: true },
  { slug: "general-surgery", nameAr: "الجراحة العامة", nameEn: "General Surgery" },
  { slug: "plastic-surgery", nameAr: "جراحة التجميل", nameEn: "Plastic Surgery" },
  {
    slug: "obstetrics-gynecology-infertility",
    nameAr: "النساء والتوليد والعقم",
    nameEn: "Obstetrics, Gynecology & Infertility",
    featured: true,
  },
  { slug: "cardiology", nameAr: "أمراض القلب", nameEn: "Cardiology", featured: true },
  {
    slug: "pediatric-cardiology",
    nameAr: "قلب الأطفال",
    nameEn: "Pediatric Cardiology",
    featured: true,
  },
  {
    slug: "audiology-balance",
    nameAr: "السمعيات والاتزان",
    nameEn: "Audiology & Balance",
  },
  {
    slug: "nerve-conduction-emg",
    nameAr: "رسم الأعصاب وتخطيط العضلات",
    nameEn: "Nerve Conduction Studies & EMG",
  },
  { slug: "physical-therapy", nameAr: "العلاج الطبيعي", nameEn: "Physical Therapy" },
  {
    slug: "obesity-weight-management",
    nameAr: "السمنة والنحافة",
    nameEn: "Obesity & Weight Management",
  },
  {
    slug: "speech-therapy",
    nameAr: "التخاطب وتنمية المهارات وتعديل السلوك",
    nameEn: "Speech Therapy, Skills Development & Behavior Modification",
  },
  {
    slug: "aesthetics-laser",
    nameAr: "التجميل والليزر",
    nameEn: "Aesthetics & Laser",
    featured: true,
  },
];

export const specialtySeeds: SpecialtySeed[] = INPUTS.map((input, index) => ({
  docId: specialtyId(input.slug),
  slug: input.slug,
  nameAr: input.nameAr,
  nameEn: input.nameEn,
  descriptionAr: null,
  descriptionEn: null,
  icon: null,
  imageUrl: null,
  imageDeleteUrl: null,
  active: true,
  featured: input.featured ?? false,
  sortOrder: (index + 1) * 10,
  seoTitleAr: null,
  seoTitleEn: null,
  seoDescriptionAr: null,
  seoDescriptionEn: null,
}));

/** Convenience map so the doctor seed can reference specialties by slug. */
export const specialtyIdBySlug = new Map(
  specialtySeeds.map((specialty) => [specialty.slug, specialty.docId]),
);

export function requireSpecialtyIds(slugs: string[]): string[] {
  return slugs.map((slug) => {
    const id = specialtyIdBySlug.get(slug);
    if (!id) throw new Error(`Unknown specialty slug in seed data: ${slug}`);
    return id;
  });
}
