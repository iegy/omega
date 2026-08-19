import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";

import { describeFirebaseEnvProblem, firebaseEnv } from "./env";

const APP_NAME = "omega-care";

let warned = false;

/**
 * Lazily initialises the Firebase app.
 *
 * Returns `null` (never throws) when the environment is incomplete so a missing
 * `.env.local` during development cannot take the public website down.
 * Callers must handle `null` — the repository layer does this centrally.
 *
 * Note: Firebase **Storage is intentionally never imported** anywhere in the
 * codebase. Images are hosted on ImgBB (spec C).
 */
export function getFirebaseApp(): FirebaseApp | null {
  if (!firebaseEnv.ok) {
    if (!warned && process.env.NODE_ENV !== "production") {
      warned = true;
      console.warn(describeFirebaseEnvProblem());
    }
    return null;
  }

  const existing = getApps().find((app) => app.name === APP_NAME);
  if (existing) return existing;

  try {
    return initializeApp(firebaseEnv.config, APP_NAME);
  } catch {
    // Extremely unlikely (duplicate init race) — recover by reusing the app.
    try {
      return getApp(APP_NAME);
    } catch {
      return null;
    }
  }
}
