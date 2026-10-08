# engagement-workspace

Start with `HANDOFF.md` (project state, rules, conventions), then `README.md` and `DEPLOY.md`.

Non-negotiables:
- No PHI or FCBOH-confidential content in this repo, in Firestore, or in Storage (proposal §9.2). Demos use public or synthetic data only and keep their DEMO labels.
- Never ask Mike to paste secrets; configuration lives in Vercel env vars (`VITE_FB_CONFIG`).
- Mike's shell is zsh; no trailing `#` comments in commands you give him.
- Run `npm test` and `npm run lint` before committing. Build on macOS or Vercel, not in a Linux VM with the existing `node_modules`.
