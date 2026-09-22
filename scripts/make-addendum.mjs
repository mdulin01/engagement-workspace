// Writes the draft workspace amendment to out/.
import { mkdirSync, writeFileSync } from "node:fs";
import config from "../src/config/engagement.json" with { type: "json" };
import { buildAddendum, addendumToBuffer, addendumFileName } from "../src/lib/addendum.js";

const siteUrl = process.argv[2] || "https://fcboh.dulinconsulting.app";
mkdirSync("out", { recursive: true });
const file = `out/${addendumFileName(config)}`;
writeFileSync(file, await addendumToBuffer(buildAddendum({ config, siteUrl })));
console.log(file);
