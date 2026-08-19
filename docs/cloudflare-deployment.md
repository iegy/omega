# Deploying Omega Care to Cloudflare Workers

Target architecture:

```
GitHub  →  Cloudflare Workers  →  OpenNext adapter  →  Next.js
                                                        ├─ Firestore (reads/writes)
                                                        ├─ Firebase Auth (admins only)
                                                        └─ ImgBB (image hosting)
```

Nothing else is introduced. There is **no** R2 bucket, **no** Workers KV, **no**
Durable Object, **no** queue, **no** D1, and no clinic or patient data of any
kind is copied into Cloudflare. Firestore stays the single source of truth, and
`firestore.rules` stays the single security boundary.

Not used, deliberately: Vercel, Netlify, GitHub Pages, Firebase Hosting,
Firebase Storage, Cloudflare Pages static export, `@cloudflare/next-on-pages`.

---

## 1. What was installed

| Package | Version | Why |
|---|---|---|
| `@opennextjs/cloudflare` | `^1.20.2` | Builds a Next.js app into a Cloudflare Worker. Its peer range is `next >=16.2.11`, so Next 16.3.1 is supported. |
| `wrangler` | `^4.123.0` | Cloudflare CLI: local preview, size check, deploy. Satisfies the adapter's `wrangler ^4.86.0` peer. |

Both are **devDependencies** — nothing new ships in the runtime bundle.

`@cloudflare/next-on-pages` is the older Pages adapter and is **not** installed.

## 2. Files added or changed for Cloudflare

| File | Change |
|---|---|
| `wrangler.jsonc` | new — Worker name, entry point, compatibility date/flags, assets and image bindings |
| `open-next.config.ts` | new — OpenNext adapter config (intentionally minimal) |
| `docs/cloudflare-deployment.md` | new — this document |
| `package.json` | added `build:cloudflare`, `preview:cloudflare`, `deploy:cloudflare` |
| `.gitignore` | ignores `/.open-next/`, `/.wrangler/`, `.dev.vars*` |
| `eslint.config.mjs` / `tsconfig.json` | exclude the generated `.open-next/` and `.wrangler/` output |
| `src/proxy.ts` → `src/middleware.ts` | required — see §6 |
| `src/**` Firestore imports | `firebase/firestore` → `firebase/firestore/lite` — required, see §7 |

Untouched: `firestore.rules`, `firestore.indexes.json`, `firebase.json`,
`.firebaserc`, every file under `scripts/seed/`, all seeded data, the UI, the
routing contract and the permission model.

## 3. Commands

```bash
npm run build:cloudflare     # next build + OpenNext bundle → .open-next/
npm run preview:cloudflare   # build, then serve the real Worker locally (workerd)
npm run deploy:cloudflare    # build, then upload to Cloudflare  ← only when you mean it
```

The existing commands are unchanged and keep working exactly as before:
`dev`, `build`, `start`, `lint`, `typecheck`, `seed`, `seed:dry`, `seed:verify`.

Always preview before deploying. `npm run preview:cloudflare` runs the same
`workerd` runtime Cloudflare runs, so a page that works there works in
production; `npm run dev` does **not** prove that.

## 4. Environment variables — where they go and why

Every variable this app uses is a `NEXT_PUBLIC_*` variable, and Next.js
**inlines those into the JavaScript at build time**. That has one practical
consequence which is easy to get wrong:

> The variables must exist **wherever `next build` runs**. Setting them on the
> Worker afterwards does nothing.

So they are deliberately **not** listed in `wrangler.jsonc`. Putting them there
would be ineffective *and* would commit real values to git.

| Where you build | Where to put the variables |
|---|---|
| Your own machine (`npm run deploy:cloudflare`) | `.env.local` (git-ignored) |
| Cloudflare Workers Builds / CI from GitHub | the build environment's variables, in the Cloudflare dashboard |

Required:

```
NEXT_PUBLIC_SITE_URL
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
NEXT_PUBLIC_IMGBB_API_KEY
```

Optional: `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` (the console emits it; the app
never uses Firebase Storage).

Never set in production: `NEXT_PUBLIC_FIRESTORE_EMULATOR_HOST`,
`NEXT_PUBLIC_AUTH_EMULATOR_URL`.

**No secrets are added to this repository.** The admin password is never stored
anywhere — not in `.env.local`, not in Wrangler, not in CI. There is no
service-account key, because the project does not use the Firebase Admin SDK.

### `NEXT_PUBLIC_SITE_URL` — update it when the domain is decided

It drives canonical URLs, `hreflang`, `sitemap.xml`, `robots.txt` and JSON-LD.
It has **no** default pointing at a made-up domain; locally it falls back to
`http://localhost:3000`.

