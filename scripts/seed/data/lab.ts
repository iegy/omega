import type { LabProfile, LabUnit } from "../../../src/types/lab";
import { labUnitId } from "../ids";

export type LabUnitSeed = Omit<LabUnit, "id" | "createdAt" | "updatedAt"> & {
  docId: string;
};

/** The six units confirmed by the laboratory (spec 15). */
const UNIT_INPUTS: { slug: string; nameAr: string; nameEn: string }[] = [
  { slug: "hematology", nameAr: "وحدة تحاليل أمراض الدم", nameEn: "Hematology Unit" },
  {
    slug: "clinical-chemistry",
    nameAr: "وحدة تحاليل كيمياء الدم",
    nameEn: "Clinical Chemistry Unit",
  },
  { slug: "hormones", nameAr: "وحدة تحاليل الهرمونات", nameEn: "Hormones Unit" },
  { slug: "virology", nameAr: "وحدة تحاليل الفيروسات", nameEn: "Virology Unit" },
  {
    slug: "parasitology",
    nameAr: "وحدة تحاليل الباراسيتولوجي",
    nameEn: "Parasitology Unit",
  },
  {
    slug: "microbiology",
    nameAr: "وحدة تحاليل الميكروبيولوجي",
    nameEn: "Microbiology Unit",
  },
];

export const labUnitSeeds: LabUnitSeed[] = UNIT_INPUTS.map((input, index) => ({
  docId: labUnitId(input.slug),
  slug: input.slug,
  nameAr: input.nameAr,
  nameEn: input.nameEn,
  descriptionAr: null,
  descriptionEn: null,
  icon: null,
  imageUrl: null,
  imageDeleteUrl: null,
  active: true,
  sortOrder: (index + 1) * 10,
}));

/**
 * `siteContent/labProfile`.
 *
 * Opening hours are `null` — the clinic has not published the laboratory's
 * hours, and a plausible-looking "9am–9pm" would be an invention.
 *
 * No `labServices` are seeded: not a single test price or test list was
 * supplied, so the collection stays empty rather than being filled with a
 * generic panel of tests (spec 2).
 */
export const labProfileSeed: LabProfile = {
  nameAr: "معامل مودة عاطف",
  nameEn: "Mawoda Atef Lab",
  descriptionAr:
    "معمل تحاليل متخصص تابع لمنظومة عيادات أوميجا كير، يضم وحدات متخصصة لتحاليل أمراض الدم وكيمياء الدم والهرمونات والفيروسات والباراسيتولوجي والميكروبيولوجي.",
  descriptionEn:
    "A specialized medical laboratory within Omega Care Specialized Clinics, with dedicated units for hematology, clinical chemistry, hormones, virology, parasitology and microbiology.",
  // Approved local brand asset (spec 30) — no upload in this phase.
  logoUrl: "/brand/mawada-atef-lab-logo.jpeg",
  logoDeleteUrl: null,
  phones: ["0452930999", "01555129217"],
  whatsapp: null,
  openingHoursAr: null,
  openingHoursEn: null,
  sampleCollectionEnabled: true,
  sampleCollectionNoteAr:
    "خدمة سحب العينات متاحة من المنازل والمستشفيات والعيادات.",
  sampleCollectionNoteEn:
    "Sample collection is available from homes, hospitals and clinics.",
  active: true,
  seoTitleAr: "معامل مودة عاطف – رشيد",
  seoTitleEn: "Mawoda Atef Lab – Rashid",
  seoDescriptionAr:
    "معمل تحاليل متخصص تابع لعيادات أوميجا كير في رشيد، مع خدمة سحب العينات من المنازل والمستشفيات والعيادات.",
  seoDescriptionEn:
    "A specialized medical laboratory of Omega Care in Rashid, offering sample collection from homes, hospitals and clinics.",
};
