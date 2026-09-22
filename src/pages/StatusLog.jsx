import { useState } from "react";
import { useCollection, save, remove, newId } from "../lib/data.js";
import { useAuth } from "../lib/auth.jsx";
import { fmt, today } from "../lib/dates.js";

const TYPES = [
  ["checkin", "Biweekly check-in"],
  ["monthly", "Monthly status summary"],
  ["note", "Working note"],
  ["decision", "Decision"],
];

export default function StatusLog() {
  const { isAdmin } = useAuth();
  const { rows, loading, error } = useCollection("statusLog", { orderBy: { field: "date", dir: "desc" } });
  const [draft, setDraft] = useState({ date: today(), type: "checkin", title: "", body: "", published: false });

  async function add(e) {
    e.preventDefault();
    await save("statusLog", newId(), draft);
    setDraft({ date: today(), type: "checkin", title: "", body: "", published: false });
  }

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {isAdmin && (
        <form onSubmit={add} className="card space-y-2 lg:col-span-1 self-start">
          <div className="label">New entry</div>
          <input type="date" className="input" value={draft.date} onChange={(e) => setDraft({ ...draft, date: e.target.value })} />
          <select className="input" value={draft.type} onChange={(e) => setDraft({ ...draft, type: e.target.value })}>
            {TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <input className="input" placeholder="Title" required value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
          <textarea className="input" rows={6} placeholder="What happened, what was decided, what is next" value={draft.body} onChange={(e) => setDraft({ ...draft, body: e.target.value })} />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={draft.published} onChange={(e) => setDraft({ ...draft, published: e.target.checked })} />
            Visible to leaders
          </label>
          <button className="btn btn-primary" type="submit">Add entry</button>
          <p className="text-xs text-slate-500">Entries feed the monthly written status summary (§2.7) and the invoice narrative (§7).</p>
        </form>
      )}
      <div className={`space-y-3 ${isAdmin ? "lg:col-span-2" : "lg:col-span-3"}`}>
        {loading && <p className="text-slate-500">Loading…</p>}
        {error && <p className="text-red-600 text-sm">{error}</p>}
        {!loading && rows.length === 0 && <p className="text-slate-500">No entries yet.</p>}
        {rows.map((r) => (
          <article key={r.id} className="card">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span>{fmt(r.date)}</span>
              <span className="pill bg-slate-100">{TYPES.find(([v]) => v === r.type)?.[1] || r.type}</span>
              {r.published ? <span className="pill bg-green-100 text-green-800">Leaders</span> : <span className="pill bg-amber-100 text-amber-800">Private</span>}
              {isAdmin && (
                <span className="ml-auto flex gap-2">
                  <button className="underline" onClick={() => save("statusLog", r.id, { published: !r.published })}>{r.published ? "Unpublish" : "Publish"}</button>
                  <button className="underline text-red-600" onClick={() => { if (window.confirm("Delete this entry?")) remove("statusLog", r.id); }}>Delete</button>
                </span>
              )}
            </div>
            <h3 className="font-semibold mt-1">{r.title}</h3>
            <p className="text-sm whitespace-pre-wrap mt-1">{r.body}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