1. Deploy once and note the URL Cloudflare gives you
   (`https://omega-care.<your-subdomain>.workers.dev`), or attach the clinic's
   real domain.
2. Set `NEXT_PUBLIC_SITE_URL` to that origin, with no trailing slash.
3. **Rebuild and redeploy** — it is a build-time value, so a redeploy is the
   only way it takes effect.
4. Re-check `https://<your-domain>/sitemap.xml` and `/robots.txt`.

## 5. Firebase — Authorized Domains

Firebase Authentication rejects sign-in from an origin it does not know, so the
Admin Dashboard login will fail with `auth/unauthorized-domain` until you add
the deployed host.

Firebase console → **Authentication → Settings → Authorized domains → Add
domain**, and add both:

- `omega-care.<your-subdomain>.workers.dev` (the Workers URL), and
- the clinic's custom domain, once it points at the Worker.

`localhost` is already there by default. Firestore itself needs nothing added —
its access is governed by `firestore.rules`, which are unchanged.

## 6. Why the file is `middleware.ts` again, not `proxy.ts`

Next.js 16 renamed the middleware convention to `proxy`, and this project used
`src/proxy.ts`. It cannot stay:

- Next 16 compiles **every** `proxy.*` file to the **Node.js** runtime. This is
  unconditional (`isProxyFile(page)` in `next/dist/build/index.js`); there is no
  config option that opts a `proxy` file into the edge runtime.
- `@opennextjs/cloudflare` refuses to build a project with Node.js middleware —
  the build aborts with *"Node.js middleware is not currently supported."*

Renaming the file back to `src/middleware.ts` makes Next compile the identical
code to the **edge** runtime, which is what OpenNext bundles into the Worker.
The matcher, the behaviour and next-intl's locale negotiation are byte-for-byte
the same; only the compilation target changed.

`next build` prints a deprecation warning about the `middleware` convention.
That warning is expected. **Do not run
`npx @next/codemod middleware-to-proxy`** — it would break the Cloudflare build.
Rename it back only when OpenNext supports Node.js middleware, or when Next lets
a `proxy` file choose the edge runtime.

## 7. Why Firestore **Lite** on the server

The app now imports `firebase/firestore/lite` instead of `firebase/firestore`.
This is not a preference; the full SDK is unusable on Workers.

Measured on `workerd` (the same runtime Cloudflare runs), the same query issued
on six consecutive requests:

| SDK | req 1 | req 2 | req 3 | req 4 | req 5 |
|---|---|---|---|---|---|
| `firebase/firestore` (full) | ✅ 1732 ms | ⛔ hang | ⛔ hang | ⛔ hang | ⛔ hang |
| `firebase/firestore/lite` | ✅ 749 ms | ✅ 170 ms | ✅ 491 ms | ✅ 166 ms | ✅ 490 ms |

The full SDK opens a long-lived WebChannel stream. Workers may not reuse an I/O
object across requests, so the stream created during the first request is dead
for every request after it — and because reads in `src/services/firestore-access.ts`
are time-boxed and never throw at the UI, the failure is **silent**: the site
keeps rendering, but from the Phase 1 fallback settings instead of Firestore.
Visitors would see a working site with the wrong content. That is the worst
possible failure mode, and it is why this was changed rather than tolerated.

The Lite SDK talks to the same Firestore over plain REST — one request, one
fetch, no persistent connection.

What this does and does not cost:

- **Unchanged:** the database, the documents, the converters, `firestore.rules`,
  the collection layout, the seed, `getDoc` / `getDocs` / `query` / `where` /
  `setDoc` / `updateDoc` / `serverTimestamp` / `Timestamp`, and every read-back
  assertion (`npm run seed:verify` still passes 33/33).
- **Lost:** `onSnapshot` real-time listeners and offline persistence. The
  codebase has never used either — a repo-wide search for `onSnapshot` returns
  nothing. If a future dashboard screen wants live updates, it must poll, or run
  a second `FirebaseApp` instance with the full SDK **in the browser only**.

## 8. Public data caching — Cloudflare Cache API, 30 minutes

`src/app/[locale]/(site)/layout.tsx` exports `revalidate = 300`, but with no
OpenNext incremental cache (no R2, no KV, no Durable Object) every request
re-renders and re-reads Firestore. Measured, that costs **~180 document reads
for one homepage view** — about **280 homepage views/day** against the Spark
allowance of 50,000 reads/day. Not viable for a real clinic.

The fix is `src/services/public-cache.ts`: the public **datasets** are cached in
Cloudflare's built-in Cache API (`caches.default`). No storage product, no
binding, no billing — the Cache API is part of the Workers runtime.

### Why datasets, not pages

