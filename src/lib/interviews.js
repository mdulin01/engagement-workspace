// Pure helpers for the stakeholder interview tracker (tested in tests/).
// Interview notes never live on this site: a row holds a link to the notes in
// the client's environment, scheduling state, and theme tags from a fixed list.

export const STATUSES = [
  ["identified", "Identified"],
  ["invited", "Invited"],
  ["scheduled", "Scheduled"],
  ["completed", "Completed"],
  ["declined", "Declined"],
];

export const THEME_MAX = 40;

/**
 * Normalize a notes link, or return null if it is not an https link to the
 * configured host (e.g. ".sharepoint.com"). Empty input returns "".
 * firestore.rules enforces the same pattern; keep them in sync.
 */
export function normalizeNotesUrl(input, hostSuffix) {
  const s = String(input || "").trim();
  if (!s) return "";
  let u;
  try {
    u = new URL(s);
  } catch {
    return null;
  }
  const suffix = hostSuffix.toLowerCase();
  if (u.protocol !== "https:" || !u.hostname.endsWith(suffix) || u.hostname.length <= suffix.length) return null;
  if (!/^[a-z0-9-]+$/.test(u.hostname.slice(0, -suffix.length))) return null;
  return u.href;
}

/**
 * The leader-visible summary: counts only, no names, titles, links or dates.
 * Themes are counted across completed interviews and never broken out by
 * group, so a small group cannot be tied to what its members said.
 */
export function summarize(interviews, themes, groups, responses = [], survey = null) {
  const byStatus = Object.fromEntries(STATUSES.map(([v]) => [v, 0]));
  interviews.forEach((r) => { if (r.status in byStatus) byStatus[r.status] += 1; });

  const byGroup = groups.map((g) => {
    const rows = interviews.filter((r) => r.group === g.id);
    return {
      id: g.id,
      name: g.name,
      target: g.target,
      scheduled: rows.filter((r) => r.status === "scheduled").length,
      completed: rows.filter((r) => r.status === "completed").length,
    };
  });

  const completed = interviews.filter((r) => r.status === "completed");
  const themeCounts = themes
    .map((t) => ({ label: t.label, count: completed.filter((r) => (r.themes || []).includes(t.id)).length }))
    .filter((t) => t.count > 0)
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));

  return {
    target: groups.reduce((s, g) => s + g.target, 0),
    active: interviews.filter((r) => r.status !== "declined").length,
    byStatus,
    byGroup,
    themes: themeCounts,
    survey: survey ? surveyBaseline(responses, survey) : { n: 0 },
  };
}

const mean = (xs) => (xs.length ? Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 10) / 10 : null);

/**
 * De-identified survey averages for leaders. Nothing is reported until at
 * least survey.minForAverages people respond, so no one's answers can be
 * read off a group of one or two. "Don't know" (0) is left out of means.
 */
export function surveyBaseline(responses, survey) {
  const n = responses.length;
  if (n < survey.minForAverages) return { n };
  const rated = (get) => responses.map(get).filter((v) => Number.isInteger(v) && v >= 1 && v <= 5);
  return {
    n,
    domains: survey.domains.map((d) => ({ id: d.id, label: d.label, mean: mean(rated((r) => r.ratings?.[d.id])) })),
    ai: survey.ai.map((d) => ({ id: d.id, label: d.label, mean: mean(rated((r) => r.ai?.[d.id])) })),
    hoursPerWeek: mean(responses.map((r) => survey.hours.reduce((s, h) => s + (Number(r.hours?.[h.id]) || 0), 0))),
  };
}

/** What to spend interview time on: domains rated 1–2 and heavy data-work hours. */
export function prepFlags(response, survey) {
  const low = survey.domains.filter((d) => [1, 2].includes(response.ratings?.[d.id]));
  const hours = survey.hours.reduce((s, h) => s + (Number(response.hours?.[h.id]) || 0), 0);
  return { low, hours, heavy: hours >= 10 };
}

/** Unguessable survey link token (128 bits, base64url). */
export function surveyToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// Key-sorted JSON, because Firestore does not preserve map key order.
function stable(v) {
  if (Array.isArray(v)) return `[${v.map(stable).join(",")}]`;
  if (v && typeof v === "object") return `{${Object.keys(v).sort().map((k) => `${JSON.stringify(k)}:${stable(v[k])}`).join(",")}}`;
  return JSON.stringify(v);
}

/** Compare two summaries ignoring server-added fields. */
export function sameSummary(a, b) {
  if (!a || !b) return false;
  const pick = ({ target, active, byStatus, byGroup, themes, survey }) => stable({ target, active, byStatus, byGroup, themes, survey });
  return pick(a) === pick(b);
}
