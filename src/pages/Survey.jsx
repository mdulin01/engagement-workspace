import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import survey from "../config/survey.json";
import config from "../config/engagement.json";
import { getOne, save } from "../lib/data.js";

// Public pre-interview survey at /survey/<token>. No sign-in: the token in
// the link is the credential, and the rules allow one submission per token.

const blank = () => ({
  profile: { title: "", unit: "", group: "", tenureOrg: "", tenureRole: "" },
  systems: [],
  systemsOther: "",
  hours: Object.fromEntries(survey.hours.map((h) => [h.id, 0])),
  ratings: Object.fromEntries(survey.domains.map((d) => [d.id, null])),
  ai: Object.fromEntries(survey.ai.map((d) => [d.id, null])),
  text: Object.fromEntries(survey.text.map((t) => [t.id, ""])),
});

function Section({ n, title, children }) {
  return (
    <section className="card space-y-4">
      <div className="flex items-baseline gap-3">
        <span className="font-display text-2xl" style={{ color: "var(--accent)" }}>{n}</span>
        <h2 className="text-xl font-medium" style={{ color: "var(--brand)" }}>{title}</h2>
      </div>
      {children}
    </section>
  );
}

function Scale({ value, onChange, name }) {
  const opts = [1, 2, 3, 4, 5];
  return (
    <div className="flex flex-wrap items-center gap-1.5" role="radiogroup" aria-label={name}>
      {opts.map((v) => (
        <button type="button" key={v} role="radio" aria-checked={value === v} onClick={() => onChange(v)}
          className="h-9 w-9 rounded-full text-sm font-medium transition num"
          style={value === v ? { background: "var(--brand)", color: "white" } : { border: "1px solid var(--line)", background: "white" }}>
          {v}
        </button>
      ))}
      <button type="button" role="radio" aria-checked={value === 0} onClick={() => onChange(0)}
        className="ml-1 h-9 rounded-full px-3 text-xs transition"
        style={value === 0 ? { background: "var(--brand)", color: "white" } : { border: "1px solid var(--line)", background: "white", color: "#64748b" }}>
        Don’t know
      </button>
    </div>
  );
}

