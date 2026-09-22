// Firestore rules tests. Run with `npm run test:rules` (needs Java for the emulator).
import { test, before, after, beforeEach } from "node:test";
import { readFileSync } from "node:fs";
import { initializeTestEnvironment, assertSucceeds, assertFails } from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

const OWNER = "mdulin@gmail.com";
let env;

before(async () => {
  env = await initializeTestEnvironment({
    projectId: "demo-engagement",
    firestore: { rules: readFileSync("firestore.rules", "utf8") },
  });
});
after(() => env.cleanup());
beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, "users/leader1"), { email: "leader@example.org", role: "leader" });
    await setDoc(doc(db, "users/part1"), { email: "part@example.org", role: "participant" });
    await setDoc(doc(db, "invites/invitee@example.org"), { role: "leader" });
    await setDoc(doc(db, "interviews/i1"), { name: "A Person", group: "exec", status: "completed", notesUrl: "", themes: [] });
    await setDoc(doc(db, "interviewSummary/current"), { target: 14, active: 1, byStatus: {}, byGroup: [], themes: [] });
  });
});

const as = (uid, email, verified = true) => env.authenticatedContext(uid, { email, email_verified: verified }).firestore();
const owner = () => as("owner", OWNER);
const leader = () => as("leader1", "leader@example.org");
const participant = () => as("part1", "part@example.org");

const interview = (extra = {}) => ({
  name: "Jane Doe", title: "Epidemiologist", group: "epi", guideId: "data", status: "scheduled",
  scheduledAt: "2026-10-12T10:00", notesUrl: "", themes: [], updatedAt: serverTimestamp(), ...extra,
});

// ---- verified email required ------------------------------------------
test("owner email only grants admin when verified", async () => {
  await assertSucceeds(getDoc(doc(owner(), "interviews/i1")));
  await assertFails(getDoc(doc(as("fake", OWNER, false), "interviews/i1")));
});

test("unverified sign-up cannot claim an invite", async () => {
  const db = as("u2", "invitee@example.org", false);
  await assertFails(setDoc(doc(db, "users/u2"), { email: "invitee@example.org", role: "leader" }));
  const ok = as("u3", "invitee@example.org");
  await assertSucceeds(setDoc(doc(ok, "users/u3"), { email: "invitee@example.org", role: "leader" }));
});

// ---- interviews: admin only, no notes ----------------------------------
test("leaders and participants cannot read interviews", async () => {
  await assertFails(getDoc(doc(leader(), "interviews/i1")));
  await assertFails(getDoc(doc(participant(), "interviews/i1")));
});

test("admin can write a valid interview with a SharePoint link", async () => {
  await assertSucceeds(setDoc(doc(owner(), "interviews/i2"), interview()));
  await assertSucceeds(setDoc(doc(owner(), "interviews/i3"), interview({ notesUrl: "https://fulton.sharepoint.com/:w:/s/DPH/abc" })));
});

test("interviews reject notes and non-SharePoint links", async () => {
  await assertFails(setDoc(doc(owner(), "interviews/i2"), interview({ notes: "She said the EMR is slow" })));
  await assertFails(setDoc(doc(owner(), "interviews/i2"), interview({ notesUrl: "https://docs.google.com/document/d/x" })));
  await assertFails(setDoc(doc(owner(), "interviews/i2"), interview({ notesUrl: "http://fulton.sharepoint.com/x" })));
  await assertFails(setDoc(doc(owner(), "interviews/i2"), interview({ notesUrl: "She said the EMR is slow" })));
  await assertFails(setDoc(doc(owner(), "interviews/i2"), interview({ status: "maybe" })));
});

test("leaders cannot write interviews", async () => {
  await assertFails(setDoc(doc(leader(), "interviews/i2"), interview()));
});

// ---- guides and themes -------------------------------------------------
test("theme labels are short and admin-only", async () => {
  await assertSucceeds(setDoc(doc(owner(), "interviewThemes/t1"), { label: "Data quality", updatedAt: serverTimestamp() }));
  await assertFails(setDoc(doc(owner(), "interviewThemes/t2"), { label: "x".repeat(41) }));
  await assertFails(setDoc(doc(owner(), "interviewThemes/t3"), { label: "Data quality", quote: "..." }));
  await assertFails(getDoc(doc(leader(), "interviewThemes/t1")));
});

test("guides are admin-only", async () => {
  await assertSucceeds(setDoc(doc(owner(), "interviewGuides/g1"), { name: "Leadership", questions: "1. ...", updatedAt: serverTimestamp() }));
  await assertFails(getDoc(doc(leader(), "interviewGuides/g1")));
});

// ---- summary: leaders read counts --------------------------------------
test("leaders read the summary; participants do not", async () => {
  await assertSucceeds(getDoc(doc(leader(), "interviewSummary/current")));
  await assertFails(getDoc(doc(participant(), "interviewSummary/current")));
});

test("only admin writes the summary, and only count fields", async () => {
  const s = { target: 14, active: 2, byStatus: { completed: 1 }, byGroup: [], themes: [], updatedAt: serverTimestamp() };
  await assertSucceeds(setDoc(doc(owner(), "interviewSummary/current"), s));
  await assertFails(setDoc(doc(owner(), "interviewSummary/current"), { ...s, names: ["Jane Doe"] }));
  await assertFails(setDoc(doc(leader(), "interviewSummary/current"), s));
});

// ---- milestone decks ---------------------------------------------------
test("deck text is admin-only", async () => {
  await assertSucceeds(setDoc(doc(owner(), "presentations/day90"), { slides: { findings: { title: "Findings", bullets: ["x"] } }, updatedAt: serverTimestamp() }));
  await assertFails(getDoc(doc(leader(), "presentations/day90")));
  await assertFails(setDoc(doc(leader(), "presentations/day90"), { slides: {} }));
  await assertFails(setDoc(doc(owner(), "presentations/day90"), { slides: {}, attachment: "..." }));
});
