import type { ReactNode } from "react";

import { AestheticsSection } from "@/features/home/sections/aesthetics-section";
import { BookingCtaSection } from "@/features/home/sections/booking-cta-section";
import {
  OffersHomeSection,
  ServicesHomeSection,
  SpecialtiesHomeSection,
  TestimonialsHomeSection,
} from "@/features/home/sections/catalog-sections";
import {
  DoctorsTodaySection,
  FeaturedDoctorsSection,
} from "@/features/home/sections/doctors-today-section";
import { FounderSection } from "@/features/home/sections/founder-section";
import { HeroSection } from "@/features/home/sections/hero-section";
import { LabSection } from "@/features/home/sections/lab-section";
import { LocationSection } from "@/features/home/sections/location-section";
import { QuickActionsSection } from "@/features/home/sections/quick-actions-section";
import { WhyUsSection } from "@/features/home/sections/why-us-section";
import type { HomepageSectionKey } from "@/types/site";

/**
 * Maps a homepage section key to its renderer, so the order and visibility of
 * the homepage is driven entirely by data (spec I / BR) — the page component
 * never hardcodes a sequence of JSX blocks.
 *
 * Every entry now renders real Firestore content. The Phase 1 `DataSection`
 * placeholder is gone.
 */
export const homepageSectionRenderers: Record<
  HomepageSectionKey,
  () => ReactNode
> = {
  hero: () => <HeroSection />,
  quickActions: () => <QuickActionsSection />,
  doctorsToday: () => <DoctorsTodaySection />,
  specialties: () => <SpecialtiesHomeSection />,
  featuredDoctors: () => <FeaturedDoctorsSection />,
  services: () => <ServicesHomeSection />,
  offers: () => <OffersHomeSection />,
  lab: () => <LabSection />,
  aesthetics: () => <AestheticsSection />,
  whyUs: () => <WhyUsSection />,
  founderPreview: () => <FounderSection />,
  testimonials: () => <TestimonialsHomeSection />,
  location: () => <LocationSection />,
  bookingCta: () => <BookingCtaSection />,
};
