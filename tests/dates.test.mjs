import { test } from "node:test";
import assert from "node:assert/strict";
import {
  weekNumber, weekStart, dayN, milestoneDate, deliverableDueDate, termMonths, addMonths, daysBetween,
} from "../src/lib/dates.js";

const E = "2026-10-01";

test("week 1 starts on the effective date", () => {
  assert.equal(weekNumber(E, "2026-10-01"), 1);
  assert.equal(weekNumber(E, "2026-10-07"), 1);
  assert.equal(weekNumber(E, "2026-10-08"), 2);
  assert.equal(weekStart(E, 2), "2026-10-08");
});

test("day 90 is 90 calendar days after the effective date", () => {
  assert.equal(dayN(E, 90), "2026-12-30");
  assert.equal(daysBetween(E, dayN(E, 90)), 90);
  assert.equal(weekNumber(E, dayN(E, 90)), 13);
});

test("milestones resolve from week or day", () => {
  assert.equal(milestoneDate(E, { week: 2 }), "2026-10-14");
  assert.equal(milestoneDate(E, { day: 90 }), "2026-12-30");
  assert.equal(milestoneDate(E, { week: 26 }), "2027-03-31");
});

test("deliverable due dates", () => {
  assert.equal(deliverableDueDate(E, "day90"), "2026-12-30");
  assert.equal(deliverableDueDate(E, "month6"), "2027-04-01");
});

test("term months cover Oct through Apr", () => {
  assert.deepEqual(termMonths(E, 6), ["2026-10", "2026-11", "2026-12", "2027-01", "2027-02", "2027-03", "2027-04"]);
});

test("addMonths handles year rollover", () => {
  assert.equal(addMonths("2026-11-15", 3), "2027-02-15");
});
