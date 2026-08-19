/**
 * Environment reading + validation for Firebase and ImgBB.
 *
 * Every variable is read as a *literal* `process.env.NEXT_PUBLIC_…` expression
 * because Next.js inlines those at build time; dynamic `process.env[key]`
 * lookups would be `undefined` in the browser bundle.
 *
 * Nothing in here throws. A missing configuration degrades the app to
 * "not configured" so the public website keeps rendering from the Phase 1
 * fallback settings, and the dashboard shows a clear developer-facing notice.
 */

export interface FirebaseClientConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  /**
   * Kept only because the Firebase console emits it. Firebase Storage is NOT
   * used anywhere in this project — images live on ImgBB (spec C).
   */
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

export type FirebaseEnvResult =
  | { ok: true; config: FirebaseClientConfig }
  | { ok: false; missing: readonly string[] };

const RAW = {
  NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET:
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID:
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
} as const;

/** `storageBucket` is optional on purpose — the app never touches Storage. */
const REQUIRED_KEYS = [
  "NEXT_PUBLIC_FIREBASE_API_KEY",
  "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
  "NEXT_PUBLIC_FIREBASE_APP_ID",
] as const satisfies readonly (keyof typeof RAW)[];

function clean(value: string | undefined): string {
  return (value ?? "").trim();
}

function read(): FirebaseEnvResult {
  const missing = REQUIRED_KEYS.filter((key) => clean(RAW[key]) === "");

  if (missing.length > 0) return { ok: false, missing };

  return {
    ok: true,
    config: {
      apiKey: clean(RAW.NEXT_PUBLIC_FIREBASE_API_KEY),
      authDomain: clean(RAW.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN),
      projectId: clean(RAW.NEXT_PUBLIC_FIREBASE_PROJECT_ID),
      storageBucket: clean(RAW.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET),
      messagingSenderId: clean(RAW.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID),
      appId: clean(RAW.NEXT_PUBLIC_FIREBASE_APP_ID),
    },
  };
}

export const firebaseEnv: FirebaseEnvResult = read();

export function isFirebaseConfigured(): boolean {
  return firebaseEnv.ok;
}

/** Developer-facing message. Never rendered to patients. */
export function describeFirebaseEnvProblem(): string | null {
  if (firebaseEnv.ok) return null;
  return [
    "[Omega Care] Firebase is not configured.",
    `Missing environment variable(s): ${firebaseEnv.missing.join(", ")}.`,
    "Copy .env.example to .env.local and fill in the Firebase Web config",
    "(Firebase console → Project settings → General → Your apps → Web app).",
  ].join(" ");
}

/* -------------------------------------------------------------------------- */
/*  ImgBB — full uploader lands in Phase 12, only the key is validated now.   */
/* -------------------------------------------------------------------------- */

export const imgbbApiKey = clean(process.env.NEXT_PUBLIC_IMGBB_API_KEY) || null;

export function isImgbbConfigured(): boolean {
  return imgbbApiKey !== null;
}
