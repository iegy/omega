import { createInterface, type Interface } from "node:readline";

import { initializeApp } from "firebase/app";
import {
  connectAuthEmulator,
  getAuth,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import {
  connectFirestoreEmulator,
  doc,
  getDoc,
  getFirestore,
  type Firestore,
} from "firebase/firestore/lite";

import {
  applySeedPlan,
  previewSeedPlan,
  type PlanPreview,
  type SeedMode,
} from "./apply";
import { loadEnvFile, readFirebaseConfig, type FirebaseCliConfig } from "./env";
import { buildSeedPlan, type SeedPlan } from "./plan";
import { hasBlockingErrors, validateSeed, type ValidationIssue } from "./validate";

/* -------------------------------------------------------------------------- */
/*  CLI arguments                                                              */
/* -------------------------------------------------------------------------- */

interface Args {
  dry: boolean;
  confirm: boolean;
  /** `--force-update` / `--sync`: overwrite existing documents. Destructive. */
  sync: boolean;
  /** Replaces the typed SYNC confirmation for non-interactive runs. */
  acceptOverwrite: boolean;
  email: string;
  passwordFromStdin: boolean;
  emulator: string | null;
  verbose: boolean;
}

function parseArgs(argv: string[]): Args {
  const get = (name: string): string | null => {
    const prefixed = argv.find((arg) => arg.startsWith(`--${name}=`));
    if (prefixed) return prefixed.slice(name.length + 3);
    const index = argv.indexOf(`--${name}`);
    if (index !== -1 && argv[index + 1] && !argv[index + 1].startsWith("--")) {
      return argv[index + 1];
    }
    return null;
  };

  return {
    dry: argv.includes("--dry") || argv.includes("--dry-run"),
    confirm: argv.includes("--confirm"),
    sync: argv.includes("--force-update") || argv.includes("--sync"),
    acceptOverwrite: argv.includes("--i-understand-overwrite"),
    email: get("email") ?? "admin@omega.com",
    passwordFromStdin: argv.includes("--password-stdin"),
    emulator: get("emulator"),
    verbose: argv.includes("--verbose"),
  };
}

/* -------------------------------------------------------------------------- */
/*  Output helpers                                                             */
/* -------------------------------------------------------------------------- */

const line = (text = "") => process.stdout.write(`${text}\n`);
const rule = (char = "─") => line(char.repeat(68));

function printPlan(plan: SeedPlan, preview: PlanPreview | null, mode: SeedMode): void {
  const verb = mode === "sync" ? "update" : "skip";

  line(`Planned documents by collection  (create / ${verb}):`);
  const collections = Object.keys(plan.countsByCollection).sort();

  for (const collection of collections) {
    const planned = plan.countsByCollection[collection];
    const bucket = preview?.byCollection[collection];

    const detail =
      preview?.probed && bucket
        ? `${String(bucket.creates).padStart(4)} / ${String(bucket.existing).padStart(4)}`
        : `${String(planned).padStart(4)} /    ?`;

    line(`  ${collection.padEnd(24)} ${detail}`);
  }

  rule();
  if (preview?.probed) {
    line(
      `  TOTAL ${String(plan.writes.length).padStart(3)} planned` +
        `  →  create ${preview.creates}` +
        `  ·  ${verb} ${preview.existing}`,
    );
  } else {
    line(`  TOTAL ${plan.writes.length} planned  (existing documents: unknown)`);
  }
}

function printIssues(issues: ValidationIssue[]): void {
  const errors = issues.filter((issue) => issue.severity === "error");
  const warnings = issues.filter((issue) => issue.severity === "warning");

  if (errors.length > 0) {
    line();
    line(`Validation errors (${errors.length}):`);
    for (const issue of errors) line(`  ✗ ${issue.where}: ${issue.message}`);
  }

  line();
  line(
    `Validation: ${errors.length} error(s), ${warnings.length} warning(s) ` +
      "(warnings mark data the clinic has not supplied — never auto-filled).",
  );
}

function printSyncWarning(projectId: string, existing: number | null): void {
  line();
  rule("═");
  line("  ⚠  DESTRUCTIVE MODE — --force-update / --sync");
  rule("═");
  line(`  Project: ${projectId}`);
  line();
  line("  This will OVERWRITE the seeded fields of documents that already");
  line("  exist. Any value entered from the Admin Dashboard on those fields");
  line("  will be replaced by the seed value, including:");
  line();
  line("    • uploaded photo URLs  → back to null");
  line("    • booking modes        → back to null (booking closes)");
  line("    • descriptions and SEO → back to null");
  line("    • prices the clinic confirmed later → back to the seed value");
  line("    • visibility / featured toggles     → back to the seed value");
  line();
  if (existing !== null) {
    line(`  ${existing} existing document(s) would be overwritten.`);
  }
  line("  Take a backup first if this database has been edited by the clinic.");
  rule("═");
}

/* -------------------------------------------------------------------------- */
/*  Prompts                                                                    */
/* -------------------------------------------------------------------------- */

/** Readline exposes the write hook we need to hide typed characters. */
interface MutableInterface extends Interface {
  _writeToOutput?: (value: string) => void;
  output?: NodeJS.WritableStream;
}

/**
 * Reads the administrator password without echoing it and without ever storing
 * it: not in the repository, not in `.env.local`, not in an environment
 * variable.
 */
function promptPassword(question: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: true,
    }) as MutableInterface;

    let promptWritten = false;
    rl._writeToOutput = (value: string) => {
      if (!promptWritten) {
        rl.output?.write(question);
        promptWritten = true;
        return;
      }
      if (value.includes("\n")) rl.output?.write("\n");
    };

    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

