import type { DocumentData } from "firebase/firestore/lite";

import {
  readBoolean,
  readDayOfWeek,
  readEnum,
  readEnumOrNull,
  readIsoDate,
  readIsoDateTime,
  readNumber,
  readNumberOrNull,
  readString,
  readStringArray,
  readStringOrNull,
  readTimeOfDay,
  readArray,
} from "./converters";

import { ADMIN_ROLES, type AdminUser } from "@/types/admin";
import {
  BOOKING_STATUSES,
  PAYMENT_METHODS,
  PAYMENT_STATUSES,
  type Appointment,
  type AppointmentPatient,
  type AppointmentPaymentDetails,
} from "@/types/appointment";
import {
  DISCOUNT_TYPES,
  OFFER_TARGET_TYPES,
  type Offer,
  type Service,
  type ServiceCategory,
  type Specialty,
  type Testimonial,
} from "@/types/catalog";
import type { DocumentMeta, SeoFields } from "@/types/common";
import {
  BOOKING_MODES,
  DOCTOR_SERVICE_KINDS,
  SCHEDULE_EXCEPTION_TYPES,
  type Doctor,
  type DoctorSchedule,
  type DoctorServicePrice,
  type ScheduleException,
} from "@/types/doctor";
import type {
  Founder,
  FounderQualification,
  FounderTimelineEntry,
} from "@/types/founder";
import {
  SAMPLE_LOCATION_TYPES,
  SAMPLE_REQUEST_STATUSES,
  type LabProfile,
  type LabService,
  type LabUnit,
  type SampleCollectionRequest,
} from "@/types/lab";
import type { HomepageSection, HomepageSectionKey } from "@/types/site";
import { HOMEPAGE_SECTION_KEYS } from "@/types/site";

/* -------------------------------------------------------------------------- */
/*  Shared fragments                                                           */
/* -------------------------------------------------------------------------- */

function meta(id: string, data: DocumentData): DocumentMeta {
  return {
    id,
    createdAt: readIsoDateTime(data.createdAt),
    updatedAt: readIsoDateTime(data.updatedAt),
  };
}

function seo(data: DocumentData): SeoFields {
  return {
    seoTitleAr: readStringOrNull(data.seoTitleAr),
    seoTitleEn: readStringOrNull(data.seoTitleEn),
    seoDescriptionAr: readStringOrNull(data.seoDescriptionAr),
    seoDescriptionEn: readStringOrNull(data.seoDescriptionEn),
  };
}

/** Falls back to the document ID so a missing slug can never break a route. */
function slugOf(id: string, data: DocumentData): string {
  return readStringOrNull(data.slug) ?? id;
}

/* -------------------------------------------------------------------------- */
/*  Doctors                                                                    */
/* -------------------------------------------------------------------------- */

export function normalizeDoctor(id: string, data: DocumentData): Doctor {
  return {
    ...meta(id, data),
    ...seo(data),
    nameAr: readString(data.nameAr),
    nameEn: readString(data.nameEn),
    slug: slugOf(id, data),
    titleAr: readStringOrNull(data.titleAr),
    titleEn: readStringOrNull(data.titleEn),
    bioAr: readStringOrNull(data.bioAr),
    bioEn: readStringOrNull(data.bioEn),
    qualificationsAr: readStringArray(data.qualificationsAr),
    qualificationsEn: readStringArray(data.qualificationsEn),
    specialtyIds: readStringArray(data.specialtyIds),
    imageUrl: readStringOrNull(data.imageUrl),
    imageDeleteUrl: readStringOrNull(data.imageDeleteUrl),
    active: readBoolean(data.active, true),
    featured: readBoolean(data.featured),
    showPricePublicly: readBoolean(data.showPricePublicly, true),
    sortOrder: readNumber(data.sortOrder, 100),
  };
}

