import type { DayOfWeek } from "../../../src/types/common";
import type {
  Doctor,
  DoctorSchedule,
  DoctorServiceKind,
  DoctorServicePrice,
} from "../../../src/types/doctor";
import { doctorId, priceId, scheduleId } from "../ids";
import { requireSpecialtyIds } from "./specialties";

export type DoctorSeed = Omit<Doctor, "id" | "createdAt" | "updatedAt"> & {
  docId: string;
};
export type ScheduleSeed = Omit<DoctorSchedule, "id" | "createdAt" | "updatedAt"> & {
  docId: string;
};
export type PriceSeed = Omit<DoctorServicePrice, "id" | "createdAt" | "updatedAt"> & {
  docId: string;
};

/** 0 = Sunday … 6 = Saturday. */
const SUN: DayOfWeek = 0;
const MON: DayOfWeek = 1;
const TUE: DayOfWeek = 2;
const WED: DayOfWeek = 3;
const THU: DayOfWeek = 4;
const SAT: DayOfWeek = 6;

interface ScheduleInput {
  day: DayOfWeek;
  start: string;
  /** `null` when the clinic publishes a start time only ("من الساعة 12 ظهرًا"). */
  end: string | null;
  noteAr?: string;
  noteEn?: string;
}

interface PriceInput {
  slug: string;
  nameAr: string;
  nameEn: string;
  kind: DoctorServiceKind;
  /** `null` when the clinic has not published a price — never guessed. */
  price: number | null;
}

interface DoctorInput {
  slug: string;
  nameAr: string;
  nameEn: string;
  titleAr: string;
  titleEn: string;
  /** Extra confirmed credentials/affiliations, exactly as supplied. */
  qualificationsAr?: string[];
  qualificationsEn?: string[];
  specialties: string[];
  featured?: boolean;
  schedules: ScheduleInput[];
  prices: PriceInput[];
}

/**
 * The 17 doctors confirmed by the clinic.
 *
 * Rules applied throughout (spec 2):
 *  - No invented price, end time, qualification or biography.
 *  - `bio*` is `null` for every doctor: the clinic supplied names, titles,
 *    schedules and prices only.
 *  - `imageUrl` is `null`; the approved neutral placeholder renders instead
 *    (spec 30) — no stock photo is ever attached to a real physician.
 *  - `bookingMode` is left unset on every schedule; whether a period runs on
 *    fixed slots or a queue is the clinic's operational decision (spec 27).
 */
