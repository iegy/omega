import { connectAuthEmulator, getAuth, type Auth } from "firebase/auth";

import { getFirebaseApp } from "./app";

let cached: Auth | null = null;

/** Optional local Auth emulator URL, e.g. `http://127.0.0.1:9099`. Dev only. */
const EMULATOR_URL = process.env.NEXT_PUBLIC_AUTH_EMULATOR_URL?.trim();

/**
 * Firebase Authentication instance, or `null` when Firebase is not configured.
 *
 * Only administrators authenticate (spec AU). Patients and visitors never have
 * accounts, so this is imported exclusively from admin-side code.
 */
export function getFirebaseAuth(): Auth | null {
  if (cached) return cached;

  const app = getFirebaseApp();
  if (!app) return null;

  const auth = getAuth(app);

  if (EMULATOR_URL) {
    connectAuthEmulator(auth, EMULATOR_URL, { disableWarnings: true });
  }

  cached = auth;
  return cached;
}
