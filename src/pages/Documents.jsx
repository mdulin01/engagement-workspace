import { useState } from "react";
import { useCollection, save, remove, newId } from "../lib/data.js";
import { useAuth } from "../lib/auth.jsx";
import { fmt, today } from "../lib/dates.js";
import config from "../config/engagement.json";

// Links to engagement documents (contract, amendments, charter). Files stay
// where they are stored; the site keeps title, link and who can see it.

const CATEGORIES = ["Contract", "Amendment", "Charter", "Engagement", "Other"];
const blank = () => ({ title: "", category: "Contract", url: "", visibility: "leaders", date: today(), note: "" });

// Built on click so the docx library only loads when needed.
async function downloadAddendum(keyPersonnel) {
  const { buildAddendum, addendumToBlob, addendumFileName } = await import("../lib/addendum.js");
  const blob = await addendumToBlob(buildAddendum({ config, siteUrl: window.location.origin, keyPersonnel }));
  const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: addendumFileName(config, keyPersonnel) });
  a.click();
  URL.revokeObjectURL(a.href);
}

// Key personnel live in Firestore, not in the (public) repo.
const KP_BLANK = { name: "", credentials: "", role: "", qualifications: "" };

function KeyPersonnel({ kp, onSave }) {
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ ...KP_BLANK, ...kp });
  const named = kp?.name;
  return (
    <div className="border-t pt-3 mt-3" style={{ borderColor: "var(--line)" }}>
      <div className="flex items-baseline gap-2 text-sm">
        <span className="text-slate-500">Key personnel:</span>
        <span>{named ? `${kp.name}, ${kp.credentials}` : "none — Consultant performs all Services personally (§4)"}</span>
        <button className="ml-auto text-xs underline" onClick={() => setOpen(!open)}>{open ? "close" : named ? "edit" : "add"}</button>
      </div>
      {open && (
        <form className="mt-2 space-y-2" onSubmit={(e) => { e.preventDefault(); onSave(f); setOpen(false); }}>
          <div className="grid gap-2 sm:grid-cols-2">
            <input className="input" placeholder="Name (e.g. Jane Doe)" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
            <input className="input" placeholder="Credentials (e.g. MD, MMCi)" value={f.credentials} onChange={(e) => setF({ ...f, credentials: e.target.value })} />
          </div>
          <input className="input" placeholder="Role (e.g. the AI opportunity assessment described in §2.5 and Deliverable 3)" value={f.role} onChange={(e) => setF({ ...f, role: e.target.value })} />
          <textarea className="input" rows={3} placeholder="Qualifications: a sentence or two from their CV." value={f.qualifications} onChange={(e) => setF({ ...f, qualifications: e.target.value })} />
          <div className="flex gap-2">
            <button className="btn btn-primary" type="submit">Save</button>
            {named && <button className="btn text-red-600" type="button" onClick={() => { onSave(null); setOpen(false); }}>Remove</button>}
          </div>
          <p className="text-xs text-slate-500">Stored in this workspace, not in the code repository. Adding a person here adds Section 9 (Key personnel) to the draft, recording Client consent under §4.</p>
        </form>
      )}
    </div>
  );
}