export function normalizeDoctorServicePrice(
  id: string,
  data: DocumentData,
): DoctorServicePrice {
  return {
    ...meta(id, data),
    doctorId: readString(data.doctorId),
    nameAr: readString(data.nameAr),
    nameEn: readString(data.nameEn),
    descriptionAr: readStringOrNull(data.descriptionAr),
    descriptionEn: readStringOrNull(data.descriptionEn),
    kind: readEnum(data.kind, DOCTOR_SERVICE_KINDS, "consultation"),
    // Never defaulted to a number — a missing price stays unknown (spec AN).
    price: readNumberOrNull(data.price),
    showPricePublicly: readBoolean(data.showPricePublicly, true),
    serviceId: readStringOrNull(data.serviceId),
    active: readBoolean(data.active, true),
    sortOrder: readNumber(data.sortOrder, 100),
  };
}

export function normalizeDoctorSchedule(id: string, data: DocumentData): DoctorSchedule {
  return {
    ...meta(id, data),
    doctorId: readString(data.doctorId),
    dayOfWeek: readDayOfWeek(data.dayOfWeek),
    startTime: readTimeOfDay(data.startTime) ?? "00:00",
    // Both stay null when the clinic has not published them — never faked.
    endTime: readTimeOfDay(data.endTime),
    bookingMode: readEnumOrNull(data.bookingMode, BOOKING_MODES),
    slotDuration: readNumberOrNull(data.slotDuration),
    maxBookingsPerSlot: readNumberOrNull(data.maxBookingsPerSlot),
    maxQueueBookings: readNumberOrNull(data.maxQueueBookings),
    noteAr: readStringOrNull(data.noteAr),
    noteEn: readStringOrNull(data.noteEn),
    active: readBoolean(data.active, true),
  };
}

export function normalizeScheduleException(
  id: string,
  data: DocumentData,
): ScheduleException {
  return {
    ...meta(id, data),
    doctorId: readString(data.doctorId),
    type: readEnum(data.type, SCHEDULE_EXCEPTION_TYPES, "day_off"),
    date: readIsoDate(data.date) ?? "1970-01-01",
    endDate: readIsoDate(data.endDate),
    startTime: readTimeOfDay(data.startTime),
    endTime: readTimeOfDay(data.endTime),
    bookingMode: readEnumOrNull(data.bookingMode, BOOKING_MODES),
    slotDuration: readNumberOrNull(data.slotDuration),
    maxBookingsPerSlot: readNumberOrNull(data.maxBookingsPerSlot),
    maxQueueBookings: readNumberOrNull(data.maxQueueBookings),
    reasonAr: readStringOrNull(data.reasonAr),
    reasonEn: readStringOrNull(data.reasonEn),
    active: readBoolean(data.active, true),
  };
}

/* -------------------------------------------------------------------------- */
/*  Catalogue                                                                  */
/* -------------------------------------------------------------------------- */

export function normalizeSpecialty(id: string, data: DocumentData): Specialty {
  return {
    ...meta(id, data),
    ...seo(data),
    nameAr: readString(data.nameAr),
    nameEn: readString(data.nameEn),
    slug: slugOf(id, data),
    descriptionAr: readStringOrNull(data.descriptionAr),
    descriptionEn: readStringOrNull(data.descriptionEn),
    icon: readStringOrNull(data.icon),
    imageUrl: readStringOrNull(data.imageUrl),
    imageDeleteUrl: readStringOrNull(data.imageDeleteUrl),
    active: readBoolean(data.active, true),
    featured: readBoolean(data.featured),
    sortOrder: readNumber(data.sortOrder, 100),
  };
}

export function normalizeServiceCategory(
  id: string,
  data: DocumentData,
): ServiceCategory {
  return {
    ...meta(id, data),
    nameAr: readString(data.nameAr),
    nameEn: readString(data.nameEn),
    slug: slugOf(id, data),
    descriptionAr: readStringOrNull(data.descriptionAr),
    descriptionEn: readStringOrNull(data.descriptionEn),
    active: readBoolean(data.active, true),
    sortOrder: readNumber(data.sortOrder, 100),
  };
}

