import { useState } from "react";
import { useCollection, save, remove, newId } from "../lib/data.js";
import { useEngagement } from "../lib/engagement.js";
import { fmt, today, monthKey } from "../lib/dates.js";

const money = (n) => `$${Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const CATEGORIES = ["Airfare", "Lodging", "Meals", "Ground transport", "Parking/tolls/bags", "Mileage", "Other"];

export default function Effort() {
  const eng = useEngagement();
  const cfg = eng.config;
  const { rows: entries } = useCollection("effortEntries", { orderBy: { field: "date", dir: "desc" } });
  const { rows: expenses } = useCollection("expenses", { orderBy: { field: "date", dir: "desc" } });
  const [e, setE] = useState({ date: today(), hours: 8, onsite: false, note: "" });
  const [x, setX] = useState({ date: today(), amount: "", category: "Airfare", note: "" });

  const byMonth = eng.months.map((m) => {
    const es = entries.filter((r) => monthKey(r.date) === m);
    const xs = expenses.filter((r) => monthKey(r.date) === m);
    const hours = es.reduce((s, r) => s + Number(r.hours || 0), 0);
    return {
      m,
      days: hours / cfg.hoursPerConsultingDay,
      onsite: es.filter((r) => r.onsite).length,
      expenses: xs.reduce((s, r) => s + Number(r.amount || 0), 0),
    };
  });
  const totalExpenses = expenses.reduce((s, r) => s + Number(r.amount || 0), 0);
  const thisMonth = byMonth.find((r) => r.m === monthKey(eng.today));

  async function addEntry(ev) {
    ev.preventDefault();
    await save("effortEntries", newId(), { ...e, hours: Number(e.hours) });
    setE({ date: today(), hours: 8, onsite: false, note: "" });
  }
  async function addExpense(ev) {
    ev.preventDefault();
    await save("expenses", newId(), { ...x, amount: Number(x.amount) });
    setX({ date: today(), amount: "", category: "Airfare", note: "" });
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="card">
          <div className="label">This month · consulting days</div>
          <div className="text-2xl font-semibold">{(thisMonth?.days || 0).toFixed(2)} <span className="text-base text-slate-500">/ {cfg.consultingDaysPerMonth}</span></div>
          <div className="text-xs text-slate-500">{cfg.hoursPerConsultingDay}-hour days; unused days do not carry over (§4)</div>
        </div>
        <div className="card">
          <div className="label">This month · on-site days</div>
          <div className="text-2xl font-semibold">{thisMonth?.onsite || 0} <span className="text-base text-slate-500">/ ~{cfg.onsiteDaysPerMonth}</span></div>
          <div className="text-xs text-slate-500">Propose on-site dates 14 days ahead (§4)</div>
        </div>
        <div className="card">
          <div className="label">Reimbursable expenses · term</div>
          <div className="text-2xl font-semibold">{money(totalExpenses)} <span className="text-base text-slate-500">/ {money(cfg.expenseNotToExceed)}</span></div>
          <div className={`text-xs ${totalExpenses > cfg.expenseNotToExceed * 0.85 ? "text-red-600" : "text-slate-500"}`}>Not-to-exceed without written authorization (§6)</div>
        </div>
      </div>

      <div className="card overflow-x-auto">
        <div className="label">By month</div>
        <table className="w-full text-sm">
          <thead><tr className="text-left text-xs text-slate-500"><th className="py-1">Month</th><th>Days used</th><th>Allotment</th><th>On-site</th><th>Expenses</th></tr></thead>
          <tbody className="divide-y divide-slate-100">
            {byMonth.map((r) => (
              <tr key={r.m} className={r.m === monthKey(eng.today) ? "font-semibold" : ""}>
                <td className="py-1.5">{r.m}</td>
                <td className={r.days > cfg.consultingDaysPerMonth ? "text-red-600" : ""}>{r.days.toFixed(2)}</td>
                <td>{cfg.consultingDaysPerMonth}</td>
                <td>{r.onsite}</td>
                <td>{money(r.expenses)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="card space-y-2">
          <div className="label">Log time</div>
          <form onSubmit={addEntry} className="grid grid-cols-2 gap-2">
            <input type="date" className="input" value={e.date} onChange={(ev) => setE({ ...e, date: ev.target.value })} />
            <input type="number" min="0.25" step="0.25" className="input" value={e.hours} onChange={(ev) => setE({ ...e, hours: ev.target.value })} placeholder="Hours" />
            <input className="input col-span-2" placeholder="Activity (this becomes the invoice narrative)" value={e.note} onChange={(ev) => setE({ ...e, note: ev.target.value })} />
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={e.onsite} onChange={(ev) => setE({ ...e, onsite: ev.target.checked })} /> On-site in Atlanta</label>
            <button className="btn btn-primary justify-self-end" type="submit">Add</button>
          </form>
          <ul className="divide-y divide-slate-100 text-sm max-h-72 overflow-y-auto">
            {entries.map((r) => (
              <li key={r.id} className="py-1.5 flex gap-2">
                <span className="text-slate-500 w-24 shrink-0">{fmt(r.date)}</span>
                <span className="w-12 shrink-0">{r.hours}h</span>
                <span className="flex-1">{r.note}{r.onsite && <span className="pill bg-sky-100 text-sky-800 ml-2">on-site</span>}</span>
                <button className="text-xs text-red-600 underline" onClick={() => remove("effortEntries", r.id)}>×</button>
              </li>
            ))}
          </ul>
        </section>

        <section className="card space-y-2">
          <div className="label">Log expense</div>
          <form onSubmit={addExpense} className="grid grid-cols-2 gap-2">
            <input type="date" className="input" value={x.date} onChange={(ev) => setX({ ...x, date: ev.target.value })} />
            <input type="number" min="0" step="0.01" required className="input" value={x.amount} onChange={(ev) => setX({ ...x, amount: ev.target.value })} placeholder="Amount" />
            <select className="input" value={x.category} onChange={(ev) => setX({ ...x, category: ev.target.value })}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select>
            <input className="input" placeholder="Note (receipt required)" value={x.note} onChange={(ev) => setX({ ...x, note: ev.target.value })} />
            <button className="btn btn-primary col-span-2 justify-self-end" type="submit">Add</button>
          </form>
          <ul className="divide-y divide-slate-100 text-sm max-h-72 overflow-y-auto">
            {expenses.map((r) => (
              <li key={r.id} className="py-1.5 flex gap-2">
                <span className="text-slate-500 w-24 shrink-0">{fmt(r.date)}</span>
                <span className="w-20 shrink-0">{money(r.amount)}</span>
                <span className="flex-1">{r.category}{r.note ? ` · ${r.note}` : ""}</span>
                <button className="text-xs text-red-600 underline" onClick={() => remove("expenses", r.id)}>×</button>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
