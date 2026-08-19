import { serverTimestamp, updateDoc } from "firebase/firestore/lite";

import { adminDocRef, adminsCollection } from "@/firebase/collections";
import { isFirebaseConfigured } from "@/firebase/env";
import { logAppError, type AppErrorCode } from "@/lib/errors";
import type { AdminUser } from "@/types/admin";

import { requireGet, safeList } from "./firestore-access";

/**
 * Authorisation lookup for the dashboard.
 *
 * A successful Firebase sign-in proves *identity only*. Authorisation comes from
 * `admins/{uid}`, which is also what `firestore.rules` inspects — so the browser
 * can never assert its own role (spec 7 / 11).
 *
 * The four outcomes are kept distinct on purpose: a permissions failure or a
 * network glitch must never be reported to a real administrator as
 * "access denied".
 */
export type AdminLookupResult =
  | { status: "authorized"; admin: AdminUser }
  | { status: "inactive"; admin: AdminUser }
  | { status: "notAuthorized" }
  | { status: "error"; code: AppErrorCode };

export async function lookupAdmin(uid: string): Promise<AdminLookupResult> {
  if (!isFirebaseConfigured()) return { status: "error", code: "notConfigured" };

  try {
    const result = await requireGet(adminDocRef(uid), { context: "lookupAdmin" });
    if (!result.found) return { status: "notAuthorized" };

    const admin = result.data;
    return admin.active ? { status: "authorized", admin } : { status: "inactive", admin };
  } catch (error) {
    const appError = logAppError("lookupAdmin", error);
    return { status: "error", code: appError.code };
  }
}

/**
 * Best-effort audit stamp after a successful sign-in.
 *
 * `firestore.rules` lets an administrator update only `lastLoginAt` /
 * `updatedAt` on their own document — never `role` or `active` — so this cannot
 * be turned into a privilege escalation. Failures are swallowed: a missing audit
 * stamp must not block a legitimate login.
 */
export async function touchAdminLastLogin(uid: string): Promise<void> {
  const reference = adminDocRef(uid);
  if (!reference) return;

  try {
    await updateDoc(reference, {
      lastLoginAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    logAppError("touchAdminLastLogin", error);
  }
}

/** Every dashboard user — readable by `super_admin` only (see the rules). */
export async function listAdmins(): Promise<AdminUser[]> {
  const records = await safeList(adminsCollection(), { context: "listAdmins" });
  return [...records].sort((a, b) => a.email.localeCompare(b.email));
}
