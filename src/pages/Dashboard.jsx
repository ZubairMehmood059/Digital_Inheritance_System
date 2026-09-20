import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getUserData, getNominees, getAssets } from "../firebase/db";
import { auth, db } from "../firebase/config";
import { doc, getDoc, collection, getDocs, query, where } from "firebase/firestore";
import { computeVaultStrength } from "../utils/vaultStrength";
import { GoogleGenAI } from '@google/genai';

const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY;

function Icon({ d, size = 16, color = "currentColor" }) {
  return (
    <svg width={size} height={size} fill="none" stroke={color} strokeWidth="1.75" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
      <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    </svg>
  );
}

const MODULES = [
  { path: "/vault",           label: "Vault",            sub: "Encrypted secrets",        d: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z",                                                                                                         color: "#E0474C", featured: true },
  { path: "/nominees",        label: "Trusted Contacts", sub: "People who matter",         d: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z",   color: "#14B8A6", featured: true },
  { path: "/medical-passport",label: "Medical Passport", sub: "Health profile & records",  d: "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z",                                                                                  color: "#EF4444", featured: true, badge: "New" },
  { path: "/net-worth",       label: "Asset Tracker",    sub: "Global net worth",          d: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",                                 color: "#10B981", featured: true, badge: "New" },
  { path: "/ai-assistant",    label: "AI Life Advisor",  sub: "Context-aware chat",        d: "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z", color: "#7C3AED", badge: "New" },
  { path: "/documents",       label: "Documents",        sub: "Important files",           d: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",                                                                                        color: "#8B5CF6" },
  { path: "/udhaar",          label: "Udhaar Manager",   sub: "Loans & debts",             d: "M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z",                                                        color: "#F59E0B" },
  { path: "/subscriptions",   label: "Subscriptions",    sub: "Monthly spending",          d: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15",                                                                                                   color: "#3B82F6" },
  { path: "/bills",           label: "Utility Bills",    sub: "Monthly bills",             d: "M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z",                                                                                                             color: "#8B5CF6" },
  { path: "/time-capsule",    label: "Time Capsule",     sub: "Future messages",           d: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",                                                                                                                                                                     color: "#EC4899" },
  { path: "/ai-letter",       label: "Farewell Letter",  sub: "Your digital story",        d: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",                                                                                                        color: "#6366F1" },
  { path: "/emergency-card",  label: "Emergency Card",   sub: "QR medical info",           d: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z",                                                                          color: "#EF4444" },
  { path: "/legacy-trigger",  label: "Legacy Trigger",   sub: "Inactivity settings",       d: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z",                                                                                                         color: "#8B5CF6" },
];

const CHECKLIST = [
  { label: "Add your first vault item",   path: "/vault",          cta: "Add item" },
  { label: "Add a trusted contact",       path: "/nominees",       cta: "Add contact" },
  { label: "Set up Emergency Card",       path: "/emergency-card", cta: "Set up" },
  { label: "Configure Legacy Trigger",    path: "/legacy-trigger", cta: "Configure" },
  { label: "Record an udhaar entry",      path: "/udhaar",         cta: "Add entry" },
];

const STAT_DEFS = (assets, nominees, userData) => [
  { label: "Vault Items",      value: assets.length || 0,   sub: "Encrypted",                          color: "#E0474C", d: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" },
  { label: "Trusted Contacts", value: nominees.length || 0, sub: "Registered",                         color: "#14B8A6", d: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" },
  { label: "Security",         value: "Active",              sub: "AES-256 Encrypted",                  color: "#34D399", d: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" },
  { label: "Account",          value: "Verified",            sub: userData?.email?.split("@")[0] || "—", color: "#8B5CF6", d: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" },
];

export default function Dashboard() {
  const [userData,      setUserData]      = useState(null);
  const [nominees,      setNominees]      = useState([]);
  const [assets,        setAssets]        = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [hoveredModule, setHoveredModule] = useState(null);
  // FEATURE: Vault Strength Meter
  const [vaultStrength, setVaultStrength] = useState(null);
  // FEATURE: AI Financial Health Score
  const [aiScore,   setAiScore]   = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  const navigate = useNavigate();

  const loadData = useCallback(async () => {
    const uid = auth.currentUser?.uid;
    const [data, noms, ast] = await Promise.all([getUserData(), getNominees(), getAssets()]);
    if (data) setUserData(data);
    setNominees(noms || []);
    setAssets(ast || []);

    // Load extra docs for Vault Strength
    let medicalForm    = null;
    let emergencyCard  = null;
    let netWorthAssets = [];
    if (uid) {
      try {
        const [medSnap, emSnap, nwSnap] = await Promise.all([
          getDoc(doc(db, "medicalPassport", uid)),
          getDoc(doc(db, "emergencyCards",  uid)),
          getDoc(doc(db, "netWorth",        uid)),
        ]);
        if (medSnap.exists()) medicalForm    = medSnap.data();
        if (emSnap.exists())  emergencyCard  = emSnap.data();
        if (nwSnap.exists())  netWorthAssets = nwSnap.data()?.assets || [];
      } catch { /* non-critical */ }
    }

    setVaultStrength(computeVaultStrength({
      assets: ast, nominees: noms,
      medicalForm, emergencyCard, netWorthAssets,
    }));
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // FEATURE: AI Financial Health Score
  async function fetchAIScore() {
  if (aiLoading) return;
  setAiLoading(true);
  setAiScore(null);
  try {
    if (!geminiApiKey) {
      throw new Error("VITE_GEMINI_API_KEY is not configured");
    }

    const ai = new GoogleGenAI({ apiKey: geminiApiKey });
    const uid = auth.currentUser?.uid;
    let nwData = null;
    let subs = [];
    let bills = [];
    if (uid) {
      const [nwSnap, subSnap, billSnap] = await Promise.all([
        getDoc(doc(db, "netWorth", uid)),
        getDocs(query(collection(db, "subscriptions"), where("uid", "==", uid))),
        getDocs(query(collection(db, "utilityBills"), where("uid", "==", uid))),
      ]);
      if (nwSnap.exists()) nwData = nwSnap.data();
      subs = subSnap.docs.map(d => d.data());
      bills = billSnap.docs.map(d => d.data());
    }

    const totalAssets = (nwData?.assets || []).reduce((s, a) => s + (a.value || 0), 0);
    const totalDebts = nwData?.debts || 0;
    const monthlyBills = bills.filter(b => b.status !== "paid").reduce((s, b) => s + Number(b.amount), 0);
    const monthlySubs = subs.reduce((s, sub) => {
      const m = sub.cycle === "yearly" ? 12 : sub.cycle === "weekly" ? 0.25 : 1;
      return s + sub.amount / m;
    }, 0);

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `You are a financial advisor for a Pakistani user. Give a financial health score out of 100 and a 2-sentence insight in simple English. Be specific.

Data:
- Total Assets: PKR ${totalAssets.toLocaleString()}
- Total Debts: PKR ${totalDebts.toLocaleString()}
- Debt Ratio: ${totalAssets > 0 ? ((totalDebts / totalAssets) * 100).toFixed(1) : "N/A"}%
- Monthly Unpaid Bills: PKR ${monthlyBills.toLocaleString()}
- Monthly Subscriptions: PKR ${Math.round(monthlySubs).toLocaleString()}
- Vault Items: ${assets.length}
- Trusted Contacts: ${nominees.length}

Respond in this exact format only:
SCORE: [number]
INSIGHT: [2 sentences]`,
      config: { maxOutputTokens: 120 },
    });

    const text = response.text || "";
    const scoreM = text.match(/SCORE:\s*(\d+)/i);
    const insightM = text.match(/INSIGHT:\s*(.+)/is);
    if (scoreM && insightM) {
      setAiScore({ score: parseInt(scoreM[1]), insight: insightM[1].trim() });
    }
  } catch (err) {
    console.error("AI score:", err.message);
  } finally {
    setAiLoading(false);
  }
}
  const displayName = userData?.name || auth.currentUser?.displayName || auth.currentUser?.email?.split("@")[0] || "there";
  const firstName   = displayName.split(" ")[0];
  const hr          = new Date().getHours();
  const greeting    = hr < 12 ? "Good morning" : hr < 17 ? "Good afternoon" : "Good evening";
  const setupDone   = assets.length > 0 && nominees.length > 0;

  const featuredModules = MODULES.filter(m => m.featured);
  const restModules     = MODULES.filter(m => !m.featured);
  const stats           = STAT_DEFS(assets, nominees, userData);

  if (loading) return (
    <div style={{ animation: "fadeIn 0.3s ease" }}>
      <div style={{ height: "200px", borderRadius: "20px", marginBottom: "28px", background: "var(--bg-card)", animation: "shimmer 1.5s infinite" }} className="skeleton" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "12px", marginBottom: "28px" }}>
        {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: "100px", borderRadius: "14px" }} />)}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "10px" }}>
        {[1,2,3,4,5,6,7,8].map(i => <div key={i} className="skeleton" style={{ height: "120px", borderRadius: "14px" }} />)}
      </div>
    </div>
  );

  return (
    <div style={{ animation: "fadeIn 0.35s ease" }}>

      {/* ── HERO ── */}
      <div style={S.hero}>
        <div style={S.heroGrad1} /><div style={S.heroGrad2} /><div style={S.heroGrad3} />
        <div style={S.heroGrid} />
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#F87171", boxShadow: "0 0 8px rgba(248,113,113,0.7)", animation: "pulse 2s ease-in-out infinite" }} />
            <span style={{ fontSize: "9px", fontWeight: "700", color: "rgba(248,113,113,0.6)", letterSpacing: "0.22em", textTransform: "uppercase" }}>
              DIGITAL ESTATE VAULT
            </span>
          </div>
          <h1 style={S.heroGreeting}>
            {greeting},<br />
            <span style={S.heroName}>{firstName}</span>
          </h1>
          <p style={S.heroSub}>
            Your digital life is secure.{" "}
            <span style={{ color: "rgba(248,113,113,0.8)" }}>{assets.length} assets</span>{" "}
            protected across{" "}
            <span style={{ color: "rgba(248,113,113,0.8)" }}>{nominees.length} trusted contacts.</span>
          </p>
        </div>
        <div style={S.heroBadges}>
          {[
            { num: assets.length,  label: "Assets"  },
            { num: nominees.length, label: "Contacts" },
            ...(vaultStrength ? [{ num: `${vaultStrength.score}%`, label: "Vault Strength", color: vaultStrength.grade.color }] : []),
            { num: "AES-256", label: "Encrypted", small: true },
          ].map((b, i, arr) => (
            <div key={i} style={{ display: "flex", alignItems: "center" }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "3px", padding: "0 20px" }}>
                <span style={{ fontFamily: "'Sora',sans-serif", fontSize: b.small ? "13px" : "20px", fontWeight: "800", color: b.color || "rgba(255,255,255,0.88)", letterSpacing: "-0.03em", lineHeight: 1 }}>
                  {b.num}
                </span>
                <span style={{ fontSize: "9px", color: "rgba(255,255,255,0.28)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                  {b.label}
                </span>
              </div>
              {i < arr.length - 1 && <div style={{ width: 1, height: 32, background: "rgba(255,255,255,0.08)" }} />}
            </div>
          ))}
        </div>
      </div>

      {/* ── FEATURE: Vault Strength + AI Financial Health ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "28px" }}>

        {/* Vault Strength Card */}
        {vaultStrength && (
          <div style={S.featureCard}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: `${vaultStrength.grade.color}15`, border: `1px solid ${vaultStrength.grade.color}25`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" size={15} color={vaultStrength.grade.color} />
                </div>
                <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text-1)", margin: 0 }}>Vault Strength</p>
              </div>
              <span style={{ fontSize: 22, fontWeight: 800, color: vaultStrength.grade.color, fontFamily: "'Sora',sans-serif" }}>
                {vaultStrength.score}%
              </span>
            </div>
            <div style={{ height: 6, borderRadius: 3, background: "var(--border)", overflow: "hidden", marginBottom: 10 }}>
              <div style={{ height: "100%", borderRadius: 3, width: `${vaultStrength.score}%`, background: vaultStrength.grade.color, transition: "width 0.6s ease" }} />
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: vaultStrength.pending.length > 0 ? 10 : 0 }}>
              <span style={{ fontSize: 11, color: vaultStrength.grade.color, fontWeight: 600 }}>{vaultStrength.grade.label}</span>
              <span style={{ fontSize: 11, color: "var(--text-3)" }}>{9 - vaultStrength.pending.length}/9 checks</span>
            </div>
            {vaultStrength.pending.length > 0 && (
              <div style={{ borderTop: "1px solid var(--border)", paddingTop: 8 }}>
                <p style={{ fontSize: 10, color: "var(--text-3)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>Next actions</p>
                {vaultStrength.pending.slice(0, 3).map((item, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                    <div style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--border)", flexShrink: 0 }} />
                    <p style={{ fontSize: 11, color: "var(--text-3)", margin: 0 }}>{item}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* AI Financial Health Score Card */}
        <div style={S.featureCard}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>✦</div>
              <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text-1)", margin: 0 }}>Financial Health</p>
            </div>
            {aiScore && (
              <span style={{
                fontSize: 22, fontWeight: 800, fontFamily: "'Sora',sans-serif",
                color: aiScore.score >= 75 ? "#10B981" : aiScore.score >= 50 ? "#F59E0B" : "#EF4444",
              }}>
                {aiScore.score}/100
              </span>
            )}
          </div>

          {aiScore ? (
            <>
              <div style={{ height: 6, borderRadius: 3, background: "var(--border)", overflow: "hidden", marginBottom: 10 }}>
                <div style={{
                  height: "100%", borderRadius: 3, width: `${aiScore.score}%`,
                  background: aiScore.score >= 75 ? "#10B981" : aiScore.score >= 50 ? "#F59E0B" : "#EF4444",
                  transition: "width 0.6s ease",
                }} />
              </div>
              <p style={{ fontSize: 12, color: "var(--text-2)", lineHeight: 1.6, margin: "0 0 10px" }}>{aiScore.insight}</p>
              <button onClick={fetchAIScore} style={{ fontSize: 11, color: "var(--text-3)", background: "transparent", border: "none", cursor: "pointer", padding: 0, textDecoration: "underline" }}>
                Refresh analysis
              </button>
            </>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <p style={{ fontSize: 12, color: "var(--text-3)", lineHeight: 1.6, margin: 0 }}>
                AI analyzes your assets, debts, bills and subscriptions to rate your financial health.
              </p>
              <button onClick={fetchAIScore} disabled={aiLoading} style={{
                padding: "8px 14px", background: "rgba(245,158,11,0.1)",
                border: "1px solid rgba(245,158,11,0.25)", borderRadius: "var(--radius-btn)",
                color: "#F59E0B", fontSize: 12, fontWeight: 600, cursor: "pointer",
                opacity: aiLoading ? 0.6 : 1, display: "flex", alignItems: "center", gap: 6, width: "fit-content",
              }}>
                {aiLoading
                  ? <><span style={{ width: 12, height: 12, border: "1.5px solid rgba(245,158,11,0.3)", borderTop: "1.5px solid #F59E0B", borderRadius: "50%", animation: "spin 0.8s linear infinite", display: "inline-block" }} /> Analyzing...</>
                  : "✦ Run AI Analysis"
                }
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── STAT CARDS ── */}
      <div style={S.statsGrid}>
        {stats.map((s, i) => (
          <div key={i} style={S.statCard}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 0 32px ${s.color}18, 0 4px 16px rgba(0,0,0,0.12)`; e.currentTarget.style.borderColor = `${s.color}30`; e.currentTarget.style.transform = "translateY(-2px)"; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = "var(--shadow-sm)"; e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.transform = "translateY(0)"; }}
          >
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "1px", background: `linear-gradient(90deg, transparent, ${s.color}40, transparent)` }} />
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "14px" }}>
              <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: `${s.color}12`, border: `1px solid ${s.color}22`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon d={s.d} size={15} color={s.color} />
              </div>
            </div>
            <p style={{ fontSize: "24px", fontWeight: "800", fontFamily: "'Sora',sans-serif", letterSpacing: "-0.04em", marginBottom: "3px", lineHeight: 1, color: s.color }}>{s.value}</p>
            <p style={{ fontSize: "12px", fontWeight: "500", color: "var(--text-2)" }}>{s.label}</p>
            <p style={{ fontSize: "10px", marginTop: "3px", fontWeight: "500", color: s.color }}>{s.sub}</p>
          </div>
        ))}
      </div>

      {/* ── FEATURED MODULES ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
        <h2 style={S.sectionTitle}>Core Modules</h2>
        <p style={{ fontSize: "12px", color: "var(--text-3)" }}>{MODULES.length} features</p>
      </div>
      <div style={S.featuredGrid}>
        {featuredModules.map(({ path, label, sub, d, color, badge }) => (
          <div key={path} onClick={() => navigate(path)}
            style={{
              ...S.featuredCard,
              boxShadow: hoveredModule === path ? `0 0 28px ${color}22, 0 8px 32px rgba(0,0,0,0.15)` : "var(--shadow-sm)",
              borderColor: hoveredModule === path ? `${color}30` : "var(--border)",
              transform: hoveredModule === path ? "translateY(-3px)" : "translateY(0)",
            }}
            onMouseEnter={() => setHoveredModule(path)}
            onMouseLeave={() => setHoveredModule(null)}
          >
            <div style={{ position: "absolute", left: 0, top: "12px", bottom: "12px", width: "3px", borderRadius: "0 2px 2px 0", background: `linear-gradient(to bottom, ${color}, ${color}44)` }} />
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "16px" }}>
              <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: `${color}12`, border: `1px solid ${color}22`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon d={d} size={18} color={color} />
              </div>
              {badge && <span style={{ fontSize: "9px", padding: "2px 7px", borderRadius: "4px", fontWeight: "700", letterSpacing: "0.04em", border: "1px solid", color, background: `${color}12`, borderColor: `${color}22` }}>{badge}</span>}
            </div>
            <p style={{ fontSize: "14px", fontWeight: "700", fontFamily: "'Sora',sans-serif", letterSpacing: "-0.01em", marginBottom: "4px", color: hoveredModule === path ? color : "var(--text-1)", transition: "color 0.2s" }}>{label}</p>
            <p style={{ fontSize: "12px", color: "var(--text-3)", marginBottom: "14px" }}>{sub}</p>
            <div style={{ fontSize: "12px", fontWeight: "600", display: "flex", alignItems: "center", color }}>Open module <span style={{ marginLeft: 4 }}>→</span></div>
          </div>
        ))}
      </div>

      {/* ── ALL TOOLS ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px", marginTop: "28px" }}>
        <h2 style={S.sectionTitle}>All Tools</h2>
      </div>
      <div style={S.moduleGrid}>
        {restModules.map(({ path, label, sub, d, color, badge }) => (
          <div key={path} onClick={() => navigate(path)}
            style={{
              ...S.moduleCard,
              boxShadow: hoveredModule === path ? `0 0 24px ${color}18, 0 4px 16px rgba(0,0,0,0.12)` : "var(--shadow-sm)",
              borderColor: hoveredModule === path ? `${color}28` : "var(--border)",
              transform: hoveredModule === path ? "translateY(-2px)" : "translateY(0)",
            }}
            onMouseEnter={() => setHoveredModule(path)}
            onMouseLeave={() => setHoveredModule(null)}
          >
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "10px" }}>
              <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: `${color}10`, border: `1px solid ${color}1A`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon d={d} size={14} color={color} />
              </div>
              {badge && <span style={{ fontSize: "9px", padding: "2px 7px", borderRadius: "4px", fontWeight: "700", border: "1px solid", color, background: `${color}10`, borderColor: `${color}1A` }}>{badge}</span>}
            </div>
            <p style={{ fontSize: "13px", fontWeight: "600", marginBottom: "3px", color: hoveredModule === path ? color : "var(--text-1)", transition: "color 0.2s" }}>{label}</p>
            <p style={{ fontSize: "11px", color: "var(--text-3)" }}>{sub}</p>
            <p style={{ fontSize: "11px", color, fontWeight: "500", marginTop: "8px" }}>Open →</p>
          </div>
        ))}
      </div>

      {/* ── SETUP CHECKLIST ── */}
      {!setupDone && (
        <div style={{ ...S.featureCard, marginTop: "28px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
            <div style={{ width: "32px", height: "32px", borderRadius: "var(--radius)", background: "var(--brand-light)", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(224,71,76,0.2)", flexShrink: 0 }}>
              <Icon d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" size={15} color="var(--brand)" />
            </div>
            <div>
              <p style={{ fontSize: "14px", fontWeight: "600", color: "var(--text-1)", fontFamily: "'Sora',sans-serif", margin: 0 }}>Getting started</p>
              <p style={{ fontSize: "12px", color: "var(--text-3)", marginTop: 2 }}>Complete these steps to secure your vault</p>
            </div>
            <div style={{ marginLeft: "auto", fontSize: "12px", color: "var(--text-3)", background: "var(--bg)", padding: "4px 12px", borderRadius: "20px", border: "1px solid var(--border)" }}>
              {CHECKLIST.filter((_, i) => [assets.length > 0, nominees.length > 0, false, false][i]).length}/{CHECKLIST.length} done
            </div>
          </div>
          {CHECKLIST.map((step, i) => {
            const done = [assets.length > 0, nominees.length > 0, false, false][i];
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "11px 14px", borderRadius: "var(--radius)", background: done ? "var(--success-bg)" : "var(--bg)", border: `1px solid ${done ? "#22C55E22" : "var(--border)"}`, marginBottom: "6px", transition: "all 0.2s" }}>
                <div style={{ width: "20px", height: "20px", borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: done ? "#22C55E18" : "transparent", border: `1.5px solid ${done ? "#22C55E" : "var(--border)"}` }}>
                  {done && <svg width="10" height="10" fill="none" stroke="#22C55E" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                </div>
                <p style={{ flex: 1, fontSize: "13px", color: done ? "var(--text-3)" : "var(--text-1)", textDecoration: done ? "line-through" : "none", margin: 0 }}>{step.label}</p>
                {!done && (
                  <button onClick={() => navigate(step.path)} style={{ padding: "5px 14px", background: "var(--brand)", border: "none", borderRadius: "var(--radius-btn)", color: "white", fontSize: "11px", cursor: "pointer", fontWeight: "600", whiteSpace: "nowrap", boxShadow: "0 2px 8px var(--brand-glow)" }}>
                    {step.cta}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      <style>{`
        @keyframes fadeIn  { from { opacity:0 }                to { opacity:1 } }
        @keyframes spin    { to   { transform:rotate(360deg) }                  }
        @keyframes pulse   { 0%,100% { opacity:1; transform:scale(1) } 50% { opacity:0.5; transform:scale(0.8) } }
      `}</style>
    </div>
  );
}

const S = {
  hero: {
    position: "relative", overflow: "hidden", borderRadius: "20px",
    marginBottom: "28px", padding: "36px 32px 28px",
    background: "linear-gradient(135deg, #0F0809 0%, #1A0A0C 50%, #100814 100%)",
    border: "1px solid rgba(224,71,76,0.18)",
    boxShadow: "0 8px 40px rgba(224,71,76,0.08), 0 2px 8px rgba(0,0,0,0.3)",
    display: "flex", flexDirection: "column", gap: "24px",
  },
  heroGrad1: { position: "absolute", top: -80, left: -60, width: 400, height: 400, background: "radial-gradient(circle, rgba(224,71,76,0.14) 0%, transparent 65%)", borderRadius: "50%", pointerEvents: "none" },
  heroGrad2: { position: "absolute", top: -20, right: -40, width: 300, height: 300, background: "radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 65%)", borderRadius: "50%", pointerEvents: "none" },
  heroGrad3: { position: "absolute", bottom: -60, left: "40%", width: 250, height: 250, background: "radial-gradient(circle, rgba(20,184,166,0.06) 0%, transparent 65%)", borderRadius: "50%", pointerEvents: "none" },
  heroGrid:  { position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px)", backgroundSize: "28px 28px", pointerEvents: "none" },
  heroGreeting: { fontSize: "28px", fontWeight: "800", fontFamily: "'Sora',sans-serif", color: "rgba(255,255,255,0.10)", letterSpacing: "-0.03em", lineHeight: 1.15, marginBottom: "10px" },
  heroName: { background: "linear-gradient(135deg, #FFFFFF 30%, rgba(248,113,113,0.85) 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" },
  heroSub:  { fontSize: "14px", color: "rgba(255,255,255,0.38)", lineHeight: 1.6, maxWidth: 480 },
  heroBadges: { display: "flex", alignItems: "center", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "12px", padding: "12px 0", width: "fit-content", position: "relative", zIndex: 1 },
  statsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: "12px", marginBottom: "32px" },
  statCard:  { background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: "18px 18px 16px", position: "relative", overflow: "hidden", boxShadow: "var(--shadow-sm)", transition: "all 0.25s ease", cursor: "default" },
  featureCard: { background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: "20px", boxShadow: "var(--shadow-sm)" },
  featuredGrid: { display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: "12px" },
  featuredCard: { background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: "20px 20px 18px", cursor: "pointer", transition: "all 0.25s ease", position: "relative", overflow: "hidden", boxShadow: "var(--shadow-sm)" },
  moduleGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: "10px", marginBottom: "32px" },
  moduleCard: { background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: "16px", cursor: "pointer", transition: "all 0.2s ease", boxShadow: "var(--shadow-sm)" },
  sectionTitle: { fontSize: "14px", fontWeight: "700", color: "var(--text-1)", fontFamily: "'Sora',sans-serif", letterSpacing: "-0.01em" },
}