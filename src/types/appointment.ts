import type { BookingMode } from "./doctor";
import type { DocumentMeta, IsoDate, MoneyEgp, TimeOfDay } from "./common";

/* -------------------------------------------------------------------------- */
/*  Payments (spec AF – AI)                                                    */
/* -------------------------------------------------------------------------- */

export const PAYMENT_METHODS = ["cash", "wallet", "instapay"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_STATUSES = [
  "pending",
  "pending_verification",
  "paid",
  "failed",
  "refunded",
] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const BOOKING_STATUSES = [
  "confirmed",
  "completed",
  "cancelled",
  "no_show",
] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];

/** Electronic methods are verified by staff — never trusted automatically. */
export function isElectronicPayment(method: PaymentMethod): boolean {
  return method !== "cash";
}

export function initialPaymentStatus(method: PaymentMethod): PaymentStatus {
  return isElectronicPayment(method) ? "pending_verification" : "pending";
}

/* -------------------------------------------------------------------------- */
/*  Appointment (spec Z – AK / 22)                                             */
/* -------------------------------------------------------------------------- */

/** Patient details captured at booking. No patient account exists (spec Z). */
export interface AppointmentPatient {
  fullName: string;
  phone: string;
  age: number | null;
  gender: "male" | "female" | null;
  visitReason: string | null;
  notes: string | null;
}

/** Proof-of-transfer fields for wallet / InstaPay payments (spec AH). */
export interface AppointmentPaymentDetails {
  method: PaymentMethod;
  status: PaymentStatus;
  /** Number the patient transferred *from*. */
  senderPhone: string | null;
  transactionReference: string | null
  ;
  notes: string | null;
  /** Set when a staff member marks the payment as paid. */
  verifiedByUid: string | null;
  verifiedAt: string | null;
}

/**
 * A booking. Built in Phase 8 with a Firestore transaction that enforces
 * capacity and allocates a unique `queueNumber` (spec AK) — this file only
 * fixes the stored shape so later phases cannot drift.
 */
export interface Appointment extends DocumentMeta {
  /** Short human-friendly code shown to the patient, e.g. `OC-8F3K2`. */
  bookingCode: string;

  doctorId: string;
  doctorNameAr: string;
  doctorNameEn: string;

  specialtyId: string | null;

  /** Either a catalogue service or a doctor-specific priced item. */
  serviceId: string | null;
  doctorServicePriceId: string | null;
  serviceNameAr: string;
  serviceNameEn: string;

  scheduleId: string | null;
  bookingMode: BookingMode;

  /** Appointment date in the clinic timezone. */
  date: IsoDate;
  /** Exact time for `slot` bookings; `null` for `queue` bookings. */
  time: TimeOfDay | null;
  /** Period boundaries, always stored so the ticket can be printed. */
  periodStart: TimeOfDay | null;
  periodEnd: TimeOfDay | null;
  /** Sequential ticket for `queue` bookings; `null` for `slot` bookings. */
  queueNumber: number | null;

  patient: AppointmentPatient;

  /** Price snapshot at booking time — later price edits must not rewrite history. */
  originalPrice: MoneyEgp | null;
  discountAmount: MoneyEgp;
  finalPrice: MoneyEgp | null;
  appliedOfferId: string | null;

  payment: AppointmentPaymentDetails;

  status: BookingStatus;
  /** Internal staff notes, never shown to the patient. */
  adminNotes: string | null;

  /** Anti-abuse fingerprint written by the booking flow (spec CA). */
  submissionFingerprint: string | null;
}
