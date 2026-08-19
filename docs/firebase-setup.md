# Firebase setup — Omega Care

Project: **omega-care-2e243** · Plan: **Spark (free)** · Firebase Storage: **not used**

Everything below is done once, by hand, in the Firebase console. No password ever
goes into the repository, the environment files, or any source file.

---

## 1. Enable Email/Password sign-in

1. Open <https://console.firebase.google.com/project/omega-care-2e243/authentication/providers>
2. If Authentication has never been used: click **Get started**.
3. In **Sign-in method**, open **Email/Password**.
4. Turn **Enable** on. Leave **Email link (passwordless sign-in)** off.
5. Save.

> Only administrators authenticate. Patients and visitors never get accounts, so
> no other provider needs to be enabled.

## 2. Create the first administrator account

1. Go to **Authentication → Users**.
2. Click **Add user**.
3. Email: `admin@omega.com`
4. Password: choose a strong password yourself and store it in your password
   manager. **Do not** send it to anyone and do not put it in `.env.local`.
5. Click **Add user**.

## 3. Copy the UID

In the users table, the new row has a **User UID** column (a 28-character string
such as `Xk7pQ2mR...`). Click the ⋮ menu → **Copy UID**, or select the text.

You need this exact value for the next step — it becomes the document ID.

## 4. Create the authorised admin record

The app treats a Firebase sign-in as *identity only*. Authorisation comes from a
document whose **ID is the UID**.

1. Go to **Firestore Database**. If the database does not exist yet:
   **Create database** → **Start in production mode** → location
   `eur3 (europe-west)` → Enable.
2. Click **Start collection**, Collection ID: `admins` → Next.
3. **Document ID: paste the UID from step 3.** Do not use "Auto-ID".
4. Add these fields:

   | Field | Type | Value |
   |---|---|---|
   | `uid` | string | *the same UID* |
   | `email` | string | `admin@omega.com` |
   | `displayName` | string | e.g. `Omega Care Admin` (optional) |
   | `role` | string | `super_admin` |
   | `active` | boolean | `true` |
   | `createdAt` | timestamp | now |
   | `updatedAt` | timestamp | now |

5. Save.

`role` must be exactly one of `super_admin`, `admin`, `reception`.
`active` must be the boolean `true`, not the string `"true"`.

## 5. Publish the security rules

The repository contains the rules; Firestore still runs whatever was last
published. Until you publish, every read is denied — the public site keeps
working from its built-in fallback, but nothing will load from the database.

### Option A — Firebase CLI (recommended)

```bash
npm install -g firebase-tools
firebase login
firebase use omega-care-2e243        # .firebaserc already points here
firebase deploy --only firestore:rules
```

`firebase.json` intentionally configures **only** Firestore — no Hosting — so the
app can be deployed to Vercel or any Node host.

### Option B — console copy/paste

1. **Firestore Database → Rules**.
2. Replace the whole editor contents with the contents of `firestore.rules`.
3. **Publish**.

### Indexes

`firestore.indexes.json` is intentionally empty: no composite index is required
by the current queries (equality filters only, ordering done in memory). Deploy
it with `firebase deploy --only firestore:indexes` when Phase 8/11 add indexed
appointment queries.

## 6. Verify

1. `npm run dev`
2. Open <http://localhost:3000/admin> → you are redirected to `/admin/login`.
3. Sign in with `admin@omega.com` and your password.
4. Expected: the dashboard opens and the overview card shows your email with the
   **مسؤول عام / Super admin** badge.

Troubleshooting:

| What you see | Meaning |
|---|---|
| «غير مصرح بالدخول» / "Access denied" | Sign-in worked, but `admins/{UID}` does not exist — check the document ID matches the UID exactly. |
| «الحساب موقوف» / "Account suspended" | The document exists but `active` is not boolean `true`. |
| «تعذّر التحقق من الصلاحيات» / "Could not verify your permissions" | The rules have not been published yet, or there is no connection. |
| «البريد الإلكتروني أو كلمة المرور غير صحيحة» | Wrong credentials. |

## 7. Adding more administrators later

Repeat steps 2–4 with `role` set to `admin` or `reception`. Only a `super_admin`
can create, disable or re-role an administrator — the rules block anyone else,
including an administrator editing their own record.

| Role | Scope |
|---|---|
| `super_admin` | everything, plus clinic settings, admin accounts and backups |
| `admin` | doctors, specialties, services, offers, lab, founder, site content, appointments |
| `reception` | appointments, patient booking details, payment verification, sample collection requests |
