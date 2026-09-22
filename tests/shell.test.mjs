import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import config from "../src/config/engagement.json" with { type: "json" };
import shells from "../src/config/shells.json" with { type: "json" };
import { buildShell, shellToBuffer, shellFileName } from "../src/lib/shell.js";
import { deliverableDueDate } from "../src/lib/dates.js";

test("every deliverable has an outline", () => {
  for (const d of config.deliverables) {
    assert.ok(shells[d.number]?.sections?.length > 0, `missing outline for D${d.number}`);
  }
});

test("shells build as valid .docx with the outline headings", async () => {
  const dir = mkdtempSync(join(tmpdir(), "shells-"));
  for (const d of config.deliverables) {
    const deliverable = { ...d, dueDate: deliverableDueDate(config.effectiveDate, d.due, config.termMonths) };
    const buf = await shellToBuffer(buildShell({ config, deliverable, outline: shells[d.number] }));
    assert.equal(buf.subarray(0, 2).toString(), "PK", "docx is a zip");
    const file = join(dir, shellFileName(config, d));
    writeFileSync(file, buf);
    const xml = execFileSync("unzip", ["-p", file, "word/document.xml"]).toString();
    assert.ok(xml.includes(d.name.replace(/&/g, "&amp;")), `title in D${d.number}`);
    for (const s of shells[d.number].sections) assert.ok(xml.includes(s.heading), `D${d.number} heading ${s.heading}`);
  }
});

test("file names are safe", () => {
  assert.equal(shellFileName(config, config.deliverables[1]), "FCBOH-D2-EMR-Data-Access-Assessment-v0.1.docx");
  assert.equal(shellFileName(config, config.deliverables[4]), "FCBOH-D5-Data-Strategy-Governance-Framework-and-Roadmap-v0.1.docx");
});
