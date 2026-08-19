import { query, where } from "firebase/firestore/lite";

import {
  doctorSchedulesCollection,
  doctorServicePricesCollection,
  doctorsCollection,
  scheduleExceptionsCollection,
} from "@/firebase/collections";
import type { Specialty } from "@/types/catalog";
import type {
  Doctor,
  DoctorSchedule,
  DoctorServicePrice,
  ScheduleException,
} from "@/types/doctor";

import { cache } from "react";

import { listPublicSpecialties } from "./catalog";
import { safeList } from "./firestore-access";
import { readPublicCacheGroup } from "./public-cache";
import { sortByOrderThenName, sortRecords } from "./repository-helpers";

/* -------------------------------------------------------------------------- */
/*  Doctors                                                                    */
/* -------------------------------------------------------------------------- */

/** Active doctors for the public site, ordered by `sortOrder`. */
export async function listPublicDoctors(): Promise<Doctor[]> {
  const collectionRef = doctorsCollection();
  const records = await safeList(
    collectionRef ? query(collectionRef, where("active", "==", true)) : null,
    { context: "listPublicDoctors" },
  );
  return sortByOrderThenName(records);
}

/** Every doctor including inactive ones — dashboard only. */
export async function listAllDoctors(): Promise<Doctor[]> {
  const records = await safeList(doctorsCollection(), { context: "listAllDoctors" });
  return sortByOrderThenName(records);
}

export async function listFeaturedDoctors(): Promise<Doctor[]> {
  const doctors = await listPublicDoctors();
  return doctors.filter((doctor) => doctor.featured);
}

export async function getDoctorBySlug(slug: string): Promise<Doctor | null> {
  const collectionRef = doctorsCollection();
  const records = await safeList(
    collectionRef ? query(collectionRef, where("slug", "==", slug)) : null,
    { context: `getDoctorBySlug(${slug})` },
  );
  return records[0] ?? null;
}

export async function listDoctorsBySpecialty(specialtyId: string): Promise<Doctor[]> {
  const collectionRef = doctorsCollection();
  const records = await safeList(
    collectionRef
      ? query(
          collectionRef,
          where("active", "==", true),
          where("specialtyIds", "array-contains", specialtyId),
        )
      : null,
    { context: `listDoctorsBySpecialty(${specialtyId})` },
  );
  return sortByOrderThenName(records);
}

/* -------------------------------------------------------------------------- */
/*  Prices                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Priced items for one doctor. `includeHidden` is for the dashboard; public
 * pages must pass `false` so `showPricePublicly === false` rows stay hidden
 * (spec Q — the amount still appears inside the booking flow).
 */
export async function listDoctorServicePrices(
  doctorId: string,
  { includeInactive = false }: { includeInactive?: boolean } = {},
): Promise<DoctorServicePrice[]> {
  const collectionRef = doctorServicePricesCollection();
  const records = await safeList(
    collectionRef ? query(collectionRef, where("doctorId", "==", doctorId)) : null,
    { context: `listDoctorServicePrices(${doctorId})` },
  );
  const filtered = includeInactive ? records : records.filter((price) => price.active);
  return sortRecords(filtered);
}

/**
 * Every active priced item, in one query.
 *
 * Pages that render many doctors at once (the directory, the homepage) group
 * this in memory instead of issuing one query per doctor: 1 Firestore read
 * batch instead of 17, which matters on the Spark free tier.
 */
export async function listActiveDoctorServicePrices(): Promise<DoctorServicePrice[]> {
  const collectionRef = doctorServicePricesCollection();
  const records = await safeList(
    collectionRef ? query(collectionRef, where("active", "==", true)) : null,
    { context: "listActiveDoctorServicePrices" },
  );
  return sortRecords(records);
}

/* -------------------------------------------------------------------------- */
/*  Schedules                                                                  */
/* -------------------------------------------------------------------------- */

export async function listDoctorSchedules(
  doctorId: string,
  { includeInactive = false }: { includeInactive?: boolean } = {},
): Promise<DoctorSchedule[]> {
  const collectionRef = doctorSchedulesCollection();
  const records = await safeList(
    collectionRef ? query(collectionRef, where("doctorId", "==", doctorId)) : null,
    { context: `listDoctorSchedules(${doctorId})` },
  );
  const filtered = includeInactive
    ? records
    : records.filter((schedule) => schedule.active);
  return [...filtered].sort(
    (a, b) => a.dayOfWeek - b.dayOfWeek || a.startTime.localeCompare(b.startTime),
  );
}

/** All active schedules — used by "doctors today" (Phase 5). */
export async function listActiveSchedules(): Promise<DoctorSchedule[]> {
  const collectionRef = doctorSchedulesCollection();
  return safeList(
    collectionRef ? query(collectionRef, where("active", "==", true)) : null,
    { context: "listActiveSchedules" },
  );
}

/* -------------------------------------------------------------------------- */
/*  Exceptions                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Exceptions that could affect a given date. The date-range logic
 * (`date … endDate`) is applied in memory because Firestore cannot express
 * "date <= X AND endDate >= X" in one query without a composite index.
 * Booking calculations themselves arrive in Phase 8.
 */
export async function listScheduleExceptionsForDate(
  isoDate: string,
): Promise<ScheduleException[]> {
  const collectionRef = scheduleExceptionsCollection();
  const records = await safeList(
    collectionRef ? query(collectionRef, where("active", "==", true)) : null,
    { context: `listScheduleExceptionsForDate(${isoDate})` },
  );

  return records.filter((exception) => {
    const from = exception.date;
    const to = exception.endDate ?? exception.date;
    return isoDate >= from && isoDate <= to;
  });
}

export async function listDoctorScheduleExceptions(
  doctorId: string,
): Promise<ScheduleException[]> {
  const collectionRef = scheduleExceptionsCollection();
  const records = await safeList(
    collectionRef ? query(collectionRef, where("doctorId", "==", doctorId)) : null,
    { context: `listDoctorScheduleExceptions(${doctorId})` },
  );
  return [...records].sort((a, b) => a.date.localeCompare(b.date));
}

/* -------------------------------------------------------------------------- */
/*  Public "doctors" cache group                                               */
/* -------------------------------------------------------------------------- */

export interface PublicDoctorsDataset {
  doctors: Doctor[];
  specialties: Specialty[];
  schedules: DoctorSchedule[];
  prices: DoctorServicePrice[];
}

/**
 * Everything the public site needs about doctors, in one cached payload:
 * the active doctors, the specialties they are filed under, every active
 * schedule and every active priced item.
 *
 * This is the most valuable group by far — it is the ~114 reads behind
 * `/doctors`, all 17 doctor profiles, every specialty page, `/aesthetics` and
 * two homepage sections. One warm entry covers all of them.
 *
 * Specialties are included here as well as in the catalogue group on purpose:
 * a visitor who lands on a doctor profile should not need the service catalogue
 * to be fetched, and vice versa. The duplication costs a few kilobytes of edge
 * cache and saves a whole collection read on the pages that only need one side.
 */
export const getPublicDoctorsDataset = cache(
  async (): Promise<PublicDoctorsDataset> =>
    readPublicCacheGroup("doctors", async () => {
      const [doctors, specialties, schedules, prices] = await Promise.all([
        listPublicDoctors(),
        listPublicSpecialties(),
        listActiveSchedules(),
        listActiveDoctorServicePrices(),
      ]);
      return { doctors, specialties, schedules, prices };
    }),
);
