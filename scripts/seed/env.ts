import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Minimal `.env.local` loader.
 *
 * The seed runs as a plain Node script, which does not read Next.js env files.
 * A tiny parser keeps the script dependency-free and, more importantly, keeps
 * the Firebase configuration in exactly one place — the same `.env.local` the
 * app uses. No credential is ever hardcoded here.
 */
export function loadEnvFile(file = ".env.local"): void {
  let contents: string;
  try {
    contents = readFileSync(resolve(process.cwd(), file), "utf8");
  } catch {
    return; // Fall back to whatever is already in process.env.
  }

  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const separator = line.indexOf("=");
    if (separator === -1) continue;

    const key = line.slice(0, separator).trim();
    let value = line.slice(separator + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (process.env[key] === undefined) process.env[key] = value;
  }
}

export interface FirebaseCliConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  messagingSenderId: string;
  appId: string;
}

export function readFirebaseConfig(): FirebaseCliConfig {
  const required = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };

  const missing = Object.entries(required)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    throw new Error(
      `Firebase configuration is incomplete. Missing: ${missing.join(", ")}. ` +
        "Copy .env.example to .env.local and fill in the Web app config.",
    );
  }

  return required as FirebaseCliConfig;
}