export function normalizeService(id: string, data: DocumentData): Service {
  return {
    ...meta(id, data),
    ...seo(data),
    nameAr: readString(data.nameAr),
    nameEn: readString(data.nameEn),
    slug: slugOf(id, data),
    descriptionAr: readStringOrNull(data.descriptionAr),
    descriptionEn: readStringOrNull(data.descriptionEn),
    categoryId: readStringOrNull(data.categoryId),
    imageUrl: readStringOrNull(data.imageUrl),
    imageDeleteUrl: readStringOrNull(data.imageDeleteUrl),
    price: readNumberOrNull(data.price),
    showPrice: readBoolean(data.showPrice, true),
    active: readBoolean(data.active, true),
    featured: readBoolean(data.featured),
    requiresBooking: readBoolean(data.requiresBooking, true),
    doctorIds: readStringArray(data.doctorIds),
    specialtyIds: readStringArray(data.specialtyIds),
    sortOrder: readNumber(data.sortOrder, 100),
  };
}

export function normalizeOffer(id: string, data: DocumentData): Offer {
  return {
    ...meta(id, data),
    titleAr: readString(data.titleAr),
    titleEn: readString(data.titleEn),
    descriptionAr: readStringOrNull(data.descriptionAr),
    descriptionEn: readStringOrNull(data.descriptionEn),
    imageUrl: readStringOrNull(data.imageUrl),
    imageDeleteUrl: readStringOrNull(data.imageDeleteUrl),
    discountType: readEnum(data.discountType, DISCOUNT_TYPES, "percentage"),
    discountValue: readNumberOrNull(data.discountValue),
    originalPrice: readNumberOrNull(data.originalPrice),
    offerPrice: readNumberOrNull(data.offerPrice),
    startDate: readIsoDate(data.startDate),
    endDate: readIsoDate(data.endDate),
    active: readBoolean(data.active),
    featured: readBoolean(data.featured),
    showOnHome: readBoolean(data.showOnHome),
    appliesTo: readEnum(data.appliesTo, OFFER_TARGET_TYPES, "service"),
    targetIds: readStringArray(data.targetIds),
    sortOrder: readNumber(data.sortOrder, 100),
  };
}

export function normalizeTestimonial(id: string, data: DocumentData): Testimonial {
  return {
    ...meta(id, data),
    patientName: readStringOrNull(data.patientName),
    bodyAr: readStringOrNull(data.bodyAr),
    bodyEn: readStringOrNull(data.bodyEn),
    rating: readNumberOrNull(data.rating),
    doctorId: readStringOrNull(data.doctorId),
    serviceId: readStringOrNull(data.serviceId),
    // Defaults to false: a testimonial is only shown when explicitly published.
    published: readBoolean(data.published),
    sortOrder: readNumber(data.sortOrder, 100),
  };
}

/* -------------------------------------------------------------------------- */
/*  Laboratory                                                                 */
/* -------------------------------------------------------------------------- */

export function normalizeLabUnit(id: string, data: DocumentData): LabUnit {
  return {
    ...meta(id, data),
    nameAr: readString(data.nameAr),
    nameEn: readString(data.nameEn),
    slug: slugOf(id, data),
    descriptionAr: readStringOrNull(data.descriptionAr),
    descriptionEn: readStringOrNull(data.descriptionEn),
    icon: readStringOrNull(data.icon),
    imageUrl: readStringOrNull(data.imageUrl),
    imageDeleteUrl: readStringOrNull(data.imageDeleteUrl),
    active: readBoolean(data.active, true),
    sortOrder: readNumber(data.sortOrder, 100),
  };
}

export function normalizeLabService(id: string, data: DocumentData): LabService {
  return {
    ...meta(id, data),
    unitId: readStringOrNull(data.unitId),
    nameAr: readString(data.nameAr),
    nameEn: readString(data.nameEn),
    slug: slugOf(id, data),
    descriptionAr: readStringOrNull(data.descriptionAr),
    descriptionEn: readStringOrNull(data.descriptionEn),
    price: readNumberOrNull(data.price),
    showPrice: readBoolean(data.showPrice, true),
    preparationAr: readStringOrNull(data.preparationAr),
    preparationEn: readStringOrNull(data.preparationEn),
    turnaroundAr: readStringOrNull(data.turnaroundAr),
    turnaroundEn: readStringOrNull(data.turnaroundEn),
    active: readBoolean(data.active, true),
    featured: readBoolean(data.featured),
    sortOrder: readNumber(data.sortOrder, 100),
  };
}

