import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeNotesUrl, summarize, sameSummary, surveyBaseline, prepFlags, surveyToken } from "../src/lib/interviews.js";
import survey from "../src/config/survey.json" with { type: "json" };

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

const resp = (access, trust, hours) => ({ ratings: { access, trust }, ai: { aiInterest: 4 }, hours: { entry: hours, reconcile: 0, reports: 2 }, text: { fixOne: "private words" } });

test("survey averages are withheld below the minimum", () => {
  assert.deepEqual(surveyBaseline([resp(1, 2, 5), resp(3, 4, 5)], survey), { n: 2 });
});

test("survey averages skip don't-know and carry no free text", () => {
  const b = surveyBaseline([resp(1, 0, 5), resp(3, 4, 10), resp(5, 5, 0)], survey);
  assert.equal(b.n, 3);
  assert.equal(b.domains.find((d) => d.id === "access").mean, 3);
  assert.equal(b.domains.find((d) => d.id === "trust").mean, 4.5);
  assert.equal(b.domains.find((d) => d.id === "tools").mean, null);
  assert.equal(b.hoursPerWeek, 7); // (7 + 12 + 2) / 3
  assert.ok(!JSON.stringify(b).includes("private words"));
});

test("summary includes the survey baseline", () => {
  const s = summarize(rows, themes, groups, [resp(2, 2, 1)], survey);
  assert.deepEqual(s.survey, { n: 1 });
});

test("prep flags low ratings and heavy hours", () => {
  const f = prepFlags(resp(1, 3, 12), survey);
  assert.deepEqual(f.low.map((d) => d.id), ["access"]);
  assert.equal(f.hours, 14);
  assert.equal(f.heavy, true);
});

test("survey tokens are long and url-safe", () => {
  const t = surveyToken();
  assert.match(t, /^[A-Za-z0-9_-]{22}$/);
  assert.notEqual(t, surveyToken());
});
