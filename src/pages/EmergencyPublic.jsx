import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { db } from "../firebase/config";
import { doc, getDoc } from "firebase/firestore";

// ── localStorage cache key ───────────────────────────────────────────────────
const cacheKey = (uid) => `emergency_card_${uid}`;

// ── Public page — no login needed — QR scan karne pe yeh dikhe ──────────────
export default function EmergencyPublic() {
  const { uid } = useParams();
  const [card, setCard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [fromCache, setFromCache] = useState(false);

  useEffect(() => {
    // 1. Try localStorage cache first for instant offline access
    try {
      const cached = localStorage.getItem(cacheKey(uid));
      if (cached) {
        const parsed = JSON.parse(cached);
        setCard(parsed);
        setFromCache(true);
        setLoading(false);
      }
    } catch { /* ignore */ }

    // 2. Always try to fetch fresh from Firestore
    getDoc(doc(db, "emergencyCards", uid))
      .then((snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setCard(data);
          setFromCache(false);
          setLoading(false);
          // Update cache
          try { localStorage.setItem(cacheKey(uid), JSON.stringify(data)); } catch { /* ignore */ }
        } else if (!fromCache) {
          setError(true);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!card) {
          setError(true);
          setLoading(false);
        }
      });
  }, [uid]);

  const hc = highContrast;
  const H = hc ? HC : P; // choose style set

  if (loading) return (
    <div style={P.page}>
      <div style={P.center}>
        <div style={P.spinner} />
        <p style={P.loadText}>Loading emergency info...</p>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  );

  if (error && !card) return (
    <div style={P.page}>
      <div style={P.center}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
        <p style={{ color: "rgba(255,255,255,0.6)", fontFamily: "'Space Grotesk',sans-serif", fontSize: 14 }}>Emergency card not found</p>
        <p style={{ color: "rgba(255,255,255,0.3)", fontFamily: "'Space Grotesk',sans-serif", fontSize: 11, marginTop: 8 }}>UID: {uid}</p>
      </div>
    </div>
  );

  const phone1 = card.emergencyPhone;
  const phone2 = card.emergencyPhone2;
  const contact1 = card.emergencyContact;
  const contact2 = card.emergencyContact2;
  const hospital = card.hospital;

  // WhatsApp pre-filled SOS message
  const sosMessage = encodeURIComponent(
    `🚨 EMERGENCY — This person needs IMMEDIATE medical help!\n\nBlood Group: ${card.bloodGroup || "Unknown"}\nAllergies: ${card.allergies || "None"}\nDoctor: ${card.doctor || "Unknown"}\nHospital: ${hospital || "Nearest hospital"}\n\nPlease respond ASAP!`
  );
  const whatsapp1 = phone1 ? `https://wa.me/${phone1.replace(/[^0-9+]/g, "")}?text=${sosMessage}` : null;
  const sms1 = phone1 ? `sms:${phone1}?body=🚨 Emergency — needs immediate help! Blood: ${card.bloodGroup}` : null;
  const hospitalGps = hospital ? `https://www.google.com/maps/search/${encodeURIComponent(hospital)}` : `https://www.google.com/maps/search/hospital+near+me`;

  return (
    <div style={hc ? H.page : P.page}>
      {!hc && <><div style={P.orb1} /><div style={P.orb2} /></>}

      <div style={hc ? H.container : P.container}>

        {/* ── High-Contrast Toggle ── */}
        <button style={hc ? H.contrastToggle : P.contrastToggle} onClick={() => setHighContrast((v) => !v)}>
          {hc ? "🌑 Normal View" : "🔆 Responder Mode"}
        </button>

        {/* ── Offline cache indicator ── */}
        {fromCache && (
          <div style={P.cacheBanner}>
            📵 Showing cached data — internet not required
          </div>
        )}

        {/* ── Emergency Header ── */}
        <div style={hc ? H.emergencyBanner : P.emergencyBanner}>
          <SvgAlert size={32} color={hc ? "#000" : "#f87171"} />
          <div>
            <div style={hc ? H.emergencyTitle : P.emergencyTitle}>EMERGENCY MEDICAL CARD</div>
            <div style={hc ? H.emergencySubtitle : P.emergencySubtitle}>This person needs immediate assistance</div>
          </div>
        </div>

        {/* ── Main card ── */}
        <div style={hc ? H.card : P.card}>
          {!hc && <div style={P.shimmer} />}

          {/* Blood group + patient info */}
          <div style={hc ? H.cardTop : P.cardTop}>
            <div style={hc ? H.cardTopLeft : P.cardTopLeft}>
              <div style={hc ? H.bigBlood : P.bigBlood}>{card.bloodGroup || "—"}</div>
              <div style={hc ? H.bloodCaption : P.bloodCaption}>Blood Group</div>
            </div>
            <div style={hc ? H.dividerV : P.dividerV} />
            <div>
              <div style={hc ? H.infoLabel : P.infoLabel}>Patient</div>
              <div style={hc ? H.infoValue : P.infoValue}>Emergency Card Holder</div>
              <div style={{ ...(hc ? H.infoLabel : P.infoLabel), marginTop: 6 }}>Scan by medical personnel</div>
            </div>
          </div>

          {/* Allergies */}
          {card.allergies && (
            <div style={hc ? H.infoRow : P.infoRow}>
              <SvgAllergy size={22} color={hc ? "#000" : "#fbbf24"} />
              <div>
                <div style={hc ? H.rowLabel : P.rowLabel}>Allergies</div>
                <div style={hc ? H.rowVal : P.rowVal}>{card.allergies}</div>
              </div>
            </div>
          )}

          {/* Medical Notes */}
          {card.medicalNotes && (
            <div style={hc ? H.infoRow : P.infoRow}>
              <SvgNotes size={22} color={hc ? "#000" : "#94a3b8"} />
              <div>
                <div style={hc ? H.rowLabel : P.rowLabel}>Medical Notes</div>
                <div style={hc ? H.rowVal : P.rowVal}>{card.medicalNotes}</div>
              </div>
            </div>
          )}

          {/* Doctor / Hospital */}
          {(card.doctor || hospital) && (
            <div style={hc ? H.infoRow : P.infoRow}>
              <SvgHospital size={22} color={hc ? "#000" : "#60a5fa"} />
              <div>
                <div style={hc ? H.rowLabel : P.rowLabel}>Hospital / Doctor</div>
                <div style={hc ? H.rowVal : P.rowVal}>{[card.doctor, hospital].filter(Boolean).join(" — ")}</div>
              </div>
            </div>
          )}

          {/* Primary ICE */}
          {contact1 && (
            <div style={hc ? H.infoRow : P.infoRow}>
              <SvgPhone size={22} color={hc ? "#000" : "#34d399"} />
              <div style={{ flex: 1 }}>
                <div style={hc ? H.rowLabel : P.rowLabel}>Primary ICE Contact</div>
                <div style={hc ? H.rowVal : P.rowVal}>{contact1}{phone1 ? ` — ${phone1}` : ""}</div>
              </div>
            </div>
          )}

          {/* Secondary ICE */}
          {contact2 && (
            <div style={{ ...(hc ? H.infoRow : P.infoRow), borderBottom: "none" }}>
              <SvgPhone size={22} color={hc ? "#000" : "#f59e0b"} />
              <div style={{ flex: 1 }}>
                <div style={hc ? H.rowLabel : P.rowLabel}>Secondary ICE Contact</div>
                <div style={hc ? H.rowVal : P.rowVal}>{contact2}{phone2 ? ` — ${phone2}` : ""}</div>
              </div>
            </div>
          )}
        </div>

        {/* ── Quick Action Buttons ── */}
        <div style={P.actionsGrid}>
          {phone1 && (
            <a href={`tel:${phone1}`} style={{ ...P.actionBtn, ...P.actionCall }}>
              <SvgPhone size={18} color="#fff" />
              <span>Call ICE 1</span>
            </a>
          )}
          {phone2 && (
            <a href={`tel:${phone2}`} style={{ ...P.actionBtn, ...P.actionCallSec }}>
              <SvgPhone size={18} color="#fff" />
              <span>Call ICE 2</span>
            </a>
          )}
          {whatsapp1 && (
            <a href={whatsapp1} target="_blank" rel="noopener noreferrer" style={{ ...P.actionBtn, ...P.actionWhatsApp }}>
              <SvgWhatsApp size={18} color="#fff" />
              <span>WhatsApp SOS</span>
            </a>
          )}
          {sms1 && (
            <a href={sms1} style={{ ...P.actionBtn, ...P.actionSms }}>
              <SvgSms size={18} color="#fff" />
              <span>Send SMS</span>
            </a>
          )}
          <a href={hospitalGps} target="_blank" rel="noopener noreferrer" style={{ ...P.actionBtn, ...P.actionMap }}>
            <SvgMap size={18} color="#fff" />
            <span>{hospital ? "Navigate to Hospital" : "Find Nearest Hospital"}</span>
          </a>
        </div>

        <p style={P.footer}>Generated by myDigitalVault · Secure Digital System</p>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
      `}</style>
    </div>
  );
}

// ── SVG Icon Components ─────────────────────────────────────────────────────
function SvgAlert({ size = 24, color = "#f87171" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
      <path d="M12 2L2 20h20L12 2z" stroke={color} strokeWidth="2" strokeLinejoin="round" fill={color} fillOpacity="0.15" />
      <line x1="12" y1="9" x2="12" y2="13" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <circle cx="12" cy="17" r="1" fill={color} />
    </svg>
  );
}
function SvgPhone({ size = 24, color = "#34d399" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
      <path d="M6.6 10.8a15.6 15.6 0 006.6 6.6l2.2-2.2a1 1 0 011.05-.24 11.4 11.4 0 003.55.57 1 1 0 011 1v3.5a1 1 0 01-1 1A17 17 0 013 5a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.2 2.45.57 3.55a1 1 0 01-.25 1.05L6.6 10.8z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function SvgAllergy({ size = 24, color = "#fbbf24" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
      <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" fill={color} fillOpacity="0.1" />
      <line x1="12" y1="7" x2="12" y2="12" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="12" cy="16" r="1.2" fill={color} />
    </svg>
  );
}
function SvgHospital({ size = 24, color = "#60a5fa" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
      <rect x="3" y="5" width="18" height="16" rx="2" stroke={color} strokeWidth="2" fill={color} fillOpacity="0.08" />
      <path d="M9 5V3h6v2" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <line x1="12" y1="9" x2="12" y2="15" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <line x1="9" y1="12" x2="15" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
function SvgNotes({ size = 24, color = "#94a3b8" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
      <rect x="4" y="3" width="16" height="18" rx="2" stroke={color} strokeWidth="2" fill={color} fillOpacity="0.08" />
      <line x1="8" y1="8" x2="16" y2="8" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="8" y1="12" x2="16" y2="12" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="8" y1="16" x2="12" y2="16" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
function SvgWhatsApp({ size = 24, color = "#fff" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} style={{ flexShrink: 0 }}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
      <path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.978-1.306A9.953 9.953 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18a7.952 7.952 0 01-4.121-1.148l-.295-.175-3.059.803.816-2.981-.192-.306A7.951 7.951 0 014 12c0-4.411 3.589-8 8-8s8 3.589 8 8-3.589 8-8 8z" />
    </svg>
  );
}
function SvgSms({ size = 24, color = "#fff" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
      <path d="M4 4h16c1.1 0 2 .9 2 2v10c0 1.1-.9 2-2 2H6l-4 4V6c0-1.1.9-2 2-2z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill={color} fillOpacity="0.15" />
    </svg>
  );
}
function SvgMap({ size = 24, color = "#fff" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
      <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z" stroke={color} strokeWidth="2" fill={color} fillOpacity="0.15" />
      <circle cx="12" cy="10" r="3" stroke={color} strokeWidth="2" />
    </svg>
  );
}

// ── Normal dark styles ───────────────────────────────────────────────────────
const P = {
  page: { minHeight: "100vh", background: "#07080f", fontFamily: "'Space Grotesk',sans-serif", position: "relative", overflow: "hidden", display: "flex", alignItems: "flex-start", justifyContent: "center" },
  orb1: { position: "fixed", top: -100, left: -80, width: 400, height: 400, background: "radial-gradient(circle,rgba(239,68,68,0.08) 0%,transparent 70%)", borderRadius: "50%", pointerEvents: "none" },
  orb2: { position: "fixed", bottom: -80, right: -60, width: 300, height: 300, background: "radial-gradient(circle,rgba(245,158,11,0.06) 0%,transparent 70%)", borderRadius: "50%", pointerEvents: "none" },
  center: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", gap: 16 },
  spinner: { width: 40, height: 40, border: "2px solid rgba(239,68,68,0.15)", borderTop: "2px solid #ef4444", borderRadius: "50%", animation: "spin 1s linear infinite" },
  loadText: { color: "rgba(255,255,255,0.3)", fontSize: 13, letterSpacing: "0.08em" },
  container: { width: "100%", maxWidth: 500, padding: "32px 20px 48px", position: "relative", zIndex: 1, animation: "fadeIn 0.4s ease" },
  contrastToggle: {
    display: "block", marginLeft: "auto", marginBottom: 16,
    padding: "7px 16px", borderRadius: 100,
    background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
    color: "rgba(255,255,255,0.5)", fontSize: 11, fontFamily: "'Space Grotesk',sans-serif",
    cursor: "pointer", letterSpacing: "0.06em", transition: "all 0.2s",
  },
  cacheBanner: {
    background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)",
    borderRadius: 10, padding: "8px 14px", marginBottom: 12,
    fontSize: 11, color: "rgba(245,158,11,0.7)", letterSpacing: "0.04em", textAlign: "center",
  },
  emergencyBanner: {
    display: "flex", alignItems: "center", gap: 14,
    background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
    borderRadius: 16, padding: "16px 20px", marginBottom: 16,
  },
  emergencyTitle: { fontSize: 15, fontWeight: 700, color: "#f87171", letterSpacing: "0.05em" },
  emergencySubtitle: { fontSize: 11, color: "rgba(239,68,68,0.5)", marginTop: 3, letterSpacing: "0.04em" },
  card: {
    background: "linear-gradient(145deg,rgba(245,158,11,0.04),rgba(10,8,2,0.7))",
    border: "1px solid rgba(245,158,11,0.12)",
    borderRadius: 20, padding: 24, position: "relative", overflow: "hidden",
    boxShadow: "0 20px 60px rgba(0,0,0,0.5), 0 0 30px rgba(245,158,11,0.04)",
    marginBottom: 16,
  },
  shimmer: { position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg,transparent,rgba(245,158,11,0.5),transparent)" },
  cardTop: { display: "flex", alignItems: "center", gap: 20, paddingBottom: 20, marginBottom: 20, borderBottom: "1px solid rgba(255,255,255,0.05)" },
  cardTopLeft: { textAlign: "center", flexShrink: 0 },
  bigBlood: { fontSize: 42, fontWeight: 900, color: "#f87171", fontFamily: "'JetBrains Mono',monospace", lineHeight: 1, textShadow: "0 0 20px rgba(239,68,68,0.3)" },
  bloodCaption: { fontSize: 9, color: "rgba(239,68,68,0.4)", textTransform: "uppercase", letterSpacing: "0.12em", marginTop: 4 },
  dividerV: { width: 1, height: 60, background: "rgba(255,255,255,0.06)", flexShrink: 0 },
  infoLabel: { fontSize: 9, color: "rgba(255,255,255,0.22)", textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: 4 },
  infoValue: { fontSize: 15, fontWeight: 600, color: "rgba(255,255,255,0.88)" },
  infoRow: { display: "flex", alignItems: "flex-start", gap: 14, padding: "14px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" },
  rowLabel: { fontSize: 9, color: "rgba(255,255,255,0.22)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 5 },
  rowVal: { fontSize: 14, fontWeight: 500, color: "rgba(255,255,255,0.85)", lineHeight: 1.4 },
  actionsGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 20 },
  actionBtn: {
    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
    padding: "13px 10px", borderRadius: 12,
    color: "#fff", textDecoration: "none",
    fontSize: 12, fontWeight: 700, fontFamily: "'Space Grotesk',sans-serif",
    letterSpacing: "0.03em", transition: "all 0.2s", cursor: "pointer",
    boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
  },
  actionCall: { background: "linear-gradient(135deg,#ef4444,#b91c1c)", gridColumn: "span 2", boxShadow: "0 4px 20px rgba(239,68,68,0.3)" },
  actionCallSec: { background: "linear-gradient(135deg,#f59e0b,#b45309)", boxShadow: "0 4px 16px rgba(245,158,11,0.2)" },
  actionWhatsApp: { background: "linear-gradient(135deg,#25d366,#128c7e)", boxShadow: "0 4px 16px rgba(37,211,102,0.2)" },
  actionSms: { background: "linear-gradient(135deg,#3b82f6,#1d4ed8)", boxShadow: "0 4px 16px rgba(59,130,246,0.2)" },
  actionMap: { background: "linear-gradient(135deg,#8b5cf6,#6d28d9)", gridColumn: "span 2", boxShadow: "0 4px 16px rgba(139,92,246,0.2)" },
  footer: { textAlign: "center", fontSize: 10, color: "rgba(255,255,255,0.1)", marginTop: 24, letterSpacing: "0.06em" },
};

// ── High Contrast / Responder Mode styles ────────────────────────────────────
const HC = {
  page: { minHeight: "100vh", background: "#FFFF00", fontFamily: "'Space Grotesk',sans-serif", display: "flex", alignItems: "flex-start", justifyContent: "center" },
  container: { width: "100%", maxWidth: 500, padding: "24px 16px 40px", animation: "fadeIn 0.3s ease" },
  contrastToggle: {
    display: "block", marginLeft: "auto", marginBottom: 16,
    padding: "8px 18px", borderRadius: 8,
    background: "#000", border: "3px solid #000",
    color: "#FFFF00", fontSize: 13, fontFamily: "'Space Grotesk',sans-serif",
    fontWeight: 700, cursor: "pointer", letterSpacing: "0.06em",
  },
  emergencyBanner: {
    display: "flex", alignItems: "center", gap: 14,
    background: "#FF0000", border: "3px solid #000",
    borderRadius: 12, padding: "16px 20px", marginBottom: 12,
  },
  emergencyTitle: { fontSize: 18, fontWeight: 900, color: "#FFFFFF", letterSpacing: "0.05em" },
  emergencySubtitle: { fontSize: 13, color: "#FFDDDD", marginTop: 4, fontWeight: 700 },
  card: {
    background: "#FFFFFF", border: "3px solid #000000",
    borderRadius: 12, padding: 20, marginBottom: 14,
  },
  cardTop: { display: "flex", alignItems: "center", gap: 20, paddingBottom: 16, marginBottom: 16, borderBottom: "2px solid #000" },
  cardTopLeft: { textAlign: "center", flexShrink: 0 },
  bigBlood: { fontSize: 48, fontWeight: 900, color: "#CC0000", fontFamily: "'JetBrains Mono',monospace", lineHeight: 1 },
  bloodCaption: { fontSize: 11, color: "#CC0000", textTransform: "uppercase", letterSpacing: "0.12em", marginTop: 4, fontWeight: 700 },
  dividerV: { width: 2, height: 70, background: "#000", flexShrink: 0 },
  infoLabel: { fontSize: 10, color: "#444", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 4, fontWeight: 700 },
  infoValue: { fontSize: 17, fontWeight: 800, color: "#000" },
  infoRow: { display: "flex", alignItems: "flex-start", gap: 12, padding: "12px 0", borderBottom: "1.5px solid #ddd" },
  rowLabel: { fontSize: 10, color: "#555", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4, fontWeight: 700 },
  rowVal: { fontSize: 16, fontWeight: 700, color: "#000", lineHeight: 1.4 },
};
