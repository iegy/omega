# Omega Care — عيادات أوميجا كير التخصصية

منصة ويب ثنائية اللغة (عربي / إنجليزي) لمجمع أوميجا كير الطبي في رشيد:
عيادات تخصصية، أطباء واستشاريون، خدمات تشخيصية وأجهزة طبية، تجميل وليزر،
معامل مودة عاطف، حجز إلكتروني، ولوحة إدارة كاملة.

> **حالة المشروع: المراحل 1 و 2 و 3 مكتملة.**
> المعمارية والواجهة واللغتان والمسارات والثيم جاهزة، ومعها الآن Firebase
> والنماذج المكتوبة بالأنواع وطبقة المستودعات ومصادقة الإدارة وقواعد الأمان.
> بيانات أوميجا كير الحقيقية جاهزة للإدخال عبر `npm run seed` (180 مستندًا).
> راجع [خطة المراحل](#execution-phases) و [إعداد Firebase](docs/firebase-setup.md)
> و [بيانات الـSeed](docs/seed-data.md).

---

## 1. Project overview

| | |
|---|---|
| Framework | Next.js 16 (App Router) + React 19 |
| Language | TypeScript (strict, no `any`) |
| Styling | Tailwind CSS v4 (`@theme` tokens) |
| i18n | `next-intl` — `ar` (default, RTL, no URL prefix) + `en` (LTR, `/en/…`) |
| Database | Cloud Firestore (Firebase Spark free plan), via the **Lite** SDK (`firebase/firestore/lite`) — the full SDK's persistent connection cannot survive across Cloudflare Worker requests |
| Hosting | Cloudflare Workers + `@opennextjs/cloudflare` |
| Auth | Firebase Authentication, **administrators only** — patients never sign in |
| Images | ImgBB API → URL stored in Firestore. **Firebase Storage is not used.** |
| Forms | React Hook Form + Zod |
| Icons / toasts | `lucide-react` / `sonner` |
| Timezone | `Africa/Cairo` · Currency `EGP` |

### Folder structure

```
src/
  app/
    [locale]/
      (site)/          public pages (header + footer + mobile action bar)
      admin/
        login/         bilingual admin sign-in (public route, noindex)
        (dashboard)/   guarded shell — AdminGate + sidebar + topbar
      layout.tsx       root layout: <html lang dir>, fonts, i18n provider
      not-found.tsx    localized 404
      error.tsx        localized error boundary
    global-error.tsx   last-resort boundary
    robots.ts          robots.txt
    sitemap.ts         sitemap.xml with hreflang alternates
    globals.css        design tokens + base layer
  components/
    admin/             AdminSidebar, AdminHeader, AdminPageShell
    layout/            SiteHeader, SiteFooter, MainNav, MobileMenu,
                       LanguageSwitcher, Logo, FloatingActions, PlaceholderPage
    seo/               JsonLd
    ui/                Button, Card, Badge, Section, PageHeader,
                       Skeleton/Empty/Error states, brand icons
  config/              constants, fonts, navigation, default-settings
  features/
    auth/              AdminAuthProvider, AdminGate, PermissionGate, login
    home/              homepage section registry + one file per section
  firebase/            app · firestore · auth · env · converters · normalizers
                       · collections  (no Firebase Storage anywhere)
  i18n/                routing, navigation helpers, request config
  lib/                 utils (cn), contact links, SEO, structured data,
                       errors (bilingual), deep-merge, imgbb config
  messages/            ar.json · en.json (single source of UI copy)
  services/            repositories: settings · doctors · catalog · lab
                       · appointments · founder · admins
  types/               common · site · doctor · catalog · lab · appointment
                       · founder · admin · i18n
  middleware.ts        locale routing — must keep the `middleware` filename so
                       Next compiles it to the edge runtime for Cloudflare
                       Workers (see docs/cloudflare-deployment.md §6)

scripts/seed/          seed CLI: data/ · plan · validate · apply · run
                       · verify-readback

firestore.rules        security rules (the real data boundary)
firestore.indexes.json composite indexes (currently none required)
firebase.json          Firestore config only — no Hosting assumption
docs/firebase-setup.md manual console steps + first admin
docs/seed-data.md      what the seed contains and how to run it
```

### Architecture rules

1. **No hardcoded business data in components.** Phone numbers, addresses,
   payment numbers, hero text, prices, doctors — all resolved through
   `src/services/*`. `src/config/default-settings.ts` holds *fallback/seed*
   values only, and is never imported by a component.
2. **Bilingual by construction.** UI copy lives in `src/messages/*.json` with
   TypeScript-checked keys; dynamic records carry `…Ar` / `…En` fields.
3. **Never invent content.** Missing prices/qualifications stay `null` and the
   element is hidden. Testimonials are disabled until real reviews exist.
4. **Honest placeholders.** Anything not yet connected renders the single
   `PendingData` component — grep for it to find every remaining stub.

---

## 2. Installation

```bash
git clone <your-repo-url> omega-care
cd omega-care
npm install
```

Requires **Node.js 20.9+** (Node 22 recommended).

## 3. Environment setup

```bash
cp .env.example .env.local
```

Then fill in `.env.local`:

```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000

NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

NEXT_PUBLIC_IMGBB_API_KEY=
```

`.env.local` is git-ignored. `NEXT_PUBLIC_SITE_URL` must be the real domain in
production, otherwise canonical URLs, hreflang and the sitemap will be wrong.

## 4. Firebase setup

1. Create a free (Spark) project at <https://console.firebase.google.com>.
2. Add a **Web app** and copy the config values into `.env.local`.
3. **Firestore Database** → create in production mode, region `eur3` /
   `europe-west`.
4. **Authentication** → enable *Email/Password* only.
5. Do **not** enable Storage — images go to ImgBB.
6. Publish the security rules: `firebase deploy --only firestore:rules`
   (or paste `firestore.rules` into Firestore → Rules → Publish).

Until the rules are published every read is denied. That is safe — the public
site falls back to its built-in defaults and keeps rendering — but nothing will
load from the database.

### Creating the first admin

**Full step-by-step instructions: [docs/firebase-setup.md](docs/firebase-setup.md).**

Short version: create the Auth user, copy its **UID**, then create the document
`admins/{UID}` with `role: "super_admin"` and `active: true`. A Firebase account
without such a document is denied access — signing in proves identity only.

Roles: `super_admin` / `admin` / `reception`.

| Role | Scope |
|---|---|
| `super_admin` | everything, plus clinic settings, admin accounts, backups |
| `admin` | doctors, specialties, services, offers, lab, founder, content, appointments |
| `reception` | appointments, patient details, payment verification, sample requests |

Never put an admin password in source code, `.env.local`, or the repository.

## 5. ImgBB key

Create a key at <https://api.imgbb.com/> and set `NEXT_PUBLIC_IMGBB_API_KEY`.
The key is intentionally client-visible (owner's decision). Uploads return a
display URL + delete URL; both are stored in Firestore, never base64.

## 6. Seed data

```bash
npm run seed:dry              # validate + report creates/skips, ZERO writes
npm run seed -- --confirm     # SAFE bootstrap: create missing, skip existing
npm run seed:verify           # read it back through the app repositories
```

Imports the clinic's confirmed data — 17 doctors with 41 schedules and 34 priced
items, 19 specialties, 9 service categories, 34 services, 6 laboratory units, the
founder profile, clinic settings, payment methods, social links and the 14
homepage sections: **180 documents**.

`npm run seed -- --confirm` is a **bootstrap**: it creates what is missing and
**skips what already exists**, so re-running after a partial seed fills only the
gaps and never overwrites anything entered from the Admin Dashboard. To make the
seed authoritative again use `--force-update` (destructive; prints a warning and
demands a typed `SYNC` confirmation).

It never runs automatically, signs in as a `super_admin` through the ordinary
security rules (no service-account key is added to the repo), uses deterministic
IDs, and never touches `admins/*`.

Full details, including every field deliberately left `null`:
**[docs/seed-data.md](docs/seed-data.md)**.

## 7. Development

```bash
npm run dev        # http://localhost:3000  (Arabic)  ·  /en (English)
npm run lint       # ESLint
npm run typecheck  # tsc --noEmit
npm run seed:dry   # validate the seed data without writing
```

`npm run dev` runs on Node. It does **not** prove the site works on Cloudflare —
use `npm run preview:cloudflare` for that.

## 8. Build

```bash
npm run build
npm run start
```

A phase is only considered done when `npm run build` finishes with **zero**
TypeScript and ESLint errors.

## 9. Deployment — Cloudflare Workers

The target host is **Cloudflare Workers** via the OpenNext adapter:
`GitHub → Cloudflare Workers → OpenNext → Next.js → Firestore + Auth + ImgBB`.
No R2, KV, Durable Object or queue is required, and no clinic or patient data is
stored in Cloudflare.

```bash
npm run build:cloudflare     # next build + OpenNext bundle
npm run preview:cloudflare   # run the real Worker locally (workerd) — do this first
npm run deploy:cloudflare    # upload to Cloudflare
```

Before the first deploy you must (a) add the deployed host to Firebase →
Authentication → Authorized domains, and (b) set `NEXT_PUBLIC_SITE_URL` to the
live origin and rebuild, because it is a build-time value.

Current Worker size: **1635 KiB gzipped of the 3072 KiB Free-plan limit.**

Public Firestore data is cached at the edge with Cloudflare's Cache API for
**30 minutes** (`PUBLIC_CACHE_TTL_SECONDS` in `src/services/public-cache.ts`) —
no R2, KV or Durable Object. A content change is saved instantly and visible in
the dashboard immediately, but can take up to 30 minutes to appear on the public
site.

Full instructions, the Cloudflare-specific constraints and everything that was
verified: **[docs/cloudflare-deployment.md](docs/cloudflare-deployment.md)**.

## 10. GitHub

```bash
git init                       # already initialised by create-next-app
git add .
git commit -m "Phase 1: architecture, i18n, routing, theme"
git branch -M main
git remote add origin https://github.com/<user>/<repo>.git
git push -u origin main
```

Never commit `.env.local`, `node_modules`, or `.next` (already in
`.gitignore`).

## 11. Backup & restore *(Phase 14)*

`/admin/backup` exports every collection to a single JSON file
(`omega-care-full-backup-YYYY-MM-DD.json`) containing a `metadata` block
(`app`, `backupVersion`, `schemaVersion`, `createdAt`) plus `collections`.
Only ImgBB **URLs** are included — never image binaries.

Restore validates metadata and schema version, shows a preview (record counts,
backup date) and supports **Merge** or **Replace**. Replace first snapshots the
current data, then requires typing `RESTORE` to confirm. Separate CSV/JSON
exports are available for doctors, appointments, services and offers.

---

## Execution phases

| Phase | Scope | Status |
|---|---|---|
| 1 | Architecture, Tailwind theme, i18n, routing, base layout | ✅ done |
| 2 | Firebase, typed models, repositories, admin auth, security rules | ✅ done |
| 3 | Seed data (doctors, specialties, services, lab, founder, settings) | ✅ done |
| 4 | Public homepage with live data | ⏳ next |
| 5 | Doctors + specialties pages, search, filters, doctors today | – |
| 6 | Service catalog, aesthetics, offers | – |
| 7 | Mawada Atef Lab + sample collection requests | – |
| 8 | Booking (slot + queue, Firestore transactions, capacity) | – |
| 9 | Payments (cash / wallet / InstaPay + verification) | – |
| 10 | Founder, about, contact, maps | – |
| 11 | Full admin dashboard | – |
| 12 | ImgBB upload system | – |
| 13 | Offers & discount management | – |
| 14 | Backup & restore, CSV/JSON export | – |
| 15 | Firestore security rules | – |
| 16 | SEO, performance, accessibility | – |
| 17 | Testing and build fixes | – |
| 18 | README, GitHub, production readiness | – |

## ما هو مطلوب من مالك المشروع

قبل بدء المرحلة 3 نحتاج خطوات يدوية في Firebase Console
(التفاصيل الكاملة في [docs/firebase-setup.md](docs/firebase-setup.md)):

1. تفعيل Email/Password في Authentication.
2. إنشاء المستخدم `admin@omega.com` بكلمة مرور من اختيارك (لا تُكتب في الكود).
3. نسخ الـUID وإنشاء مستند `admins/{UID}` مع `role = "super_admin"` و `active = true`.
4. نشر قواعد الأمان: `firebase deploy --only firestore:rules`.

وأشياء اختيارية تحسّن النتيجة:

- صورة Hero حقيقية للمجمع (بديلًا عن اللوجو).
- صور الأطباء.
- صور العروض.
- رابط Google Maps الرسمي للعيادة.
