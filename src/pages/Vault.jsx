import { useState, useEffect, useCallback } from "react";
import { addAsset, getAssets, deleteAsset } from "../firebase/db";
import { encrypt, decrypt } from "../utils/encryption";

const CATS = [
  { value: "bank",     label: "Bank Account",    color: "#00d68f", bg: "rgba(0,214,143,0.1)" },
  { value: "crypto",   label: "Crypto Wallet",   color: "#ffb020", bg: "rgba(255,176,32,0.1)" },
  { value: "social",   label: "Social Media",    color: "#00aaff", bg: "rgba(0,170,255,0.1)" },
  { value: "email",    label: "Email Account",   color: "#6c47ff", bg: "rgba(108,71,255,0.1)" },
  { value: "property", label: "Property",        color: "#00d68f", bg: "rgba(0,214,143,0.1)" },
  { value: "memory",   label: "Personal Memory", color: "#ff4d4d", bg: "rgba(255,77,77,0.1)" },
];

function getCat(value) { return CATS.find(c => c.value === value) || CATS[5]; }

export default function Vault() {
  const [title, setTitle]           = useState("");
  const [category, setCategory]     = useState("bank");
  const [data, setData]             = useState("");
  const [assets, setAssets]         = useState([]);
  const [loading, setLoading]       = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [toast, setToast]           = useState(null);
  const [revealed, setRevealed]     = useState({});
  const [showForm, setShowForm]     = useState(false);
  const [filter, setFilter]         = useState("all");

  const loadAssets = useCallback(async () => {
    const list = await getAssets();
    setAssets(list.map(a => ({ ...a, data: decrypt(a.data) })));
    setPageLoading(false);
  }, []);

  useEffect(() => { loadAssets(); }, [loadAssets]);

  function showToast(msg, type = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  async function handleSave() {
    if (!title.trim() || !data.trim()) { showToast("Title and data are required", "error"); return; }
    setLoading(true);
    await addAsset({ title, category, data: encrypt(data) });
    setTitle(""); setCategory("bank"); setData("");
    showToast("Asset saved securely ✓");
    setLoading(false); setShowForm(false);
    loadAssets();
  }

  async function handleDelete(id) {
    await deleteAsset(id);
    showToast("Asset removed");
    loadAssets();
  }

  const filtered = filter === "all" ? assets : assets.filter(a => a.category === filter);
  const counts   = CATS.reduce((acc, c) => ({ ...acc, [c.value]: assets.filter(a => a.category === c.value).length }), {});

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
          <h1 style={S.heading}>Vault</h1>
          <p style={S.subheading}>{assets.length} encrypted assets</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} style={S.btnPrimary}
          onMouseEnter={e => e.currentTarget.style.opacity = "0.85"}
          onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
          {showForm ? "✕ Cancel" : "+ Add Asset"}
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <div style={{ ...S.card, marginBottom: "16px", borderColor: "rgba(108,71,255,0.25)", animation: "slideUp 0.3s ease" }}>
          <p style={S.cardTitle}>New Asset</p>

          <p style={S.label}>Category</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "8px", marginBottom: "14px" }}>
            {CATS.map(c => (
              <button key={c.value} onClick={() => setCategory(c.value)}
                style={{ padding: "8px 10px", borderRadius: "var(--radius-btn)", border: `1px solid ${category === c.value ? c.color : "var(--border)"}`, background: category === c.value ? c.bg : "var(--bg-3)", color: category === c.value ? c.color : "var(--text-muted)", fontSize: "12px", cursor: "pointer", transition: "all 0.15s" }}>
                {c.label}
              </button>
            ))}
          </div>

          <p style={S.label}>Title</p>
          <input style={{ ...S.input, marginBottom: "12px" }} placeholder="e.g. Main Bank Account"
            value={title} onChange={e => setTitle(e.target.value)}
            onFocus={e => e.target.style.borderColor = "rgba(108,71,255,0.6)"}
            onBlur={e => e.target.style.borderColor = "var(--border)"} />

          <p style={S.label}>Secure Data</p>
          <textarea style={{ ...S.input, height: "90px", resize: "none", marginBottom: "6px" }}
            placeholder="Username, password, seed phrase..."
            value={data} onChange={e => setData(e.target.value)}
            onFocus={e => e.target.style.borderColor = "rgba(108,71,255,0.6)"}
            onBlur={e => e.target.style.borderColor = "var(--border)"} />
          <p style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "14px" }}>🔒 AES-256 encrypted before saving</p>

          <button onClick={handleSave} disabled={loading} style={{ ...S.btnPrimary, width: "100%", opacity: loading ? 0.6 : 1 }}>
            {loading ? "Encrypting..." : "Save Securely"}
          </button>
        </div>
      )}

      {/* Filter tabs */}
      {assets.length > 0 && (
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "16px" }}>
          {[{ value: "all", label: `All (${assets.length})`, color: "var(--brand)", bg: "rgba(108,71,255,0.1)" }, ...CATS.filter(c => counts[c.value] > 0).map(c => ({ ...c, label: `${c.label} (${counts[c.value]})` }))].map(f => (
            <button key={f.value} onClick={() => setFilter(f.value)}
              style={{ padding: "4px 12px", borderRadius: "var(--radius-btn)", border: `1px solid ${filter === f.value ? f.color : "var(--border)"}`, background: filter === f.value ? f.bg : "transparent", color: filter === f.value ? f.color : "var(--text-muted)", fontSize: "11px", cursor: "pointer", transition: "all 0.15s" }}>
              {f.label}
            </button>
          ))}
        </div>
      )}

      {/* Assets */}
      {pageLoading ? (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          {[1,2,3].map(i => <div key={i} style={{ height: "110px", borderRadius: "14px", background: "var(--bg-3)", animation: "shimmer 1.8s infinite", backgroundSize: "200% 100%", backgroundImage: "linear-gradient(90deg,var(--bg-3) 25%,var(--bg-4) 50%,var(--bg-3) 75%)" }} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ ...S.card, padding: "48px", textAlign: "center" }}>
          <p style={{ fontSize: "36px", marginBottom: "12px" }}>🔐</p>
          <p style={{ fontSize: "15px", fontWeight: "500", color: "var(--text-primary)", marginBottom: "6px" }}>No assets yet</p>
          <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>Add your first encrypted asset above</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          {filtered.map(asset => {
            const cat = getCat(asset.category);
            const isRevealed = revealed[asset.id];
            return (
              <div key={asset.id} style={S.card}
                onMouseEnter={e => e.currentTarget.style.borderColor = "var(--border-hover)"}
                onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border)"}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: cat.bg, border: `1px solid ${cat.color}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", flexShrink: 0 }}>
                      {asset.category === "bank" ? "🏦" : asset.category === "crypto" ? "💰" : asset.category === "social" ? "📱" : asset.category === "email" ? "📧" : asset.category === "property" ? "🏠" : "💝"}
                    </div>
                    <div>
                      <p style={{ fontSize: "13px", fontWeight: "600", color: "var(--text-primary)", marginBottom: "3px" }}>{asset.title}</p>
                      <span style={{ fontSize: "10px", padding: "2px 8px", borderRadius: "20px", background: cat.bg, color: cat.color, border: `1px solid ${cat.color}30` }}>{cat.label}</span>
                    </div>
                  </div>
                  <button onClick={() => handleDelete(asset.id)}
                    style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: "16px", padding: "4px", borderRadius: "var(--radius-btn)", transition: "color 0.2s" }}
                    onMouseEnter={e => e.currentTarget.style.color = "var(--danger)"}
                    onMouseLeave={e => e.currentTarget.style.color = "var(--text-muted)"}>
                    🗑️
                  </button>
                </div>
                <p style={{ fontSize: "12px", fontFamily: "monospace", color: "var(--text-secondary)", wordBreak: "break-all", lineHeight: "1.6", filter: isRevealed ? "none" : "blur(5px)", userSelect: isRevealed ? "auto" : "none", transition: "filter 0.3s" }}>
                  {asset.data}
                </p>
                <button onClick={() => setRevealed(r => ({ ...r, [asset.id]: !r[asset.id] }))}
                  style={{ marginTop: "8px", background: "transparent", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: "11px", padding: 0 }}>
                  {isRevealed ? "🙈 Hide" : "👁 Reveal"}
                </button>
              </div>
            );
          })}
        </div>
      )}

      <style>{`@keyframes fadeIn{from{opacity:0}to{opacity:1}} @keyframes slideUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}} @keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}`}</style>
    </div>
  );
}

