// Writes the draft workspace amendment to out/.
import { mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import config from "../src/config/engagement.json" with { type: "json" };
import { buildAddendum, addendumToBuffer, addendumFileName } from "../src/lib/addendum.js";

// Usage: npm run addendum [siteUrl] [keyPersonnel.json]
// keyPersonnel.json: { name, credentials, role, qualifications }. On the site
// this comes from settings/keyPersonnel instead, so it stays out of the repo.
const siteUrl = process.argv[2] || "https://fcboh.dulinconsulting.app";
const kpPath = process.argv[3];
const keyPersonnel = kpPath && existsSync(kpPath) ? JSON.parse(readFileSync(kpPath, "utf8")) : null;
mkdirSync("out", { recursive: true });
const file = `out/${addendumFileName(config, keyPersonnel)}`;
writeFileSync(file, await addendumToBuffer(buildAddendum({ config, siteUrl, keyPersonnel })));
console.log(file);
