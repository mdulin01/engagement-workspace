import { test } from "node:test";
import assert from "node:assert/strict";
import { validateSeed, applySeed } from "../src/lib/seeds.js";
import engagement from "../src/config/engagement.json" with { type: "json" };
import seedsConfig from "../src/config/seeds.json" with { type: "json" };
const SEEDS = seedsConfig.seeds;

const groups = engagement.interviews.groups.map((g) => g.id);
const guideIds = engagement.interviews.starterGuides.map((g) => g.id);

test("every configured seed validates against the rules allow-lists", () => {
  assert.ok(SEEDS.length > 0);
  for (const seed of SEEDS) {
    assert.deepEqual(validateSeed(seed, { groups, guideIds }), [], `seed ${seed.id}`);
  }
});

test("validateSeed rejects disallowed collections, fields and notes links", () => {
  const bad = { id: "x", docs: [
    { collection: "users", id: "u1", fields: { role: "admin" } },
    { collection: "interviews", id: "i1", fields: { name: "A", group: "exec", status: "identified", themes: [], notesUrl: "https://x.sharepoint.com/n", secret: 1 } },
    { collection: "documents", id: "d1", fields: { title: "T", category: "Other", url: "http://insecure", visibility: "leaders" } },
  ] };
  const errs = validateSeed(bad, { groups, guideIds });
  assert.ok(errs.some((e) => e.includes("collection not allowed")));
  assert.ok(errs.some((e) => e.includes('field "secret" not allowed')));
  assert.ok(errs.some((e) => e.includes("never carry notes links")));
  assert.ok(errs.some((e) => e.includes("must be https")));
});

test("duplicate ids within a seed are caught", () => {
  const errs = validateSeed({ id: "dup", docs: [
    { collection: "interviewThemes", id: "t", fields: { label: "A" } },
    { collection: "interviewThemes", id: "t", fields: { label: "B" } },
  ] });
  assert.ok(errs.some((e) => e.includes("duplicate")));
});

test("applySeed writes every doc then the settings marker", async () => {
  const writes = [];
  const seed = { id: "s1", docs: [{ collection: "interviewThemes", id: "t1", fields: { label: "A" } }] };
  await applySeed(seed, {}, async (c, id, f) => writes.push([c, id, f]), "2026-10-08");
  assert.deepEqual(writes, [["interviewThemes", "t1", { label: "A" }], ["settings", "seeds", { s1: "2026-10-08" }]]);
});
