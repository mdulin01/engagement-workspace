// Firebase init. Config comes from VITE_FB_CONFIG (a JSON string) so the same
// repo deploys per client: one Firebase project + one Vercel project each.
// With no config the app runs in DEMO mode: in-memory data, no sign-in.
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const envCfg = (() => {
  try {
    return import.meta.env.VITE_FB_CONFIG ? JSON.parse(import.meta.env.VITE_FB_CONFIG) : null;
  } catch {
    return null;
  }
})();

export const ADMIN_EMAIL = String(import.meta.env.VITE_ADMIN_EMAIL || "mdulin@gmail.com").toLowerCase();
export const FIREBASE_ENABLED = Boolean(envCfg && envCfg.apiKey);
export const DEMO = !FIREBASE_ENABLED;

let app = null, auth = null, db = null, storage = null, googleProvider = null;
if (FIREBASE_ENABLED) {
  app = initializeApp(envCfg);
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
  googleProvider = new GoogleAuthProvider();
}

export { app, auth, db, storage, googleProvider };