const INPUTS: DoctorInput[] = [
  {
    slug: "mohamed-abu-zaid",
    nameAr: "د. محمد أبو زيد",
    nameEn: "Dr. Mohamed Abu Zaid",
    titleAr: "استشاري أمراض الجهاز الهضمي والكبد والقولون والحميات",
    titleEn:
      "Consultant of Gastroenterology, Hepatology, Colorectal Diseases and Fevers",
    qualificationsAr: ["مناظير الجهاز الهضمي"],
    qualificationsEn: ["Gastrointestinal Endoscopy"],
    specialties: ["gastroenterology-hepatology-colorectal"],
    featured: true,
    schedules: [{ day: SUN, start: "10:00", end: "14:00" }],
    prices: [
      {
        slug: "consultation",
        nameAr: "الكشف",
        nameEn: "Consultation",
        kind: "consultation",
        price: 350,
      },
    ],
  },

  {
    slug: "kariman-tahoun",
    nameAr: "د. كاريمان طاحون",
    nameEn: "Dr. Kariman Tahoun",
    titleAr: "أخصائي أمراض الجهاز الهضمي والغدد وطب الشيخوخة",
    titleEn: "Specialist in Gastroenterology, Endocrinology and Geriatric Medicine",
    specialties: [
      "gastroenterology-hepatology-colorectal",
      "endocrinology",
      "geriatric-medicine",
    ],
    schedules: [
      { day: SAT, start: "17:00", end: "19:00" },
      { day: TUE, start: "19:00", end: "21:00" },
      { day: THU, start: "10:00", end: "12:00" },
    ],
    prices: [
      {
        slug: "consultation",
        nameAr: "الكشف",
        nameEn: "Consultation",
        kind: "consultation",
        price: 200,
      },
    ],
  },

  {
    slug: "mohamed-youssef",
    nameAr: "د. محمد يوسف",
    nameEn: "Dr. Mohamed Youssef",
    titleAr: "أستاذ مساعد أمراض الدم والمناعة",
    titleEn: "Assistant Professor of Hematology and Immunology",
    qualificationsAr: ["معهد البحوث الطبية"],
    qualificationsEn: ["Medical Research Institute"],
    specialties: ["hematology-immunology"],
    featured: true,
    schedules: [{ day: TUE, start: "15:00", end: "19:00" }],
    prices: [
      {
        slug: "consultation",
        nameAr: "الكشف",
        nameEn: "Consultation",
        kind: "consultation",
        price: 250,
      },
    ],
  },

  {
    slug: "marwa-fekry",
    nameAr: "د. مروة فكري",
    nameEn: "Dr. Marwa Fekry",
    titleAr: "أخصائي أمراض الجهاز التنفسي والربو",
    titleEn: "Specialist in Respiratory Diseases and Asthma",
    specialties: ["respiratory-asthma"],
    schedules: [{ day: TUE, start: "10:00", end: "12:00" }],
    prices: [
      {
        slug: "consultation",
        nameAr: "الكشف",
        nameEn: "Consultation",
        kind: "consultation",
        price: 200,
      },
    ],
  },

  {
    slug: "mohamed-abdel-motaleb",
    nameAr: "د. محمد عبد المطلب",
    nameEn: "Dr. Mohamed Abdel Motaleb",
    titleAr: "أخصائي جراحة العظام والكسور",
    titleEn: "Specialist in Orthopedic Surgery and Fractures",
    specialties: ["orthopedics"],
    featured: true,
    schedules: [
      { day: SAT, start: "15:00", end: "17:00" },
      { day: TUE, start: "15:00", end: "17:00" },
      { day: THU, start: "15:00", end: "17:00" },
    ],
    prices: [
      {
        slug: "consultation",
        nameAr: "الكشف",
        nameEn: "Consultation",
        kind: "consultation",
        price: 300,
      },
    ],
  },

  {
    slug: "mohamed-mosaad-mahmoud",
    nameAr: "د. محمد مسعد محمود",
    nameEn: "Dr. Mohamed Mosaad Mahmoud",
    titleAr:
      "استشاري جراحة الأوعية الدموية ودوالي الساقين وقسطرة الشرايين والأوردة الطرفية",
    titleEn:
      "Consultant of Vascular Surgery, Varicose Veins and Peripheral Arterial & Venous Catheterization",
    specialties: ["vascular-surgery"],
    schedules: [
      { day: SUN, start: "17:00", end: "19:00" },
      { day: THU, start: "17:00", end: "19:00" },
    ],
    prices: [
      {
        slug: "consultation",
        nameAr: "الكشف",
        nameEn: "Consultation",
        kind: "consultation",
        price: 250,
      },
      // Confirmed services, prices not supplied by the clinic → stay null.
      {
        slug: "varicose-veins",
        nameAr: "دوالي الساقين",
        nameEn: "Varicose Veins",
        kind: "procedure",
        price: null,
      },
      {
        slug: "leg-thrombosis",
        nameAr: "جلطات الساق",
        nameEn: "Leg Thrombosis (DVT)",
        kind: "procedure",
        price: null,
      },
      {
        slug: "diabetic-foot",
        nameAr: "القدم السكري",
        nameEn: "Diabetic Foot",
        kind: "procedure",
        price: null,
      },
      {
        slug: "varicose-treatment",
        nameAr: "علاج الدوالي",
        nameEn: "Varicose Vein Treatment",
        kind: "procedure",
        price: null,
      },
      {
        slug: "peripheral-vascular-services",
        nameAr: "الخدمات الوعائية الطرفية",
        nameEn: "Peripheral Vascular Services",
        kind: "procedure",
        price: null,
      },
    ],
  },

  {
    slug: "mohamed-anwar-alwany",
    nameAr: "د. محمد أنور علواني",
    nameEn: "Dr. Mohamed Anwar Alwany",
    titleAr: "أخصائي جراحة المسالك البولية",
    titleEn: "Specialist in Urologic Surgery",
    specialties: ["urology"],
    featured: true,
    // "يوميًا من الساعة 12 ظهرًا ماعدا الجمعة" — six periods, each open-ended.
    schedules: [SAT, SUN, MON, TUE, WED, THU].map((day) => ({
      day,
      start: "12:00",
      end: null,
      noteAr: "يوميًا ما عدا الجمعة",
      noteEn: "Daily except Friday",
    })),
    prices: [
      {
        slug: "consultation",
        nameAr: "الكشف",
        nameEn: "Consultation",
        kind: "consultation",
        price: 250,
      },
    ],
  },

  {
    slug: "gamal-shaalan",
    nameAr: "د. جمال شعلان",
    nameEn: "Dr. Gamal Shaalan",
    titleAr: "أخصائي جراحة المسالك البولية",
    titleEn: "Specialist in Urologic Surgery",
    specialties: ["urology"],
    schedules: [
      { day: MON, start: "16:00", end: "19:00" },
      { day: TUE, start: "16:00", end: "19:00" },
    ],
    prices: [
      {
        slug: "consultation",
        nameAr: "الكشف",
        nameEn: "Consultation",
        kind: "consultation",
        price: 200,
      },
    ],
  },

  {
    slug: "mohamed-el-gayar",
    nameAr: "د. محمد الجيار",
    nameEn: "Dr. Mohamed El-Gayar",
    titleAr: "أخصائي الجراحة العامة وجراحة التجميل",
    titleEn: "Specialist in General Surgery and Plastic Surgery",
    specialties: ["general-surgery", "plastic-surgery"],
    schedules: [
      { day: SUN, start: "18:00", end: "20:00" },
      { day: TUE, start: "18:00", end: "20:00" },
    ],
    prices: [
      {
        slug: "consultation",
        nameAr: "الكشف",
        nameEn: "Consultation",
        kind: "consultation",
        price: 200,
      },
    ],
  },

  {
    slug: "eman-salem-el-zeity",
    nameAr: "د. إيمان سالم الزعيطي",
    nameEn: "Dr. Eman Salem El-Zeity",
    titleAr: "أخصائي أمراض النساء والتوليد والعقم",
    titleEn: "Specialist in Obstetrics, Gynecology and Infertility",
    specialties: ["obstetrics-gynecology-infertility"],
    featured: true,
    schedules: [
      { day: SAT, start: "12:00", end: "14:00" },
      { day: MON, start: "12:00", end: "14:00" },
      { day: THU, start: "17:00", end: "19:00" },
    ],
    prices: [
      {
        slug: "consultation",
        nameAr: "الكشف",
        nameEn: "Consultation",
        kind: "consultation",
        price: 250,
      },
    ],
  },

  {
    slug: "ibrahim-abd-el-salam",
    nameAr: "د. إبراهيم عبد السلام",
    nameEn: "Dr. Ibrahim Abd El-Salam",
    titleAr: "أخصائي السمعيات وقياس السمع والاتزان",
    titleEn: "Specialist in Audiology, Hearing Assessment and Balance Testing",
    specialties: ["audiology-balance"],
    schedules: [SAT, MON, WED, THU].map((day) => ({
      day,
      start: "09:00",
      end: null,
    })),
    prices: [
      {
        slug: "tympanometry",
        nameAr: "ضغط الأذن",
        nameEn: "Tympanometry / Middle Ear Pressure Test",
        kind: "examination",
        price: 200,
      },
      {
        slug: "full-audiometry",
        nameAr: "رسم سمع كامل",
        nameEn: "Full Audiometry",
        kind: "examination",
        price: 400,
      },
      {
        slug: "computerized-hearing-test",
        nameAr: "رسم سمع كمبيوتر",
        nameEn: "Computerized Hearing Test",
        kind: "examination",
        price: 1000,
      },
    ],
  },

  {
    slug: "mohamed-ibrahim-abdel-galil",
    nameAr: "د. محمد إبراهيم عبد الجليل",
    nameEn: "Dr. Mohamed Ibrahim Abdel Galil",
    titleAr: "استشاري إيكو الأطفال / قلب الأطفال",
    titleEn: "Consultant in Pediatric Cardiac Echocardiography / Pediatric Cardiology",
    specialties: ["pediatric-cardiology"],
    featured: true,
    schedules: [{ day: THU, start: "12:00", end: null }],
    prices: [
      {
        slug: "pediatric-cardiology-consultation",
        nameAr: "كشف قلب أطفال",
        nameEn: "Pediatric Cardiology Consultation",
        kind: "consultation",
        price: 300,
      },
      {
        slug: "ecg",
        nameAr: "رسم قلب",
        nameEn: "ECG",
        kind: "device",
        price: 200,
      },
      {
        slug: "echocardiography",
        nameAr: "إيكو",
        nameEn: "Echocardiography",
        kind: "device",
        price: 600,
      },
    ],
  },

  {
    slug: "abdelrahman-el-shenawy",
    nameAr: "د. عبد الرحمن الشنواني",
    nameEn: "Dr. Abdelrahman El-Shenawy",
    titleAr: "أخصائي رسم العصب وتخطيط العضلات",
    titleEn: "Specialist in Nerve Conduction Studies and Electromyography",
    specialties: ["nerve-conduction-emg"],
    schedules: [{ day: TUE, start: "10:00", end: null }],
    prices: [
      {
        slug: "nerve-conduction-study",
        nameAr: "رسم عصب الطرف",
        nameEn: "Nerve Conduction Study per Limb",
        kind: "examination",
        price: 450,
      },
      {
        slug: "emg",
        nameAr: "تخطيط العضلات للطرف",
        nameEn: "EMG per Limb",
        kind: "examination",
        price: 200,
      },
      {
        slug: "sensory-study",
        nameAr: "الجهد الحسي للطرف",
        nameEn: "Sensory Evoked / Sensory Study per Limb",
        kind: "examination",
        price: 500,
      },
    ],
  },

  {
    // Correct spelling confirmed by the clinic: يسرا (not يسرى).
    slug: "yosra-sharaf",
    nameAr: "د. يسرا شرف",
    nameEn: "Dr. Yosra Sharaf",
    titleAr: "أخصائي العلاج الطبيعي والسمنة والنحافة",
    titleEn: "Specialist in Physical Therapy, Obesity and Weight Management",
    specialties: ["physical-therapy", "obesity-weight-management"],
    featured: true,
    schedules: [
      { day: SUN, start: "17:00", end: "20:00" },
      { day: THU, start: "17:00", end: "20:00" },
    ],
    prices: [
      {
        slug: "consultation",
        nameAr: "الكشف",
        nameEn: "Consultation / Examination",
        kind: "consultation",
        price: 150,
      },
      {
        slug: "follow-up",
        nameAr: "الاستشارة",
        nameEn: "Follow-up Consultation",
        kind: "followUp",
        price: 75,
      },
    ],
  },

  {
    slug: "safaa-el-shoury",
    nameAr: "د. صفاء الشوري",
    nameEn: "Dr. Safaa El-Shoury",
    titleAr: "أخصائي التخاطب وتنمية المهارات وتعديل السلوك",
    titleEn: "Specialist in Speech Therapy, Skills Development and Behavior Modification",
    specialties: ["speech-therapy"],
    schedules: [
      { day: SAT, start: "10:00", end: "15:00" },
      { day: MON, start: "10:00", end: "15:00" },
      { day: WED, start: "10:00", end: "15:00" },
    ],
    prices: [
      {
        slug: "assessment",
        nameAr: "الكشف",
        nameEn: "Assessment",
        kind: "consultation",
        price: 250,
      },
      {
        slug: "session",
        nameAr: "الجلسة",
        nameEn: "Session",
        kind: "session",
        price: 100,
      },
      {
        slug: "intelligence-test",
        nameAr: "اختبار ذكاء",
        nameEn: "Intelligence Test",
        kind: "examination",
        price: 400,
      },
    ],
  },

  {
    slug: "kholoud-mostafa",
    nameAr: "د. خلود مصطفى",
    nameEn: "Dr. Kholoud Mostafa",
    titleAr: "أخصائي التجميل بالليزر",
    titleEn: "Specialist in Laser Aesthetics",
    specialties: ["aesthetics-laser"],
    featured: true,
    schedules: [SAT, SUN, WED, THU].map((day) => ({
      day,
      start: "14:00",
      end: null,
    })),
    prices: [
      {
        // No consultation price confirmed by the clinic (spec: price = null).
        slug: "consultation",
        nameAr: "الكشف",
        nameEn: "Consultation",
        kind: "consultation",
        price: null,
      },
    ],
  },

  {
    slug: "mohamed-saad-hebala",
    nameAr: "د. محمد سعد هبالة",
    nameEn: "Dr. Mohamed Saad Hebala",
    titleAr: "استشاري أمراض القلب وقسطرة الشرايين التاجية",
    titleEn: "Consultant of Cardiology and Coronary Catheterization",
    qualificationsAr: ["عضو الجمعية الأوروبية لأمراض القلب", "مستشفى جمال عبد الناصر"],
    qualificationsEn: [
      "Member of the European Society of Cardiology",
      "Gamal Abdel Nasser Hospital",
    ],
    specialties: ["cardiology"],
    featured: true,
    schedules: [
      { day: SUN, start: "14:00", end: null },
      { day: TUE, start: "14:00", end: null },
    ],
    prices: [
      {
        slug: "consultation",
        nameAr: "الكشف",
        nameEn: "Consultation",
        kind: "consultation",
        price: 350,
      },
      // Confirmed services, prices not supplied → stay null.
      {
        slug: "echocardiography",
        nameAr: "إيكو",
        nameEn: "Echocardiography",
        kind: "device",
        price: null,
      },
      {
        slug: "ecg",
        nameAr: "رسم قلب عادي",
        nameEn: "Resting ECG",
        kind: "device",
        price: null,
      },
      {
        slug: "stress-ecg",
        nameAr: "رسم قلب بالمجهود",
        nameEn: "Stress ECG (Exercise Test)",
        kind: "device",
        price: null,
      },
    ],
  },
];