export default function Survey() {
  const { token } = useParams();
  const [state, setState] = useState("loading");
  const [a, setA] = useState(blank);
  const [error, setError] = useState("");

  useEffect(() => {
    getOne("surveyInvites", token)
      .then((inv) => setState(inv ? "open" : "invalid"))
      .catch(() => setState("invalid"));
  }, [token]);

  const set = (part, key, value) => setA((x) => ({ ...x, [part]: { ...x[part], [key]: value } }));
  const unanswered = [...Object.values(a.ratings), ...Object.values(a.ai)].filter((v) => v === null).length;

  async function submit(e) {
    e.preventDefault();
    setError("");
    const clean = {
      ...a,
      // unanswered ratings are stored as 0 ("don't know")
      ratings: Object.fromEntries(Object.entries(a.ratings).map(([k, v]) => [k, v ?? 0])),
      ai: Object.fromEntries(Object.entries(a.ai).map(([k, v]) => [k, v ?? 0])),
      hours: Object.fromEntries(Object.entries(a.hours).map(([k, v]) => [k, Math.min(80, Math.max(0, Number(v) || 0))])),
    };
    try {
      await save("surveyResponses", token, clean);
      setState("done");
    } catch {
      setError("This survey could not be submitted. It may already have been completed from this link.");
    }
  }

  const shell = (children) => (
    <div className="min-h-screen">
      <header className="masthead text-white">
        <div className="relative z-10 mx-auto max-w-2xl px-5 py-10">
          <div className="label !text-white/60">{config.client}</div>
          <h1 className="text-4xl font-medium">{survey.title}</h1>
          <p className="mt-2 text-white/75">{config.title}</p>
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-5 py-8">{children}</main>
    </div>
  );

  if (state === "loading") return shell(<p className="text-slate-500">Loading…</p>);
  if (state === "invalid") return shell(<div className="card">This survey link is not valid. Please check the link in your email, or contact {config.consultant}.</div>);
  if (state === "done") return shell(
    <div className="card text-center space-y-2 py-10">
      <div className="font-display text-3xl" style={{ color: "var(--accent)" }}>Thank you.</div>
      <p className="text-slate-600">Your answers are in. We’ll use them to make the most of our conversation.</p>
    </div>,
  );

  return shell(
    <form onSubmit={submit} className="space-y-5">
      <p className="text-slate-600 leading-relaxed">{survey.intro}</p>

      <Section n="1" title="About you">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm">Title<input className="input mt-1" maxLength={120} value={a.profile.title} onChange={(e) => set("profile", "title", e.target.value)} /></label>
          <label className="text-sm">Program or unit<input className="input mt-1" maxLength={120} value={a.profile.unit} onChange={(e) => set("profile", "unit", e.target.value)} /></label>
          <label className="text-sm">Time at {config.clientShort}
            <select className="input mt-1" value={a.profile.tenureOrg} onChange={(e) => set("profile", "tenureOrg", e.target.value)}>
              <option value="">Choose…</option>{survey.tenureOptions.map((o) => <option key={o}>{o}</option>)}
            </select>
          </label>
          <label className="text-sm">Time in your current role
            <select className="input mt-1" value={a.profile.tenureRole} onChange={(e) => set("profile", "tenureRole", e.target.value)}>
              <option value="">Choose…</option>{survey.tenureOptions.map((o) => <option key={o}>{o}</option>)}
            </select>
          </label>
          <label className="text-sm sm:col-span-2">Which best describes your area?
            <select className="input mt-1" value={a.profile.group} onChange={(e) => set("profile", "group", e.target.value)}>
              <option value="">Choose…</option>{config.interviews.groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </label>
        </div>
      </Section>

      <Section n="2" title="Systems you use weekly">
        <div className="grid gap-2 sm:grid-cols-2">
          {survey.systems.map((s) => (
            <label key={s} className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={a.systems.includes(s)} onChange={(e) => setA((x) => ({ ...x, systems: e.target.checked ? [...x.systems, s] : x.systems.filter((y) => y !== s) }))} />
              {s}
            </label>
          ))}
        </div>
        <input className="input" placeholder="Other systems" maxLength={200} value={a.systemsOther} onChange={(e) => setA({ ...a, systemsOther: e.target.value })} />
      </Section>

      <Section n="3" title="Time on data work">
        <p className="text-sm text-slate-500 -mt-2">Roughly how many hours in a typical week?</p>
        {survey.hours.map((h) => (
          <label key={h.id} className="flex items-center justify-between gap-4 text-sm">
            <span>{h.label}</span>
            <input type="number" min={0} max={80} step={0.5} className="input w-24 num text-right" value={a.hours[h.id]} onChange={(e) => set("hours", h.id, e.target.value)} />
          </label>
        ))}
      </Section>

      <Section n="4" title="How things work today">
        <p className="text-sm text-slate-500 -mt-2">1 = strongly disagree, 5 = strongly agree.</p>
        {survey.domains.map((d) => (
          <div key={d.id} className="space-y-1.5 border-t pt-3 first:border-0 first:pt-0" style={{ borderColor: "var(--line)" }}>
            <div className="text-sm">{d.label}</div>
            <Scale name={d.label} value={a.ratings[d.id]} onChange={(v) => set("ratings", d.id, v)} />
          </div>
        ))}
      </Section>

      <Section n="5" title="AI">
        {survey.ai.map((d) => (
          <div key={d.id} className="space-y-1.5">
            <div className="text-sm">{d.label}</div>
            <Scale name={d.label} value={a.ai[d.id]} onChange={(v) => set("ai", d.id, v)} />
          </div>
        ))}
      </Section>

      <Section n="6" title="In your words">
        <p className="text-sm text-slate-500 -mt-2">Optional. A sentence or two is plenty. No patient or client details, please.</p>
        {survey.text.map((t) => (
          <label key={t.id} className="block text-sm">{t.label}
            <textarea className="input mt-1" rows={3} maxLength={survey.textMax} value={a.text[t.id]} onChange={(e) => set("text", t.id, e.target.value)} />
            <span className="text-xs text-slate-400 num">{a.text[t.id].length}/{survey.textMax}</span>
          </label>
        ))}
      </Section>

      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex items-center gap-4">
        <button className="btn btn-primary !px-6 !py-2.5" type="submit">Submit</button>
        {unanswered > 0 && <span className="text-xs text-slate-500">{unanswered} rating(s) left blank will be recorded as “don’t know”.</span>}
      </div>
    </form>,
  );
}
