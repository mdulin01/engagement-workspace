import { useEffect, useState } from "react";
import { useCollection, save, remove, newId } from "../lib/data.js";
import { useAuth } from "../lib/auth.jsx";
import { useEngagement } from "../lib/engagement.js";
import { STATUSES, THEME_MAX, normalizeNotesUrl, summarize, sameSummary } from "../lib/interviews.js";

const STATUS_PILL = {
  identified: "bg-slate-100 text-slate-600",
  invited: "bg-sky-100 text-sky-800",
  scheduled: "bg-amber-100 text-amber-800",
  completed: "bg-green-100 text-green-800",
  declined: "bg-red-100 text-red-700",
};

const when = (s) => (s ? new Date(s).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "");

// ------------------------------------------------------------ leader view
// Also rendered on the admin page so you see exactly what leaders see.
function Summary({ s }) {
  if (!s) return <div className="card text-sm text-slate-500">No interview counts published yet.</div>;
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="card lg:col-span-2">
        <div className="label">Stakeholder interviews · {s.byStatus.completed} of {s.target} completed</div>
        <div className="flex flex-wrap gap-2 my-2">
          {STATUSES.map(([v, l]) => <span key={v} className={`pill ${STATUS_PILL[v]}`}>{l}: {s.byStatus[v] || 0}</span>)}
        </div>
        <table className="w-full text-sm">
          <thead><tr className="text-left text-xs text-slate-500"><th className="py-1">Stakeholder group</th><th>Scheduled</th><th>Completed</th><th>Target</th></tr></thead>
          <tbody className="divide-y divide-slate-100">
            {s.byGroup.map((g) => (
              <tr key={g.id}>
                <td className="py-1.5">{g.name}</td>
                <td>{g.scheduled}</td>
                <td className={g.completed >= g.target ? "text-green-700 font-medium" : ""}>{g.completed}</td>
                <td className="text-slate-500">{g.target}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="card">
        <div className="label">Emerging themes (completed interviews)</div>
        {s.themes.length === 0 ? <p className="text-sm text-slate-500">None tagged yet.</p> : (
          <ul className="text-sm space-y-1">
            {s.themes.map((t) => <li key={t.label} className="flex justify-between"><span>{t.label}</span><span className="text-slate-500">{t.count}</span></li>)}
          </ul>
        )}
        <p className="text-xs text-slate-500 mt-2">Counts only. Themes are not broken out by group or person.</p>
      </div>
    </div>
  );
}

function LeaderView() {
  const { rows, loading, error } = useCollection("interviewSummary");
  if (loading) return <p className="text-slate-500">Loading…</p>;
  if (error) return <p className="text-red-600 text-sm">{error}</p>;
  return <Summary s={rows.find((r) => r.id === "current")} />;
}

// ------------------------------------------------------------- admin view
const blank = (group) => ({ name: "", title: "", group, guideId: "", status: "identified", scheduledAt: "", notesUrl: "", themes: [] });

function AdminView() {
  const cfg = useEngagement().config.interviews;
  const { rows: interviews, loading: l1 } = useCollection("interviews");
  const { rows: guides, loading: l2 } = useCollection("interviewGuides");
  const { rows: themes, loading: l3 } = useCollection("interviewThemes");
  const { rows: summaries, loading: l4 } = useCollection("interviewSummary");
  const loading = l1 || l2 || l3 || l4;
  const current = summaries.find((r) => r.id === "current");

  const [draft, setDraft] = useState(blank(cfg.groups[0].id));
  const [editing, setEditing] = useState(null);
  const [urlError, setUrlError] = useState("");
  const [openGuide, setOpenGuide] = useState(null);
  const [newTheme, setNewTheme] = useState("");

  // Keep the leader-visible counts in step with the tracker.
  const next = summarize(interviews, themes, cfg.groups);
  useEffect(() => {
    if (!loading && !sameSummary(next, current)) save("interviewSummary", "current", next);
  });

  async function submit(e) {
    e.preventDefault();
    const notesUrl = normalizeNotesUrl(draft.notesUrl, cfg.notesLink.hostSuffix);
    if (notesUrl === null) {
      setUrlError(`Must be an https link to ${cfg.notesLink.label} (*${cfg.notesLink.hostSuffix}). Paste the link, not the notes.`);
      return;
    }
    setUrlError("");
    await save("interviews", editing || newId(), { ...draft, name: draft.name.trim(), title: draft.title.trim(), notesUrl });
    setDraft(blank(draft.group));
    setEditing(null);
  }

  function edit(r) {
    setEditing(r.id);
    setUrlError("");
    const base = blank(r.group);
    setDraft(Object.fromEntries(Object.keys(base).map((k) => [k, r[k] ?? base[k]])));
  }

  function toggleTheme(id) {
    setDraft((d) => ({ ...d, themes: d.themes.includes(id) ? d.themes.filter((t) => t !== id) : [...d.themes, id] }));
  }

  async function loadStarters() {
    await Promise.all([
      ...cfg.starterGuides.filter((g) => !guides.some((x) => x.id === g.id)).map((g) => save("interviewGuides", g.id, { name: g.name, questions: g.questions })),
      ...cfg.starterThemes.filter((t) => !themes.some((x) => x.label === t)).map((t) => save("interviewThemes", newId(), { label: t })),
    ]);
  }

  const guideName = (id) => guides.find((g) => g.id === id)?.name || "—";
  const themeLabel = (id) => themes.find((t) => t.id === id)?.label;

  return (
    <div className="space-y-4">
      <Summary s={next} />
      <p className="text-xs text-slate-500 -mt-2">Above is what leaders see. Everything below is admin only.</p>

      <div className="grid gap-4 lg:grid-cols-3">
        <form onSubmit={submit} className="card space-y-2 self-start">
          <div className="label">{editing ? "Edit interview" : "Add interview"}</div>
          <input className="input" placeholder="Interviewee name" required maxLength={120} value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
          <input className="input" placeholder="Role / title" maxLength={120} value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
          <select className="input" value={draft.group} onChange={(e) => setDraft({ ...draft, group: e.target.value })}>
            {cfg.groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
          <select className="input" value={draft.guideId} onChange={(e) => setDraft({ ...draft, guideId: e.target.value })}>
            <option value="">Interview guide…</option>
            {guides.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
          <div className="grid grid-cols-2 gap-2">
            <select className="input" value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value })}>
              {STATUSES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            <input type="datetime-local" className="input" value={draft.scheduledAt} onChange={(e) => setDraft({ ...draft, scheduledAt: e.target.value })} />
          </div>
          <input className="input" placeholder={`Link to notes in ${cfg.notesLink.label}`} value={draft.notesUrl} onChange={(e) => setDraft({ ...draft, notesUrl: e.target.value })} />
          {urlError && <p className="text-xs text-red-600">{urlError}</p>}
          <div>
            <div className="label mt-2">Theme tags</div>
            <div className="flex flex-wrap gap-1">
              {themes.map((t) => (
                <button type="button" key={t.id} onClick={() => toggleTheme(t.id)}
                  className={`pill border ${draft.themes.includes(t.id) ? "bg-sky-600 text-white border-sky-600" : "bg-white border-slate-300 text-slate-600"}`}>
                  {t.label}
                </button>
              ))}
              {themes.length === 0 && <span className="text-xs text-slate-500">Add themes below.</span>}
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button className="btn btn-primary" type="submit">{editing ? "Save" : "Add"}</button>
            {editing && <button className="btn" type="button" onClick={() => { setEditing(null); setDraft(blank(draft.group)); setUrlError(""); }}>Cancel</button>}
          </div>
          <p className="text-xs text-slate-500">Notes stay in {cfg.notesLink.label}. This site holds the link, scheduling state and theme tags only.</p>
        </form>

        <div className="card lg:col-span-2 overflow-x-auto">
          <div className="label">Interviews ({interviews.length} · target {next.target})</div>
          {!loading && interviews.length === 0 && <p className="text-sm text-slate-500">No interviews yet.</p>}
          {cfg.groups.map((g) => {
            const rows = interviews.filter((r) => r.group === g.id).sort((a, b) => (a.scheduledAt || "~").localeCompare(b.scheduledAt || "~"));
            if (rows.length === 0) return null;
            return (
              <div key={g.id} className="mt-3">
                <div className="text-xs font-semibold text-slate-600">{g.name} · {rows.filter((r) => r.status === "completed").length}/{g.target}</div>
                <ul className="divide-y divide-slate-100">
                  {rows.map((r) => (
                    <li key={r.id} className="py-2 text-sm flex flex-wrap items-center gap-2">
                      <span className="flex-1 min-w-40">
                        <b>{r.name}</b>{r.title ? <span className="text-slate-500"> · {r.title}</span> : null}
                        <span className="block text-xs text-slate-500">
                          {guideName(r.guideId)}{r.scheduledAt ? ` · ${when(r.scheduledAt)}` : ""}
                          {(r.themes || []).map(themeLabel).filter(Boolean).map((l) => <span key={l} className="pill bg-slate-100 ml-1">{l}</span>)}
                        </span>
                      </span>
                      <select className={`pill border-0 ${STATUS_PILL[r.status]}`} value={r.status} onChange={(e) => save("interviews", r.id, { status: e.target.value })}>
                        {STATUSES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                      </select>
                      {r.notesUrl
                        ? <a className="text-xs underline" href={r.notesUrl} target="_blank" rel="noopener noreferrer">Notes ↗</a>
                        : <span className="text-xs text-slate-400">no notes link</span>}
                      <button className="text-xs underline" onClick={() => edit(r)}>Edit</button>
                      <button className="text-xs underline text-red-600" onClick={() => { if (window.confirm(`Delete ${r.name}?`)) remove("interviews", r.id); }}>Delete</button>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="card space-y-2">
          <div className="label">Interview guides by role</div>
          {guides.map((g) => (
            <div key={g.id} className="border border-slate-200 rounded-md">
              <button className="w-full text-left px-3 py-2 text-sm font-medium flex justify-between" onClick={() => setOpenGuide(openGuide === g.id ? null : g.id)}>
                <span>{g.name}</span>
                <span className="text-xs text-slate-500">{interviews.filter((r) => r.guideId === g.id).length} interview(s) · {openGuide === g.id ? "close" : "open"}</span>
              </button>
              {openGuide === g.id && <GuideEditor guide={g} />}
            </div>
          ))}
          <button className="btn" onClick={() => { const id = newId(); save("interviewGuides", id, { name: "New guide", questions: "" }); setOpenGuide(id); }}>Add guide</button>
        </section>

        <section className="card space-y-2">
          <div className="label">Theme tags</div>
          <p className="text-xs text-slate-500">Short, de-identified tags ({THEME_MAX} characters max). A theme names a pattern, never a quote, a person or a unit small enough to identify someone.</p>
          <ul className="flex flex-wrap gap-1">
            {themes.map((t) => (
              <li key={t.id} className="pill bg-slate-100 flex items-center gap-1">
                {t.label}
                <button className="text-red-600" title="Delete theme" onClick={() => {
                  const used = interviews.filter((r) => (r.themes || []).includes(t.id));
                  if (!window.confirm(`Delete "${t.label}"?${used.length ? ` It is tagged on ${used.length} interview(s).` : ""}`)) return;
                  used.forEach((r) => save("interviews", r.id, { themes: r.themes.filter((x) => x !== t.id) }));
                  remove("interviewThemes", t.id);
                }}>×</button>
              </li>
            ))}
          </ul>
          <form className="flex gap-2" onSubmit={async (e) => { e.preventDefault(); await save("interviewThemes", newId(), { label: newTheme.trim() }); setNewTheme(""); }}>
            <input className="input" placeholder="New theme" required maxLength={THEME_MAX} value={newTheme} onChange={(e) => setNewTheme(e.target.value)} />
            <button className="btn" type="submit">Add</button>
          </form>
        </section>
      </div>

      {(guides.length === 0 || themes.length === 0) && !loading && (
        <div className="card flex items-center gap-3 text-sm">
          <span className="flex-1">Start from the starter guides and themes in engagement.json?</span>
          <button className="btn btn-primary" onClick={loadStarters}>Load starters</button>
        </div>
      )}
    </div>
  );
}

function GuideEditor({ guide }) {
  const [g, setG] = useState({ name: guide.name, questions: guide.questions });
  const dirty = g.name !== guide.name || g.questions !== guide.questions;
  return (
    <form className="px-3 pb-3 space-y-2" onSubmit={(e) => { e.preventDefault(); save("interviewGuides", guide.id, g); }}>
      <input className="input" required maxLength={80} value={g.name} onChange={(e) => setG({ ...g, name: e.target.value })} />
      <textarea className="input font-mono text-xs" rows={8} maxLength={8000} value={g.questions} onChange={(e) => setG({ ...g, questions: e.target.value })} />
      <div className="flex gap-2">
        <button className="btn btn-primary" type="submit" disabled={!dirty}>Save guide</button>
        <button className="btn text-red-600" type="button" onClick={() => { if (window.confirm(`Delete guide "${guide.name}"?`)) remove("interviewGuides", guide.id); }}>Delete</button>
      </div>
      <p className="text-xs text-slate-500">Questions only. Answers go in the notes in the client's environment.</p>
    </form>
  );
}

export default function Interviews() {
  const { isAdmin } = useAuth();
  return isAdmin ? <AdminView /> : <LeaderView />;
}
