import { useAuth } from "../lib/auth.jsx";

export default function NoAccess() {
  const { user, signOut } = useAuth();
  return (
    <div className="card max-w-lg">
      <h1 className="font-semibold text-lg mb-2">No access</h1>
      <p className="text-sm text-slate-600">
        {user?.email} is signed in but has not been invited to this workspace. Ask the consultant to add your address, then sign in again.
      </p>
      <button onClick={signOut} className="btn mt-4">Sign out</button>
    </div>
  );
}
