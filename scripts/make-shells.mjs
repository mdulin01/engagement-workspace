// Writes every deliverable shell to out/shells/ (gitignored), using the
// effective date in engagement.json. The hub's "Shell" button does the same
// per deliverable, using the effective date set in Admin.
import { mkdirSync, writeFileSync } from "node:fs";
import config from "../src/config/engagement.json" with { type: "json" };
import shells from "../src/config/shells.json" with { type: "json" };
import { buildShell, shellToBuffer, shellFileName } from "../src/lib/shell.js";
import { deliverableDueDate } from "../src/lib/dates.js";

const dir = "out/shells";
mkdirSync(dir, { recursive: true });
for (const d of config.deliverables) {
  const deliverable = { ...d, dueDate: deliverableDueDate(config.effectiveDate, d.due, config.termMonths) };
  const file = `${dir}/${shellFileName(config, d)}`;
  writeFileSync(file, await shellToBuffer(buildShell({ config, deliverable, outline: shells[d.number] })));
  console.log(file);
}
