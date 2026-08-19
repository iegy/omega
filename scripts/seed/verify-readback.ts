/**
 * Post-seed read-back check.
 *
 * Runs the *application's own repositories* against whatever Firestore the
 * environment points at, so it proves the seeded documents survive the
 * converters and come back as valid domain objects — not just that writes
 * returned 200.
 *
 *   npm run seed:verify          → reads the configured project
 *   NEXT_PUBLIC_FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 npm run seed:verify
 */
import { loadEnvFile } from "./env";

const line = (text = "") => process.stdout.write(`${text}\n`);
const rule = () => line("─".repeat(64));

let failures = 0;
function expect(label: string, condition: boolean, detail = ""): void {
  if (condition) {
    line(`  ✓ ${label}${detail ? ` — ${detail}` : ""}`);
  } else {
    failures += 1;
    line(`  ✗ ${label}${detail ? ` — ${detail}` : ""}`);
  }
}

async function main(): Promise<number> {
  // Env must be loaded before the app modules read `process.env` at import time.
  loadEnvFile();

  const { listPublicDoctors, listDoctorSchedules, listDoctorServicePrices } =
    await import("../../src/services/doctors");
  const {
    listPublicSpecialties,
    listPublicServices,
    listServiceCategories,
    listLiveOffers,
  } = await import("../../src/services/catalog");
  const { listLabUnits, getLabProfile } = await import("../../src/services/lab");
  const { getFounder } = await import("../../src/services/founder");
  const { getSiteSettings, getHomepageSectionConfig } = await import(
    "../../src/services/settings"
  );

  rule();
  line("Read-back verification (through the app repositories)");
  rule();

  const doctors = await listPublicDoctors();
  expect("doctors readable", doctors.length === 17, `${doctors.length} active doctors`);

  const yosra = doctors.find((doctor) => doctor.slug === "yosra-sharaf");
  expect("Dr. Yosra Sharaf present with the correct Arabic spelling", yosra?.nameAr === "د. يسرا شرف", yosra?.nameAr ?? "missing");
  expect("no doctor carries an invented photo", doctors.every((doctor) => doctor.imageUrl === null));
  expect("every doctor is linked to a specialty", doctors.every((doctor) => doctor.specialtyIds.length > 0));

  const specialties = await listPublicSpecialties();
  expect("specialties readable", specialties.length === 19, `${specialties.length} specialties`);
  const specialtyIds = new Set(specialties.map((specialty) => specialty.id));
  expect(
    "every doctor's specialtyIds resolve",
    doctors.every((doctor) => doctor.specialtyIds.every((id) => specialtyIds.has(id))),
  );

  const alwany = doctors.find((doctor) => doctor.slug === "mohamed-anwar-alwany");
  const alwanySchedules = alwany ? await listDoctorSchedules(alwany.id) : [];
  expect("open-ended schedule kept as null endTime", alwanySchedules.length === 6 && alwanySchedules.every((schedule) => schedule.endTime === null), `${alwanySchedules.length} periods, daily except Friday`);
  expect("no schedule was assigned a booking mode", alwanySchedules.every((schedule) => schedule.bookingMode === null));
  expect("Friday is not a working day for Dr. Alwany", alwanySchedules.every((schedule) => schedule.dayOfWeek !== 5));

  const abuZaid = doctors.find((doctor) => doctor.slug === "mohamed-abu-zaid");
  const abuZaidPrices = abuZaid ? await listDoctorServicePrices(abuZaid.id) : [];
  expect("consultation price round-trips as a number", abuZaidPrices[0]?.price === 350, `${String(abuZaidPrices[0]?.price)} EGP`);

  const hebala = doctors.find((doctor) => doctor.slug === "mohamed-saad-hebala");
  const hebalaPrices = hebala ? await listDoctorServicePrices(hebala.id) : [];
  const unknownPrices = hebalaPrices.filter((price) => price.price === null);
  expect("unpriced cardiology services stay null", unknownPrices.length === 3, `${unknownPrices.length} of ${hebalaPrices.length} without a price`);

  const categories = await listServiceCategories();
  expect("service categories readable", categories.length === 9, `${categories.length} categories`);

  const services = await listPublicServices();
  expect("service catalogue readable", services.length === 34, `${services.length} services`);
  expect("no catalogue price was invented", services.every((service) => service.price === null));
  const magaleef = services.find((service) => service.slug === "wart-removal-magaleef");
  expect("Magaleef wart-removal device present", magaleef?.nameAr === "إزالة السنط بجهاز مجاليف", magaleef?.nameEn ?? "missing");

  const labUnits = await listLabUnits();
  expect("six laboratory units", labUnits.length === 6, labUnits.map((unit) => unit.nameEn).join(", "));

  const labProfile = await getLabProfile();
  expect("lab profile readable", labProfile?.nameEn === "Mawoda Atef Lab");
  expect("lab phone numbers stored", labProfile?.phones.join(",") === "0452930999,01555129217", labProfile?.phones.join(", ") ?? "");
  expect("lab opening hours left unknown", labProfile?.openingHoursAr === null);

  const founder = await getFounder();
  expect("founder readable", founder?.nameEn === "Dr. Mahmoud Zayed");
  expect("five founder qualifications", founder?.qualifications.length === 5);
  expect("no graduation year invented", founder?.qualifications.every((qualification) => qualification.year === null) ?? false);
  expect("founder vision/message left null", founder?.visionAr === null && founder?.messageAr === null);

  const settings = await getSiteSettings();
  expect("clinic settings merged from Firestore", settings.contact.phone === "0452935000", settings.contact.phone ?? "");
  expect("address (AR) from Firestore", settings.location.address.ar.includes("رشيد"));
  expect("wallet number from paymentMethods/default", settings.payments.walletNumber === "01008650036");
  expect("InstaPay number from paymentMethods/default", settings.payments.instapayNumber === "01008650036");
  expect("Facebook link from socialLinks/default", settings.social.facebook?.includes("omega.care.clinics") ?? false);
  expect("Instagram intentionally absent", settings.social.instagram === null);

  const sections = await getHomepageSectionConfig();
  expect("14 homepage sections", sections.length === 14);
  expect("testimonials section disabled", sections.find((section) => section.key === "testimonials")?.enabled === false);
  expect("hero section enabled", sections.find((section) => section.key === "hero")?.enabled === true);

  const offers = await listLiveOffers();
  expect("no offers seeded (none confirmed)", offers.length === 0, `${offers.length} offers`);

  rule();
  line(failures === 0 ? "All read-back checks passed." : `${failures} read-back check(s) FAILED.`);
  return failures === 0 ? 0 : 1;
}

main()
  .then((code) => process.exit(code))
  .catch((error: unknown) => {
    process.stderr.write(
      `\nRead-back failed: ${error instanceof Error ? error.message : String(error)}\n`,
    );
    process.exit(1);
  });
