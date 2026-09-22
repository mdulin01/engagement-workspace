import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import decks from "../config/presentations.json";
import { useEngagement } from "../lib/engagement.js";
import { useCollection, save } from "../lib/data.js";
import { fmt } from "../lib/dates.js";

// Milestone decks. Structure comes from presentations.json (public repo, so
// prompts only); text typed here is saved to presentations/{deckId} in
// Firestore, admin only. Live slides read the same data as the hub.

const W = 1280, H = 720;
const EDITABLE = new Set(["bullets", "discussion", "team", "themes"]);

function Bullets({ items, big }) {
  return (
    <ul className={`space-y-4 ${big ? "text-[34px]" : "text-[26px]"} leading-snug`}>
      {items.filter(Boolean).map((b, i) => (
        <li key={i} className="flex gap-4">
          <span className="mt-[0.45em] h-3 w-3 shrink-0 rounded-full" style={{ background: "var(--accent)" }} />
          <span className={/^\[.*\]$/.test(b) ? "text-slate-400 italic" : ""}>{b}</span>
        </li>
      ))}
    </ul>
  );
}

function Frame({ title, children, footer }) {
  return (
    <div className="flex h-full flex-col bg-white">
      <div className="h-3" style={{ background: "var(--brand)" }} />
      <div className="px-20 pt-14 pb-6">
        <h2 className="text-[46px] font-medium" style={{ color: "var(--brand)" }}>{title}</h2>
      </div>
      <div className="flex-1 overflow-hidden px-20">{children}</div>
      <div className="flex justify-between px-20 py-6 text-[16px] text-slate-400">{footer}</div>
    </div>
  );
}

