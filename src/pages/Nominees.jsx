import { useState, useEffect, useCallback } from "react";
import { addNominee, getNominees, deleteNominee } from "../firebase/db";

const RELATIONS = [
  { value: "spouse",  label: "Spouse",  color: "#ff4d4d", bg: "rgba(255,77,77,0.1)"   },
  { value: "child",   label: "Child",   color: "#00aaff", bg: "rgba(0,170,255,0.1)"   },
  { value: "parent",  label: "Parent",  color: "#ffb020", bg: "rgba(255,176,32,0.1)"  },
  { value: "sibling", label: "Sibling", color: "#6c47ff", bg: "rgba(108,71,255,0.1)"  },
  { value: "friend",  label: "Friend",  color: "#00d68f", bg: "rgba(0,214,143,0.1)"   },
  { value: "other",   label: "Other",   color: "#9090b0", bg: "rgba(144,144,176,0.1)" },
];

const AVATAR_COLORS = ["#6c47ff","#00aaff","#00d68f","#ffb020","#ff4d4d"];

function getRel(value) { return RELATIONS.find(r => r.value === value) || RELATIONS[5]; }

export default function Nominees() {
  const [name, setName]         = useState("");
  const [email, setEmail]       = useState("");
  const [phone, setPhone]       = useState("");
  const [relation, setRelation] = useState("spouse");
  const [nominees, setNominees] = useState([]);
  const [loading, setLoading]   = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [toast, setToast]       = useState(null);
  const [showForm, setShowForm] = useState(false);

  const loadNominees = useCallback(async () => {
    const list = await getNominees();
    setNominees(list);
    setPageLoading(false);
  }, []);

  useEffect(() => { loadNominees(); }, [loadNominees]);

  function showToast(msg, type = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  async function handleSave() {
    if (!name.trim() || !email.trim()) { showToast("Name and email are required", "error"); return; }
    setLoading(true);
    await addNominee({ name, email, phone, relation });
    setName(""); setEmail(""); setPhone(""); setRelation("spouse");
    showToast("Nominee added ✓");
    setLoading(false); setShowForm(false);
    loadNominees();
  }

  async function handleDelete(id) {
    await deleteNominee(id);
    showToast("Nominee removed");
    loadNominees();
  }

  const focus = e => e.target.style.borderColor = "rgba(108,71,255,0.6)";
  const blur  = e => e.target.style.borderColor = "var(--border)";

  return (
    <div style={{ animation: "fadeIn 0.3s ease" }}>

      {/* Toast */}
      {toast && (
        <div style={{ ...S.toast, background: toast.type === "error" ? "rgba(255,77,77,0.1)" : "rgba(0,214,143,0.1)", borderColor: toast.type === "error" ? "rgba(255,77,77,0.3)" : "rgba(0,214,143,0.3)", color: toast.type === "error" ? "var(--danger)" : "var(--success)" }}>
          {toast.type === "error" ? "✕" : "✓"} {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={S.header}>
        <div>
          <h1 style={S.heading}>Trusted Contacts</h1>
          <p style={S.subheading}>{nominees.length} trusted {nominees.length === 1 ? "person" : "people"} registered</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} style={S.btnPrimary}
          onMouseEnter={e => e.currentTarget.style.opacity = "0.85"}
          onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
          {showForm ? "✕ Cancel" : "+ Add Nominee"}
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <div style={{ ...S.card, marginBottom: "16px", borderColor: "rgba(108,71,255,0.25)", animation: "slideUp 0.3s ease" }}>
          <p style={S.cardTitle}>New </p>

          <p style={S.label}>Relationship</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "8px", marginBottom: "16px" }}>
            {RELATIONS.map(r => (
              <button key={r.value} onClick={() => setRelation(r.value)}
                style={{ padding: "8px 10px", borderRadius: "var(--radius-btn)", border: `1px solid ${relation === r.value ? r.color : "var(--border)"}`, background: relation === r.value ? r.bg : "var(--bg-3)", color: relation === r.value ? r.color : "var(--text-muted)", fontSize: "12px", cursor: "pointer", transition: "all 0.15s" }}>
                {r.label}
              </button>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
            <div>
              <p style={S.label}>Full Name</p>
              <input style={S.input} placeholder="Ahmed Khan" value={name} onChange={e => setName(e.target.value)} onFocus={focus} onBlur={blur} />
            </div>
            <div>
              <p style={S.label}>Email</p>
              <input style={S.input} type="email" placeholder="ahmed@example.com" value={email} onChange={e => setEmail(e.target.value)} onFocus={focus} onBlur={blur} />
            </div>
          </div>

          <p style={S.label}>Phone <span style={{ textTransform: "none", color: "var(--text-muted)", opacity: 0.6 }}>(optional)</span></p>
          <input style={{ ...S.input, marginBottom: "16px" }} placeholder="+92 300 0000000" value={phone} onChange={e => setPhone(e.target.value)} onFocus={focus} onBlur={blur} />

          <button onClick={handleSave} disabled={loading} style={{ ...S.btnPrimary, width: "100%", opacity: loading ? 0.6 : 1 }}>
            {loading ? "Saving..." : "Add Nominee"}
          </button>
        </div>
      )}

      {/* List */}
      {pageLoading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {[1,2,3].map(i => <div key={i} style={{ height: "76px", borderRadius: "14px", background: "var(--bg-3)" }} />)}
        </div>
      ) : nominees.length === 0 ? (
        <div style={{ ...S.card, padding: "48px", textAlign: "center" }}>
          <p style={{ fontSize: "36px", marginBottom: "12px" }}>👥</p>
          <p style={{ fontSize: "15px", fontWeight: "500", color: "var(--text-primary)", marginBottom: "6px" }}>No person yet</p>
          <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>Add trusted peoples</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {nominees.map((nominee, idx) => {
            const rel = getRel(nominee.relation);
            const avatarColor = AVATAR_COLORS[idx % AVATAR_COLORS.length];
            return (
              <div key={nominee.id} style={S.card}
                onMouseEnter={e => e.currentTarget.style.borderColor = "var(--border-hover)"}
                onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border)"}>
                <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                  <div style={{ width: "44px", height: "44px", borderRadius: "50%", background: avatarColor, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", fontWeight: "700", color: "white", flexShrink: 0 }}>
                    {nominee.name.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px", flexWrap: "wrap" }}>
                      <p style={{ fontSize: "14px", fontWeight: "600", color: "var(--text-primary)" }}>{nominee.name}</p>
                      <span style={{ fontSize: "10px", padding: "2px 8px", borderRadius: "20px", background: rel.bg, color: rel.color, border: `1px solid ${rel.color}30` }}>{rel.label}</span>
                    </div>
                    <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
                      <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>✉ {nominee.email}</span>
                      {nominee.phone && <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>📞 {nominee.phone}</span>}
                    </div>
                  </div>
                  <button onClick={() => handleDelete(nominee.id)}
                    style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: "16px", padding: "6px", borderRadius: "var(--radius-btn)", transition: "color 0.2s" }}
                    onMouseEnter={e => e.currentTarget.style.color = "var(--danger)"}
                    onMouseLeave={e => e.currentTarget.style.color = "var(--text-muted)"}>
                    🗑️
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <style>{`@keyframes fadeIn{from{opacity:0}to{opacity:1}} @keyframes slideUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  );
}

const S = {
  toast: { position: "fixed", top: "16px", right: "16px", zIndex: 9999, padding: "12px 18px", borderRadius: "12px", border: "1px solid", fontSize: "13px", fontWeight: "500" },
  header: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" },
  heading: { fontSize: "22px", fontWeight: "600", color: "var(--text-primary)", margin: 0 },
  subheading: { fontSize: "13px", color: "var(--text-muted)", marginTop: "4px" },
  card: { background: "var(--bg-2)", border: "1px solid var(--border)", borderRadius: "14px", padding: "18px", transition: "border-color 0.2s" },
  cardTitle: { fontSize: "14px", fontWeight: "600", color: "var(--text-primary)", marginBottom: "16px" },
  label: { fontSize: "11px", fontWeight: "500", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "6px" },
  input: { width: "100%", padding: "10px 14px", background: "var(--bg-1)", border: "1px solid var(--border)", borderRadius: "10px", color: "var(--text-primary)", fontSize: "13px", outline: "none", transition: "border-color 0.2s", boxSizing: "border-box" },
  btnPrimary: { padding: "10px 18px", background: "linear-gradient(135deg,#6c47ff,#4f2fe0)", color: "white", border: "none", borderRadius: "var(--radius-btn)", fontSize: "13px", fontWeight: "500", cursor: "pointer", boxShadow: "0 4px 16px rgba(108,71,255,0.3)", transition: "opacity 0.2s" },
};
