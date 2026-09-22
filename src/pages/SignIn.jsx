import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../lib/auth.jsx";
import config from "../config/engagement.json";

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
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="card w-full max-w-md">
        <div className="text-xs uppercase tracking-wider text-slate-500">{config.clientShort} engagement workspace</div>
        <h1 className="text-lg font-semibold mb-4">{config.title}</h1>
        {loading ? <p className="text-slate-500">Checking sign-in…</p> : sent ? (
          <p>Check <b>{email}</b> for a sign-in link. It opens this site and signs you in; no password needed.</p>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <label className="label" htmlFor="email">Work email</label>
            <input id="email" type="email" required className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@dph.ga.gov" />
            <button className="btn btn-primary w-full justify-center" type="submit">Email me a sign-in link</button>
            <p className="text-xs text-slate-500">Access is by invitation. If your address has not been invited you will see a “no access” page after signing in.</p>
            <div className="pt-2 border-t border-slate-200">
              <button type="button" onClick={signInGoogle} className="btn w-full justify-center">Sign in with Google (consultant)</button>
            </div>
          </form>
        )}
        {(err || error) && <p className="mt-3 text-sm text-red-600">{err || error}</p>}
      </div>
    </div>
  );
}