`/`, `/doctors`, `/specialties`, `/services`, every doctor profile and
`/aesthetics` all need the same doctors + specialties + schedules + prices. If
each *page* were cached, each would warm its own copy. Caching the *dataset*
means the first request to any of them warms the data for all of them, in both
locales, from one entry.

Six groups, each a single cache entry:

| Group | Contents | Used by |
|---|---|---|
| `settings` | clinic settings, payment display, social links, homepage section config | every page (layout, header, footer, metadata) |
| `doctors` | doctors + specialties + active schedules + public prices | `/doctors`, every doctor profile, specialty pages, `/aesthetics`, 2 homepage sections |
| `catalog` | services + service categories + specialties | `/services`, service pages, `/specialties`, `/aesthetics`, homepage |
| `lab` | public lab profile + lab units | `/labs`, homepage lab section |
| `founder` | public founder profile | `/founder`, homepage teaser |
| `promotions` | live offers + published testimonials | `/offers`, homepage |

### TTL

**30 minutes**, defined once in `PUBLIC_CACHE_TTL_SECONDS`.

Chosen against the allowance, not by feel. At a 5-minute TTL one continuously
active Cloudflare location could cost `180 × 12 × 24 = 51,840` reads/day for the
homepage dataset alone — over the limit before other routes, builds, bots or
additional locations. At 30 minutes the same worst case is `180 × 2 × 24 =
8,640`, leaving room for every other group, several builds a day and multiple
Cloudflare locations.

**Operational consequence: a content change can take up to 30 minutes to appear
on the public site.** The Admin Dashboard says so explicitly. Edits are written
to Firestore immediately and the dashboard itself always reads fresh
(`getSiteSettingsFresh()`, `getFounderFresh()`, …), so an editor sees their own
change at once.

### What is never cached this way

The group list is a closed union and is re-checked at runtime, so only the six
public groups above can ever be stored. Not cached, by construction: `/admin`,
admin sessions, Firebase Auth state, appointments, patient or contact
submissions, lab sample requests, payment verification data, any private
collection, and any non-GET response. Each of those is read on an authenticated
path that never calls this module.

### Safety

- **A failed read is never cached.** `safeList`/`safeGet` swallow errors and
  return empty values so the site stays up, which means the loader cannot tell
  "empty" from "Firestore unreachable". `firestore-access.ts` therefore keeps a
  read-failure counter that the cache samples either side of the load; if it
  moved, the write is skipped. Without this, a transient outage would pin an
  empty website for the full 30 minutes.
- **No Cache API, no problem.** Node during `next build` and `npm run dev` has
  no `caches.default`; the layer logs `BYPASS` and reads Firestore directly.
- **The build phase always bypasses**, because `services/build-cache.ts` already
  memoises the whole build in-process.
- Every cache operation is wrapped: a corrupt entry or a failed write falls back
  to Firestore. The public site cannot fail because of this file.

### Observability

One line per lookup, safe to leave on in production — it contains only the fixed
group name, never clinic or patient data:

```
[Omega Care][cache] HIT group=doctors 3ms
[Omega Care][cache] MISS group=settings 831ms
[Omega Care][cache] MISS group=doctors 172ms nocache=read-failed
[Omega Care][cache] BYPASS group=lab 0ms
```

Watch it live with `npx wrangler tail`.

### Verified on the Workers runtime

| Check | Result |
|---|---|
| First request | `MISS`, loader ran once |
| Second and third requests | `HIT`, **loader did not run** — zero Firestore reads |
| Payload integrity across the cache | identical |
| TTL read from the single constant | `1800` |
| A non-public group (`appointments`) | **refused** |
| Plain Node (no Cache API) | `BYPASS`, data still correct |
| Firestore failing (quota exhausted) | `nocache=read-failed`, nothing stored |
| Homepage group lookups per render | 6, down from ~12 collection queries |

### If it is ever not enough

`PUBLIC_CACHE_TTL_SECONDS` is the one knob. Raising it lowers reads
proportionally at the cost of a longer publish delay. Only if that is not enough
should R2 + a Durable Object queue be reconsidered — and that is a decision for
the owner, not a silent change.

### Publishing sooner than 30 minutes

Deliberately not built yet: no Cloudflare API token, no purge endpoint, no paid
invalidation. If the delay becomes operationally inconvenient, a secure
"Publish / refresh public cache" action can be added later.

## 9. Images

`wrangler.jsonc` enables Cloudflare's `IMAGES` binding, which is what makes
`next/image` work on Workers. `next.config.ts` already restricts remote images
to `i.ibb.co`, `i.ibb.co.com` and `image.ibb.co`, so the optimizer can only ever
be pointed at ImgBB or at the site's own `/brand` assets. Verified locally:

