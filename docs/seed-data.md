# Seed data — Omega Care

Target project: **omega-care-2e243** · 180 documents · Phase 3

The seed inserts the clinic's **real, confirmed** data into Firestore. It never
runs by itself: not on `npm run dev`, not on `npm run build`, not on deploy. It
is a manual command, and it refuses to write without an explicit flag.

---

## 1. Which method it uses, and why

The seed signs in as the **super_admin administrator** with the Firebase *client*
SDK and writes through the ordinary security rules.

The alternative — the Firebase Admin SDK — would require a service-account JSON
private key: a new, high-value secret that bypasses every rule in
`firestore.rules` and must never reach the repository. Since the existing
authenticated path already has exactly the permissions the seed needs
(`super_admin` may write settings, payment numbers and all content), adding that
secret would buy nothing and increase risk.

Consequences of that choice, all deliberate:

- The seed is subject to the same rules as the dashboard. If the rules are wrong,
  the seed fails — it cannot paper over a security mistake.
- Only a `super_admin` can run it. A `reception` or `admin` account is rejected
  before a single write.
- The password is typed at the prompt and never stored — not in the repo, not in
  `.env.local`, not in an environment variable.
- **The rules are never weakened to make seeding easier.**

## 2. Commands

```bash
npm run seed:dry              # validate + report creates/skips, ZERO writes
npm run seed -- --confirm     # SAFE bootstrap: create missing, skip existing
npm run seed:verify           # read everything back through the app repositories
```

### Bootstrap is the default, and it never overwrites

`npm run seed -- --confirm` is a **bootstrap/upsert**:

- documents that are **missing** are created;
- documents that **already exist** are skipped — no write is issued against them
  at all;
- so a re-run after a partial seed fills only the gaps;
- and **every value entered from the Admin Dashboard is preserved**.

This matters because many seed values are first-install *placeholders*:
`imageUrl: null`, `bookingMode: null`, empty descriptions, `price: null`,
`featured` flags. A merge-based re-run would push those nulls back over real
data the clinic had entered. Bootstrap mode makes that impossible.

### Deliberate overwrite (destructive)

```bash
npm run seed -- --confirm --force-update      # or --sync
```

Only use this when you *want* the seed to become the source of truth again. It
prints a full-width warning listing exactly what will be reset, shows how many
documents are affected, and then requires you to type `SYNC` before anything is
written. Take a backup first.

| Flag | Meaning |
|---|---|
| `--dry` | validate and report, write nothing |
| `--confirm` | required for any write |
| `--force-update` / `--sync` | overwrite existing documents (destructive) |
| `--i-understand-overwrite` | replaces the typed `SYNC` prompt for non-interactive runs |
| `--email <address>` | administrator to sign in as (default `admin@omega.com`) |
| `--verbose` | print every planned document path |
| `--password-stdin` | read the password from stdin instead of prompting |
| `--emulator <host:port>` | target the local emulator instead of the real project |

Every run prints the target project and the strategy **before** writing:

```
Target Firebase project : omega-care-2e243
Mode                    : WRITE
Strategy                : BOOTSTRAP — create missing, skip existing (safe)
```

Without `--confirm` it stops and tells you how many documents it *would* create.

## 3. What gets written

