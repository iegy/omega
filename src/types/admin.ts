import type { DocumentMeta } from "./common";

/* -------------------------------------------------------------------------- */
/*  Roles (spec CC / CD / 4 / 5)                                               */
/* -------------------------------------------------------------------------- */

export const ADMIN_ROLES = ["super_admin", "admin", "reception"] as const;
export type AdminRole = (typeof ADMIN_ROLES)[number];

export function isAdminRole(value: unknown): value is AdminRole {
  return typeof value === "string" && (ADMIN_ROLES as readonly string[]).includes(value);
}

/**
 * Authorised dashboard user: `admins/{uid}`.
 *
 * The document ID **is** the Firebase Auth UID, which is what lets
 * `firestore.rules` verify authorisation with
 * `get(/databases/$(db)/documents/admins/$(request.auth.uid))`.
 * A role sent by the browser is never trusted (spec 11).
 *
 * A successful Firebase sign-in alone grants nothing: without an `active`
 * document here the session is rejected as "access denied" (spec 7).
 */
export interface AdminUser extends DocumentMeta {
  /** Mirrors the document ID; stored too so exports stay self-describing. */
  uid: string;
  email: string;
  displayName: string | null;

  role: AdminRole;
  active: boolean;

  /** Audit trail, written by the dashboard. */
  lastLoginAt: string | null;
  createdByUid: string | null;
}

/* -------------------------------------------------------------------------- */
/*  Permissions                                                                */
/* -------------------------------------------------------------------------- */

/**
 * Fine-grained capabilities. Components ask `can(role, "doctors:manage")`
 * instead of comparing role strings, so permissions can evolve in later phases
 * without touching the UI (spec 5 — no role strings scattered around).
 */
export const PERMISSIONS = [
  "dashboard:view",

  "appointments:view",
  "appointments:manage",
  "payments:verify",

  "sampleRequests:view",
  "sampleRequests:manage",

  "doctors:manage",
  "specialties:manage",
  "services:manage",
  "offers:manage",
  "lab:manage",
  "founder:manage",
  "content:manage",

  "settings:manage",
  "admins:manage",
  "backup:manage",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

const RECEPTION_PERMISSIONS: readonly Permission[] = [
  "dashboard:view",
  "appointments:view",
  "appointments:manage",
  "payments:verify",
  "sampleRequests:view",
  "sampleRequests:manage",
];

const ADMIN_PERMISSIONS: readonly Permission[] = [
  ...RECEPTION_PERMISSIONS,
  "doctors:manage",
  "specialties:manage",
  "services:manage",
  "offers:manage",
  "lab:manage",
  "founder:manage",
  "content:manage",
];

const SUPER_ADMIN_PERMISSIONS: readonly Permission[] = [
  ...ADMIN_PERMISSIONS,
  "settings:manage",
  "admins:manage",
  "backup:manage",
];

export const rolePermissions: Record<AdminRole, readonly Permission[]> = {
  super_admin: SUPER_ADMIN_PERMISSIONS,
  admin: ADMIN_PERMISSIONS,
  reception: RECEPTION_PERMISSIONS,
};

/** Single source of truth for authorisation checks in the UI. */
export function can(role: AdminRole | null | undefined, permission: Permission): boolean {
  if (!role) return false;
  return rolePermissions[role].includes(permission);
}

export function canAny(
  role: AdminRole | null | undefined,
  permissions: readonly Permission[],
): boolean {
  return permissions.some((permission) => can(role, permission));
}

export function isSuperAdmin(role: AdminRole | null | undefined): boolean {
  return role === "super_admin";
}
