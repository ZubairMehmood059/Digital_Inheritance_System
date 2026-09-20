// src/App.jsx
// CHANGES FROM ORIGINAL:
//   1. Theme state (light/dark) added here — no separate hook, no new folder
//   2. Theme applied to <html data-theme> and saved in localStorage
//   3. theme + toggleTheme passed to AppLayout → Sidebar
//   4. /legacy-trigger route added
//   5. /bills route added
//   All existing routes and logic unchanged

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
<<<<<<< HEAD
import { auth } from "./firebase/config";
=======
import { auth, firebaseConfigError } from "./firebase/config";
>>>>>>> da8dc0b (Fix Netlify deployment)
import { getUserData } from "./firebase/db";
import AppLayout from "./components/layout/AppLayout";
// ── PATTERN 5: Bridge ─────────────────────────────────────────────
import { switchTheme } from "./patterns/bridge/ThemeBridge";
// ── FEATURE: Bill Auto-Status Updater ────────────────────────────
import { runBillAutoUpdate } from "./utils/billAutoUpdate";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Vault from "./pages/Vault";
import Nominees from "./pages/Nominees";
import AILetter from "./pages/AILetter";
import Inheritance from "./pages/Inheritance";
import EmergencyCard from "./pages/EmergencyCard";
import EmergencyPublic from "./pages/EmergencyPublic";
import DocumentVault from "./pages/DocumentVault";
import UdhaarManager from "./pages/UdhaarManager";
import SubscriptionTracker from "./pages/SubscriptionTracker";
import TimeCapsule from "./pages/TimeCapsule";
import BillManager from "./pages/BillManager";
import LegacyTrigger from "./pages/LegacyTrigger"; 
import MedicalPassport from "./pages/MedicalPassport";
import NetWorth from "./pages/NetWorth";
import AIChatAssistant from "./pages/AIChatAssistant";

// ── Loading screen (unchanged) ───────────────────────────────────────────────
function LoadingScreen() {
  return (
    <div style={{ minHeight:"100vh", background:"var(--bg)", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ textAlign:"center" }}>
        <div style={{ width:"32px", height:"32px", border:"2.5px solid var(--brand-light)", borderTop:"2.5px solid var(--brand)", borderRadius:"50%", animation:"spin 0.9s linear infinite", margin:"0 auto 12px" }} />
        <p style={{ color:"var(--text-3)", fontSize:"13px" }}>Loading...</p>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

<<<<<<< HEAD
=======
function ConfigurationErrorScreen() {
  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: "24px", background: "var(--bg, #f7f8fa)", color: "var(--text-primary, #1f2937)" }}>
      <div style={{ maxWidth: "560px", padding: "28px", borderRadius: "16px", background: "var(--card-bg, #fff)", border: "1px solid var(--border, #e5e7eb)", boxShadow: "0 12px 32px rgba(0,0,0,0.08)" }}>
        <h1 style={{ margin: "0 0 12px", fontSize: "22px" }}>Configuration required</h1>
        <p style={{ margin: 0, lineHeight: 1.6, color: "var(--text-2, #4b5563)" }}>
          Firebase is not configured for this deployment. Add the required VITE_FIREBASE_* environment variables in Netlify and redeploy.
        </p>
        {firebaseConfigError && <p style={{ margin: "16px 0 0", fontSize: "12px", color: "var(--danger, #b91c1c)" }}>{firebaseConfigError}</p>}
      </div>
    </div>
  );
}

>>>>>>> da8dc0b (Fix Netlify deployment)
// ── Protected route — now forwards theme props to AppLayout ──────────────────
function ProtectedRoute({ user, userName, theme, toggleTheme, children }) {
  if (user === null) return <Navigate to="/login" />;
  if (user === undefined) return <LoadingScreen />;
  return (
    <AppLayout userName={userName} theme={theme} toggleTheme={toggleTheme}>
      {children}
    </AppLayout>
  );
}

export default function App() {
  const [user,     setUser]     = useState(undefined);
  const [userName, setUserName] = useState("");

  // ── Theme state — stored directly in App, no hooks folder needed ──────────
  const [theme, setTheme] = useState(() => {
    // Read from localStorage on first render
    return localStorage.getItem("fh_theme") || "light";
  });

  // Apply theme to <html> element whenever it changes
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("fh_theme", theme);
    // PATTERN 5: Bridge — notify the bridge so it syncs its engine
    switchTheme(theme === "dark" ? "dark" : "light");
  }, [theme]);

  function toggleTheme() {
    setTheme(t => t === "light" ? "dark" : "light");
  }
  // ──────────────────────────────────────────────────────────────────────────

  useEffect(() => {
<<<<<<< HEAD
    return onAuthStateChanged(auth, async (u) => {
      setUser(u ?? null);
      if (u) {
        const data = await getUserData();
        if (data?.name) setUserName(data.name);
=======
    if (!auth) {
      return undefined;
    }

    return onAuthStateChanged(auth, async (u) => {
      setUser(u ?? null);
      if (u) {
        try {
          const data = await getUserData();
          if (data?.name) setUserName(data.name);
        } catch (error) {
          console.error("Failed to load user profile:", error);
        }
>>>>>>> da8dc0b (Fix Netlify deployment)
        // FEATURE: auto-mark overdue bills silently on every login
        runBillAutoUpdate();
      }
    });
  }, []);

<<<<<<< HEAD
=======
  if (firebaseConfigError) return <ConfigurationErrorScreen />;

>>>>>>> da8dc0b (Fix Netlify deployment)
  // Wrap helper — passes theme + toggleTheme through to AppLayout
  const wrap = (el) => (
    <ProtectedRoute user={user} userName={userName} theme={theme} toggleTheme={toggleTheme}>
      {el}
    </ProtectedRoute>
  );

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"               element={<Navigate to="/login" />} />
        <Route path="/login"          element={<Login />} />
        <Route path="/signup"         element={<Signup />} />
        <Route path="/dashboard"      element={wrap(<Dashboard />)} />
        <Route path="/vault"          element={wrap(<Vault />)} />
        <Route path="/nominees"       element={wrap(<Nominees />)} />
        <Route path="/ai-letter"      element={wrap(<AILetter />)} />
        <Route path="/inheritance"    element={wrap(<Inheritance />)} />
        <Route path="/documents"      element={wrap(<DocumentVault />)} />
        <Route path="/udhaar"         element={wrap(<UdhaarManager />)} />
        <Route path="/subscriptions"  element={wrap(<SubscriptionTracker />)} />
        <Route path="/time-capsule"   element={wrap(<TimeCapsule />)} />
        <Route path="/bills"          element={wrap(<BillManager />)} />
        <Route path="/legacy-trigger" element={wrap(<LegacyTrigger />)} />
        <Route path="/medical-passport" element={wrap(<MedicalPassport />)} />
        <Route path="/net-worth"      element={wrap(<NetWorth />)} />
        <Route path="/ai-assistant"   element={wrap(<AIChatAssistant />)} />
        {/* EmergencyCard uses its own dark standalone layout — no AppLayout */}
        <Route path="/emergency-card" element={
          <ProtectedRoute user={user} userName={userName} theme={theme} toggleTheme={toggleTheme}>
            <EmergencyCard />
          </ProtectedRoute>
        } />
        <Route path="/emergency/:uid" element={<EmergencyPublic />} />
<<<<<<< HEAD
=======
        <Route path="*" element={<Navigate to="/login" replace />} />
>>>>>>> da8dc0b (Fix Netlify deployment)
      </Routes>
    </BrowserRouter>
  );
}
