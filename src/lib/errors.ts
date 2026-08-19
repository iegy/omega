/**
 * Central error translation layer.
 *
 * Rule (spec CI / 36): a raw Firebase message such as
 * `FirebaseError: Missing or insufficient permissions` must never reach a
 * patient or an administrator. Every failure becomes an `AppError` carrying a
 * stable `code` plus a message key that resolves in both languages through
 * `src/messages/*.json` → `errors.<code>`.
 */

export const APP_ERROR_CODES = [
  "notConfigured",
  "network",
  "permissionDenied",
  "unauthenticated",
  "notFound",
  "invalidCredentials",
  "accountDisabled",
  "tooManyRequests",
  "signInMethodDisabled",
  "invalidEmail",
  "unknown",
] as const;

export type AppErrorCode = (typeof APP_ERROR_CODES)[number];

export class AppError extends Error {
  readonly code: AppErrorCode;
  /** i18n key, e.g. `errors.permissionDenied`. */
  readonly messageKey: `errors.${AppErrorCode}`;
  /** Original technical detail — logged in development only. */
  readonly technical: string;

  constructor(code: AppErrorCode, technical = "") {
    super(`AppError:${code}${technical ? ` (${technical})` : ""}`);
    this.name = "AppError";
    this.code = code;
    this.messageKey = `errors.${code}`;
    this.technical = technical;
  }
}

const FIREBASE_CODE_MAP: Record<string, AppErrorCode> = {
  // Firebase Authentication
  "auth/invalid-email": "invalidEmail",
  "auth/missing-email": "invalidEmail",
  "auth/invalid-credential": "invalidCredentials",
  "auth/wrong-password": "invalidCredentials",
  "auth/user-not-found": "invalidCredentials",
  "auth/missing-password": "invalidCredentials",
  "auth/user-disabled": "accountDisabled",
  "auth/too-many-requests": "tooManyRequests",
  "auth/network-request-failed": "network",
  "auth/operation-not-allowed": "signInMethodDisabled",
  "auth/configuration-not-found": "signInMethodDisabled",
  "auth/invalid-api-key": "notConfigured",
  "auth/api-key-not-valid": "notConfigured",

  // Cloud Firestore
  "permission-denied": "permissionDenied",
  unauthenticated: "unauthenticated",
  "not-found": "notFound",
  unavailable: "network",
  "deadline-exceeded": "network",
  cancelled: "network",
  "resource-exhausted": "tooManyRequests",
  "failed-precondition": "unknown",
};

function extractCode(error: unknown): string | null {
  if (typeof error !== "object" || error === null) return null;
  const candidate = (error as { code?: unknown }).code;
  return typeof candidate === "string" ? candidate : null;
}

function extractMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "unknown error";
}

/** Normalises anything thrown by Firebase (or our own code) into an `AppError`. */
export function toAppError(error: unknown): AppError {
  if (error instanceof AppError) return error;

  const rawCode = extractCode(error);
  const mapped = rawCode ? FIREBASE_CODE_MAP[rawCode] : undefined;

  return new AppError(mapped ?? "unknown", rawCode ?? extractMessage(error));
}

/**
 * Development-only technical logging. In production only the stable code is
 * emitted so nothing sensitive ends up in a browser console or server log.
 */
export function logAppError(context: string, error: unknown): AppError {
  const appError = toAppError(error);

  if (process.env.NODE_ENV !== "production") {
    console.error(`[Omega Care] ${context}: ${appError.code}`, error);
  } else {
    console.error(`[Omega Care] ${context}: ${appError.code}`);
  }

  return appError;
}
