import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../lib/auth.jsx";
import config from "../config/engagement.json";

const link = ({ isActive }) =>
  `px-3 py-1.5 rounded-md text-sm ${isActive ? "bg-white/20 text-white" : "text-white/80 hover:text-white"}`;

export default function Layout() {
  const { user, role, isAdmin, isLeader, demo, signOut } = useAuth();
  return (
    <div className="min-h-screen flex flex-col">
      <header style={{ background: "var(--brand)" }} className="text-white">
        <div className="mx-auto max-w-6xl px-4 py-3 flex flex-wrap items-center gap-3">
          <div className="mr-auto">
            <div className="text-xs uppercase tracking-wider text-white/70">{config.clientShort} engagement workspace</div>
            <div className="font-semibold leading-tight">{config.title}</div>
          </div>
          <nav className="flex items-center gap-1">
            <NavLink to="/" end className={link}>Hub</NavLink>
            {isLeader && <NavLink to="/status" className={link}>Status</NavLink>}
            {isLeader && <NavLink to="/interviews" className={link}>Interviews</NavLink>}
            {isAdmin && <NavLink to="/effort" className={link}>Effort</NavLink>}
            {isAdmin && <NavLink to="/admin" className={link}>Admin</NavLink>}
          </nav>
          <div className="text-xs text-white/80 flex items-center gap-2">
            {demo ? <span className="pill bg-amber-300 text-amber-900">DEMO</span> : null}
            <span>{user?.email || "demo"} · {role}</span>
            {!demo && <button onClick={signOut} className="underline">Sign out</button>}
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        <Outlet />
      </main>
      <footer className="mx-auto max-w-6xl w-full px-4 py-4 text-xs text-slate-400">
        Engagement management only. No PHI or client confidential documents are stored here (Proposal §9.2).
      </footer>
    </div>
  );
}