const S = {
  toast: { position: "fixed", top: "16px", right: "16px", zIndex: 9999, padding: "12px 18px", borderRadius: "12px", border: "1px solid", fontSize: "13px", fontWeight: "500", animation: "slideRight 0.3s ease" },
  header: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" },
  heading: { fontSize: "22px", fontWeight: "600", color: "var(--text-primary)", margin: 0 },
  subheading: { fontSize: "13px", color: "var(--text-muted)", marginTop: "4px" },
  card: { background: "var(--bg-2)", border: "1px solid var(--border)", borderRadius: "14px", padding: "18px", transition: "border-color 0.2s" },
  cardTitle: { fontSize: "14px", fontWeight: "600", color: "var(--text-primary)", marginBottom: "16px" },
  label: { fontSize: "11px", fontWeight: "500", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "6px" },
  input: { width: "100%", padding: "10px 14px", background: "var(--bg-1)", border: "1px solid var(--border)", borderRadius: "10px", color: "var(--text-primary)", fontSize: "13px", outline: "none", transition: "border-color 0.2s", boxSizing: "border-box" },
  btnPrimary: { padding: "10px 18px", background: "linear-gradient(135deg,#6c47ff,#4f2fe0)", color: "white", border: "none", borderRadius: "var(--radius-btn)", fontSize: "13px", fontWeight: "500", cursor: "pointer", boxShadow: "0 4px 16px rgba(108,71,255,0.3)", transition: "opacity 0.2s" },
};
