import { createContext, useContext, useEffect, useState } from "react";
import {
  onAuthStateChanged, isSignInWithEmailLink, signInWithEmailLink, sendSignInLinkToEmail,
  signInWithPopup, signOut as fbSignOut,
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db, googleProvider, DEMO, ADMIN_EMAIL } from "./firebase.js";

const EMAIL_KEY = "ew.signin.email";
const AuthCtx = createContext(null);

// Role resolution: the owner email is always admin; everyone else needs a
// users/{uid} doc, created on first sign-in from a matching invites/{email}.
async function resolveRole(user) {
  const email = (user.email || "").toLowerCase();
  if (email === ADMIN_EMAIL) {
    const ref = doc(db, "users", user.uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, { email, role: "admin", name: user.displayName || "", createdAt: serverTimestamp() });
    }
    return "admin";
  }
  const userRef = doc(db, "users", user.uid);
  const userSnap = await getDoc(userRef);
  if (userSnap.exists()) return userSnap.data().role || "none";
  const inviteSnap = await getDoc(doc(db, "invites", email));
  if (!inviteSnap.exists()) return "none";
  const role = inviteSnap.data().role || "participant";
  await setDoc(userRef, { email, role, name: inviteSnap.data().name || "", createdAt: serverTimestamp() });
  return role;
}

export function AuthProvider({ children }) {
  const [state, setState] = useState({ loading: !DEMO, user: null, role: DEMO ? "admin" : "none", error: null });

  useEffect(() => {
    if (DEMO) return;
    // Complete an email-link sign-in if this load is one.
    (async () => {
      if (isSignInWithEmailLink(auth, window.location.href)) {
        let email = window.localStorage.getItem(EMAIL_KEY);
        if (!email) email = window.prompt("Confirm the email address you used to sign in");
        if (email) {
          try {
            await signInWithEmailLink(auth, email, window.location.href);
            window.localStorage.removeItem(EMAIL_KEY);
            window.history.replaceState({}, "", window.location.pathname);
          } catch (e) {
            setState((s) => ({ ...s, error: e.message }));
          }
        }
      }
    })();
    return onAuthStateChanged(auth, async (user) => {
      if (!user) return setState({ loading: false, user: null, role: "none", error: null });
      try {
        const role = await resolveRole(user);
        setState({ loading: false, user, role, error: null });
      } catch (e) {
        setState({ loading: false, user, role: "none", error: e.message });
      }
    });
  }, []);

  const api = {
    ...state,
    demo: DEMO,
    isAdmin: state.role === "admin",
    isLeader: state.role === "leader" || state.role === "admin",
    async sendLink(email) {
      const clean = email.trim().toLowerCase();
      await sendSignInLinkToEmail(auth, clean, { url: `${window.location.origin}/signin`, handleCodeInApp: true });
      window.localStorage.setItem(EMAIL_KEY, clean);
    },
    async signInGoogle() {
      await signInWithPopup(auth, googleProvider);
    },
    async signOut() {
      if (!DEMO) await fbSignOut(auth);
    },
  };
  return <AuthCtx.Provider value={api}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  return useContext(AuthCtx);
}