| Collection | Docs | Notes |
|---|---:|---|
| `specialties` | 19 | names only; descriptions/icons left null |
| `doctors` | 17 | the confirmed list — no eighteenth doctor was invented |
| `doctorSchedules` | 41 | weekly periods; open-ended ones keep `endTime: null` |
| `doctorServicePrices` | 34 | confirmed prices; unknown ones stay `null` |
| `serviceCategories` | 9 | medical, diagnostics, cardiology, pulmonology, audiology, neuro-diagnostics, aesthetics, weight management, laboratory |
| `services` | 34 | 14 diagnostic/medical + 20 aesthetics & slimming (incl. Magaleef) |
| `labUnits` | 6 | exactly the six units of Mawoda Atef Lab |
| `founder` | 1 | `founder/profile` with the 5 supplied qualifications |
| `clinicSettings` | 1 | `clinicSettings/site` — branding, contact, location (incl. the owner's official Google Maps place URL + coordinates), hero, footer, SEO |
| `paymentMethods` | 1 | `paymentMethods/default` — cash / wallet / InstaPay |
| `socialLinks` | 1 | `socialLinks/default` — Facebook + TikTok only |
| `siteContent` | 2 | `labProfile`, `store` |
| `homepageSections` | 14 | one document per section, `enabled` + `sortOrder` |
| **Total** | **180** | |

Deliberately **not** written:

- `offers` — no confirmed offer exists. Zero is the correct number.
- `testimonials` — no real patient review was supplied. None was invented.
- `labServices` — the laboratory supplied units, not a test list or prices.
- `appointments`, `sampleCollectionRequests` — patient data, created by the
  public flows in Phases 8 and 7.
- `admins/*` — **the seed never touches authorisation.** The validator fails the
  run if a plan entry ever targets that collection.

## 4. Re-running is safe

Every document has a deterministic ID derived from its slug, and the default
strategy never touches a document that already exists.

```
first run on an empty database : created 180 · skipped   0 · updated 0
re-run, nothing deleted        : created   0 · skipped 180 · updated 0
re-run after 3 were deleted    : created   3 · skipped 177 · updated 0
--force-update                 : created   0 · skipped   0 · updated 180
```

`createdAt` is stamped once, when the document is created, and never rewritten.
`updatedAt` is only touched when a write actually happens. Both use
`serverTimestamp()`, never the clock of the machine running the script.

`seed:dry` performs a read-only existence probe (no sign-in needed — every
seeded collection is publicly readable) so it can report *create* vs *skip*
counts rather than just plan totals. If Firestore is unreachable it says so and
still validates the plan.

### ID convention

```
doctors/doctor-<slug>                     e.g. doctor-mohamed-abu-zaid
doctorSchedules/schedule-<slug>-<day>-<HHmm>   e.g. schedule-yosra-sharaf-sun-1700
doctorServicePrices/price-<slug>-<item>   e.g. price-yosra-sharaf-follow-up
specialties/specialty-<slug>              e.g. specialty-cardiology
serviceCategories/category-<slug>         e.g. category-audiology
services/service-<slug>                   e.g. service-wart-removal-magaleef
labUnits/lab-unit-<slug>                  e.g. lab-unit-hematology
founder/profile · clinicSettings/site · paymentMethods/default
socialLinks/default · siteContent/labProfile · siteContent/store
homepageSections/<sectionKey>             e.g. homepageSections/doctorsToday
```

A record's public `slug` is always its ID minus the prefix, which is what makes
`/doctors/mohamed-abu-zaid` stable.

## 5. What is intentionally left `null`

The dry run reports these as **warnings**, not errors. They mark information the
clinic has not supplied. Nothing here is a bug, and none of it may be filled in
by guessing.

| Where | Field | Why |
|---|---|---|
| All 17 doctors | `imageUrl` | no photos supplied; the neutral placeholder renders |
| All 17 doctors | `bioAr` / `bioEn` | no biographies supplied |
| **18** schedules | `endTime` | published as "من الساعة 12 ظهرًا" with no finish time |
| All 41 schedules | `bookingMode` | slot vs queue is the clinic's operational decision |
| Dr. Mosaad — 5 vascular services | `price` | services confirmed, prices not |
| Dr. Hebala — echo / ECG / stress ECG | `price` | services confirmed, prices not |
| Dr. Kholoud Mostafa | consultation `price` | no price confirmed |
| All 34 catalogue services | `price` | prices belong to a doctor, not the catalogue |
| All 19 specialties | `description`, `icon`, `image` | names only were supplied |
| Founder — 5 qualifications | `year` | award dates were explicitly withheld |
| Founder | `vision`, `message` | no wording supplied; a quote would be fabricated |
| Lab profile | `openingHoursAr/En`, `whatsapp` | not published |
| Clinic settings | `location.directionsUrl` | derived from the place URL / coordinates by `directionsHref()` |
| Social links | `instagram`, `youtube` | not supplied |

### The 18 open-ended schedule rows

| Doctor | Rows | Published as |
|---|---:|---|
| Dr. Mohamed Anwar Alwany | 6 | daily except Friday, from 12:00 |
| Dr. Ibrahim Abd El-Salam | 4 | Sat / Mon / Wed / Thu, from 09:00 |
| Dr. Kholoud Mostafa | 4 | Sat / Sun / Wed / Thu, from 14:00 |
| Dr. Mohamed Saad Hebala | 2 | Sun / Tue, from 14:00 |
| Dr. Mohamed Ibrahim Abdel Galil | 1 | Thu, from 12:00 |
| Dr. Abdelrahman El-Shenawy | 1 | Tue, from 10:00 |
| **Total** | **18** | of 41 schedule rows |

All 41 rows also carry `bookingMode: null` until the clinic decides slot vs
queue per period.

## 6. Adding records later

1. Add the entry to the matching file under `scripts/seed/data/`.
   The objects are typed against the real domain models, so a missing or
   misspelled field fails `npm run typecheck`.
2. Run `npm run seed:dry` — the validator checks slugs, duplicate IDs, time
   formats, price sanity and every cross-reference (a doctor's `specialtyIds`, a
   service's `doctorIds`, a schedule's `doctorId`).
3. Run `npm run seed -- --confirm`.

From Phase 11 the dashboard becomes the normal way to add records; the seed
stays as the reproducible first-install path and as living documentation of what
the clinic confirmed.

## 7. Verification performed

Before this was reported as done, the whole flow ran against the **Firestore
emulator loaded with the real `firestore.rules`**:

| Check | Result |
|---|---|
| Fresh database, `--confirm` | created 180 · skipped 0 · failed 0 |
| Re-run with no changes | created 0 · **skipped 180** · updated 0 |
| Dashboard edits before a re-run (photo URL, bio, `featured`, `bookingMode: slot`, `slotDuration: 20`, a confirmed price) | **all six survived untouched** |
| 3 documents deleted, then re-run | created 3 · skipped 177 — gaps filled, edits still intact |
| `seed:dry` after the deletions | reported `create 3 · skip 177` |
| `--force-update` without acknowledgement | warning shown, **aborted**, nothing written |
| `--force-update --i-understand-overwrite` | updated 180 (documented, intended) |
| `npm run seed:verify` | 33/33 read-back assertions passed |
| `reception` account / account with no `admins/{uid}` | both refused before any write |
| No `--confirm` | refused |
| `admins/*` | untouched by every run |
| Phase 2 rules suite | still 33/33 |
