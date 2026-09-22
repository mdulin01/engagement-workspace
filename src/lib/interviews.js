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
export function summarize(interviews, themes, groups) {
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
  };
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
  const pick = ({ target, active, byStatus, byGroup, themes }) => stable({ target, active, byStatus, byGroup, themes });
  return pick(a) === pick(b);
}
