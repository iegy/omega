import {
  collection,
  doc,
  type CollectionReference,
  type DocumentData,
  type DocumentReference,
} from "firebase/firestore/lite";

import { COLLECTIONS } from "@/config/constants";
import type { AdminUser } from "@/types/admin";
import type { Appointment } from "@/types/appointment";
import type {
  Offer,
  Service,
  ServiceCategory,
  Specialty,
  Testimonial,
} from "@/types/catalog";
import type {
  Doctor,
  DoctorSchedule,
  DoctorServicePrice,
  ScheduleException,
} from "@/types/doctor";
import type { LabService, LabUnit, SampleCollectionRequest } from "@/types/lab";

import { createConverter, type Normalizer } from "./converters";
import { getDb } from "./firestore";
import {
  normalizeAdminUser,
  normalizeAppointment,
  normalizeDoctor,
  normalizeDoctorSchedule,
  normalizeDoctorServicePrice,
  normalizeLabService,
  normalizeLabUnit,
  normalizeOffer,
  normalizeSampleCollectionRequest,
  normalizeScheduleException,
  normalizeService,
  normalizeServiceCategory,
  normalizeSpecialty,
  normalizeTestimonial,
} from "./normalizers";

/**
 * Typed collection accessors.
 *
 * Every accessor returns `null` when Firebase is not configured, so the
 * repository layer has exactly one place to degrade gracefully. Converters are
 * attached here, which is why no UI component ever casts a Firestore snapshot
 * (spec 13).
 */
function typedCollection<T extends { id: string }>(
  name: string,
  normalize: Normalizer<T>,
): () => CollectionReference<T> | null {
  const converter = createConverter(normalize);
  return () => {
    const db = getDb();
    if (!db) return null;
    return collection(db, name).withConverter(converter);
  };
}

/** Raw (unconverted) collection, for documents whose meaning is keyed by ID. */
export function rawCollection(name: string): CollectionReference<DocumentData> | null {
  const db = getDb();
  if (!db) return null;
  return collection(db, name);
}

/** Single fixed document such as `clinicSettings/site` or `founder/profile`. */
export function singletonDoc(
  collectionName: string,
  documentId: string,
): DocumentReference<DocumentData> | null {
  const db = getDb();
  if (!db) return null;
  return doc(db, collectionName, documentId);
}

/** Fixed IDs of the singleton documents. */
export const SINGLETON_IDS = {
  siteSettings: "site",
  founderProfile: "profile",
  labProfile: "labProfile",
  storeContent: "store",
  /** Shared ID for the single-document configuration collections. */
  config: "default",
} as const;

export const doctorsCollection = typedCollection<Doctor>(
  COLLECTIONS.doctors,
  normalizeDoctor,
);

export const doctorServicePricesCollection = typedCollection<DoctorServicePrice>(
  COLLECTIONS.doctorServicePrices,
  normalizeDoctorServicePrice,
);

export const doctorSchedulesCollection = typedCollection<DoctorSchedule>(
  COLLECTIONS.doctorSchedules,
  normalizeDoctorSchedule,
);

export const scheduleExceptionsCollection = typedCollection<ScheduleException>(
  COLLECTIONS.scheduleExceptions,
  normalizeScheduleException,
);

export const specialtiesCollection = typedCollection<Specialty>(
  COLLECTIONS.specialties,
  normalizeSpecialty,
);

export const servicesCollection = typedCollection<Service>(
  COLLECTIONS.services,
  normalizeService,
);

export const serviceCategoriesCollection = typedCollection<ServiceCategory>(
  COLLECTIONS.serviceCategories,
  normalizeServiceCategory,
);

export const offersCollection = typedCollection<Offer>(COLLECTIONS.offers, normalizeOffer);

export const labUnitsCollection = typedCollection<LabUnit>(
  COLLECTIONS.labUnits,
  normalizeLabUnit,
);

export const labServicesCollection = typedCollection<LabService>(
  COLLECTIONS.labServices,
  normalizeLabService,
);

export const sampleCollectionRequestsCollection =
  typedCollection<SampleCollectionRequest>(
    COLLECTIONS.sampleCollectionRequests,
    normalizeSampleCollectionRequest,
  );

export const appointmentsCollection = typedCollection<Appointment>(
  COLLECTIONS.appointments,
  normalizeAppointment,
);

export const testimonialsCollection = typedCollection<Testimonial>(
  COLLECTIONS.testimonials,
  normalizeTestimonial,
);

export const adminsCollection = typedCollection<AdminUser>(
  COLLECTIONS.admins,
  normalizeAdminUser,
);

/** `admins/{uid}` — the document ID is the Firebase Auth UID (spec 11). */
export function adminDocRef(uid: string): DocumentReference<AdminUser> | null {
  const ref = adminsCollection();
  return ref ? doc(ref, uid) : null;
}
