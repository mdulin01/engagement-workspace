import { useState } from "react";
import { useCollection, save, remove } from "../lib/data.js";
import { useEngagement } from "../lib/engagement.js";
import { fmt } from "../lib/dates.js";

const ROLES = ["leader", "participant", "vendor", "admin"];

export default function Admin() {
  const eng = useEngagement();
  const { rows: invites } = useCollection("invites");
  const { rows: users } = useCollection("users");
  const [inv, setInv] = useState({ email: "", name: "", role: "leader" });
  const [eff, setEff] = useState("");

  async function addInvite(e) {
    e.preventDefault();
    const email = inv.email.trim().toLowerCase();
    await save("invites", email, { role: inv.role, name: inv.name.trim() });
    setInv({ email: "", name: "", role: "leader" });
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <section className="card space-y-3">
        <div className="label">Engagement settings</div>
        <p className="text-sm">Effective Date is the date of full execution. Every week number, milestone and due date is computed from it; change it here once the agreement is signed.</p>
        <div className="text-sm">Current: <b>{fmt(eng.effectiveDate)}</b> → term ends {fmt(eng.endDate)}</div>
        <form onSubmit={async (e) => { e.preventDefault(); await save("settings", "engagement", { effectiveDate: eff }); setEff(""); }} className="flex gap-2">
          <input type="date" className="input" value={eff} onChange={(e) => setEff(e.target.value)} required />
          <button className="btn btn-primary" type="submit">Set</button>
        </form>
        <div className="text-xs text-slate-500">
          Client: {eng.config.client} · Sponsor: {eng.config.sponsor} · Day-to-day: {eng.config.dayToDay}
        </div>
      </section>

      <section className="card space-y-3">
        <div className="label">Invite access</div>
        <p className="text-sm">Only invited addresses get in. A person signs in with an emailed link; their role is copied from the invite on first sign-in. Only invite people the charter's data-handling table allows.</p>
        <form onSubmit={addInvite} className="grid grid-cols-3 gap-2">
          <input type="email" required className="input col-span-3" placeholder="name@dph.ga.gov" value={inv.email} onChange={(e) => setInv({ ...inv, email: e.target.value })} />
          <input className="input col-span-2" placeholder="Name" value={inv.name} onChange={(e) => setInv({ ...inv, name: e.target.value })} />
          <select className="input" value={inv.role} onChange={(e) => setInv({ ...inv, role: e.target.value })}>{ROLES.map((r) => <option key={r}>{r}</option>)}</select>
          <button className="btn btn-primary col-span-3 justify-self-end" type="submit">Invite</button>
        </form>
        <ul className="divide-y divide-slate-100 text-sm">
          {invites.map((i) => {
            const u = users.find((x) => x.email === i.id);
            return (
              <li key={i.id} className="py-1.5 flex items-center gap-2">
                <span className="flex-1">{i.name ? `${i.name} · ` : ""}{i.id}</span>
                <span className="pill bg-slate-100">{i.role}</span>
                <span className={`pill ${u ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}`}>{u ? "signed in" : "pending"}</span>
                <button className="text-xs text-red-600 underline" onClick={async () => { if (window.confirm(`Remove ${i.id}? Their access ends on next load.`)) { await remove("invites", i.id); if (u) await remove("users", u.id); } }}>remove</button>
              </li>
            );
          })}
        </ul>
        <p className="text-xs text-slate-500">Roles: <b>leader</b> sees the hub and published status; <b>participant</b> and <b>vendor</b> see the hub only (session pages come later); <b>admin</b> is you.</p>
      </section>
    </div>
  );
}
