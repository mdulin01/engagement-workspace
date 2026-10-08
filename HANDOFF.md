# Handoff: FCBOH engagement workspace

Written 2026-10-08 for Claude Code. Read this first, then `README.md` and `DEPLOY.md`.

## What this is

Mike Dulin's consulting workspace for the Fulton County Board of Health (FCBOH, Atlanta) data-modernization engagement: 6 months, $60k, sponsor Dr. Marcus Plescia (health director), day-to-day Dr. Susan Hrapcak. Deliverables: D1 current-state assessment, D2 EMR data-access assessment, D3 AI opportunity assessment, D5 governance framework + target architecture + roadmap, D6 clinical operations measurement plan, D7 CHA/PHAB accreditation readiness. Milestones from the Effective Date (`src/lib/dates.js`): kickoff wk 2, interim wk 6, Day 90 wk 13, draft strategy wk 18, transition wk 26.

Site: `fcboh.dulinconsulting.app` (Vercel Pro, project on Mike's team). Repo: `github.com/mdulin01/engagement-workspace`.

## Hard rules (from the signed proposal)

- §9.2: no PHI and no client-confidential material on this site or any personal cloud. Client data stays in FCBOH's environment. This site holds only engagement management (schedule, surveys, interview tracker, decks, deliverable shells, demos on public or synthetic data).
- §9.3: deliverables are client property and subject to Georgia Open Records. Write everything as if it will be public.
- §4 key personnel: Mike is accountable for every deliverable. Rashaud Senior (proposed for D3) joins only after FCBOH written consent; request sent Sep 28, 2026, no reply as of Oct 7. Do not describe him as on the team.
- §10.2: the engagement excludes implementation and dashboard construction. Demos are illustrations, labeled "DEMO", never FCBOH products.
- Jonathan Ong (Mecklenburg County Public Health) is a peer advisor with no contract role; proposed lunch-and-learn in December.

## Stack and conventions

- React 18 + Vite + Tailwind v4 (`@tailwindcss/vite`), React Router 6, Firebase (Auth: email-link + Google; Firestore; Storage), Vercel SPA rewrite (`vercel.json`). Static files in `public/` are served before the rewrite.
- Firebase config comes from `VITE_FB_CONFIG` (JSON). Unset = DEMO mode with an in-memory store. Never ask Mike to paste secret values; point him at the Vercel env settings.
- Roles: admin / team / leader / participant / vendor via `invites/{email}` → `users/{uid}`. `mdulin@gmail.com` is hard-coded admin in `firestore.rules`.
- Design tokens (`src/styles.css`, `Layout.jsx`): `--brand #14283a`, `--brand-2 #1f3b52`, `--accent #0f766e`, `--accent-soft #e3f1ee`, `--gold #b7791f`, `--paper #f6f4ef`, `--line #e4ded3`. Font: Geist.
- Pages: Hub, Interviews, Survey, Documents, Present, Effort, StatusLog, Admin, SignIn. Nav in `src/components/Layout.jsx`; the `Demos` link shows for `isLeader`.
- Tests: `npm test` (node --test), `npm run test:rules` (Firestore emulator), `npm run lint`.
- Mike's shell is zsh. Give him commands without trailing `#` comments.

## Demos (`public/demos/`, plain HTML, no build step)

| Path | What | Data |
|---|---|---|
| `demos/index.html` | Landing with three cards | — |
| `demos/clinical/` | Clinical Services Dashboard: Access, Quality (incl. time-to-action block for STI/HIV/TB), Program outcomes, Client experience; "FCBOH AI" assistant bar with scripted answers | Synthetic, deterministic LCG seed 20261008. Real FCBOH site and service-line names only. |
| `demos/hiv/` | CHAMPS-style Diagnose / Treat / Prevent / Respond for Fulton | Real: `demos/data/ahead_fulton*.json` (AHEAD API, areaId 1031), `aidsvu_fulton.json`, `gadph_hiv_fulton.json` (transcribed from GA DPH PDFs) |
| `demos/neighborhoods/` | Leaflet choropleth, 326 tracts, 18 PLACES measures + life expectancy, 8 FCBOH center markers (approximate coords) | Real: CDC PLACES 2025 (Socrata `cwsq-ngmh`, countyfips 13121), NCHS USALEEP, Census TIGERweb |

Chart.js 4.4.1 and Leaflet 1.9.4 load from cdnjs. Keep the yellow "DEMO" pill and the footer disclaimer on every demo page. The clinical demo's AI bar is scripted (`renderAI` / `askAI`); do not wire it to a live model without an FCBOH AI policy in place (D3).

## Deck source (`tools/deck/`)

`build.js` generates `FCBOH_Data_Modernization_Endpoint.pptx` with pptxgenjs; `animate.py` injects click-build animations by shape-name prefix (`L1_`…`L5_` builds the endpoint diagram layer by layer; `H1_`…`H5_` highlights one part at a time) and a fade transition on every slide. Pipeline:

```
cd tools/deck
NODE_PATH=$(npm root -g) node build.js
rm -rf un && mkdir un && cd un && unzip -q ../FCBOH_Data_Modernization_Endpoint.pptx && cd ..
python3 animate.py un
cd un && zip -q -r -X ../final.pptx '[Content_Types].xml' _rels docProps ppt && cd ..
```

Needs global `pptxgenjs`, `react`, `react-dom`, `react-icons`, `sharp`. Images used: `mike.jpg`, `rashaud.png` (Avance Care provider page), `jonathan.png` (LinkedIn), `clinical.jpg`, `hiv.jpg`, `neighborhoods.jpg`. Current deck: 14 slides; slide 14 is sources with live links. Shape names must stay unique per slide or `animate.py` asserts.

## Related documents (Claude Docs, not in repo)

- FCBOH Engagement Workspace Plan: https://claude.ai/code/artifact/b07c9b00-16f5-495e-afbe-a8bfafea67ab
- FCBOH Data Modernization Endpoint (the source for the deck): https://claude.ai/code/artifact/d71970fe-79b7-4156-8e58-e6fe8317bd2e

## State as of 2026-10-08

- Commits `90c6af3` (demos) and `124eaff` (clinical demo AI bar + timeliness) are local on Mike's Mac and **not pushed**. First action: `git push`, then confirm the Vercel deploy serves `/demos/`.
- `.git/stale-locks/` holds lock files moved aside by a sandboxed git; safe to delete.
- `npm run build` fails inside the Cowork Linux VM (`@rollup/rollup-linux-arm64-gnu` missing) because `node_modules` is a macOS install. Build on the Mac or on Vercel.
- Kickoff meeting with FCBOH leadership: Thursday Oct 8, 2026, 9:00 a.m., 10 Park Place South SE, Atlanta, 4th floor.
- Open items: Rashaud consent (Marcus/Susan); Jonathan session date and whether FCBOH covers his travel; find the Mecklenburg CRC SDOH dashboard link (likely shared to Mike's UNC Charlotte ArcGIS account, not in Gmail).

## Next build ideas (not started)

1. Present page: embed the deck PDF and link the three demos.
2. Interview tracker: add the leadership roster from the Oct 8 meeting (Plescia, Hrapcak, Easom, Goddard, Ferdinand, Jumpp, Pare-Alanda, Bishop, Lafua).
3. Clinical demo: a site-level drill-down when a health center is selected (currently scales totals only).
4. Status log entries for Day 90 package drafting.
