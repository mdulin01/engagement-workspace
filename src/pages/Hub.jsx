import { useEngagement } from "../lib/engagement.js";
import { useCollection, save } from "../lib/data.js";
import { useAuth } from "../lib/auth.jsx";
import { fmt, daysBetween } from "../lib/dates.js";
import { Link } from "react-router-dom";
import decks from "../config/presentations.json";

// Built on click so the docx library only loads when someone needs a shell.
async function downloadShell(config, deliverable) {
  const [{ buildShell, shellToBlob, shellFileName }, { default: shells }] = await Promise.all([
    import("../lib/shell.js"), import("../config/shells.json"),
  ]);
  const blob = await shellToBlob(buildShell({ config, deliverable, outline: shells[deliverable.number] }));
  const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: shellFileName(config, deliverable) });
  a.click();
  URL.revokeObjectURL(a.href);
}

function Stat({ label, value, sub }) {
  return (
    <div className="card">
      <div className="label">{label}</div>
      <div className="text-2xl font-semibold">{value}</div>
      {sub && <div className="text-xs text-slate-500 mt-1">{sub}</div>}
    </div>
  );
}

function PhaseBar({ phases, week, termWeeks }) {
  return (
    <div className="card">
      <div className="label">Phases (week {Math.max(week, 0)} of {termWeeks})</div>
      <div className="relative h-2 bg-slate-200 rounded my-3">
        <div className="absolute top-0 left-0 h-2 rounded" style={{ width: `${Math.min(100, Math.max(0, (week / termWeeks) * 100))}%`, background: "var(--accent)" }} />
      </div>
      <div className="space-y-1">
        {phases.map((p) => {
          const active = week >= p.startWeek && week <= p.endWeek;
          const left = ((p.startWeek - 1) / termWeeks) * 100;
          const width = ((p.endWeek - p.startWeek + 1) / termWeeks) * 100;
          return (
            <div key={p.id} className="text-xs">
              <div className="relative h-5">
                <div
                  className={`absolute top-0 h-5 rounded px-2 leading-5 truncate ${active ? "text-white" : "text-slate-700"}`}
                  style={{ left: `${left}%`, width: `${width}%`, background: active ? "var(--brand)" : "var(--brand-soft)" }}
                  title={p.summary}
                >
                  {p.name} · wk {p.startWeek}–{p.endWeek}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function Hub() {
  const eng = useEngagement();
  const { isAdmin } = useAuth();
  const { rows: msOverrides } = useCollection("milestones");
  const { rows: dlOverrides } = useCollection("deliverables");

  const milestones = eng.milestones.map((m) => ({ ...m, ...(msOverrides.find((o) => o.id === m.id) || {}) }));
  const deliverables = eng.deliverables.map((d) => ({ ...d, status: "Not started", ...(dlOverrides.find((o) => o.id === String(d.number)) || {}) }));

  const overdueMs = milestones.filter((m) => !m.done && m.date < eng.today);
  const overdueDl = deliverables.filter((d) => d.status !== "Final" && d.dueDate < eng.today);
  const atRisk = overdueMs.length + overdueDl.length > 0;
  const next = milestones.find((m) => !m.done && m.date >= eng.today);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Engagement week" value={eng.week < 1 ? "Pre-start" : `Week ${eng.week}`} sub={`Effective ${fmt(eng.effectiveDate)} → ends ${fmt(eng.endDate)}`} />
        <Stat label="Current phase" value={eng.currentPhases.map((p) => p.name).join(" / ") || (eng.week < 1 ? "Not started" : "Complete")} />
        <Stat label="Next milestone" value={next ? `${daysBetween(eng.today, next.date)} days` : "—"} sub={next ? `${next.name} · ${fmt(next.date)}` : ""} />
        <Stat label="Timeline" value={atRisk ? "At risk" : "On track"} sub={atRisk ? `${overdueMs.length} milestone(s), ${overdueDl.length} deliverable(s) past due` : "Nothing past due"} />
      </div>

      <PhaseBar phases={eng.config.phases} week={eng.week} termWeeks={eng.config.termWeeks} />

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card">
          <div className="label">Milestones (Proposal §2.7, §3)</div>
          <ul className="divide-y divide-slate-100">
            {milestones.map((m) => (
              <li key={m.id} className="py-2 flex items-center gap-3 text-sm">
                {isAdmin ? (
                  <input type="checkbox" checked={!!m.done} onChange={(e) => save("milestones", m.id, { done: e.target.checked, actualDate: e.target.checked ? eng.today : null })} />
                ) : (
                  <span className={`pill ${m.done ? "bg-green-100 text-green-800" : "bg-slate-100 text-slate-600"}`}>{m.done ? "Done" : "Open"}</span>
                )}
                <span className={`flex-1 ${m.done ? "line-through text-slate-400" : ""}`}>{m.name}</span>
                <span className="text-slate-500 text-xs">{m.week ? `wk ${m.week}` : `day ${m.day}`} · {fmt(m.date)}</span>
                {isAdmin && decks[m.id] && <Link to={`/present/${m.id}`} className="btn text-xs py-0.5" title={`Open the ${decks[m.id].title} deck`}>▶ Present</Link>}
              </li>
            ))}
          </ul>
        </div>

        <div className="card">
          <div className="label">Deliverables (Proposal §3)</div>
          <table className="w-full text-sm">
            <thead><tr className="text-left text-xs text-slate-500"><th className="py-1">#</th><th>Deliverable</th><th>Due</th><th>Status</th>{isAdmin && <th />}</tr></thead>
            <tbody className="divide-y divide-slate-100">
              {deliverables.map((d) => (
                <tr key={d.number}>
                  <td className="py-2 pr-2 text-slate-500">{d.number}</td>
                  <td className="py-2 pr-2">{d.name}</td>
                  <td className="py-2 pr-2 text-xs text-slate-500 whitespace-nowrap">{fmt(d.dueDate)}</td>
                  <td className="py-2">
                    {isAdmin ? (
                      <select className="input" value={d.status} onChange={(e) => save("deliverables", String(d.number), { status: e.target.value })}>
                        {eng.config.deliverableStatuses.map((s) => <option key={s}>{s}</option>)}
                      </select>
                    ) : (
                      <span className={`pill ${d.status === "Final" ? "bg-green-100 text-green-800" : d.status === "Not started" ? "bg-slate-100 text-slate-600" : "bg-sky-100 text-sky-800"}`}>{d.status}</span>
                    )}
                  </td>
                  {isAdmin && (
                    <td className="py-2 pl-2">
                      <button className="text-xs underline whitespace-nowrap" title="Download a Word shell for this deliverable" onClick={() => downloadShell(eng.config, d)}>⤓ Shell</button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
