import { useState, useEffect } from "react";
import { doc, setDoc, getDoc } from "firebase/firestore";
// ── PATTERN 1: Singleton ──────────────────────────────────────────
import firebaseService from "../patterns/singleton/FirebaseService";
// ── PATTERN 2: Factory ────────────────────────────────────────────
import PageFactory from "../patterns/factory/PageFactory";

const BLOOD_GROUPS = ["A+", "A−", "B+", "B−", "O+", "O−", "AB+", "AB−"];

const FIELDS = [
  {
    key: "conditions",
    title: "Chronic Conditions",
    icon: "🩺",
    placeholder: "E.g., Type 2 Diabetes, Hypertension, Asthma...",
    hint: "List ongoing diagnosed conditions",
    color: "#EF4444",
  },
  {
    key: "prescriptions",
    title: "Current Prescriptions",
    icon: "💊",
    placeholder: "E.g., Metformin 500mg twice daily, Lisinopril 10mg...",
    hint: "Include dosage and frequency",
    color: "#F59E0B",
  },
  {
    key: "vaccinations",
    title: "Vaccination History",
    icon: "💉",
    placeholder: "E.g., COVID-19 (Pfizer) - 2021, Tetanus - 2019, Hepatitis B - 2018...",
    hint: "Include year of each vaccination",
    color: "#10B981",
  },
  {
    key: "surgeries",
    title: "Past Surgeries / Procedures",
    icon: "🔬",
    placeholder: "E.g., Appendectomy (2015), Knee surgery (2019)...",
    hint: "Include approximate year",
    color: "#7C3AED",
  },
];

// ── Completion score ──────────────────────────────────────────────
function getCompletion(form) {
  const fields = ["bloodGroup", ...FIELDS.map(f => f.key)];
  const filled = fields.filter(k => form[k]?.trim?.()?.length > 0);
  return { filled: filled.length, total: fields.length };
}

