import type {
  DayOfWeek,
  DocumentMeta,
  IsoDate,
  MoneyEgp,
  SeoFields,
  TimeOfDay,
} from "./common";

/* -------------------------------------------------------------------------- */
/*  Doctor (spec N / 18)                                                       */
/* -------------------------------------------------------------------------- */

export interface Doctor extends DocumentMeta, SeoFields {
  nameAr: string;
  nameEn: string;
  /** URL segment, unique. Used by `/doctors/[slug]`. */
  slug: string;

  titleAr: string | null;
  titleEn: string | null;

  bioAr: string | null;
  bioEn: string | null;

  /** Free-form lines; never invented (spec CV). */
  qualificationsAr: string[];
  qualificationsEn: string[];

  /** References `specialties/{id}`; a doctor may hold several. */
  specialtyIds: string[];

  /** ImgBB URL. `null` renders the neutral medical placeholder (spec CM). */
  imageUrl: string | null;
  /** ImgBB delete URL, kept so the dashboard can revoke an old upload. */
  imageDeleteUrl: string | null;

  active: boolean;
  featured: boolean;

  /**
   * Master switch for this doctor's prices on public pages. An individual
   * `DoctorServicePrice` can still hide itself. Regardless of this flag, the
   * amount due is always shown inside the booking flow (spec Q).
   */
  showPricePublicly: boolean;

  sortOrder: number;
}

/* -------------------------------------------------------------------------- */
/*  Doctor service price (spec P / 19)                                         */
/* -------------------------------------------------------------------------- */

/** What kind of item the patient is paying for. */
export const DOCTOR_SERVICE_KINDS = [
  "consultation",
  "followUp",
  "session",
  "examination",
  "device",
  "procedure",
] as const;

export type DoctorServiceKind = (typeof DOCTOR_SERVICE_KINDS)[number];

export interface DoctorServicePrice extends DocumentMeta {
  doctorId: string;

  nameAr: string;
  nameEn: string;

  descriptionAr: string | null;
  descriptionEn: string | null;

  kind: DoctorServiceKind;

  /** `null` = the clinic has not supplied a price yet. Never guessed. */
  price: MoneyEgp | null;

  showPricePublicly: boolean;

  /** Optional link to a catalogue `services/{id}` entry. */
  serviceId: string | null;

  active: boolean;
  sortOrder: number;
}

/* -------------------------------------------------------------------------- */
/*  Doctor schedule (spec AB / AC / 20)                                        */
/* -------------------------------------------------------------------------- */

export const BOOKING_MODES = ["slot", "queue"] as const;
export type BookingMode = (typeof BOOKING_MODES)[number];

/**
 * Booking mode lives on the *schedule*, not the doctor, so the same doctor can
 * run fixed slots one day and a queue on another (spec AB).
 *
 * Two fields are deliberately nullable, because the clinic's real data is:
 *
 * - `endTime` — several doctors are published as "من الساعة 12 ظهرًا" with no
 *   stated finish. `null` means "open-ended / until the clinic closes". A fake
 *   value such as `23:59` would look authoritative and would silently generate
 *   bookable slots that do not exist.
 * - `bookingMode` — whether a period runs on fixed slots or a queue is an
 *   operational policy the clinic has not stated yet. `null` means "not
 *   configured"; Phase 8 refuses to open online booking for such a period and
 *   the dashboard prompts for a decision.
 */
export interface DoctorSchedule extends DocumentMeta {
  doctorId: string;

  dayOfWeek: DayOfWeek;

  startTime: TimeOfDay;
  /** `null` = the finish time is not published by the clinic. */
  endTime: TimeOfDay | null;

  /** `null` = not configured yet; booking stays closed for this period. */
  bookingMode: BookingMode | null;

  /** Slot length in minutes. Required when `bookingMode === "slot"`. */
  slotDuration: number | null;
  /** Capacity per slot. Required when `bookingMode === "slot"`. */
  maxBookingsPerSlot: number | null;

  /** Total tickets for the period. Used when `bookingMode === "queue"`. */
  maxQueueBookings: number | null;

  /** Optional note shown next to the period (e.g. "بعد الحجز المسبق"). */
  noteAr: string | null;
  noteEn: string | null;

  active: boolean;
}

/* -------------------------------------------------------------------------- */
/*  Schedule exceptions (spec AD / 21)                                         */
/* -------------------------------------------------------------------------- */

export const SCHEDULE_EXCEPTION_TYPES = [
  "day_off",
  "vacation",
  "special_hours",
  "emergency_cancellation",
] as const;

export type ScheduleExceptionType = (typeof SCHEDULE_EXCEPTION_TYPES)[number];

/**
 * Overrides the weekly schedule for one date (or a `date … endDate` range for
 * vacations) without deleting the recurring rows.
 *
 * `special_hours` carries alternate working hours; the other types close the
 * day. Booking calculations are built in Phase 8 — this is the data shape only.
 */
export interface ScheduleException extends DocumentMeta {
  doctorId: string;

  type: ScheduleExceptionType;

  /** First affected date, `YYYY-MM-DD` (clinic timezone). */
  date: IsoDate;
  /** Last affected date for multi-day vacations; `null` = single day. */
  endDate: IsoDate | null;

  /** Only meaningful for `special_hours`. */
  startTime: TimeOfDay | null;
  endTime: TimeOfDay | null;
  bookingMode: BookingMode | null;
  /* (already nullable — an exception may only shift the start time) */
  slotDuration: number | null;
  maxBookingsPerSlot: number | null;
  maxQueueBookings: number | null;

  reasonAr: string | null;
  reasonEn: string | null;

  active: boolean;
}

/**
 * A period can only be opened for online booking once the clinic has told us
 * how it runs. Phase 8 gates every slot/queue calculation behind this.
 */
export function isSchedulePublishable(schedule: DoctorSchedule): boolean {
  return schedule.active && schedule.bookingMode !== null;
}

export function closesTheDay(type: ScheduleExceptionType): boolean {
  return type !== "special_hours";
}
