import type { AppErrorCode } from "@/lib/errors";
import type { AdminRole, AdminUser } from "@/types/admin";

/**
 * Every state the dashboard session can be in.
 *
 * The states map 1:1 to the flow in spec 7:
 *   loading        – Firebase is resolving the persisted session
 *   unconfigured   – no Firebase env (development only)
 *   signedOut      – no Firebase user → show the login screen
 *   notAuthorized  – signed in, but `admins/{uid}` does not exist
 *   inactive       – `admins/{uid}.active === false`
 *   error          – lookup failed (network / rules); NOT the same as denied
 *   authorized     – active admin with a role → dashboard
 */
export type AdminSession =
  | { status: "loading" }
  | { status: "unconfigured" }
  | { status: "signedOut" }
  | { status: "notAuthorized"; email: string | null }
  | { status: "inactive"; email: string | null }
  | { status: "error"; code: AppErrorCode; email: string | null }
  | { status: "authorized"; admin: AdminUser };

export function isAuthorized(
  session: AdminSession,
): session is { status: "authorized"; admin: AdminUser } {
  return session.status === "authorized";
}

export function sessionRole(session: AdminSession): AdminRole | null {
  return isAuthorized(session) ? session.admin.role : null;
}

export function sessionEmail(session: AdminSession): string | null {
  if (session.status === "authorized") return session.admin.email;
  if (
    session.status === "notAuthorized" ||
    session.status === "inactive" ||
    session.status === "error"
  ) {
    return session.email;
  }
  return null;
}
