import { useState, useEffect, useRef } from "react";
import { auth, db } from "../firebase/config";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { QRCodeCanvas } from "qrcode.react";
// ── PATTERN 2: Factory ────────────────────────────────────────────
import PageFactory from "../patterns/factory/PageFactory";

const BLOOD_GROUPS = ["A+", "A−", "B+", "B−", "O+", "O−", "AB+", "AB−"];

async function saveCard(uid, cardData) {
  await setDoc(doc(db, "emergencyCards", uid), {
    ...cardData,
    updatedAt: new Date().toISOString(),
  });
}

async function loadCard(uid) {
  const snap = await getDoc(doc(db, "emergencyCards", uid));
  return snap.exists() ? snap.data() : null;
}

export default function EmergencyCard() {
  const uid        = auth.currentUser?.uid;
  const publicUrl  = `${window.location.origin}/emergency/${uid}`;
  const hiddenQrRef = useRef(null);

  const [form, setForm] = useState({
    bloodGroup:        "",
    allergies:         "",
    emergencyContact:  "",
    emergencyPhone:    "",
    emergencyContact2: "",
    emergencyPhone2:   "",
    doctor:            "",
    hospital:          "",
    medicalNotes:      "",
  });

  const [loading,     setLoading]     = useState(true);
  const [saving,      setSaving]      = useState(false);
  const [saved,       setSaved]       = useState(false);
  const [saveError,   setSaveError]   = useState("");
  const [copied,      setCopied]      = useState(false);
  const [downloading, setDownloading] = useState(false);

  // ── Load ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!uid) { setLoading(false); return; }
    loadCard(uid)
      .then(data => { if (data) setForm(f => ({ ...f, ...data })); })
      .catch(err => console.error("EmergencyCard load error:", err.message))
      .finally(() => setLoading(false));
  }, [uid]);

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));

  // ── Save ─────────────────────────────────────────────────────────
  async function handleSave() {
    if (!uid) return;
    setSaving(true);
    setSaveError("");
    try {
      await saveCard(uid, form);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setSaveError("Save failed — " + err.message);
    } finally {
      setSaving(false);
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // ── Download ID card as PNG ───────────────────────────────────────
  async function downloadCardImage() {
    setDownloading(true);
    await new Promise(r => setTimeout(r, 80));

    const canvas = document.createElement("canvas");
    canvas.width  = 680;
    canvas.height = 380;
    const ctx = canvas.getContext("2d");

    // Background
    const bg = ctx.createLinearGradient(0, 0, 680, 380);
    bg.addColorStop(0, "#0F1117");
    bg.addColorStop(1, "#1A1D27");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 680, 380);

    // Red accent bar
    ctx.fillStyle = "#EF4444";
    ctx.fillRect(0, 0, 680, 4);

    // Title
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 18px sans-serif";
    ctx.fillText("EMERGENCY MEDICAL ID", 28, 38);
    ctx.fillStyle = "#64748B";
    ctx.font = "10px sans-serif";
    ctx.fillText("MYDIGITALVAULT · SECURE DIGITAL SYSTEM", 28, 56);

    // Divider
    ctx.strokeStyle = "#2A2F45";
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(28, 70); ctx.lineTo(652, 70); ctx.stroke();

    // Blood group circle
    ctx.fillStyle = "rgba(239,68,68,0.15)";
    ctx.strokeStyle = "rgba(239,68,68,0.4)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(620, 38, 26, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#F87171";
    ctx.font = "bold 18px monospace";
    ctx.textAlign = "center";
    ctx.fillText(form.bloodGroup || "—", 620, 45);
    ctx.textAlign = "left";

    // Info rows
    const rows = [
      { label: "PATIENT",           val: auth.currentUser?.displayName || auth.currentUser?.email?.split("@")[0] || "—" },
      { label: "ALLERGIES",         val: form.allergies || "None declared" },
      { label: "PRIMARY ICE",       val: form.emergencyContact ? `${form.emergencyContact}  ${form.emergencyPhone}` : "Not set" },
      { label: "SECONDARY ICE",     val: form.emergencyContact2 ? `${form.emergencyContact2}  ${form.emergencyPhone2}` : "Not set" },
      { label: "DOCTOR / HOSPITAL", val: [form.doctor, form.hospital].filter(Boolean).join(" · ") || "—" },
    ];

    rows.forEach((row, i) => {
      const y = 96 + i * 52;
      ctx.font = "bold 8px sans-serif";
      ctx.fillStyle = "#64748B";
      ctx.fillText(row.label, 28, y);
      ctx.font = "500 13px sans-serif";
      ctx.fillStyle = "#E2E8F0";
      ctx.fillText(row.val, 28, y + 18);
      if (i < rows.length - 1) {
        ctx.strokeStyle = "#1E2433";
        ctx.lineWidth = 0.5;
        ctx.beginPath(); ctx.moveTo(28, y + 30); ctx.lineTo(430, y + 30); ctx.stroke();
      }
    });

    // QR code
    const qrEl = hiddenQrRef.current?.querySelector("canvas");
    if (qrEl) {
      const qrX = 458, qrY = 86, qrSize = 160;
      ctx.fillStyle = "#FFFFFF";
      ctx.roundRect?.(qrX - 8, qrY - 8, qrSize + 16, qrSize + 16, 8);
      ctx.fill();
      ctx.drawImage(qrEl, qrX, qrY, qrSize, qrSize);
      ctx.fillStyle = "#888";
      ctx.font = "bold 7px monospace";
      ctx.textAlign = "center";
      ctx.fillText("SCAN FOR FULL DETAILS", qrX + qrSize / 2, qrY + qrSize + 14);
      ctx.textAlign = "left";
    }

    // Footer
    ctx.fillStyle = "#334155";
    ctx.font = "8px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Generated by myDigitalVault", 340, 370);

    const userName = auth.currentUser?.displayName || auth.currentUser?.email?.split("@")[0] || "Card";
    const a = document.createElement("a");
    a.download = `Medical_ID_${userName.replace(/\s+/g, "_")}.png`;
    a.href = canvas.toDataURL("image/png");
    a.click();
    setDownloading(false);
  }

  if (loading) return PageFactory.createLoadingState("Loading Emergency Card...");

  const userName = auth.currentUser?.displayName || auth.currentUser?.email?.split("@")[0] || "User";

  return (
    <div style={{ animation: "fadeIn 0.3s ease" }}>

      {/* Hidden QR for PNG export */}
      <div ref={hiddenQrRef} style={{ position: "fixed", left: -9999, top: -9999, pointerEvents: "none", opacity: 0 }}>
        <QRCodeCanvas value={publicUrl} size={200} bgColor="#ffffff" fgColor="#07080f" level="H" />
      </div>

      {/* PATTERN 2: Factory header */}
      {PageFactory.createPageHeader({
        moduleType: "HEALTH",
        title:      "Emergency Card",
        subtitle:   "Scannable medical ID — accessible to anyone without login",
        action: (
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={handleCopy} style={S.btnGhost}>
              {copied ? "✓ Copied" : "Copy Link"}
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{ ...S.btnPrimary, background: saved ? "#10B981" : "var(--brand)", opacity: saving ? 0.7 : 1 }}
            >
              {saving ? "Saving..." : saved ? "✓ Saved" : "Save Card"}
            </button>
          </div>
        ),
      })}

      {/* Error banner */}
      {saveError && <div style={S.errorBanner}>⚠ {saveError}</div>}

      {/* ── Two-column layout ─────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 20, alignItems: "start" }}>

        {/* ── LEFT: Form ─────────────────────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

          {/* Blood group */}
          <div style={S.card}>
            <p style={S.sectionTitle}>🩸 Blood Group</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 7, marginTop: 12 }}>
              {BLOOD_GROUPS.map(g => (
                <button
                  key={g}
                  onClick={() => setForm(f => ({ ...f, bloodGroup: g }))}
                  style={{
                    padding: "9px 4px",
                    borderRadius: "var(--radius-btn)",
                    border: `1.5px solid ${form.bloodGroup === g ? "#EF4444" : "var(--border)"}`,
                    background: form.bloodGroup === g ? "rgba(239,68,68,0.15)" : "var(--bg)",
                    color: form.bloodGroup === g ? "#F87171" : "var(--text-2)",
                    fontSize: 13, fontWeight: 700, cursor: "pointer",
                    transition: "all 0.15s",
                    fontFamily: "monospace",
                    transform: form.bloodGroup === g ? "scale(1.04)" : "scale(1)",
                    boxShadow: form.bloodGroup === g ? "0 0 10px rgba(239,68,68,0.2)" : "none",
                  }}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* Allergies */}
          <div style={S.card}>
            <p style={S.sectionTitle}>⚠️ Known Allergies</p>
            <input
              style={{ ...S.input, marginTop: 10 }}
              placeholder="Penicillin, Latex, Peanuts..."
              value={form.allergies}
              onChange={set("allergies")}
              onFocus={e => e.target.style.borderColor = "#EF4444"}
              onBlur={e  => e.target.style.borderColor = "var(--border)"}
            />
          </div>

          {/* ICE Contacts */}
          <div style={S.card}>
            <p style={S.sectionTitle}>📞 Emergency Contacts (ICE)</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 12 }}>
              {/* Primary */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <span style={S.contactLabel}>Primary</span>
                <input style={S.input} placeholder="Full name" value={form.emergencyContact} onChange={set("emergencyContact")}
                  onFocus={e => e.target.style.borderColor = "#EF4444"}
                  onBlur={e  => e.target.style.borderColor = "var(--border)"} />
                <input style={S.input} placeholder="Phone number" value={form.emergencyPhone} onChange={set("emergencyPhone")}
                  onFocus={e => e.target.style.borderColor = "#EF4444"}
                  onBlur={e  => e.target.style.borderColor = "var(--border)"} />
              </div>
              {/* Secondary */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <span style={{ ...S.contactLabel, color: "#F59E0B" }}>Secondary</span>
                <input style={S.input} placeholder="Full name" value={form.emergencyContact2} onChange={set("emergencyContact2")}
                  onFocus={e => e.target.style.borderColor = "#F59E0B"}
                  onBlur={e  => e.target.style.borderColor = "var(--border)"} />
                <input style={S.input} placeholder="Phone number" value={form.emergencyPhone2} onChange={set("emergencyPhone2")}
                  onFocus={e => e.target.style.borderColor = "#F59E0B"}
                  onBlur={e  => e.target.style.borderColor = "var(--border)"} />
              </div>
            </div>
          </div>

          {/* Doctor, Hospital, Notes — compact 3-col */}
          <div style={S.card}>
            <p style={S.sectionTitle}>🏥 Medical Info</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 12 }}>
              <div>
                <p style={S.fieldLabel}>Doctor</p>
                <input style={S.input} placeholder="Dr. Ahmed Raza" value={form.doctor} onChange={set("doctor")}
                  onFocus={e => e.target.style.borderColor = "var(--brand)"}
                  onBlur={e  => e.target.style.borderColor = "var(--border)"} />
              </div>
              <div>
                <p style={S.fieldLabel}>Hospital</p>
                <input style={S.input} placeholder="Aga Khan Hospital, Karachi" value={form.hospital} onChange={set("hospital")}
                  onFocus={e => e.target.style.borderColor = "var(--brand)"}
                  onBlur={e  => e.target.style.borderColor = "var(--border)"} />
              </div>
            </div>
            <div style={{ marginTop: 10 }}>
              <p style={S.fieldLabel}>Medical Notes <span style={{ color: "var(--text-3)", fontWeight: 400 }}>(optional)</span></p>
              <input style={S.input} placeholder="Diabetic, takes insulin daily..." value={form.medicalNotes} onChange={set("medicalNotes")}
                onFocus={e => e.target.style.borderColor = "var(--brand)"}
                onBlur={e  => e.target.style.borderColor = "var(--border)"} />
            </div>
          </div>

        </div>

        {/* ── RIGHT: Live card preview + share ──────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14, position: "sticky", top: 24 }}>

          {/* Card preview */}
          <div style={S.cardPreview}>
            {/* Card top: name + blood group */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={S.avatar}>
                  {userName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "#fff", margin: 0 }}>{userName}</p>
                  <p style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", letterSpacing: "0.1em", textTransform: "uppercase", marginTop: 2 }}>
                    Emergency Medical Card
                  </p>
                </div>
              </div>
              <div style={S.bloodBadge}>
                <p style={S.bloodVal}>{form.bloodGroup || "—"}</p>
                <p style={S.bloodLbl}>Blood</p>
              </div>
            </div>

            {/* Divider */}
            <div style={{ height: 1, background: "rgba(255,255,255,0.07)", marginBottom: 14 }} />

            {/* Key info tiles */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
              {[
                { label: "Allergies",  val: form.allergies         || "—" },
                { label: "ICE 1",      val: form.emergencyContact  || "—" },
                { label: "Doctor",     val: form.doctor            || "—" },
                { label: "Hospital",   val: form.hospital          || "—" },
              ].map(({ label, val }) => (
                <div key={label} style={S.infoTile}>
                  <p style={S.infoLbl}>{label}</p>
                  <p style={S.infoVal}>{val}</p>
                </div>
              ))}
            </div>

            {/* QR code */}
            <div style={{
              background: "#fff",
              borderRadius: 10, padding: 10,
              display: "flex", flexDirection: "column",
              alignItems: "center", gap: 6,
            }}>
              <QRCodeCanvas
                value={publicUrl}
                size={100}
                bgColor="#ffffff"
                fgColor="#07080f"
                level="H"
                style={{ borderRadius: 6 }}
              />
              <p style={{ fontSize: 9, color: "#666", letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: "monospace" }}>
                Scan — No login needed
              </p>
            </div>
          </div>

          {/* Public URL */}
          <div style={S.urlBox}>
            <div style={{ flex: 1, overflow: "hidden" }}>
              <p style={S.urlLabel}>Public URL</p>
              <p style={S.urlText}>{publicUrl}</p>
            </div>
            <button style={S.copyBtnSmall} onClick={handleCopy}>
              {copied ? "✓" : "Copy"}
            </button>
          </div>

          {/* Download */}
          <button
            style={{ ...S.btnDownload, opacity: downloading ? 0.7 : 1 }}
            onClick={downloadCardImage}
            disabled={downloading}
          >
            {downloading ? "Generating..." : "⬇ Download ID Card"}
          </button>

        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity:0 } to { opacity:1 } }
        @keyframes spin    { to   { transform:rotate(360deg) } }
      `}</style>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────
const S = {
  errorBanner: {
    background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
    borderRadius: "var(--radius)", padding: "10px 16px", marginBottom: 14,
    color: "#EF4444", fontSize: 13, fontWeight: 500,
  },
  card: {
    background: "var(--bg-card)", border: "1px solid var(--border)",
    borderRadius: "var(--radius-lg)", padding: "16px 18px",
    boxShadow: "var(--shadow-sm)",
  },
  cardPreview: {
    background: "linear-gradient(145deg, #0f1117, #1a0a0a)",
    border: "1px solid rgba(239,68,68,0.2)",
    borderRadius: 16, padding: 18,
    boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
  },
  sectionTitle: {
    fontSize: 13, fontWeight: 700, color: "var(--text-1)",
    margin: 0, fontFamily: "'Sora', sans-serif",
  },
  fieldLabel: {
    fontSize: 10, fontWeight: 600, color: "var(--text-2)",
    textTransform: "uppercase", letterSpacing: "0.08em",
    marginBottom: 5,
  },
  contactLabel: {
    fontSize: 10, fontWeight: 700, color: "#F87171",
    textTransform: "uppercase", letterSpacing: "0.1em",
  },
  input: {
    width: "100%", padding: "9px 12px",
    background: "var(--bg)", border: "1.5px solid var(--border)",
    borderRadius: "var(--radius)", color: "var(--text-1)",
    fontSize: 13, outline: "none",
    transition: "border-color 0.15s", boxSizing: "border-box",
  },
  avatar: {
    width: 36, height: 36, borderRadius: "50%",
    background: "linear-gradient(135deg,#ef4444,#b91c1c)",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 15, fontWeight: 700, color: "#fff", flexShrink: 0,
  },
  bloodBadge: {
    background: "rgba(239,68,68,0.12)",
    border: "1px solid rgba(239,68,68,0.25)",
    borderRadius: 10, padding: "6px 12px", textAlign: "center",
  },
  bloodVal: {
    fontSize: 18, fontWeight: 800, color: "#F87171",
    fontFamily: "monospace", lineHeight: 1, margin: 0,
  },
  bloodLbl: {
    fontSize: 8, color: "rgba(239,68,68,0.5)",
    textTransform: "uppercase", letterSpacing: "0.1em",
    marginTop: 2,
  },
  infoTile: {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 8, padding: "8px 10px",
  },
  infoLbl: {
    fontSize: 9, color: "rgba(255,255,255,0.3)",
    textTransform: "uppercase", letterSpacing: "0.12em",
    marginBottom: 4, margin: 0,
  },
  infoVal: {
    fontSize: 12, fontWeight: 500, color: "rgba(255,255,255,0.8)",
    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
    margin: 0,
  },
  urlBox: {
    display: "flex", alignItems: "center", gap: 10,
    background: "var(--bg-card)", border: "1px solid var(--border)",
    borderRadius: "var(--radius-lg)", padding: "12px 14px",
  },
  urlLabel: {
    fontSize: 9, color: "var(--text-3)",
    textTransform: "uppercase", letterSpacing: "0.1em",
    marginBottom: 4, margin: 0,
  },
  urlText: {
    fontSize: 11, color: "var(--brand)",
    fontFamily: "monospace", overflow: "hidden",
    textOverflow: "ellipsis", whiteSpace: "nowrap",
    margin: 0,
  },
  copyBtnSmall: {
    padding: "6px 12px",
    background: "rgba(224,71,76,0.1)",
    border: "1px solid rgba(224,71,76,0.25)",
    borderRadius: "var(--radius-btn)",
    color: "var(--brand)", fontSize: 12, fontWeight: 600,
    cursor: "pointer", flexShrink: 0, transition: "all 0.15s",
  },
  btnPrimary: {
    padding: "9px 18px", color: "white", border: "none",
    borderRadius: "var(--radius-btn)", fontSize: 13,
    fontWeight: 600, cursor: "pointer",
    boxShadow: "0 2px 10px var(--brand-glow)",
    transition: "background 0.25s",
  },
  btnGhost: {
    padding: "9px 14px",
    background: "transparent",
    border: "1px solid rgba(255,255,255,0.15)",
    borderRadius: "var(--radius-btn)",
    color: "rgba(255,255,255,0.6)", fontSize: 13,
    fontWeight: 500, cursor: "pointer",
    transition: "all 0.15s",
  },
  btnDownload: {
    width: "100%", padding: "11px",
    background: "rgba(245,158,11,0.1)",
    border: "1px solid rgba(245,158,11,0.25)",
    borderRadius: "var(--radius-btn)",
    color: "#F59E0B", fontSize: 13, fontWeight: 600,
    cursor: "pointer", transition: "all 0.15s",
    letterSpacing: "0.02em",
  },
};
