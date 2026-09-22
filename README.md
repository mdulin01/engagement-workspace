# Engagement Workspace

A reusable consulting-engagement site: one repo, deployed once per client (own Firebase project, own Vercel project, own subdomain). First deployment: Fulton County Board of Health, `fcboh.dulinconsulting.app`.

The site is the **management and facilitation layer** for an engagement. It never holds PHI or client confidential documents; those stay in the client's environment. See `DEPLOY.md` for setup and the plan doc for the module roadmap.

## Stack

React 18 · Vite · Tailwind v4 · Firebase (Auth email-link, Firestore, Storage) · Vercel. No server code yet; Cloud Functions come with the AI drafting and export features.

## Layout

```
src/config/engagement.json   client, dates, phases, milestones, deliverables (edit per client)
src/config/presentations.json  milestone deck structure (prompts only; repo is public)
src/config/shells.json       deliverable shell outlines
src/lib/dates.js             pure timeline math (tested in tests/)
src/lib/firebase.js          init from VITE_FB_CONFIG; DEMO mode when unset
src/lib/auth.jsx             email-link + Google sign-in, invite-based roles
src/lib/data.js              Firestore or in-memory store; useCollection / save / remove
src/lib/engagement.js        config + settings override → computed dates
src/lib/interviews.js        interview tracker: notes-link check, leader summary (tested)
src/lib/shell.js             deliverable shell .docx builder (tested)
src/pages/                   Hub, StatusLog, Interviews, Present, Effort, Admin, SignIn, NoAccess
firestore.rules              role model: owner email is admin; others need invites/{email}
```

## Roles

| Role | Sees |
| --- | --- |
| admin | everything; edits milestones, deliverables, status, interviews, effort, invites |
| leader | hub, published status entries, interview counts (no names, links or notes) |
| participant, vendor | hub (session pages later) |

A person signs in with an emailed link. On first sign-in the client copies the role from `invites/{email}` into `users/{uid}`; the security rules verify the two match, so the client cannot grant itself a role.

## Interview tracker

`/interviews`. Admin tracks each interview (name, role, stakeholder group, guide, scheduling state, notes link, theme tags) and edits the guides and theme list. Groups, targets and starter guides/themes are in `engagement.json` under `interviews`.

- **Notes are never stored here.** The rules allow a fixed set of fields with no free-text body, and `notesUrl` must be an `https://<tenant>.sharepoint.com/...` link (the host is in `firestore.rules` and in `interviews.notesLink`; change both for a client that uses a different system).
- **Leaders see counts only.** They cannot read `interviews`. The admin page writes `interviewSummary/current` (counts by status and group, theme counts across completed interviews) whenever the tracker changes, and leaders read only that doc. Themes are never broken out by group, so a one-person group cannot be tied to what was said.

## Milestone decks and deliverable shells

- **Decks.** Admin sees **▶ Present** next to each milestone on the hub. It opens a full-screen 16:9 deck at `/present/<milestoneId>`. Use the arrow keys, space or a click to move; press F for full screen; Print / PDF gives one page per slide; `#n` in the URL links to slide n. Live slides (deliverables, phases, milestones, interview counts, themes, what's next) read the same data as the hub. Text slides have **Edit slide**. The edits are saved to `presentations/{deckId}` in Firestore (admin only), not to the repo.
- **Shells.** **⤓ Shell** next to each deliverable downloads a Word document: cover page, document control, approval table, contents, and the section outline from `shells.json` with guidance in brackets. Due dates use the current effective date. `npm run shells` writes all eight to `out/shells/`. Fill them in and store them in the client's SharePoint, not on this site.
- **This repo is public.** Keep findings, names and client specifics out of `presentations.json` and `shells.json`.

## Commands

```zsh
npm run dev
npm test
npm run test:rules   # Firestore rules against the emulator; needs Java (brew install openjdk)
npm run shells       # all deliverable shells to out/shells/
npm run lint
npm run build
```

## Per-client deployment

1. Edit `src/config/engagement.json`.
2. New Firebase project; deploy `firestore.rules` and `storage.rules`.
3. New Vercel project from this repo with `VITE_FB_CONFIG` and `VITE_ADMIN_EMAIL` set.
4. Add the subdomain in Vercel and in Firebase Auth authorized domains.