function SlideBody({ slide, ctx }) {
  const { eng, deck, milestone, deliverables, milestones, summary } = ctx;
  const cfg = eng.config;
  switch (slide.type) {
    case "title":
      return (
        <div className="masthead flex h-full flex-col justify-center px-24 text-white">
          <div className="relative z-10 text-[22px] uppercase tracking-[0.2em] text-white/60">{cfg.client}</div>
          <h1 className="relative z-10 mt-4 text-[68px] font-medium leading-tight">{deck.title}</h1>
          <div className="relative z-10 mt-3 text-[28px] text-white/80">{cfg.title}</div>
          <div className="relative z-10 mt-16 h-1 w-24 rounded-full bg-teal-300" />
          <div className="relative z-10 mt-5 text-[22px] text-white/75">{cfg.consultant} · {milestone ? fmt(milestone.date) : ""}</div>
        </div>
      );
    case "deliverables": {
      const rows = slide.numbers ? deliverables.filter((d) => slide.numbers.includes(d.number)) : deliverables;
      return (
        <table className="w-full text-[22px]">
          <thead><tr className="text-left text-[16px] uppercase tracking-wide text-slate-400"><th className="pb-3">#</th><th>Deliverable</th><th>Due</th><th>Status</th></tr></thead>
          <tbody className="divide-y divide-slate-200">
            {rows.map((d) => (
              <tr key={d.number}>
                <td className="py-3 pr-4 text-slate-400">{d.number}</td>
                <td className="py-3 pr-4">{d.name}</td>
                <td className="py-3 pr-4 whitespace-nowrap text-slate-500">{fmt(d.dueDate)}</td>
                <td className="py-3 whitespace-nowrap">{d.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    }
    case "phases":
      return (
        <div className="space-y-5">
          {cfg.phases.map((p) => {
            const active = eng.week >= p.startWeek && eng.week <= p.endWeek;
            return (
              <div key={p.id} className="flex gap-6">
                <div className="w-40 shrink-0 text-[20px] text-slate-400">Weeks {p.startWeek}–{p.endWeek}</div>
                <div>
                  <div className="text-[26px] font-semibold" style={{ color: active ? "var(--accent)" : "var(--brand)" }}>{p.name}{active ? " · now" : ""}</div>
                  <div className="text-[18px] text-slate-600">{p.summary}</div>
                </div>
              </div>
            );
          })}
        </div>
      );
    case "milestones":
      return (
        <div className="space-y-5 text-[28px]">
          {milestones.map((m) => (
            <div key={m.id} className="flex items-baseline gap-6">
              <span className="w-56 shrink-0 text-slate-500">{fmt(m.date)}</span>
              <span className={m.done ? "text-slate-400 line-through" : ""}>{m.name}</span>
            </div>
          ))}
        </div>
      );
    case "team":
      return (
        <div className="grid grid-cols-2 gap-12">
          <div className="space-y-6 text-[24px]">
            <div><div className="text-[16px] uppercase tracking-wide text-slate-400">Executive sponsor</div>{cfg.sponsor}</div>
            <div><div className="text-[16px] uppercase tracking-wide text-slate-400">Day-to-day lead</div>{cfg.dayToDay}</div>
            <div><div className="text-[16px] uppercase tracking-wide text-slate-400">Consultant</div>{cfg.consultant}</div>
          </div>
          <Bullets items={slide.bullets} />
        </div>
      );
    case "interviews": {
      const groups = cfg.interviews.groups.map((g) => ({ ...g, ...(summary?.byGroup.find((x) => x.id === g.id) || { scheduled: 0, completed: 0 }) }));
      const done = groups.reduce((s, g) => s + g.completed, 0), target = groups.reduce((s, g) => s + g.target, 0);
      return (
        <div className="grid grid-cols-3 gap-12">
          <div>
            <div className="text-[96px] font-semibold leading-none" style={{ color: "var(--brand)" }}>{done}<span className="text-[40px] text-slate-400"> / {target}</span></div>
            <div className="mt-2 text-[22px] text-slate-500">interviews completed</div>
            <div className="mt-6 text-[18px] text-slate-500">Notes held in {cfg.client} SharePoint. Counts only on this slide.</div>
          </div>
          <table className="col-span-2 w-full text-[21px]">
            <thead><tr className="text-left text-[15px] uppercase tracking-wide text-slate-400"><th className="pb-2">Stakeholder group</th><th>Scheduled</th><th>Done</th><th>Target</th></tr></thead>
            <tbody className="divide-y divide-slate-200">
              {groups.map((g) => (
                <tr key={g.id}><td className="py-2">{g.name}</td><td>{g.scheduled}</td><td style={{ color: g.completed >= g.target ? "var(--accent)" : undefined }}>{g.completed}</td><td className="text-slate-400">{g.target}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    case "themes": {
      const themes = (summary?.themes || []).slice(0, 8);
      const max = Math.max(1, ...themes.map((t) => t.count));
      return (
        <div className="grid grid-cols-2 gap-12">
          <div className="space-y-3">
            {themes.length === 0 && <div className="text-[22px] text-slate-400 italic">No themes tagged yet.</div>}
            {themes.map((t) => (
              <div key={t.label}>
                <div className="flex justify-between text-[20px]"><span>{t.label}</span><span className="text-slate-500">{t.count}</span></div>
                <div className="h-3 rounded bg-slate-100"><div className="h-3 rounded" style={{ width: `${(t.count / max) * 100}%`, background: "var(--accent)" }} /></div>
              </div>
            ))}
            <div className="pt-2 text-[15px] text-slate-400">Completed interviews tagged with each theme. Not broken out by group or person.</div>
          </div>
          <Bullets items={slide.bullets} />
        </div>
      );
    }
    case "upcoming": {
      const next = milestones.filter((m) => !m.done && m.date >= eng.today).slice(0, 3);
      const due = deliverables.filter((d) => d.status !== "Final" && d.dueDate >= eng.today).slice(0, 4);
      return (
        <div className="grid grid-cols-2 gap-12 text-[24px]">
          <div>
            <div className="mb-3 text-[16px] uppercase tracking-wide text-slate-400">Coming milestones</div>
            {next.map((m) => <div key={m.id} className="py-2"><span className="text-slate-500">{fmt(m.date)}</span> · {m.name}</div>)}
          </div>
          <div>
            <div className="mb-3 text-[16px] uppercase tracking-wide text-slate-400">Deliverables due</div>
            {due.map((d) => <div key={d.number} className="py-2"><span className="text-slate-500">{fmt(d.dueDate)}</span> · D{d.number} {d.name}</div>)}
          </div>
        </div>
      );
    }
    case "discussion":
      return <Bullets items={slide.bullets} big />;
    default:
      return <Bullets items={slide.bullets || []} />;
  }
}

function Slide({ slide, ctx, index, total }) {
  if (slide.type === "title") return <SlideBody slide={slide} ctx={ctx} />;
  return (
    <Frame title={slide.title} footer={<><span>{ctx.eng.config.clientShort} · {ctx.deck.title}</span><span>{index + 1} / {total}</span></>}>
      <SlideBody slide={slide} ctx={ctx} />
    </Frame>
  );
}

function Editor({ slide, onSave, onClose }) {
  const [title, setTitle] = useState(slide.title || "");
  const [text, setText] = useState((slide.bullets || []).join("\n"));
  return (
    <div className="absolute inset-y-0 right-0 z-20 w-96 space-y-2 overflow-y-auto bg-white p-4 shadow-xl">
      <div className="label">Edit slide</div>
      <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} />
      <textarea className="input" rows={12} value={text} onChange={(e) => setText(e.target.value)} />
      <p className="text-xs text-slate-500">One bullet per line. Saved to the workspace (admin only), not the public repo. No PHI and no quotes from interviews.</p>
      <div className="flex gap-2">
        <button className="btn btn-primary" onClick={() => onSave({ title: title.trim(), bullets: text.split("\n").map((s) => s.trim()).filter(Boolean) })}>Save</button>
        <button className="btn" onClick={onClose}>Close</button>
        <button className="btn ml-auto" onClick={() => onSave(null)} title="Back to the template text">Reset</button>
      </div>
    </div>
  );
}

export default function Present() {
  const { deckId } = useParams();
  const deck = decks[deckId];
  const eng = useEngagement();
  const { rows: msOverrides } = useCollection("milestones");
  const { rows: dlOverrides } = useCollection("deliverables");
  const { rows: summaries } = useCollection("interviewSummary");
  const { rows: saved } = useCollection("presentations");
  const [i, setI] = useState(() => Math.max(0, parseInt(window.location.hash.slice(1), 10) - 1 || 0));
  const [editing, setEditing] = useState(false);
  const [scale, setScale] = useState(1);
  const stage = useRef(null);

  const overrides = saved.find((r) => r.id === deckId)?.slides || {};
  const slides = (deck?.slides || []).map((s) => ({ ...s, ...(overrides[s.id] || {}) }));
  const n = slides.length;

  // Slide number in the URL (#3) so a reload or shared link lands on the same slide.
  useEffect(() => { window.history.replaceState(null, "", `#${i + 1}`); }, [i]);

  useEffect(() => {
    const fit = () => {
      const el = stage.current;
      if (el) setScale(Math.min(el.clientWidth / W, el.clientHeight / H));
    };
    fit();
    window.addEventListener("resize", fit);
    document.addEventListener("fullscreenchange", fit);
    return () => { window.removeEventListener("resize", fit); document.removeEventListener("fullscreenchange", fit); };
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.target.closest?.("input, textarea")) return;
      if (["ArrowRight", "PageDown", " "].includes(e.key)) { e.preventDefault(); setI((x) => Math.min(n - 1, x + 1)); }
      else if (["ArrowLeft", "PageUp"].includes(e.key)) { e.preventDefault(); setI((x) => Math.max(0, x - 1)); }
      else if (e.key === "Home") setI(0);
      else if (e.key === "End") setI(n - 1);
      else if (e.key === "f") fullscreen();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [n]);

  if (!deck) return <div className="p-8">No presentation for “{deckId}”. <Link className="underline" to="/">Back to hub</Link></div>;

  const ctx = {
    eng, deck,
    milestone: eng.milestones.find((m) => m.id === deckId),
    milestones: eng.milestones.map((m) => ({ ...m, ...(msOverrides.find((o) => o.id === m.id) || {}) })),
    deliverables: eng.deliverables.map((d) => ({ ...d, status: "Not started", ...(dlOverrides.find((o) => o.id === String(d.number)) || {}) })),
    summary: summaries.find((r) => r.id === "current"),
  };
  const slide = slides[i];

  function fullscreen() {
    if (document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen?.();
  }

  async function saveSlide(fields) {
    const next = { ...overrides };
    if (fields) next[slide.id] = fields; else delete next[slide.id];
    await save("presentations", deckId, { slides: next });
    if (!fields) setEditing(false);
  }

  return (
    <>
      <div className="fixed inset-0 flex flex-col bg-slate-900 print:hidden">
        <div ref={stage} className="relative flex flex-1 items-center justify-center overflow-hidden" onClick={(e) => { if (!editing && e.target === e.currentTarget) setI((x) => Math.min(n - 1, x + 1)); }}>
          <div style={{ width: W, height: H, transform: `scale(${scale})` }} className="shrink-0 overflow-hidden shadow-2xl" onClick={() => !editing && setI((x) => Math.min(n - 1, x + 1))}>
            <Slide slide={slide} ctx={ctx} index={i} total={n} />
          </div>
          {editing && <Editor key={`${deckId}-${slide.id}`} slide={slide} onSave={saveSlide} onClose={() => setEditing(false)} />}
        </div>
        <div className="flex items-center gap-2 bg-slate-800 px-4 py-2 text-sm text-white/80">
          <Link to="/" className="underline">Exit</Link>
          <span className="mx-2 text-white/40">|</span>
          <button onClick={() => setI((x) => Math.max(0, x - 1))} disabled={i === 0} className="px-2 disabled:opacity-30">◀</button>
          <span>{i + 1} / {n}</span>
          <button onClick={() => setI((x) => Math.min(n - 1, x + 1))} disabled={i === n - 1} className="px-2 disabled:opacity-30">▶</button>
          <span className="ml-2 truncate text-white/50">{deck.title}</span>
          <span className="ml-auto flex gap-3">
            {EDITABLE.has(slide.type) && <button onClick={() => setEditing((x) => !x)} className="underline">{editing ? "Done editing" : "Edit slide"}</button>}
            <button onClick={() => window.print()} className="underline">Print / PDF</button>
            <button onClick={fullscreen} className="underline">Full screen (F)</button>
          </span>
        </div>
      </div>
      <div className="hidden print:block">
        {slides.map((s, k) => (
          <div key={s.id} className="deck-print-page" style={{ width: W, height: H }}>
            <Slide slide={s} ctx={ctx} index={k} total={n} />
          </div>
        ))}
      </div>
    </>
  );
}
