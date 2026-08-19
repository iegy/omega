import { query, where, type Query } from "firebase/firestore/lite";

import { appointmentsCollection } from "@/firebase/collections";
import type {
  Appointment,
  BookingStatus,
  PaymentStatus,
} from "@/types/appointment";

import { safeList } from "./firestore-access";
import { clinicToday } from "./repository-helpers";

/**
 * Appointment reads.
 *
 * Staff-only by design: `appointments` is never publicly listable or readable
 * (spec BZ), which is enforced in `firestore.rules` — this layer only shapes the
 * queries the dashboard needs.
 *
 * Booking creation, capacity enforcement and queue-number allocation are Phase 8
 * and will use a Firestore transaction (spec AK). Nothing here writes.
 */

export interface AppointmentFilters {
  date?: string;
  doctorId?: string;
  status?: BookingStatus;
  paymentStatus?: PaymentStatus;
}

function buildQuery(filters: AppointmentFilters): Query<Appointment> | null {
  const collectionRef = appointmentsCollection();
  if (!collectionRef) return null;

  // A single equality filter needs no composite index. The dashboard applies
  // any additional filters in memory until Phase 11 defines its exact screens
  // (and, with them, the indexes that are genuinely required).
  if (filters.date) return query(collectionRef, where("date", "==", filters.date));
  if (filters.doctorId) {
    return query(collectionRef, where("doctorId", "==", filters.doctorId));
  }
  if (filters.status) return query(collectionRef, where("status", "==", filters.status));
  return collectionRef;
}

function matchesFilters(appointment: Appointment, filters: AppointmentFilters): boolean {
  if (filters.date && appointment.date !== filters.date) return false;
  if (filters.doctorId && appointment.doctorId !== filters.doctorId) return false;
  if (filters.status && appointment.status !== filters.status) return false;
  if (filters.paymentStatus && appointment.payment.status !== filters.paymentStatus) {
    return false;
  }
  return true;
}

export async function listAppointments(
  filters: AppointmentFilters = {},
): Promise<Appointment[]> {
  const records = await safeList(buildQuery(filters), {
    context: `listAppointments(${JSON.stringify(filters)})`,
  });

  return records
    .filter((appointment) => matchesFilters(appointment, filters))
    .sort(
      (a, b) =>
        b.date.localeCompare(a.date) ||
        (a.time ?? "").localeCompare(b.time ?? "") ||
        (a.queueNumber ?? 0) - (b.queueNumber ?? 0),
    );
}

export async function listTodayAppointments(): Promise<Appointment[]> {
  return listAppointments({ date: clinicToday() });
}

/** Counters for the dashboard overview cards (spec AW). */
export interface AppointmentStats {
  today: number;
  total: number;
  confirmed: number;
  completed: number;
  cancelled: number;
  noShow: number;
  paymentsPending: number;
  paymentsAwaitingVerification: number;
  paymentsPaid: number;
}

export async function getAppointmentStats(): Promise<AppointmentStats> {
  const all = await listAppointments();
  const today = clinicToday();

  const count = (predicate: (appointment: Appointment) => boolean) =>
    all.reduce((total, appointment) => total + (predicate(appointment) ? 1 : 0), 0);

  return {
    today: count((appointment) => appointment.date === today),
    total: all.length,
    confirmed: count((appointment) => appointment.status === "confirmed"),
    completed: count((appointment) => appointment.status === "completed"),
    cancelled: count((appointment) => appointment.status === "cancelled"),
    noShow: count((appointment) => appointment.status === "no_show"),
    paymentsPending: count((appointment) => appointment.payment.status === "pending"),
    paymentsAwaitingVerification: count(
      (appointment) => appointment.payment.status === "pending_verification",
    ),
    paymentsPaid: count((appointment) => appointment.payment.status === "paid"),
  };
}
