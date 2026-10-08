// One-time data loads ("seeds") defined in src/config/seeds.json and applied
// from Admin → Data seeds while signed in as admin. Each doc has a fixed id,
// so re-applying a seed overwrites the same records instead of duplicating
// them. Pure helpers here are unit-tested; applySeed writes through data.js.
// Pure module: the seed list and the writer are passed in by the caller
// (Admin.jsx) so this file stays testable under node --test.

// Collections a seed may touch, with the field allow-list firestore.rules
// enforces where one exists (null = no allow-list in rules).
export const SEED_COLLECTIONS = {
  milestones: null,
  deliverables: null,
  statusLog: null,
  effortEntries: null,
  expenses: null,
  interviews: ["name", "title", "group", "guideId", "status", "scheduledAt", "notesUrl", "recordingUrl", "recordingConsent", "themes"],
  interviewThemes: ["label"],
  interviewGuides: ["name", "questions"],
  documents: ["title", "category", "url", "visibility", "date", "note"],
};

const ID_RE = /^[A-Za-z0-9][A-Za-z0-9._-]{0,80}$/;

/** Returns a list of problems; empty means the seed can be applied. */
export function validateSeed(seed, { groups = [], guideIds = [] } = {}) {
  const errs = [];
  if (!seed || !ID_RE.test(seed.id || "")) errs.push("seed id missing or invalid");
  if (!Array.isArray(seed?.docs) || seed.docs.length === 0) { errs.push("seed has no docs"); return errs; }
  const seen = new Set();
  seed.docs.forEach((d, i) => {
    const where = `doc ${i} (${d.collection}/${d.id})`;
    if (!(d.collection in SEED_COLLECTIONS)) errs.push(`${where}: collection not allowed`);
    if (!ID_RE.test(d.id || "")) errs.push(`${where}: bad id`);
    const key = `${d.collection}/${d.id}`;
    if (seen.has(key)) errs.push(`${where}: duplicate`);
    seen.add(key);
    if (!d.fields || typeof d.fields !== "object") { errs.push(`${where}: fields missing`); return; }
    const allow = SEED_COLLECTIONS[d.collection];
    if (allow) Object.keys(d.fields).forEach((k) => { if (!allow.includes(k)) errs.push(`${where}: field "${k}" not allowed`); });
    if (d.collection === "interviews") {
      if (groups.length && !groups.includes(d.fields.group)) errs.push(`${where}: unknown group "${d.fields.group}"`);
      if (guideIds.length && d.fields.guideId && !guideIds.includes(d.fields.guideId)) errs.push(`${where}: unknown guide "${d.fields.guideId}"`);
      if (d.fields.notesUrl) errs.push(`${where}: seeds never carry notes links`);
      if ((d.fields.name || "").length > 120 || (d.fields.title || "").length > 120) errs.push(`${where}: name/title over 120 chars`);
    }
    if (d.collection === "interviewThemes" && (d.fields.label || "").length > 40) errs.push(`${where}: theme label over 40 chars`);
    if (d.collection === "documents") {
      if (!/^https:\/\/.+/.test(d.fields.url || "")) errs.push(`${where}: document url must be https`);
      if ((d.fields.note || "").length > 300) errs.push(`${where}: note over 300 chars`);
    }
    const text = JSON.stringify(d.fields);
    if (/\b(MRN|DOB|SSN)\b/i.test(text)) errs.push(`${where}: looks like it carries client identifiers`);
  });
  return errs;
}

/** Writes every doc in order with save(collection, id, fields), then records the seed as applied in settings/seeds. */
export async function applySeed(seed, opts, save, today) {
  const errs = validateSeed(seed, opts);
  if (errs.length) throw new Error(errs.join("; "));
  for (const d of seed.docs) await save(d.collection, d.id, d.fields);
  await save("settings", "seeds", { [seed.id]: today });
}