export function normalizeLabProfile(data: DocumentData): LabProfile {
  return {
    ...seo(data),
    nameAr: readString(data.nameAr),
    nameEn: readString(data.nameEn),
    descriptionAr: readStringOrNull(data.descriptionAr),
    descriptionEn: readStringOrNull(data.descriptionEn),
    logoUrl: readStringOrNull(data.logoUrl),
    logoDeleteUrl: readStringOrNull(data.logoDeleteUrl),
    phones: readStringArray(data.phones),
    whatsapp: readStringOrNull(data.whatsapp),
    openingHoursAr: readStringOrNull(data.openingHoursAr),
    openingHoursEn: readStringOrNull(data.openingHoursEn),
    sampleCollectionEnabled: readBoolean(data.sampleCollectionEnabled, true),
    sampleCollectionNoteAr: readStringOrNull(data.sampleCollectionNoteAr),
    sampleCollectionNoteEn: readStringOrNull(data.sampleCollectionNoteEn),
    active: readBoolean(data.active, true),
  };
}

export function normalizeSampleCollectionRequest(
  id: string,
  data: DocumentData,
): SampleCollectionRequest {
  return {
    ...meta(id, data),
    fullName: readString(data.fullName),
    phone: readString(data.phone),
    locationType: readEnum(data.locationType, SAMPLE_LOCATION_TYPES, "home"),
    address: readString(data.address),
    area: readStringOrNull(data.area),
    preferredDate: readIsoDate(data.preferredDate),
    preferredTime: readTimeOfDay(data.preferredTime),
    notes: readStringOrNull(data.notes),
    status: readEnum(data.status, SAMPLE_REQUEST_STATUSES, "new"),
    adminNotes: readStringOrNull(data.adminNotes),
    handledByUid: readStringOrNull(data.handledByUid),
  };
}

/* -------------------------------------------------------------------------- */
/*  Appointments                                                               */
/* -------------------------------------------------------------------------- */

function normalizePatient(data: DocumentData): AppointmentPatient {
  const patient = typeof data.patient === "object" && data.patient !== null
    ? (data.patient as DocumentData)
    : {};

  return {
    fullName: readString(patient.fullName),
    phone: readString(patient.phone),
    age: readNumberOrNull(patient.age),
    gender: readEnumOrNull(patient.gender, ["male", "female"] as const),
    visitReason: readStringOrNull(patient.visitReason),
    notes: readStringOrNull(patient.notes),
  };
}

function normalizePayment(data: DocumentData): AppointmentPaymentDetails {
  const payment = typeof data.payment === "object" && data.payment !== null
    ? (data.payment as DocumentData)
    : {};

  return {
    method: readEnum(payment.method, PAYMENT_METHODS, "cash"),
    status: readEnum(payment.status, PAYMENT_STATUSES, "pending"),
    senderPhone: readStringOrNull(payment.senderPhone),
    transactionReference: readStringOrNull(payment.transactionReference),
    notes: readStringOrNull(payment.notes),
    verifiedByUid: readStringOrNull(payment.verifiedByUid),
    verifiedAt: readIsoDateTime(payment.verifiedAt),
  };
}

export function normalizeAppointment(id: string, data: DocumentData): Appointment {
  return {
    ...meta(id, data),
    bookingCode: readString(data.bookingCode, id),
    doctorId: readString(data.doctorId),
    doctorNameAr: readString(data.doctorNameAr),
    doctorNameEn: readString(data.doctorNameEn),
    specialtyId: readStringOrNull(data.specialtyId),
    serviceId: readStringOrNull(data.serviceId),
    doctorServicePriceId: readStringOrNull(data.doctorServicePriceId),
    serviceNameAr: readString(data.serviceNameAr),
    serviceNameEn: readString(data.serviceNameEn),
    scheduleId: readStringOrNull(data.scheduleId),
    bookingMode: readEnum(data.bookingMode, BOOKING_MODES, "queue"),
    date: readIsoDate(data.date) ?? "1970-01-01",
    time: readTimeOfDay(data.time),
    periodStart: readTimeOfDay(data.periodStart),
    periodEnd: readTimeOfDay(data.periodEnd),
    queueNumber: readNumberOrNull(data.queueNumber),
    patient: normalizePatient(data),
    originalPrice: readNumberOrNull(data.originalPrice),
    discountAmount: readNumber(data.discountAmount),
    finalPrice: readNumberOrNull(data.finalPrice),
    appliedOfferId: readStringOrNull(data.appliedOfferId),
    payment: normalizePayment(data),
    status: readEnum(data.status, BOOKING_STATUSES, "confirmed"),
    adminNotes: readStringOrNull(data.adminNotes),
    submissionFingerprint: readStringOrNull(data.submissionFingerprint),
  };
}

