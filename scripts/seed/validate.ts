import { COLLECTIONS } from "../../src/config/constants";
import { HOMEPAGE_SECTION_KEYS } from "../../src/types/site";

import { doctorPriceSeeds, doctorSeeds, scheduleSeeds } from "./data/doctors";
import { founderSeed } from "./data/founder";
import { labUnitSeeds } from "./data/lab";
import { categorySeeds, serviceSeeds } from "./data/services";
import {
  homepageSectionSeeds,
  paymentMethodsSeed,
  siteSettingsSeed,
} from "./data/settings";
import { specialtySeeds } from "./data/specialties";
import type { SeedPlan } from "./plan";

export interface ValidationIssue {
  severity: "error" | "warning";
  where: string;
  message: string;
}

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

/**
 * Validates the seed before anything is written (spec 1).
 *
 * `error` stops the run. `warning` is printed but allowed through — it marks
 * data the clinic has genuinely not supplied yet (an unknown price, an open
 * ended schedule), which is expected and must never be auto-filled.
 */
export function validateSeed(plan: SeedPlan): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  const error = (where: string, message: string) =>
    issues.push({ severity: "error", where, message });
  const warn = (where: string, message: string) =>
    issues.push({ severity: "warning", where, message });

  /* ---- unique document paths -------------------------------------------- */
  const seenPaths = new Set<string>();
  for (const write of plan.writes) {
    const path = `${write.collection}/${write.docId}`;
    if (seenPaths.has(path)) error(path, "duplicate document path in the plan");
    seenPaths.add(path);
    if (write.docId.includes("/")) error(path, "document ID must not contain '/'");
  }

  /* ---- the seed must never touch authorisation --------------------------- */
  for (const write of plan.writes) {
    if (write.collection === COLLECTIONS.admins) {
      error(write.collection, "the seed must never write to admins/* (spec 35)");
    }
  }

  /* ---- specialties ------------------------------------------------------- */
  const specialtyIds = new Set(specialtySeeds.map((s) => s.docId));
  for (const specialty of specialtySeeds) {
    if (!SLUG_PATTERN.test(specialty.slug)) {
      error(specialty.docId, `invalid slug "${specialty.slug}"`);
    }
    if (!specialty.nameAr.trim()) error(specialty.docId, "nameAr is empty");
    if (!specialty.nameEn.trim()) error(specialty.docId, "nameEn is empty");
  }

  /* ---- doctors ----------------------------------------------------------- */
  const doctorIds = new Set(doctorSeeds.map((d) => d.docId));
  const slugs = new Set<string>();

  for (const doctor of doctorSeeds) {
    const where = doctor.docId;
    if (!SLUG_PATTERN.test(doctor.slug)) error(where, `invalid slug "${doctor.slug}"`);
    if (slugs.has(doctor.slug)) error(where, `duplicate doctor slug "${doctor.slug}"`);
    slugs.add(doctor.slug);

    if (!doctor.nameAr.trim()) error(where, "nameAr is empty");
    if (!doctor.nameEn.trim()) error(where, "nameEn is empty");
    if (!doctor.titleAr?.trim()) error(where, "titleAr is empty");
    if (!doctor.titleEn?.trim()) error(where, "titleEn is empty");

    if (doctor.specialtyIds.length === 0) error(where, "no specialty linked");
    for (const id of doctor.specialtyIds) {
      if (!specialtyIds.has(id)) error(where, `unknown specialtyId "${id}"`);
    }

    if (doctor.imageUrl === null) {
      warn(where, "no photo supplied — the neutral placeholder will render");
    }
  }

  /* ---- schedules --------------------------------------------------------- */
  for (const schedule of scheduleSeeds) {
    const where = schedule.docId;
    if (!doctorIds.has(schedule.doctorId)) {
      error(where, `unknown doctorId "${schedule.doctorId}"`);
    }
    if (schedule.dayOfWeek < 0 || schedule.dayOfWeek > 6) {
      error(where, `dayOfWeek out of range: ${schedule.dayOfWeek}`);
    }
    if (!TIME_PATTERN.test(schedule.startTime)) {
      error(where, `invalid startTime "${schedule.startTime}"`);
    }
    if (schedule.endTime === null) {
      warn(where, "no end time published by the clinic — stored as null");
    } else {
      if (!TIME_PATTERN.test(schedule.endTime)) {
        error(where, `invalid endTime "${schedule.endTime}"`);
      } else if (schedule.endTime <= schedule.startTime) {
        error(where, `endTime ${schedule.endTime} is not after ${schedule.startTime}`);
      }
    }
    if (schedule.bookingMode === null) {
      warn(where, "booking mode not configured — online booking stays closed");
    }
  }

  /* ---- doctor prices ----------------------------------------------------- */
  for (const price of doctorPriceSeeds) {
    const where = price.docId;
    if (!doctorIds.has(price.doctorId)) {
      error(where, `unknown doctorId "${price.doctorId}"`);
    }
    if (!price.nameAr.trim()) error(where, "nameAr is empty");
    if (!price.nameEn.trim()) error(where, "nameEn is empty");
    if (price.price === null) {
      warn(where, "no price supplied by the clinic — stored as null");
    } else if (!Number.isFinite(price.price) || price.price <= 0) {
      error(where, `invalid price ${String(price.price)}`);
    }
  }

  /* ---- services ---------------------------------------------------------- */
  const categoryIds = new Set(categorySeeds.map((c) => c.docId));
  const serviceSlugs = new Set<string>();

  for (const service of serviceSeeds) {
    const where = service.docId;
    if (!SLUG_PATTERN.test(service.slug)) error(where, `invalid slug "${service.slug}"`);
    if (serviceSlugs.has(service.slug)) {
      error(where, `duplicate service slug "${service.slug}"`);
    }
    serviceSlugs.add(service.slug);

    if (!service.nameAr.trim()) error(where, "nameAr is empty");
    if (!service.nameEn.trim()) error(where, "nameEn is empty");
    if (service.categoryId && !categoryIds.has(service.categoryId)) {
      error(where, `unknown categoryId "${service.categoryId}"`);
    }
    for (const id of service.doctorIds) {
      if (!doctorIds.has(id)) error(where, `unknown doctorId "${id}"`);
    }
    for (const id of service.specialtyIds) {
      if (!specialtyIds.has(id)) error(where, `unknown specialtyId "${id}"`);
    }
  }

  /* ---- lab --------------------------------------------------------------- */
  for (const unit of labUnitSeeds) {
    if (!unit.nameAr.trim()) error(unit.docId, "nameAr is empty");
    if (!unit.nameEn.trim()) error(unit.docId, "nameEn is empty");
  }
  if (labUnitSeeds.length !== 6) {
    error("labUnits", `expected exactly 6 units, found ${labUnitSeeds.length}`);
  }

  /* ---- founder ----------------------------------------------------------- */
  if (!founderSeed.nameAr.trim() || !founderSeed.nameEn.trim()) {
    error("founder/profile", "founder name is empty");
  }
  if (founderSeed.qualifications.length === 0) {
    error("founder/profile", "no qualifications supplied");
  }
  for (const qualification of founderSeed.qualifications) {
    if (qualification.year !== null) {
      warn(
        `founder/${qualification.id}`,
        "a year is set — confirm it was supplied by the founder, never inferred",
      );
    }
  }
  if (founderSeed.visionAr === null && founderSeed.visionEn === null) {
    warn("founder/profile", "vision not supplied — left null");
  }
  if (founderSeed.messageAr === null && founderSeed.messageEn === null) {
    warn("founder/profile", "message not supplied — left null");
  }

  /* ---- settings ---------------------------------------------------------- */

  const { location } = siteSettingsSeed;
  if (location.latitude === null || location.longitude === null) {
    error("clinicSettings/site", "clinic coordinates are missing");
  }
  if (location.mapsUrl === null) {
    warn(
      "clinicSettings/site",
      "no official Google Maps URL set — paste it into OFFICIAL_MAPS_URL in " +
        "scripts/seed/data/settings.ts; map links fall back to the coordinates",
    );
  }

  if (paymentMethodsSeed.walletEnabled && !paymentMethodsSeed.walletNumber) {
    error("paymentMethods/default", "wallet enabled without a number");
  }
  if (paymentMethodsSeed.instapayEnabled && !paymentMethodsSeed.instapayNumber) {
    error("paymentMethods/default", "InstaPay enabled without a number");
  }

  /* ---- homepage sections -------------------------------------------------- */
  const allowedKeys = new Set<string>(HOMEPAGE_SECTION_KEYS);
  for (const section of homepageSectionSeeds) {
    if (!allowedKeys.has(section.key)) {
      error(`homepageSections/${section.key}`, "unknown homepage section key");
    }
  }
  if (homepageSectionSeeds.length !== HOMEPAGE_SECTION_KEYS.length) {
    error(
      "homepageSections",
      `expected ${HOMEPAGE_SECTION_KEYS.length} sections, found ${homepageSectionSeeds.length}`,
    );
  }

  return issues;
}

export function hasBlockingErrors(issues: ValidationIssue[]): boolean {
  return issues.some((issue) => issue.severity === "error");
}
