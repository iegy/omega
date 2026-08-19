import type { Permission } from "@/types/admin";
import type { AdminNavKey, CommonKey, NavKey } from "@/types/i18n";

/**
 * Route map + navigation structure (spec G / H).
 * Labels live in `src/messages/*.json` under `nav.*` so both languages stay in sync.
 */

export const ROUTES = {
  home: "/",
  doctors: "/doctors",
  specialties: "/specialties",
  services: "/services",
  labs: "/labs",
  aesthetics: "/aesthetics",
  offers: "/offers",
  about: "/about",
  founder: "/founder",
  store: "/store",
  contact: "/contact",
  booking: "/booking",
  bookingSuccess: "/booking/success",
  admin: "/admin",
} as const;

export interface NavItem {
  /** i18n key under `nav` */
  key: NavKey;
  href: string;
  /** Shown in the header on desktop. */
  inHeader: boolean;
  /** Shown in the footer link column. */
  inFooter: boolean;
  badgeKey?: CommonKey;
}

export const mainNavigation: NavItem[] = [
  { key: "home", href: ROUTES.home, inHeader: true, inFooter: true },
  { key: "doctors", href: ROUTES.doctors, inHeader: true, inFooter: true },
  { key: "specialties", href: ROUTES.specialties, inHeader: true, inFooter: true },
  { key: "services", href: ROUTES.services, inHeader: true, inFooter: true },
  { key: "labs", href: ROUTES.labs, inHeader: true, inFooter: true },
  { key: "aesthetics", href: ROUTES.aesthetics, inHeader: true, inFooter: true },
  { key: "offers", href: ROUTES.offers, inHeader: true, inFooter: true },
  { key: "about", href: ROUTES.about, inHeader: true, inFooter: true },
  { key: "founder", href: ROUTES.founder, inHeader: true, inFooter: true },
  {
    key: "store",
    href: ROUTES.store,
    inHeader: true,
    inFooter: true,
    badgeKey: "comingSoon",
  },
  { key: "contact", href: ROUTES.contact, inHeader: true, inFooter: true },
];

export interface AdminNavItem {
  key: AdminNavKey;
  href: string;
  /**
   * Capability required to see and open the screen. The sidebar filters on this
   * and each page re-checks it, so a `reception` account never sees — or reaches
   * — a content-management screen (spec 5 / CD).
   */
  permission: Permission;
}

export const adminNavigation: AdminNavItem[] = [
  { key: "overview", href: "/admin", permission: "dashboard:view" },
  {
    key: "appointments",
    href: "/admin/appointments",
    permission: "appointments:view",
  },
  { key: "doctors", href: "/admin/doctors", permission: "doctors:manage" },
  {
    key: "specialties",
    href: "/admin/specialties",
    permission: "specialties:manage",
  },
  { key: "services", href: "/admin/services", permission: "services:manage" },
  { key: "offers", href: "/admin/offers", permission: "offers:manage" },
  { key: "lab", href: "/admin/lab", permission: "lab:manage" },
  { key: "founder", href: "/admin/founder", permission: "founder:manage" },
  { key: "content", href: "/admin/content", permission: "content:manage" },
  { key: "settings", href: "/admin/settings", permission: "settings:manage" },
  { key: "backup", href: "/admin/backup", permission: "backup:manage" },
];

/** Admin route paths that the login page must never redirect back into. */
export const ADMIN_LOGIN_PATH = "/admin/login";