/* -------------------------------------------------------------------------- */
/*  Founder                                                                    */
/* -------------------------------------------------------------------------- */

function normalizeQualification(entry: DocumentData, index: number): FounderQualification {
  return {
    id: readString(entry.id, `q-${index}`),
    titleAr: readString(entry.titleAr),
    titleEn: readString(entry.titleEn),
    institutionAr: readStringOrNull(entry.institutionAr),
    institutionEn: readStringOrNull(entry.institutionEn),
    // Never inferred — the brief explicitly withheld award dates (spec AP).
    year: readStringOrNull(entry.year),
    sortOrder: readNumber(entry.sortOrder, index * 10),
  };
}

function normalizeTimelineEntry(
  entry: DocumentData,
  index: number,
): FounderTimelineEntry {
  return {
    id: readString(entry.id, `t-${index}`),
    titleAr: readString(entry.titleAr),
    titleEn: readString(entry.titleEn),
    descriptionAr: readStringOrNull(entry.descriptionAr),
    descriptionEn: readStringOrNull(entry.descriptionEn),
    year: readStringOrNull(entry.year),
    sortOrder: readNumber(entry.sortOrder, index * 10),
  };
}

export function normalizeFounder(data: DocumentData): Founder {
  return {
    ...seo(data),
    nameAr: readString(data.nameAr),
    nameEn: readString(data.nameEn),
    titleAr: readStringOrNull(data.titleAr),
    titleEn: readStringOrNull(data.titleEn),
    bioAr: readStringOrNull(data.bioAr),
    bioEn: readStringOrNull(data.bioEn),
    visionAr: readStringOrNull(data.visionAr),
    visionEn: readStringOrNull(data.visionEn),
    messageAr: readStringOrNull(data.messageAr),
    messageEn: readStringOrNull(data.messageEn),
    imageUrl: readStringOrNull(data.imageUrl),
    imageDeleteUrl: readStringOrNull(data.imageDeleteUrl),
    qualifications: readArray(data.qualifications)
      .map(normalizeQualification)
      .sort((a, b) => a.sortOrder - b.sortOrder),
    timeline: readArray(data.timeline)
      .map(normalizeTimelineEntry)
      .sort((a, b) => a.sortOrder - b.sortOrder),
    active: readBoolean(data.active, true),
    showOnHomepage: readBoolean(data.showOnHomepage, true),
  };
}

/* -------------------------------------------------------------------------- */
/*  Homepage sections + admins                                                 */
/* -------------------------------------------------------------------------- */

export function isHomepageSectionKey(value: string): value is HomepageSectionKey {
  return (HOMEPAGE_SECTION_KEYS as readonly string[]).includes(value);
}

/**
 * `homepageSections/{key}` — the document ID *is* the section key, which keeps
 * the collection self-documenting and prevents duplicate rows for one section.
 */
export function normalizeHomepageSection(
  id: string,
  data: DocumentData,
): HomepageSection | null {
  if (!isHomepageSectionKey(id)) return null;
  return {
    key: id,
    enabled: readBoolean(data.enabled, true),
    sortOrder: readNumber(data.sortOrder, 100),
  };
}

export function normalizeAdminUser(id: string, data: DocumentData): AdminUser {
  return {
    ...meta(id, data),
    uid: readString(data.uid, id),
    email: readString(data.email),
    displayName: readStringOrNull(data.displayName),
    // No safe default for a role: unknown values fall back to the weakest role.
    role: readEnum(data.role, ADMIN_ROLES, "reception"),
    // Access must be granted explicitly; a missing flag means "not active".
    active: readBoolean(data.active),
    lastLoginAt: readIsoDateTime(data.lastLoginAt),
    createdByUid: readStringOrNull(data.createdByUid),
  };
}
