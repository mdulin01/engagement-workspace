import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../lib/auth.jsx";
import { useEngagement } from "../lib/engagement.js";
import config from "../config/engagement.json";
import Mark from "./Mark.jsx";

const link = ({ isActive }) =>
  `relative px-3 py-1.5 text-sm transition-colors ${isActive ? "text-white after:absolute after:inset-x-3 after:-bottom-0.5 after:h-0.5 after:rounded-full after:bg-teal-300" : "text-white/65 hover:text-white"}`;

export default function Layout() {
  const { user, role, isAdmin, isLeader, demo, signOut } = useAuth();
  const eng = useEngagement();
  const pct = Math.min(100, Math.max(0, (eng.week / config.termWeeks) * 100));
  return (
    <div className="min-h-screen flex flex-col">
      <header className="masthead text-white">
        <div className="relative z-10 mx-auto max-w-6xl px-4 pt-4 pb-5">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <div className="flex items-center gap-2.5 mr-auto">
              <Mark />
              <span className="text-[11px] uppercase tracking-[0.18em] text-white/60">{config.clientShort} · Engagement workspace</span>
            </div>
            <nav className="flex items-center gap-1 -mx-3 sm:mx-0 overflow-x-auto">
              <NavLink to="/" end className={link}>Hub</NavLink>
              {isLeader && <NavLink to="/status" className={link}>Status</NavLink>}
              {isLeader && <NavLink to="/interviews" className={link}>Interviews</NavLink>}
              {isAdmin && <NavLink to="/effort" className={link}>Effort</NavLink>}
              {isAdmin && <NavLink to="/admin" className={link}>Admin</NavLink>}
            </nav>
            <div className="text-xs text-white/70 flex items-center gap-2">
              {demo ? <span className="pill bg-amber-300 text-amber-950">DEMO</span> : null}
              <span className="max-w-48 truncate">{user?.email || "demo"}</span>
              <span className="pill bg-white/10 text-white/80">{role}</span>
              {!demo && <button onClick={signOut} className="underline decoration-white/30 hover:decoration-white">Sign out</button>}
            </div>
          </div>
          <h1 className="mt-5 text-2xl sm:text-3xl font-medium leading-tight max-w-3xl">{config.title}</h1>
          <div className="mt-1 text-sm text-white/65">{config.client}</div>
          <div className="mt-4 flex items-center gap-3 text-xs text-white/60">
            <div className="h-1 flex-1 max-w-md rounded-full bg-white/15 overflow-hidden">
              <div className="h-full rounded-full bg-teal-300" style={{ width: `${pct}%` }} />
            </div>
            <span className="num">{eng.week < 1 ? "Starts" : `Week ${eng.week} of ${config.termWeeks} ·`} {eng.week < 1 ? new Date(eng.effectiveDate + "T12:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : eng.currentPhases.map((p) => p.name).join(" / ")}</span>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        <Outlet />
      </main>
      <footer className="mx-auto max-w-6xl w-full px-4 py-6 text-xs text-slate-400 flex flex-wrap gap-x-4 gap-y-1">
        <span>Engagement management only. No PHI or client confidential documents are stored here (Proposal §9.2).</span>
        <span className="ml-auto">{config.consultant}</span>
      </footer>
    </div>
  );
}
