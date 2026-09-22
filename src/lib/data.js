// Thin data layer: Firestore when configured, an in-memory store in DEMO mode.
// Every collection is a flat list of {id, ...fields}. Pages subscribe with useCollection.
import { useEffect, useState } from "react";
import {
  collection, doc, onSnapshot, setDoc, deleteDoc, serverTimestamp, query, orderBy as fsOrderBy,
} from "firebase/firestore";
import { db, DEMO } from "./firebase.js";
import { today, addDays } from "./dates.js";

// ---------------------------------------------------------------- demo store
const demo = {
  data: {
    settings: [{ id: "engagement", effectiveDate: "2026-10-01" }],
    invites: [
      { id: "susan.example@dph.ga.gov", role: "leader", name: "Susan Hrapcak (example)" },
    ],
    milestones: [],
    deliverables: [{ id: "1", status: "In progress", note: "Interview guide drafted" }],
    statusLog: [
      { id: "s1", date: today(), type: "checkin", published: true, title: "Kickoff scheduled", body: "Demo entry. Charter draft circulated to Dr. Hrapcak." },
      { id: "s2", date: addDays(today(), -3), type: "note", published: false, title: "Private note", body: "Only admin sees unpublished entries." },
    ],
    effortEntries: [
      { id: "e1", date: today(), hours: 6, onsite: false, note: "Charter drafting, interview guides" },
      { id: "e2", date: addDays(today(), -2), hours: 8, onsite: true, note: "On-site kickoff" },
    ],
    expenses: [{ id: "x1", date: addDays(today(), -2), amount: 412.5, category: "Airfare", note: "GSO–ATL" }],
    aiLog: [],
    interviewGuides: [
      { id: "leadership", name: "Leadership", questions: "1. What decisions do you most need data for that you cannot make well today?\n2. Who owns data decisions today?" },
      { id: "data", name: "Data, IT and surveillance", questions: "1. Which systems do you pull data from, and how do they connect?\n2. What manual extracts do you rely on?" },
    ],
    interviewThemes: [
      { id: "th1", label: "Manual reporting burden" },
      { id: "th2", label: "EMR data access" },
      { id: "th3", label: "Data quality" },
    ],
    interviews: [
      { id: "i1", name: "Example Director", title: "District Health Director", group: "exec", guideId: "leadership", status: "completed", scheduledAt: `${addDays(today(), -4)}T10:00`, notesUrl: "https://example.sharepoint.com/:w:/s/engagement/notes-i1", themes: ["th2", "th3"] },
      { id: "i2", name: "Example Epidemiologist", title: "Lead Epidemiologist", group: "epi", guideId: "data", status: "scheduled", scheduledAt: `${addDays(today(), 3)}T14:00`, notesUrl: "", themes: [] },
      { id: "i3", name: "Example IT Manager", title: "IT Manager", group: "it", guideId: "data", status: "invited", scheduledAt: "", notesUrl: "", themes: [] },
    ],
    interviewSummary: [],
    presentations: [],
  },
  listeners: new Map(),
  emit(name) {
    (this.listeners.get(name) || new Set()).forEach((fn) => fn([...(this.data[name] || [])]));
  },
  subscribe(name, fn) {
    if (!this.listeners.has(name)) this.listeners.set(name, new Set());
    this.listeners.get(name).add(fn);
    fn([...(this.data[name] || [])]);
    return () => this.listeners.get(name).delete(fn);
  },
  set(name, id, fields) {
    const list = this.data[name] || (this.data[name] = []);
    const i = list.findIndex((r) => r.id === id);
    const row = { ...(i >= 0 ? list[i] : {}), ...fields, id };
    if (i >= 0) list[i] = row; else list.push(row);
    this.emit(name);
  },
  remove(name, id) {
    this.data[name] = (this.data[name] || []).filter((r) => r.id !== id);
    this.emit(name);
  },
};

// ---------------------------------------------------------------- public API
export function newId() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

/** Subscribe to a collection. Returns {rows, loading, error}. */
export function useCollection(name, { orderBy = null, enabled = true } = {}) {
  const [state, setState] = useState({ rows: [], loading: true, error: null });
  useEffect(() => {
    if (!enabled) { setState({ rows: [], loading: false, error: null }); return; }
    if (DEMO) {
      return demo.subscribe(name, (rows) => {
        const sorted = orderBy ? [...rows].sort((a, b) => (a[orderBy.field] < b[orderBy.field] ? 1 : -1) * (orderBy.dir === "asc" ? -1 : 1)) : rows;
        setState({ rows: sorted, loading: false, error: null });
      });
    }
    const ref = collection(db, name);
    const q = orderBy ? query(ref, fsOrderBy(orderBy.field, orderBy.dir || "desc")) : ref;
    return onSnapshot(
      q,
      (snap) => setState({ rows: snap.docs.map((d) => ({ id: d.id, ...d.data() })), loading: false, error: null }),
      (err) => setState({ rows: [], loading: false, error: err.message }),
    );
  }, [name, enabled, orderBy?.field, orderBy?.dir]);
  return state;
}

/** Create or merge a document. */
export async function save(name, id, fields) {
  if (DEMO) return demo.set(name, id, fields);
  await setDoc(doc(db, name, id), { ...fields, updatedAt: serverTimestamp() }, { merge: true });
}

export async function remove(name, id) {
  if (DEMO) return demo.remove(name, id);
  await deleteDoc(doc(db, name, id));
}
