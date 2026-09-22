import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./lib/auth.jsx";
import Layout from "./components/Layout.jsx";
import SignIn from "./pages/SignIn.jsx";
import Hub from "./pages/Hub.jsx";
import Effort from "./pages/Effort.jsx";
import StatusLog from "./pages/StatusLog.jsx";
import Interviews from "./pages/Interviews.jsx";
import Present from "./pages/Present.jsx";
import Survey from "./pages/Survey.jsx";
import Documents from "./pages/Documents.jsx";
import Admin from "./pages/Admin.jsx";
import NoAccess from "./pages/NoAccess.jsx";

function Guard({ need, children }) {
  const { loading, user, role, demo } = useAuth();
  if (loading) return <div className="p-8 text-slate-500">Loading…</div>;
  if (!demo && !user) return <Navigate to="/signin" replace />;
  const ok =
    need === "member" ? ["admin", "team", "leader", "participant", "vendor"].includes(role)
    : need === "leader" ? ["admin", "team", "leader"].includes(role)
    : need === "team" ? ["admin", "team"].includes(role)
    : role === "admin";
  if (!ok) return <NoAccess />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/signin" element={<SignIn />} />
      <Route path="/survey/:token" element={<Survey />} />
      <Route path="/present/:deckId" element={<Guard need="team"><Present /></Guard>} />
      <Route element={<Layout />}>
        <Route path="/" element={<Guard need="member"><Hub /></Guard>} />
        <Route path="/status" element={<Guard need="leader"><StatusLog /></Guard>} />
        <Route path="/interviews" element={<Guard need="leader"><Interviews /></Guard>} />
        <Route path="/documents" element={<Guard need="leader"><Documents /></Guard>} />
        <Route path="/effort" element={<Guard need="admin"><Effort /></Guard>} />
        <Route path="/admin" element={<Guard need="admin"><Admin /></Guard>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