function promptVisible(question: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

function readStdin(): Promise<string> {
  return new Promise((resolve) => {
    let data = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => (data += chunk));
    process.stdin.on("end", () => resolve(data.trim()));
  });
}

/* -------------------------------------------------------------------------- */
/*  Firebase wiring                                                            */
/* -------------------------------------------------------------------------- */

interface Connection {
  db: Firestore;
  auth: ReturnType<typeof getAuth>;
}

function connect(config: FirebaseCliConfig, emulator: string | null): Connection {
  const app = initializeApp(config, `omega-care-seed-${Date.now()}`);
  const auth = getAuth(app);
  const db = getFirestore(app);

  if (emulator) {
    const [host, port] = emulator.split(":");
    connectFirestoreEmulator(db, host, Number(port));
    connectAuthEmulator(auth, `http://${host}:9099`, { disableWarnings: true });
  }

  return { db, auth };
}

/* -------------------------------------------------------------------------- */
/*  Main                                                                       */
/* -------------------------------------------------------------------------- */

async function main(): Promise<number> {
  const args = parseArgs(process.argv.slice(2));
  loadEnvFile();

  const config = readFirebaseConfig();
  const plan = buildSeedPlan();
  const issues = validateSeed(plan);
  const mode: SeedMode = args.sync ? "sync" : "bootstrap";

  rule();
  line("Omega Care — Firestore seed");
  rule();
  line(`Target Firebase project : ${config.projectId}`);
  line(`Mode                    : ${args.dry ? "DRY RUN (no writes)" : "WRITE"}`);
  line(
    `Strategy                : ${
      mode === "sync"
        ? "SYNC — overwrite existing documents (destructive)"
        : "BOOTSTRAP — create missing, skip existing (safe)"
    }`,
  );
  if (args.emulator) line(`Firestore emulator      : ${args.emulator}`);
  rule();

  // The probe is read-only and needs no sign-in: every seeded collection is
  // publicly readable, which is exactly what the dry run relies on.
  const { db, auth } = connect(config, args.emulator);
  const preview = await previewSeedPlan(db, plan);

  printPlan(plan, preview, mode);
  if (!preview.probed) {
    line();
    line("  Note: could not reach Firestore, so create/skip counts are unknown.");
    line("  The plan itself is still fully validated below.");
  }

  if (args.verbose || args.dry) {
    rule();
    line("Planned document paths:");
    for (const write of plan.writes) line(`  ${write.collection}/${write.docId}`);
  }

  printIssues(issues);

  if (hasBlockingErrors(issues)) {
    line();
    line("Aborted: fix the validation errors above before seeding.");
    return 1;
  }

  if (args.dry) {
    if (mode === "sync") printSyncWarning(config.projectId, preview.probed ? preview.existing : null);
    line();
    line("Dry run complete. No document was written.");
    line("Run `npm run seed -- --confirm` to create the missing documents.");
    return 0;
  }

  if (!args.confirm) {
    line();
    line("Refusing to write without an explicit confirmation flag.");
    line(
      `This would create ${preview.probed ? preview.creates : plan.writes.length} document(s) in "${config.projectId}".`,
    );
    line("Re-run with:  npm run seed -- --confirm");
    return 1;
  }

  if (mode === "bootstrap" && preview.probed && preview.creates === 0) {
    line();
    line("Nothing to do: all 180 seed documents already exist.");
    line("Existing documents are never modified in bootstrap mode.");
    line("To deliberately overwrite them, use --force-update (destructive).");
    return 0;
  }

  /* ---- destructive-mode confirmation ------------------------------------- */

  if (mode === "sync") {
    printSyncWarning(config.projectId, preview.probed ? preview.existing : null);

    if (!args.acceptOverwrite) {
      if (args.passwordFromStdin) {
        line();
        line("Non-interactive run: add --i-understand-overwrite to proceed. Aborted.");
        return 1;
      }
      const typed = await promptVisible('Type SYNC to confirm the overwrite: ');
      if (typed !== "SYNC") {
        line("Confirmation did not match. Aborted — nothing was written.");
        return 1;
      }
    }
  }

  /* ---- authenticate ------------------------------------------------------ */

  line();
  line(`Signing in as: ${args.email}`);

  const password = args.passwordFromStdin
    ? await readStdin()
    : await promptPassword("Password (input hidden): ");

  if (!password) {
    line("No password supplied. Aborted.");
    return 1;
  }

  let uid: string;
  try {
    const credential = await signInWithEmailAndPassword(auth, args.email, password);
    uid = credential.user.uid;
  } catch (error) {
    const code =
      typeof error === "object" && error !== null && "code" in error
        ? String((error as { code: unknown }).code)
        : "unknown";
    line(`Sign-in failed (${code}). Aborted — nothing was written.`);
    return 1;
  }

  /* ---- authorise --------------------------------------------------------- */

  const adminSnapshot = await getDoc(doc(db, "admins", uid));
  if (!adminSnapshot.exists()) {
    line("This account has no admins/{uid} record. Aborted.");
    await signOut(auth);
    return 1;
  }

  const adminData = adminSnapshot.data();
  if (adminData.active !== true) {
    line("This administrator account is not active. Aborted.");
    await signOut(auth);
    return 1;
  }
  if (adminData.role !== "super_admin") {
    line(
      `Role "${String(adminData.role)}" cannot write clinic settings. ` +
        "Sign in as a super_admin. Aborted.",
    );
    await signOut(auth);
    return 1;
  }

  line(`Authorised as super_admin (uid ${uid}).`);
  line();
  line(`Processing ${plan.writes.length} documents…`);

  /* ---- write ------------------------------------------------------------- */

  const result = await applySeedPlan(db, plan, {
    mode,
    onProgress: (done, total) => {
      if (done % 30 === 0 || done === total) line(`  … ${done}/${total}`);
    },
  });

  await signOut(auth);

  /* ---- report ------------------------------------------------------------ */

  rule();
  line("Seed report");
  rule();
  for (const [collection, counts] of Object.entries(result.byCollection).sort(
    ([a], [b]) => a.localeCompare(b),
  )) {
    line(
      `  ${collection.padEnd(24)} created ${String(counts.created).padStart(3)}` +
        `   skipped ${String(counts.skipped).padStart(3)}` +
        `   updated ${String(counts.updated).padStart(3)}`,
    );
  }
  rule();
  line(
    `  created ${result.created} · skipped ${result.skipped} · ` +
      `updated ${result.updated} · failed ${result.failed}`,
  );

  if (result.errors.length > 0) {
    line();
    line("Failures:");
    for (const failure of result.errors) {
      line(`  ✗ ${failure.path}: ${failure.message}`);
    }
    return 1;
  }

  line();
  if (mode === "bootstrap" && result.skipped > 0) {
    line(
      `${result.skipped} existing document(s) were left untouched — ` +
        "dashboard edits are preserved.",
    );
  }
  line("Seed complete.");
  line("Not written on purpose: offers (0), testimonials (0), labServices (0),");
  line("admins/* (never touched by the seed).");
  return 0;
}

main()
  .then((code) => process.exit(code))
  .catch((error: unknown) => {
    process.stderr.write(
      `\nUnexpected failure: ${error instanceof Error ? error.message : String(error)}\n`,
    );
    process.exit(1);
  });
