import { useState, useEffect, useCallback } from "react";
import { db, auth } from "../firebase/config";
import { collection, addDoc, getDocs, deleteDoc, doc, query, where, serverTimestamp } from "firebase/firestore";

const CYCLES = [
  { value: "monthly",  label: "Monthly",  months: 1  },
  { value: "yearly",   label: "Yearly",   months: 12 },
  { value: "weekly",   label: "Weekly",   months: 0.25 },
];

const CATS = [
  { value: "streaming",  label: "Streaming",  color: "#ef4444", icon: "M15 10l4.553-2.069A1 1 0 0121 8.868V15.131a1 1 0 01-1.447.9L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" },
  { value: "saas",       label: "SaaS / App", color: "#5b5ef4", icon: "M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" },
  { value: "internet",   label: "Internet",   color: "#38bdf8", icon: "M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9" },
  { value: "phone",      label: "Phone / SIM",color: "#a78bfa", icon: "M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" },
  { value: "gym",        label: "Gym / Health",color: "#22c55e",icon: "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" },
  { value: "other",      label: "Other",      color: "#f59e0b", icon: "M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8" },
];

function getCat(v) { return CATS.find(c => c.value === v) || CATS[5]; }

export default function SubscriptionTracker() {
  const uid = auth.currentUser?.uid;
  const [subs, setSubs]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [toast, setToast]       = useState(null);

  const [name, setName]         = useState("");
  const [amount, setAmount]     = useState("");
  const [cycle, setCycle]       = useState("monthly");
  const [category, setCategory] = useState("saas");
  const [nextDate, setNextDate] = useState("");
  const [saving, setSaving]     = useState(false);

  const loadSubs = useCallback(async () => {
    if (!uid) return;
    const q = query(collection(db, "subscriptions"), where("uid", "==", uid));
    const snap = await getDocs(q);
    const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    setSubs(list);
    setLoading(false);
  }, [uid]);

  useEffect(() => { loadSubs(); }, [loadSubs]);

  function showToastMsg(msg, type = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  async function handleSave() {
    if (!name.trim() || !amount) { showToastMsg("Name and amount are required", "error"); return; }
    setSaving(true);
    await addDoc(collection(db, "subscriptions"), {
      uid, name: name.trim(), amount: Number(amount),
      cycle, category, nextDate: nextDate || null,
      createdAt: serverTimestamp(),
    });
    setName(""); setAmount(""); setCycle("monthly"); setCategory("saas"); setNextDate("");
    setSaving(false); setShowForm(false);
    showToastMsg("Subscription added ✓");
    loadSubs();
  }

  async function handleDelete(id) {
    await deleteDoc(doc(db, "subscriptions", id));
    showToastMsg("Removed");
    loadSubs();
  }

  // Calculate monthly cost for each sub
  const monthlyOf = (sub) => {
    const c = CYCLES.find(x => x.value === sub.cycle);
    return c ? sub.amount / c.months : sub.amount;
  };

  const totalMonthly = subs.reduce((s, sub) => s + monthlyOf(sub), 0);
  const totalYearly  = totalMonthly * 12;

  const focus = e => e.target.style.borderColor = "rgba(91,94,244,0.5)";
  const blur  = e => e.target.style.borderColor = "var(--border)";

  return (
    <div style={{ animation: "fadeIn 0.3s ease" }}>

      {toast && (
        <div style={{ ...S.toast, background: toast.type === "error" ? "rgba(239,68,68,0.1)" : "rgba(34,197,94,0.1)", borderColor: toast.type === "error" ? "rgba(239,68,68,0.3)" : "rgba(34,197,94,0.3)", color: toast.type === "error" ? "var(--danger)" : "var(--success)" }}>
          {toast.type === "error" ? "✕" : "✓"} {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
        <div>
          <h1 style={S.heading}>Subscriptions</h1>
          <p style={S.subheading}>Track your recurring payments</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} style={S.btnPrimary}>
          {showForm ? "✕ Cancel" : "+ Add"}
        </button>
      </div>

      {/* Summary */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px", marginBottom: "24px" }}>
        <div style={S.statCard}>
          <p style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Monthly spend</p>
          <p style={{ fontSize: "22px", fontWeight: "700", color: "#5b5ef4" }}>PKR {Math.round(totalMonthly).toLocaleString()}</p>
        </div>
        <div style={S.statCard}>
          <p style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Yearly spend</p>
          <p style={{ fontSize: "22px", fontWeight: "700", color: "#f59e0b" }}>PKR {Math.round(totalYearly).toLocaleString()}</p>
        </div>
        <div style={S.statCard}>
          <p style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Active subscriptions</p>
          <p style={{ fontSize: "22px", fontWeight: "700", color: "var(--text-primary)" }}>{subs.length}</p>
        </div>
      </div>

      {/* Add form */}
      {showForm && (
        <div style={{ ...S.card, borderColor: "rgba(91,94,244,0.25)", marginBottom: "16px", animation: "slideUp 0.25s ease" }}>
          <p style={S.cardTitle}>New Subscription</p>

          {/* Category */}
          <p style={S.label}>Category</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "7px", marginBottom: "14px" }}>
            {CATS.map(c => (
              <button key={c.value} onClick={() => setCategory(c.value)}
                style={{ padding: "7px 8px", borderRadius: "var(--radius-btn)", border: `1px solid ${category === c.value ? c.color : "var(--border)"}`, background: category === c.value ? `${c.color}15` : "var(--bg-3)", color: category === c.value ? c.color : "var(--text-muted)", fontSize: "11px", cursor: "pointer", transition: "all 0.15s" }}>
                {c.label}
              </button>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
            <div>
              <p style={S.label}>Service Name</p>
              <input style={S.input} placeholder="Netflix, Jazz, Canva..." value={name} onChange={e => setName(e.target.value)} onFocus={focus} onBlur={blur} />
            </div>
            <div>
              <p style={S.label}>Amount (PKR)</p>
              <input style={S.input} type="number" placeholder="1200" value={amount} onChange={e => setAmount(e.target.value)} onFocus={focus} onBlur={blur} />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
            <div>
              <p style={S.label}>Billing Cycle</p>
              <div style={{ display: "flex", gap: "6px" }}>
                {CYCLES.map(c => (
                  <button key={c.value} onClick={() => setCycle(c.value)}
                    style={{ flex: 1, padding: "8px 4px", borderRadius: "var(--radius-btn)", border: `1px solid ${cycle === c.value ? "var(--brand)" : "var(--border)"}`, background: cycle === c.value ? "var(--brand-dim)" : "var(--bg-3)", color: cycle === c.value ? "var(--brand-light)" : "var(--text-muted)", fontSize: "11px", cursor: "pointer", transition: "all 0.15s" }}>
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p style={S.label}>Next billing date</p>
              <input style={S.input} type="date" value={nextDate} onChange={e => setNextDate(e.target.value)} onFocus={focus} onBlur={blur} />
            </div>
          </div>

          <button onClick={handleSave} disabled={saving} style={{ ...S.btnPrimary, width: "100%", opacity: saving ? 0.6 : 1 }}>
            {saving ? "Saving..." : "Save Subscription"}
          </button>
        </div>
      )}

      {/* List */}
      {loading ? (
        [1,2,3].map(i => <div key={i} className="skeleton" style={{ height: "72px", borderRadius: "12px", marginBottom: "8px" }} />)
      ) : subs.length === 0 ? (
        <div style={{ ...S.card, padding: "48px", textAlign: "center" }}>
          <p style={{ fontSize: "32px", marginBottom: "10px" }}>📋</p>
          <p style={{ fontSize: "15px", fontWeight: "500", color: "var(--text-primary)", marginBottom: "4px" }}>No subscriptions found</p>
          <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>Netflix, Jazz, Adobe — Track them here</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {subs.map(sub => {
            const cat = getCat(sub.category);
            const monthlyAmt = monthlyOf(sub);
            const isUpcoming = sub.nextDate && new Date(sub.nextDate) <= new Date(Date.now() + 7 * 86400000);
            return (
              <div key={sub.id} style={S.card}
                onMouseEnter={e => e.currentTarget.style.borderColor = "var(--border-hover)"}
                onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border)"}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: `${cat.color}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <svg width="16" height="16" fill="none" stroke={cat.color} strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d={cat.icon} />
                    </svg>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                      <p style={{ fontSize: "14px", fontWeight: "600", color: "var(--text-primary)" }}>{sub.name}</p>
                      <span style={{ fontSize: "10px", padding: "2px 8px", borderRadius: "20px", background: `${cat.color}18`, color: cat.color, border: `1px solid ${cat.color}30` }}>{cat.label}</span>
                      {isUpcoming && <span style={{ fontSize: "10px", padding: "2px 8px", borderRadius: "20px", background: "rgba(245,158,11,0.1)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.25)" }}>Due soon</span>}
                    </div>
                    <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
                      {CYCLES.find(c => c.value === sub.cycle)?.label}
                      {sub.nextDate ? ` · Next: ${sub.nextDate}` : ""}
                    </p>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <p style={{ fontSize: "15px", fontWeight: "700", color: "var(--text-primary)" }}>PKR {sub.amount.toLocaleString()}</p>
                    <p style={{ fontSize: "11px", color: "var(--text-muted)" }}>≈ PKR {Math.round(monthlyAmt).toLocaleString()}/mo</p>
                    <button onClick={() => handleDelete(sub.id)}
                      style={{ marginTop: "4px", background: "transparent", border: "none", color: "var(--text-muted)", fontSize: "11px", cursor: "pointer", padding: 0 }}
                      onMouseEnter={e => e.currentTarget.style.color = "var(--danger)"}
                      onMouseLeave={e => e.currentTarget.style.color = "var(--text-muted)"}>
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const S = {
  heading:    { fontSize: "22px", fontWeight: "600", color: "var(--text-primary)", margin: 0 },
  subheading: { fontSize: "13px", color: "var(--text-muted)", marginTop: "4px" },
  statCard:   { background: "var(--bg-2)", border: "1px solid var(--border)", borderRadius: "12px", padding: "16px" },
  card:       { background: "var(--bg-2)", border: "1px solid var(--border)", borderRadius: "12px", padding: "16px", transition: "border-color 0.2s" },
  cardTitle:  { fontSize: "14px", fontWeight: "600", color: "var(--text-primary)", marginBottom: "16px" },
  label:      { fontSize: "11px", fontWeight: "500", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "5px" },
  input:      { width: "100%", padding: "9px 12px", background: "var(--bg-1)", border: "1px solid var(--border)", borderRadius: "9px", color: "var(--text-primary)", fontSize: "13px", outline: "none", transition: "border-color 0.2s", boxSizing: "border-box" },
  btnPrimary: { padding: "9px 16px", background: "var(--brand)", color: "white", border: "none", borderRadius: "var(--radius-btn)", fontSize: "13px", fontWeight: "500", cursor: "pointer", transition: "opacity 0.2s" },
  toast:      { position: "fixed", top: "16px", right: "16px", zIndex: 9999, padding: "10px 16px", borderRadius: "10px", border: "1px solid", fontSize: "13px", fontWeight: "500", animation: "slideRight 0.3s ease" },
};