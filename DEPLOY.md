# Deploy runbook — fcboh.dulinconsulting.app

These steps need your Google account, payment, and DNS, so they are yours. Budget ~30 minutes. Do them in order; each later step needs a value from an earlier one.

## 1. Register the domain (dulinconsulting.app)

`.app` is on the HSTS preload list, so HTTPS is mandatory. Vercel provides that automatically.

1. Cloudflare → Domain Registration → Register Domains → search `dulinconsulting.app` → check out (registry cost, roughly $15/yr). Porkbun or Namecheap also work.
2. Leave DNS alone for now; Vercel gives you the record in step 5.

## 2. Create the Firebase project

1. console.firebase.google.com → **Add project** → name `fcboh-workspace` (note the real Project ID if Firebase appends a suffix).
2. **Build → Authentication → Get started**. Enable two sign-in methods:
   - **Email/Password** → turn on **Email link (passwordless sign-in)**. This is how FCBOH leaders get in.
   - **Google** (your own sign-in shortcut; set your email as support email).
3. **Authentication → Settings → Authorized domains** → add `fcboh.dulinconsulting.app` and, until DNS is done, the `*.vercel.app` URL Vercel gives you in step 4.
4. **Build → Firestore Database → Create database** → Production mode → region `nam5` (US).
5. **Build → Storage → Get started** → Production mode (denied by rules until the document library exists).
6. **Project settings (gear) → Your apps → Web (`</>`)** → register `fcboh-workspace` → copy the `firebaseConfig` object. You will paste it as one line of JSON into Vercel in step 4. Do not commit it to the repo.
7. Upgrade to the **Blaze** plan (pay as you go; expected cost is a few dollars a month). Required later for Cloud Functions (AI calls, export bundle).

Deploy the security rules from your machine:

```zsh
cd ~/Documents/engagement-workspace
npm install
npm install -g firebase-tools
firebase login
sed -i '' 's/REPLACE_WITH_FIREBASE_PROJECT_ID/YOUR_PROJECT_ID/' .firebaserc
firebase deploy --only firestore:rules,storage
```

`firestore.rules` hard-codes `mdulin@gmail.com` as the always-admin address. If you sign in with a different Google account, change `ownerEmail()` in the rules and `VITE_ADMIN_EMAIL` in Vercel to match.

## 3. Clone the repo

```zsh
cd ~/Documents
git clone git@github.com:mdulin01/engagement-workspace.git
cd engagement-workspace
npm install
npm run dev
```

With no `.env.local` the app runs in **DEMO** mode (in-memory sample data, no sign-in) so you can see it immediately. To run against Firebase locally, copy `.env.example` to `.env.local` and set `VITE_FB_CONFIG` to the JSON from step 2.6.

## 4. Deploy on Vercel

1. vercel.com → **Add New → Project** → import `mdulin01/engagement-workspace`. Framework preset: Vite. Build settings come from `vercel.json`.
2. **Environment Variables** (Production and Preview):
   - `VITE_FB_CONFIG` = the `firebaseConfig` object from step 2.6 as a single line of JSON, e.g. `{"apiKey":"...","authDomain":"...","projectId":"...","storageBucket":"...","messagingSenderId":"...","appId":"..."}`
   - `VITE_ADMIN_EMAIL` = `mdulin@gmail.com`
3. Deploy. Open the `*.vercel.app` URL, sign in with Google, confirm you land on the hub as `admin`.
4. Vercel **Hobby** is for non-commercial use. This is client work, so use **Pro** ($20/mo) or move hosting to Firebase Hosting (free) later.

## 5. Point the subdomain at Vercel

1. Vercel → Project → **Settings → Domains** → add `fcboh.dulinconsulting.app`.
2. Vercel shows a CNAME (`cname.vercel-dns.com`). Add it at Cloudflare → DNS → Records, **proxy off (grey cloud)**, so Vercel can issue the certificate.
3. When it verifies, go back to Firebase Authentication → Authorized domains and confirm `fcboh.dulinconsulting.app` is listed (step 2.3).

## 6. First use

1. **Admin → Engagement settings**: set the Effective Date once the agreement is executed. Every week number, milestone and due date derives from it.
2. **Admin → Invite access**: add Dr. Hrapcak and Dr. Plescia as `leader` only after FCBOH confirms staff may sign in to an external site (see the plan's open items).
3. **Effort**: log hours from day one. The monthly table is the invoice.
4. **Status**: one entry per biweekly check-in; tick "Visible to leaders" for anything they should see.
5. **Interviews**: click **Load starters** once, then adjust the guides and themes. Keep the notes in SharePoint and paste the link. If FCBOH's tenant is known, narrow the `notesUrl` pattern in `firestore.rules` from any `*.sharepoint.com` to that tenant and redeploy the rules.

## What is not built yet (in order of need)

Session page template → document library (Storage rules) → capability maturity instrument → leader spaces → Cloud Functions for AI drafts and the export bundle → architecture workbench. See the plan doc for the phase each one is due.
