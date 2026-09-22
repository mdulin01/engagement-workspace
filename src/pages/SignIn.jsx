import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../lib/auth.jsx";
import config from "../config/engagement.json";
import Mark from "../components/Mark.jsx";

export default function SignIn() {
  const { user, demo, sendLink, signInGoogle, error, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState(null);

  if (demo || user) return <Navigate to="/" replace />;

  async function submit(e) {
    e.preventDefault();
    setErr(null);
    try {
      await sendLink(email);
      setSent(true);
    } catch (ex) {
      setErr(ex.message);
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="masthead text-white p-8 sm:p-12 flex flex-col justify-between min-h-64">
        <div className="relative z-10 flex items-center gap-2.5">
          <Mark size={32} />
          <span className="text-[11px] uppercase tracking-[0.18em] text-white/60">Engagement workspace</span>
        </div>
        <div className="relative z-10 max-w-lg">
          <div className="text-sm text-white/60">{config.client}</div>
          <h1 className="mt-2 text-3xl sm:text-4xl font-medium leading-tight">{config.title}</h1>
          <p className="mt-4 text-white/70 text-sm">Timeline, status and working materials for the engagement, in one place.</p>
        </div>
      </div>
      <div className="flex items-center justify-center p-6">
      <div className="card w-full max-w-md">
        <h2 className="text-xl font-medium mb-4" style={{ color: "var(--brand)" }}>Sign in</h2>
        {loading ? <p className="text-slate-500">Checking sign-in…</p> : sent ? (
          <p>Check <b>{email}</b> for a sign-in link. It opens this site and signs you in; no password needed.</p>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <label className="label" htmlFor="email">Work email</label>
            <input id="email" type="email" required className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@dph.ga.gov" />
            <button className="btn btn-primary w-full justify-center" type="submit">Email me a sign-in link</button>
            <p className="text-xs text-slate-500">Access is by invitation. If your address has not been invited you will see a “no access” page after signing in.</p>
            <div className="pt-3 border-t" style={{ borderColor: "var(--line)" }}>
              <button type="button" onClick={signInGoogle} className="btn w-full justify-center">Sign in with Google (consultant)</button>
            </div>
          </form>
        )}
        {(err || error) && <p className="mt-3 text-sm text-red-600">{err || error}</p>}
      </div>
      </div>
    </div>
  );
}