/* -------------------------------------------------------------------------- */
/*  Derived seed records                                                       */
/* -------------------------------------------------------------------------- */

export const doctorSeeds: DoctorSeed[] = INPUTS.map((input, index) => ({
  docId: doctorId(input.slug),
  slug: input.slug,
  nameAr: input.nameAr,
  nameEn: input.nameEn,
  titleAr: input.titleAr,
  titleEn: input.titleEn,
  bioAr: null,
  bioEn: null,
  qualificationsAr: input.qualificationsAr ?? [],
  qualificationsEn: input.qualificationsEn ?? [],
  specialtyIds: requireSpecialtyIds(input.specialties),
  imageUrl: null,
  imageDeleteUrl: null,
  active: true,
  featured: input.featured ?? false,
  showPricePublicly: true,
  sortOrder: (index + 1) * 10,
  seoTitleAr: null,
  seoTitleEn: null,
  seoDescriptionAr: null,
  seoDescriptionEn: null,
}));

export const scheduleSeeds: ScheduleSeed[] = INPUTS.flatMap((input) =>
  input.schedules.map((schedule) => ({
    docId: scheduleId(input.slug, schedule.day, schedule.start),
    doctorId: doctorId(input.slug),
    dayOfWeek: schedule.day,
    startTime: schedule.start,
    endTime: schedule.end,
    // Operational policy the clinic has not stated — left unset on purpose.
    bookingMode: null,
    slotDuration: null,
    maxBookingsPerSlot: null,
    maxQueueBookings: null,
    noteAr: schedule.noteAr ?? null,
    noteEn: schedule.noteEn ?? null,
    active: true,
  })),
);

export const doctorPriceSeeds: PriceSeed[] = INPUTS.flatMap((input) =>
  input.prices.map((price, index) => ({
    docId: priceId(input.slug, price.slug),
    doctorId: doctorId(input.slug),
    nameAr: price.nameAr,
    nameEn: price.nameEn,
    descriptionAr: null,
    descriptionEn: null,
    kind: price.kind,
    price: price.price,
    showPricePublicly: true,
    serviceId: null,
    active: true,
    sortOrder: (index + 1) * 10,
  })),
);

/** Used by the service catalogue to link a service to the doctors offering it. */
export const doctorIdBySlug = new Map(
  doctorSeeds.map((doctor) => [doctor.slug, doctor.docId]),
);
