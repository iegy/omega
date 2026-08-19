import { DoctorCard } from "@/components/public/doctor-card";
import { HomeCollectionSection } from "@/features/home/sections/collection-section";
import { getDoctorsDirectory, getDoctorsToday } from "@/services/public-content";

/**
 * Doctors whose published weekly pattern includes today, in the clinic's
 * timezone (Africa/Cairo). Capped at 6 cards; "view all" leads to the full
 * directory.
 */
export async function DoctorsTodaySection() {
  const entries = await getDoctorsToday();

  return (
    <HomeCollectionSection
      namespace="doctorsToday"
      emptyKey="doctorsTodayEmpty"
      viewAllHref="/doctors"
      isEmpty={entries.length === 0}
    >
      <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {entries.slice(0, 6).map(({ listing, today }) => (
          <li key={listing.doctor.id}>
            {/* Only today's periods are passed, so the card's day chips and
                time line describe today rather than the whole week. */}
            <DoctorCard listing={{ ...listing, schedules: today }} />
          </li>
        ))}
      </ul>
    </HomeCollectionSection>
  );
}

/** Featured doctors, as flagged on the doctor documents. */
export async function FeaturedDoctorsSection() {
  const { listings } = await getDoctorsDirectory();
  const featured = listings.filter((listing) => listing.doctor.featured);

  return (
    <HomeCollectionSection
      namespace="featuredDoctors"
      emptyKey="featuredDoctorsEmpty"
      viewAllHref="/doctors"
      isEmpty={featured.length === 0}
    >
      <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {featured.slice(0, 6).map((listing) => (
          <li key={listing.doctor.id}>
            <DoctorCard listing={listing} />
          </li>
        ))}
      </ul>
    </HomeCollectionSection>
  );
}