| Request | Result |
|---|---|
| `/_next/image?url=/brand/omega-care-logo.png` | `200`, `image/png` |
| `/_next/image?url=https://i.ibb.co/…` | allowed (reaches upstream) |
| `/_next/image?url=https://evil.example.com/a.png` | `400 "url" parameter is not allowed` |

Cloudflare Images includes a free monthly allowance of unique transformations,
and this site has a handful of brand assets plus doctor photos. To opt out of
image optimization entirely, delete the `images` block from `wrangler.jsonc` and
set `images: { unoptimized: true }` in `next.config.ts`.

## 10. Bundle size vs the Workers **Free** plan

The Free plan allows **3 MiB gzipped** per Worker.

```
$ npx wrangler deploy --dry-run
Total Upload: 7604.55 KiB / gzip: 1522.07 KiB
```

**1522 KiB of the 3072 KiB budget — about 50 % used, ~1.5 MiB of headroom.**
No size workaround is needed and no code was dropped to fit.

For reference, moving to the Lite SDK removed gRPC and protobuf from the bundle
and saved ~440 KiB gzipped (1962 KiB → 1522 KiB).

Static assets (`/brand/*`, `/_next/static/*`, fonts, icons) are served from
Cloudflare's asset store, **not** from the Worker bundle, and do not count
toward this limit.

Re-check the number after any dependency change:

```bash
npm run build:cloudflare
npx wrangler deploy --dry-run
```

## 11. First deployment

Nothing below has been run yet — no Worker exists, and no deploy has happened.

```bash
# 0. one-off: authenticate the CLI with the clinic's Cloudflare account
npx wrangler login

# 1. make sure .env.local is filled in, then build and preview locally
npm run preview:cloudflare        # → http://localhost:8787, check AR + EN + /admin/login

# 2. confirm the bundle still fits the Free plan
npx wrangler deploy --dry-run     # gzip must stay under 3072 KiB

# 3. deploy
npm run deploy:cloudflare
```

Then, in order:

1. Note the `*.workers.dev` URL Cloudflare prints.
2. Add that host to **Firebase → Authentication → Authorized domains** (§5).
3. Set `NEXT_PUBLIC_SITE_URL` to it and **redeploy** (§4).
4. Open `/` (Arabic, RTL), `/en` (English, LTR), `/sitemap.xml`, `/robots.txt`.
5. Sign in at `/admin/login` with the real administrator account and confirm the
   dashboard loads.

### Deploying from GitHub instead

Cloudflare Workers Builds can build straight from the repository. Point it at
this repo with:

- build command `npm run build:cloudflare`
- deploy command `npx wrangler deploy`
- the `NEXT_PUBLIC_*` variables set as **build** variables (§4)

`.env.local` is git-ignored and must never be committed.

## 12. Verified locally on `workerd`

Everything below was run against `npx wrangler dev` — the real Workers runtime —
with the live `omega-care-2e243` Firestore project.

| Check | Result |
|---|---|
| `npm run typecheck` | clean |
| `npm run lint` | clean |
| `npm run build` | 56 pages, clean |
| `npm run build:cloudflare` | Worker built, no errors |
| Arabic homepage `/` | `200`, `dir="rtl"`, `lang="ar-EG"` |
| English homepage `/en` | `200`, `dir="ltr"`, `lang="en"` |
| All 14 public pages + both admin login pages | `200` |
| Dynamic routes (`/doctors/[slug]`, `/specialties/[slug]`, `/services/[slug]`) | `200` |
| Firestore read at runtime | live data on **every** request (the clinic's official Maps URL, lab phone `0452930999`), 0 errors in 6 consecutive requests |
| Firebase Auth from the browser | `POST identitytoolkit.googleapis.com/v1/accounts:signInWithPassword` issued, 0 page errors |
| Static assets `/brand/*`, `/icon.png` | `200` |
| Logos, lab logo and founder photo | all render through `/_next/image` |
| `sitemap.xml` | `200`, 24 `<loc>` entries |
| `robots.txt` | `200`, `Disallow: /admin` present |
| Layout at 1280 px and 390 px | no horizontal overflow, 0 console errors |
| `npm run seed:dry` | still works — `create 0 · skip 180`, 0 errors |
| `npm run seed:verify` | still passes 33/33 |

## 13. Things this setup deliberately does not do

- No `wrangler deploy` has been run.
- No secret, password, token or service-account key is in the repository.
- `firestore.rules` was not weakened, and `AdminGate` was not bypassed.
- The Firebase Admin SDK was not added.
- No patient data, appointment or admin record is stored in or cached by
  Cloudflare.
- Payment logic was untouched.
- No Cloudflare storage product (R2, KV, D1, Durable Objects) is required to
  run this Worker.
