# Engagement Workspace

A reusable consulting-engagement site: one repo, deployed once per client (own Firebase project, own Vercel project, own subdomain). First deployment: Fulton County Board of Health, `fcboh.dulinconsulting.app`.

The site is the **management and facilitation layer** for an engagement. It never holds PHI or client confidential documents; those stay in the client's environment. See `DEPLOY.md` for setup and the plan doc for the module roadmap.

## Stack

React 18 · Vite · Tailwind v4 · Firebase (Auth email-link, Firestore, Storage) · Vercel. No server code yet; Cloud Functions come with the AI drafting and export features.

## Layout

```
src/config/engagement.json   client, dates, phases, milestones, deliverables (edit per client)
src/lib/dates.js             pure timeline math (tested in tests/)
src/lib/firebase.js          init from VITE_FB_CONFIG; DEMO mode when unset
src/lib/auth.jsx             email-link + Google sign-in, invite-based roles
src/lib/data.js              Firestore or in-memory store; useCollection / save / remove
src/lib/engagement.js        config + settings override → computed dates
src/pages/                   Hub, StatusLog, Effort, Admin, SignIn, NoAccess
firestore.rules              role model: owner email is admin; others need invites/{email}
```

## Roles

| Role | Sees |
| --- | --- |
| admin | everything; edits milestones, deliverables, status, effort, invites |
| leader | hub, published status entries |
| participant, vendor | hub (session pages later) |

A person signs in with an emailed link. On first sign-in the client copies the role from `invites/{email}` into `users/{uid}`; the security rules verify the two match, so the client cannot grant itself a role.

## Commands

```zsh
npm run dev
npm test
npm run lint
npm run build
```

## Per-client deployment

1. Edit `src/config/engagement.json`.
2. New Firebase project; deploy `firestore.rules` and `storage.rules`.
3. New Vercel project from this repo with `VITE_FB_CONFIG` and `VITE_ADMIN_EMAIL` set.
4. Add the subdomain in Vercel and in Firebase Auth authorized domains.
