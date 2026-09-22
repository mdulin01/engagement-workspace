import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import config from "../src/config/engagement.json" with { type: "json" };
import { buildAddendum, addendumToBuffer } from "../src/lib/addendum.js";

test("addendum builds and names the site, parties and key terms", async () => {
  const buf = await addendumToBuffer(buildAddendum({ config, siteUrl: "https://fcboh.dulinconsulting.app/" }));
  const file = join(mkdtempSync(join(tmpdir(), "amend-")), "a.docx");
  writeFileSync(file, buf);
  const xml = execFileSync("unzip", ["-p", file, "word/document.xml"]).toString();
  for (const s of ["https://fcboh.dulinconsulting.app", config.client, "Section 9.2", "two (2) business days", "at least three (3)", "thirty (30) days", "Georgia Open Records Act"]) {
    assert.ok(xml.includes(s), `missing: ${s}`);
  }
  assert.ok(!xml.includes("undefined"));
  assert.ok(!xml.includes("dulinconsulting.app//"));
});
