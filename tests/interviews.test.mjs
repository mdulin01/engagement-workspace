import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeNotesUrl, summarize, sameSummary } from "../src/lib/interviews.js";

const SP = ".sharepoint.com";

test("notes links must be https SharePoint", () => {
  assert.equal(normalizeNotesUrl("", SP), "");
  assert.equal(normalizeNotesUrl("  ", SP), "");
  assert.equal(normalizeNotesUrl("https://FultonCounty.sharepoint.com/:w:/s/DPH/abc", SP), "https://fultoncounty.sharepoint.com/:w:/s/DPH/abc");
  assert.equal(normalizeNotesUrl("https://fulton-my.sharepoint.com/personal/x", SP), "https://fulton-my.sharepoint.com/personal/x");
  assert.equal(normalizeNotesUrl("http://fulton.sharepoint.com/x", SP), null);
  assert.equal(normalizeNotesUrl("https://sharepoint.com/x", SP), null);
  assert.equal(normalizeNotesUrl("https://evil.com/.sharepoint.com", SP), null);
  assert.equal(normalizeNotesUrl("https://a.b.sharepoint.com/x", SP), null);
  assert.equal(normalizeNotesUrl("Dr. Smith said the EMR is slow", SP), null);
});

const groups = [{ id: "exec", name: "Exec", target: 2 }, { id: "it", name: "IT", target: 1 }];
const themes = [{ id: "t1", label: "Data quality" }, { id: "t2", label: "Workforce" }, { id: "t3", label: "Unused" }];
const rows = [
  { id: "a", group: "exec", status: "completed", themes: ["t1", "t2"], name: "Secret Name", notesUrl: "https://x.sharepoint.com/a" },
  { id: "b", group: "exec", status: "scheduled", themes: ["t2"] },
  { id: "c", group: "it", status: "completed", themes: ["t1"] },
  { id: "d", group: "it", status: "declined" },
];

test("summary counts by status, group and theme", () => {
  const s = summarize(rows, themes, groups);
  assert.equal(s.target, 3);
  assert.equal(s.active, 3);
  assert.deepEqual(s.byStatus, { identified: 0, invited: 0, scheduled: 1, completed: 2, declined: 1 });
  assert.deepEqual(s.byGroup, [
    { id: "exec", name: "Exec", target: 2, scheduled: 1, completed: 1 },
    { id: "it", name: "IT", target: 1, scheduled: 0, completed: 1 },
  ]);
  // only completed interviews count; zero-count themes are dropped
  assert.deepEqual(s.themes, [{ label: "Data quality", count: 2 }, { label: "Workforce", count: 1 }]);
});

test("summary carries no identifying fields", () => {
  const text = JSON.stringify(summarize(rows, themes, groups));
  assert.ok(!text.includes("Secret Name"));
  assert.ok(!text.includes("sharepoint"));
});

test("sameSummary ignores key order and server fields", () => {
  const s = summarize(rows, themes, groups);
  const reordered = { ...s, byStatus: Object.fromEntries(Object.entries(s.byStatus).reverse()), updatedAt: 123, id: "current" };
  assert.ok(sameSummary(s, reordered));
  assert.ok(!sameSummary(s, summarize(rows.slice(1), themes, groups)));
  assert.ok(!sameSummary(s, undefined));
});
