import {
  connectFirestoreEmulator,
  getFirestore,
  type Firestore,
} from "firebase/firestore/lite";

import { getFirebaseApp } from "./app";

let cached: Firestore | null = null;

/**
 * Optional local emulator target, e.g. `127.0.0.1:8080`.
 *
 * Development/testing only: when the variable is absent — which is always the
 * case in production — this code path is inert and the app talks to the real
 * project. It exists so the seed and the repositories can be exercised against
 * the emulator under the real `firestore.rules`.
 */
const EMULATOR_HOST = process.env.NEXT_PUBLIC_FIRESTORE_EMULATOR_HOST?.trim();

/** Firestore instance, or `null` when Firebase is not configured. */
export function getDb(): Firestore | null {
  if (cached) return cached;

  const app = getFirebaseApp();
  if (!app) return null;

  const db = getFirestore(app);

  if (EMULATOR_HOST) {
    const [host, port] = EMULATOR_HOST.split(":");
    connectFirestoreEmulator(db, host, Number(port));
    if (process.env.NODE_ENV !== "production") {
      console.warn(`[Omega Care] Firestore is using the emulator at ${EMULATOR_HOST}.`);
    }
  }

  cached = db;
  return cached;
}