export default function MedicalPassport() {
  const [form, setForm] = useState({
    conditions:    "",
    prescriptions: "",
    vaccinations:  "",
    surgeries:     "",
    bloodGroup:    "",
  });
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);
  const [saved,     setSaved]     = useState(false);
  const [saveError, setSaveError] = useState("");
  const [lastSaved, setLastSaved] = useState(null);

  // ── Fetch on mount ────────────────────────────────────────────
  useEffect(() => {
    const fetchDoc = async () => {
      const currentUser = firebaseService.auth.currentUser;
      if (!currentUser) { setLoading(false); return; }
      try {
        const snap = await getDoc(doc(firebaseService.db, "medicalPassport", currentUser.uid));
        if (snap.exists()) {
          const data = snap.data();
          setForm(prev => ({ ...prev, ...data }));
          if (data.updatedAt) {
            setLastSaved(new Date(data.updatedAt).toLocaleString("en-PK"));
          }
        }
      } catch (err) {
        console.error("MedicalPassport fetch error:", err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchDoc();
  }, []);

  // ── Save ──────────────────────────────────────────────────────
  const handleSave = async () => {
    const currentUser = firebaseService.auth.currentUser;
    if (!currentUser) return;
    setSaving(true);
    setSaveError("");
    try {
      const now = new Date().toISOString();
      await setDoc(
        doc(firebaseService.db, "medicalPassport", currentUser.uid),
        { ...form, updatedAt: now },
        { merge: true }
      );
      setSaved(true);
      setLastSaved(new Date().toLocaleString("en-PK"));
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setSaveError("Save failed — " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const update = (key) => (e) => setForm(prev => ({ ...prev, [key]: e.target.value }));

  const { filled, total } = getCompletion(form);
  const completionPct = Math.round((filled / total) * 100);

  if (loading) return PageFactory.createLoadingState("Loading Medical Passport...");

  return (
    <div style={{ animation: "fadeIn 0.3s ease" }}>
      {/* PATTERN 2: Factory header */}
      {PageFactory.createPageHeader({
        moduleType: "HEALTH",
        title:      "Medical Passport",
        subtitle:   "Your secure health profile — accessible in emergencies",
        action: (
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              ...S.btnPrimary,
              opacity: saving ? 0.7 : 1,
              background: saved ? "#10B981" : "var(--brand)",
            }}
          >
            {saving ? "Saving..." : saved ? "✓ Saved" : "Save Changes"}
          </button>
        ),
      })}

      {/* Error banner */}
      {saveError && (
        <div style={S.errorBanner}>⚠ {saveError}</div>
      )}

      {/* Completion + last saved bar */}
      <div style={S.metaBar}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <span style={{ fontSize: 12, color: "var(--text-2)", fontWeight: 600 }}>
              Profile Completion
            </span>
            <span style={{
              fontSize: 11, padding: "2px 8px", borderRadius: 20,
              background: completionPct === 100 ? "rgba(16,185,129,0.12)" : "rgba(245,158,11,0.10)",
              color:      completionPct === 100 ? "#10B981" : "#F59E0B",
              border:     `1px solid ${completionPct === 100 ? "rgba(16,185,129,0.25)" : "rgba(245,158,11,0.2)"}`,
              fontWeight: 700,
            }}>
              {filled}/{total} fields
            </span>
          </div>
          <div style={{ height: 6, borderRadius: 3, background: "var(--border)", overflow: "hidden" }}>
            <div style={{
              height: "100%", borderRadius: 3,
              width: `${completionPct}%`,
              background: completionPct === 100 ? "#10B981"
                : completionPct >= 60 ? "#F59E0B"
                : "var(--brand)",
              transition: "width 0.4s ease",
            }} />
          </div>
        </div>
        {lastSaved && (
          <p style={{ fontSize: 11, color: "var(--text-3)", flexShrink: 0, marginLeft: 16 }}>
            Last saved: {lastSaved}
          </p>
        )}
      </div>

      {/* ── Blood Group selector ────────────────────────────────── */}
      <div style={{ ...S.card, marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <span style={{ fontSize: 20 }}>🩸</span>
          <div>
            <p style={S.cardTitle}>Blood Group</p>
            <p style={{ fontSize: 11, color: "var(--text-3)", marginTop: 2 }}>
              Critical for emergency medical care
            </p>
          </div>
          {form.bloodGroup && (
            <span style={{
              marginLeft: "auto", fontSize: 20, fontWeight: 800,
              color: "#EF4444",
              background: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.25)",
              borderRadius: 10, padding: "4px 14px",
              fontFamily: "monospace",
            }}>
              {form.bloodGroup}
            </span>
          )}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
          {BLOOD_GROUPS.map(bg => (
            <button
              key={bg}
              onClick={() => setForm(prev => ({ ...prev, bloodGroup: bg }))}
              style={{
                padding: "10px 6px",
                borderRadius: "var(--radius-btn)",
                border: `1.5px solid ${form.bloodGroup === bg ? "#EF4444" : "var(--border)"}`,
                background: form.bloodGroup === bg
                  ? "rgba(239,68,68,0.15)"
                  : "var(--bg)",
                color: form.bloodGroup === bg ? "#F87171" : "var(--text-2)",
                fontSize: 13, fontWeight: 700, cursor: "pointer",
                transition: "all 0.15s",
                fontFamily: "monospace",
                transform: form.bloodGroup === bg ? "scale(1.05)" : "scale(1)",
                boxShadow: form.bloodGroup === bg ? "0 0 12px rgba(239,68,68,0.2)" : "none",
              }}
            >
              {bg}
            </button>
          ))}
        </div>
      </div>

      {/* ── Health fields grid ──────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {FIELDS.map(field => {
          const charCount = form[field.key]?.length || 0;
          return (
            <div key={field.key} style={{
              ...S.card,
              borderTop: `3px solid ${field.color}`,
            }}>
              {/* Card header */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <span style={{
                  width: 32, height: 32, borderRadius: 8, fontSize: 16,
                  background: `${field.color}15`,
                  border: `1px solid ${field.color}30`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}>
                  {field.icon}
                </span>
                <div style={{ flex: 1 }}>
                  <p style={S.cardTitle}>{field.title}</p>
                  <p style={{ fontSize: 11, color: "var(--text-3)", marginTop: 1 }}>{field.hint}</p>
                </div>
                {/* Filled indicator */}
                {form[field.key]?.trim() && (
                  <span style={{
                    width: 8, height: 8, borderRadius: "50%",
                    background: "#10B981",
                    boxShadow: "0 0 6px rgba(16,185,129,0.5)",
                    flexShrink: 0,
                  }} />
                )}
              </div>

              {/* Textarea */}
              <textarea
                style={{
                  ...S.textarea,
                  borderColor: form[field.key]?.trim()
                    ? `${field.color}55`
                    : "var(--border)",
                }}
                placeholder={field.placeholder}
                value={form[field.key]}
                onChange={update(field.key)}
                onFocus={(e) => (e.target.style.borderColor = field.color)}
                onBlur={(e)  => (e.target.style.borderColor = form[field.key]?.trim()
                  ? `${field.color}55`
                  : "var(--border)"
                )}
              />

              {/* Character count */}
              <p style={{
                fontSize: 10, color: "var(--text-3)",
                textAlign: "right", marginTop: 4,
              }}>
                {charCount} characters
              </p>
            </div>
          );
        })}
      </div>

      {/* ── Emergency tip banner ────────────────────────────────── */}
      <div style={S.tipBanner}>
        <span style={{ fontSize: 16 }}>💡</span>
        <p style={{ fontSize: 12, color: "var(--text-2)", flex: 1 }}>
          This data is also used by your <strong style={{ color: "var(--text-1)" }}>Emergency Card</strong> — 
          keep it updated so first responders have accurate information.
        </p>
      </div>

      <style>{`@keyframes fadeIn{from{opacity:0}to{opacity:1}}`}</style>
    </div>
  );
}

const S = {
  errorBanner: {
    background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
    borderRadius: "var(--radius)", padding: "10px 16px", marginBottom: 16,
    color: "#EF4444", fontSize: 13, fontWeight: 500,
  },
  metaBar: {
    display: "flex", alignItems: "center",
    background: "var(--bg-card)", border: "1px solid var(--border)",
    borderRadius: "var(--radius-lg)", padding: "14px 18px",
    marginBottom: 16, gap: 12,
  },
  card: {
    background: "var(--bg-card)", border: "1px solid var(--border)",
    borderRadius: "var(--radius-lg)", padding: "18px 20px",
    boxShadow: "var(--shadow-sm)",
  },
  cardTitle: {
    fontSize: "14px", fontWeight: "600", color: "var(--text-1)",
    margin: 0, fontFamily: "'Sora', sans-serif",
  },
  textarea: {
    width: "100%", minHeight: 110, padding: "10px 12px",
    background: "var(--bg-card)", border: "1.5px solid var(--border)",
    borderRadius: "var(--radius)", color: "var(--text-1)",
    fontSize: "13px", outline: "none", resize: "vertical",
    transition: "border-color 0.15s", boxSizing: "border-box",
    lineHeight: 1.6, fontFamily: "inherit",
  },
  btnPrimary: {
    padding: "10px 22px", color: "white", border: "none",
    borderRadius: "var(--radius-btn)", fontSize: "13px",
    fontWeight: "600", cursor: "pointer",
    boxShadow: "0 2px 12px var(--brand-glow)",
    transition: "background 0.3s",
  },
  tipBanner: {
    display: "flex", alignItems: "flex-start", gap: 10,
    background: "rgba(16,185,129,0.06)",
    border: "1px solid rgba(16,185,129,0.15)",
    borderRadius: "var(--radius-lg)", padding: "14px 18px",
    marginTop: 16,
  },
};
