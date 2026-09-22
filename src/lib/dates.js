// Pure date math for the engagement timeline. No Firebase, no React.
// All dates are handled as "YYYY-MM-DD" strings interpreted as local calendar days.

const DAY_MS = 24 * 60 * 60 * 1000;

export function parseISO(s) {
  const [y, m, d] = String(s).split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function toISO(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function addDays(iso, n) {
  const d = parseISO(iso);
  d.setDate(d.getDate() + n);
  return toISO(d);
}

export function addMonths(iso, n) {
  const d = parseISO(iso);
  d.setMonth(d.getMonth() + n);
  return toISO(d);
}

export function daysBetween(fromISO, toISOStr) {
  const a = parseISO(fromISO);
  const b = parseISO(toISOStr);
  return Math.round((b - a) / DAY_MS);
}

/** Engagement week number (1-based) for a given date. Week 1 starts on the effective date. */
export function weekNumber(effectiveDate, onDate) {
  const days = daysBetween(effectiveDate, onDate);
  return Math.floor(days / 7) + 1;
}

/** First calendar day of engagement week N. */
export function weekStart(effectiveDate, week) {
  return addDays(effectiveDate, (week - 1) * 7);
}

/** "Day N" as the proposal defines it: N calendar days after the effective date. */
export function dayN(effectiveDate, n) {
  return addDays(effectiveDate, n);
}

/** Resolve a milestone definition ({week} or {day}) to a calendar date. */
export function milestoneDate(effectiveDate, milestone) {
  if (milestone.day != null) return dayN(effectiveDate, milestone.day);
  // A week-anchored milestone lands at the end of that week.
  return addDays(weekStart(effectiveDate, milestone.week), 6);
}

/** Resolve a deliverable due key to a date. */
export function deliverableDueDate(effectiveDate, due, termMonths = 6) {
  if (due === "day90") return dayN(effectiveDate, 90);
  if (due === "month6") return addMonths(effectiveDate, termMonths);
  return due; // already an ISO date
}

export function phaseFor(phases, week) {
  return phases.filter((p) => week >= p.startWeek && week <= p.endWeek);
}

export function termEnd(effectiveDate, termMonths = 6) {
  return addMonths(effectiveDate, termMonths);
}

/** "YYYY-MM" key for grouping effort by calendar month. */
export function monthKey(iso) {
  return String(iso).slice(0, 7);
}

/** List of "YYYY-MM" keys covering the term. */
export function termMonths(effectiveDate, months = 6) {
  const out = [];
  for (let i = 0; i < months; i++) out.push(monthKey(addMonths(effectiveDate, i)));
  const last = monthKey(termEnd(effectiveDate, months));
  if (!out.includes(last)) out.push(last);
  return out;
}

export function fmt(iso) {
  if (!iso) return "";
  return parseISO(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function today() {
  return toISO(new Date());
}