export default function Documents() {
  const { isAdmin, isTeam } = useAuth();
  const { rows, loading, error } = useCollection("documents", { where: isTeam ? null : ["visibility", "==", "leaders"] });
  const { rows: settings } = useCollection("settings", { enabled: isAdmin });
  const kp = settings.find((r) => r.id === "keyPersonnel");
  const keyPersonnel = kp?.name ? { name: kp.name, credentials: kp.credentials, role: kp.role, qualifications: kp.qualifications } : null;
  const [d, setD] = useState(blank);
  const [editing, setEditing] = useState(null);
  const [err, setErr] = useState("");

  async function submit(e) {
    e.preventDefault();
    let url;
    try { url = new URL(d.url.trim()); } catch { url = null; }
    if (!url || url.protocol !== "https:") { setErr("Paste an https link to where the document is stored (SharePoint, Google Drive, etc.)."); return; }
    setErr("");
    await save("documents", editing || newId(), { ...d, title: d.title.trim(), note: d.note.trim(), url: url.href });
    setD(blank()); setEditing(null);
  }

  const sorted = [...rows].sort((a, b) => CATEGORIES.indexOf(a.category) - CATEGORIES.indexOf(b.category) || (b.date || "").localeCompare(a.date || ""));

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className={`space-y-4 ${isAdmin ? "lg:col-span-2" : "lg:col-span-3"}`}>
        <div className="card">
          <div className="label">Engagement documents</div>
          {loading && <p className="text-sm text-slate-500">Loading…</p>}
          {error && <p className="text-sm text-red-600">{error}</p>}
          {!loading && sorted.length === 0 && <p className="text-sm text-slate-500">No documents yet.</p>}
          <ul className="divide-y" style={{ borderColor: "var(--line)" }}>
            {sorted.map((r) => (
              <li key={r.id} className="py-3 flex flex-wrap items-center gap-3">
                <span className="pill bg-slate-100 text-slate-600 w-24 text-center">{r.category}</span>
                <span className="flex-1 min-w-48">
                  <a href={r.url} target="_blank" rel="noopener noreferrer" className="font-medium hover:underline" style={{ color: "var(--brand)" }}>{r.title} ↗</a>
                  <span className="block text-xs text-slate-500">{r.date ? fmt(r.date) : ""}{r.note ? ` · ${r.note}` : ""}</span>
                </span>
                {isAdmin && (
                  <>
                    <span className={`pill ${r.visibility === "leaders" ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}`}>{r.visibility === "leaders" ? "Leaders" : "Admin only"}</span>
                    <button className="text-xs underline" onClick={() => { setEditing(r.id); setD({ ...blank(), ...Object.fromEntries(Object.keys(blank()).map((k) => [k, r[k] ?? blank()[k]])) }); }}>Edit</button>
                    <button className="text-xs underline text-red-600" onClick={() => { if (window.confirm(`Remove "${r.title}" from the list? The document itself is not deleted.`)) remove("documents", r.id); }}>Remove</button>
                  </>
                )}
              </li>
            ))}
          </ul>
        </div>
        {isAdmin && (
          <div className="card flex flex-wrap items-center gap-x-3 gap-y-1">
            <div className="flex-1 min-w-64">
              <div className="font-medium" style={{ color: "var(--brand)" }}>Amendment No. 1: {keyPersonnel ? "Engagement Workspace and Key Personnel" : "Use of the Engagement Workspace"}</div>
              <p className="text-sm text-slate-500">Draft generated from this engagement's settings. Have Client counsel review it, get it signed, store the signed copy, then add its link above as an Amendment.</p>
            </div>
            <button className="btn btn-primary" onClick={() => downloadAddendum(keyPersonnel)}>⤓ Download draft</button>
            <div className="basis-full">
              <KeyPersonnel kp={kp} onSave={(f) => save("settings", "keyPersonnel", f || { ...KP_BLANK })} />
            </div>
          </div>
        )}
      </div>

      {isAdmin && (
        <form onSubmit={submit} className="card space-y-2 self-start">
          <div className="label">{editing ? "Edit document link" : "Add document link"}</div>
          <input className="input" placeholder="Title (e.g. Services Agreement, signed)" required maxLength={160} value={d.title} onChange={(e) => setD({ ...d, title: e.target.value })} />
          <div className="grid grid-cols-2 gap-2">
            <select className="input" value={d.category} onChange={(e) => setD({ ...d, category: e.target.value })}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select>
            <input type="date" className="input" value={d.date} onChange={(e) => setD({ ...d, date: e.target.value })} />
          </div>
          <input className="input" placeholder="https:// link to the stored file" required value={d.url} onChange={(e) => setD({ ...d, url: e.target.value })} />
          <input className="input" placeholder="Note (optional)" maxLength={300} value={d.note} onChange={(e) => setD({ ...d, note: e.target.value })} />
          <select className="input" value={d.visibility} onChange={(e) => setD({ ...d, visibility: e.target.value })}>
            <option value="leaders">Visible to leaders</option>
            <option value="admin">Admin only</option>
          </select>
          {err && <p className="text-xs text-red-600">{err}</p>}
          <div className="flex gap-2">
            <button className="btn btn-primary" type="submit">{editing ? "Save" : "Add"}</button>
            {editing && <button className="btn" type="button" onClick={() => { setEditing(null); setD(blank()); setErr(""); }}>Cancel</button>}
          </div>
          <p className="text-xs text-slate-500">The site stores the link, not the file. Leaders also need access to wherever the file lives.</p>
        </form>
      )}
    </div>
  );
}
