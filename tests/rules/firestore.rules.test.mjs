// Firestore rules tests. Run with `npm run test:rules` (needs Java for the emulator).
import { test, before, after, beforeEach } from "node:test";
import { readFileSync } from "node:fs";
import { initializeTestEnvironment, assertSucceeds, assertFails } from "@firebase/rules-unit-testing";
import { doc, getDoc, getDocs, setDoc, collection, query, where, serverTimestamp } from "firebase/firestore";

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
    await setDoc(doc(db, "users/team1"), { email: "team@example.org", role: "team" });
    await setDoc(doc(db, "invites/invitee@example.org"), { role: "leader" });
    await setDoc(doc(db, "interviews/i1"), { name: "A Person", group: "exec", status: "completed", notesUrl: "", themes: [] });
    await setDoc(doc(db, "interviewSummary/current"), { target: 14, active: 1, byStatus: {}, byGroup: [], themes: [] });
  });
});

const as = (uid, email, verified = true) => env.authenticatedContext(uid, { email, email_verified: verified }).firestore();
const owner = () => as("owner", OWNER);
const leader = () => as("leader1", "leader@example.org");
const participant = () => as("part1", "part@example.org");
const team = () => as("team1", "team@example.org");

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

// ---- pre-interview survey ------------------------------------------------
const anon = () => env.unauthenticatedContext().firestore();
const answer = (extra = {}) => ({
  profile: { title: "Nurse Manager", unit: "Clinic A", group: "clinical", tenureOrg: "3–5 years", tenureRole: "1–3 years" },
  systems: ["VHN (clinical EMR)"], systemsOther: "", hours: { entry: 4, reconcile: 2, reports: 1.5 },
  ratings: { access: 2, trust: 3, timely: 0, burden: 1, tools: 2, skills: 4, ownership: 1 },
  ai: { aiInterest: 4, aiConcern: 3 }, text: { fixOne: "Fewer duplicate forms", reportsMade: "", success: "", sentinel: "A late outbreak report", useCases: "", worksWell: "", priorities: "" },
  updatedAt: serverTimestamp(), ...extra,
});

test("survey: link holder submits once without signing in", async () => {
  await env.withSecurityRulesDisabled((ctx) => setDoc(doc(ctx.firestore(), "surveyInvites/tok123"), { interviewId: "i1" }));
  await assertSucceeds(getDoc(doc(anon(), "surveyInvites/tok123")));
  await assertSucceeds(setDoc(doc(anon(), "surveyResponses/tok123"), answer()));
  await assertFails(setDoc(doc(anon(), "surveyResponses/tok123"), answer()));
  await assertFails(getDoc(doc(anon(), "surveyResponses/tok123")));
  await assertFails(getDoc(doc(leader(), "surveyResponses/tok123")));
  await assertSucceeds(getDoc(doc(owner(), "surveyResponses/tok123")));
});

test("survey: no invite, no submission; invites cannot be listed or forged", async () => {
  await assertFails(setDoc(doc(anon(), "surveyResponses/guess"), answer()));
  await assertFails(setDoc(doc(anon(), "surveyInvites/mine"), { interviewId: "x" }));
  const { getDocs, collection } = await import("firebase/firestore");
  await assertFails(getDocs(collection(anon(), "surveyInvites")));
});

test("survey: bad shapes are rejected", async () => {
  await env.withSecurityRulesDisabled((ctx) => setDoc(doc(ctx.firestore(), "surveyInvites/t2"), { interviewId: "i1" }));
  await assertFails(setDoc(doc(anon(), "surveyResponses/t2"), answer({ ratings: { access: 9 } })));
  await assertFails(setDoc(doc(anon(), "surveyResponses/t2"), answer({ text: { fixOne: "x".repeat(601) } })));
  await assertFails(setDoc(doc(anon(), "surveyResponses/t2"), answer({ patientName: "x" })));
  await assertFails(setDoc(doc(anon(), "surveyResponses/t2"), answer({ hours: { entry: 500 } })));
});

test("interviews accept a SharePoint recording link only", async () => {
  await assertSucceeds(setDoc(doc(owner(), "interviews/r1"), interview({ recordingUrl: "https://fulton-my.sharepoint.com/:v:/p/x/abc", recordingConsent: true })));
  await assertFails(setDoc(doc(owner(), "interviews/r2"), interview({ recordingUrl: "https://example.com/audio.m4a" })));
});

// ---- documents -----------------------------------------------------------
const docEntry = (extra = {}) => ({ title: "Services Agreement", category: "Contract", url: "https://drive.google.com/file/d/abc", visibility: "leaders", date: "2026-10-01", note: "", updatedAt: serverTimestamp(), ...extra });

test("documents: admin adds links; leaders see only leader-visible ones", async () => {
  await assertSucceeds(setDoc(doc(owner(), "documents/d1"), docEntry()));
  await assertSucceeds(setDoc(doc(owner(), "documents/d2"), docEntry({ title: "Private", visibility: "admin" })));
  await assertSucceeds(getDocs(query(collection(leader(), "documents"), where("visibility", "==", "leaders"))));
  await assertFails(getDocs(collection(leader(), "documents")));
  await assertFails(getDoc(doc(leader(), "documents/d2")));
  await assertFails(getDoc(doc(participant(), "documents/d1")));
  await assertFails(setDoc(doc(leader(), "documents/d3"), docEntry()));
});

test("documents: links must be https and fields are fixed", async () => {
  await assertFails(setDoc(doc(owner(), "documents/d4"), docEntry({ url: "http://example.com/x" })));
  await assertFails(setDoc(doc(owner(), "documents/d4"), docEntry({ body: "pasted contract text" })));
  await assertFails(setDoc(doc(owner(), "documents/d4"), docEntry({ category: "Findings" })));
});

// ---- team role -----------------------------------------------------------
test("team works the engagement but cannot see billing or settings", async () => {
  await assertSucceeds(getDoc(doc(team(), "interviews/i1")));
  await assertSucceeds(setDoc(doc(team(), "interviews/t9"), interview()));
  await assertSucceeds(setDoc(doc(team(), "presentations/day90"), { slides: {} }));
  await assertSucceeds(getDoc(doc(team(), "documents/none")));
  await env.withSecurityRulesDisabled((ctx) => setDoc(doc(ctx.firestore(), "surveyInvites/tk"), { interviewId: "i1" }));
  await assertSucceeds(getDoc(doc(team(), "surveyResponses/none")));
  // billing, invites and settings stay with admin
  await assertFails(getDoc(doc(team(), "effortEntries/e1")));
  await assertFails(getDoc(doc(team(), "expenses/x1")));
  await assertFails(setDoc(doc(team(), "settings/engagement"), { effectiveDate: "2026-10-01" }));
  await assertFails(setDoc(doc(team(), "invites/x@example.org"), { role: "admin" }));
  await assertFails(setDoc(doc(team(), "documents/d9"), docEntry()));
  await assertFails(setDoc(doc(team(), "users/leader1"), { email: "leader@example.org", role: "admin" }));
  // themes are engagement work, so team may edit them
  await assertSucceeds(setDoc(doc(team(), "interviewThemes/t1"), { label: "Data quality" }));
});
