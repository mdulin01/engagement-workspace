# engagement-workspace

Mike's cross-project notes are in his vault at `~/Dropbox (Personal)/Vault`. When asked about priorities, status across projects, or what Mike decided, read `01-Week/` (newest note) and this project's `NOW.md` there (`10-Folio/` for mikeshealth, `40-Rentals/` for rainbow-rentals and dulinproperties, `20-FCBOH/` for engagement-workspace, `50-Finances/` for mikes-money). Never copy anything from `05-Health/` into this repo, an issue, or a PR.

Start with `HANDOFF.md` (project state, rules, conventions), then `README.md` and `DEPLOY.md`.

Non-negotiables:
- No PHI or FCBOH-confidential content in this repo, in Firestore, or in Storage (proposal §9.2). Demos use public or synthetic data only and keep their DEMO labels.
- Never ask Mike to paste secrets; configuration lives in Vercel env vars (`VITE_FB_CONFIG`).
- Mike's shell is zsh; no trailing `#` comments in commands you give him.
- Run `npm test` and `npm run lint` before committing. Build on macOS or Vercel, not in a Linux VM with the existing `node_modules`.
