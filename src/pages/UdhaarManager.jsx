import { useState, useEffect, useCallback } from "react";
import { db, auth } from "../firebase/config";
import { callGemini } from "../utils/gemini";
import {
  collection, addDoc, getDocs, deleteDoc, doc,
  query, where, serverTimestamp, updateDoc,
} from "firebase/firestore";
// ── PATTERN 4: Adapter — unified notification interface ───────────
import notificationAdapter from "../patterns/adapter/NotificationAdapter";

const TYPES = [
  { value: "given",  label: "Maine diya",  sub: "I lent money",     color: "#22c55e", bg: "rgba(34,197,94,0.1)" },
  { value: "taken",  label: "Mujhe mila",  sub: "I borrowed money", color: "#ef4444", bg: "rgba(239,68,68,0.1)" },
];
async function generateFollowUpMessage(record) {
  const isOverdue = record.dueDate && new Date(record.dueDate) < new Date();
  const daysLate  = isOverdue
    ? Math.floor((new Date() - new Date(record.dueDate)) / 86400000)
    : null;

  const prompt = `Write a single polite WhatsApp follow-up message in Hinglish (mix of Urdu and English) to remind ${record.name} about PKR ${record.amount} they owe me.${record.note ? ` Context: ${record.note}.` : ""}${isOverdue ? ` It is ${daysLate} day(s) overdue.` : ""} Keep it friendly, short (2 sentences max), no emojis except at end. Start naturally, not with "Assalam".`;

  return await callGemini(prompt, 80);
}

export default function UdhaarManager() {
  const uid = auth.currentUser?.uid;

  const [records,     setRecords]     = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [showForm,    setShowForm]    = useState(false);
  const [toast,       setToast]       = useState(null);
  const [filterType,  setFilterType]  = useState("all");
  // FEATURE: follow-up message state
  const [msgLoading,  setMsgLoading]  = useState(null); // record id
  const [msgModal,    setMsgModal]    = useState(null); // { name, text, phone }

  // Form state
  const [type,    setType]    = useState("given");
  const [name,    setName]    = useState("");
  const [amount,  setAmount]  = useState("");
  const [note,    setNote]    = useState("");
  const [dueDate, setDueDate] = useState("");
  const [saving,  setSaving]  = useState(false);

  const loadRecords = useCallback(async () => {
    if (!uid) return;
    const q = query(collection(db, "udhaar"), where("uid", "==", uid));
    const snap = await getDocs(q);
    const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    list.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
    setRecords(list);
    setLoading(false);
    notificationAdapter.notifyDueItems(list, "udhaar", setToast);
  }, [uid]);

  useEffect(() => {
    notificationAdapter.requestPermission();
    loadRecords();
  }, [loadRecords]);

  function showToastMsg(msg, type = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  // FEATURE: handle follow-up button click
  async function handleFollowUp(record) {
    setMsgLoading(record.id);
    const text = await generateFollowUpMessage(record);
    setMsgLoading(null);
    if (text) {
      setMsgModal({ name: record.name, text, phone: record.phone || null });
    } else {
      showToastMsg("AI message generate nahi ho saka", "error");
    }
  }

  async function handleSave() {
    if (!name.trim() || !amount) { showToastMsg("Name aur amount zaroori hai", "error"); return; }
    setSaving(true);
    await addDoc(collection(db, "udhaar"), {
      uid, type, name: name.trim(),
      amount: Number(amount),
      note: note.trim(),
      dueDate: dueDate || null,
      settled: false,
      createdAt: serverTimestamp(),
    });
    setName(""); setAmount(""); setNote(""); setDueDate(""); setType("given");
    setSaving(false); setShowForm(false);
    showToastMsg("Entry saved ✓");
    loadRecords();
  }

  async function handleSettle(id) {
    await updateDoc(doc(db, "udhaar", id), { settled: true });
    showToastMsg("Settled ✓");
    loadRecords();
  }

  async function handleDelete(id) {
    await deleteDoc(doc(db, "udhaar", id));
    showToastMsg("Removed");
    loadRecords();
  }

  const filtered   = filterType === "all" ? records : records.filter(r => r.type === filterType);
  const totalGiven = records.filter(r => r.type === "given" && !r.settled).reduce((s, r) => s + r.amount, 0);
  const totalTaken = records.filter(r => r.type === "taken" && !r.settled).reduce((s, r) => s + r.amount, 0);  const net        = totalGiven - totalTaken;

  const fmtAmt = (n) => `PKR ${Number(n).toLocaleString()}`;

  const focus = e => e.target.style.borderColor = "rgba(91,94,244,0.5)";
  const blur  = e => e.target.style.borderColor = "var(--border)";

  return (
    <div style={{ animation: "fadeIn 0.3s ease" }}>

      {/* Toast */}
      {toast && (
        <div style={{ ...S.toast, background: toast.type === "error" ? "rgba(239,68,68,0.1)" : "rgba(34,197,94,0.1)", borderColor: toast.type === "error" ? "rgba(239,68,68,0.3)" : "rgba(34,197,94,0.3)", color: toast.type === "error" ? "var(--danger)" : "var(--success)" }}>
          {toast.type === "error" ? "✕" : "✓"} {toast.msg}
        </div>
      )}

      {/* FEATURE: AI Message Modal */}
      {msgModal && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.6)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:20, backdropFilter:"blur(4px)" }}>
          <div style={{ background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:16, padding:24, maxWidth:420, width:"100%", boxShadow:"0 20px 60px rgba(0,0,0,0.4)" }}>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
              <span style={{ fontSize:20 }}>💬</span>
              <div>
                <p style={{ fontSize:14, fontWeight:700, color:"var(--text-1)", margin:0 }}>Follow-up Message</p>
                <p style={{ fontSize:11, color:"var(--text-3)", margin:0 }}>For {msgModal.name} — AI generated</p>
              </div>
              <button onClick={() => setMsgModal(null)} style={{ marginLeft:"auto", background:"transparent", border:"none", color:"var(--text-3)", fontSize:18, cursor:"pointer" }}>✕</button>
            </div>
            <div style={{ background:"var(--bg)", border:"1px solid var(--border)", borderRadius:10, padding:"14px 16px", marginBottom:16 }}>
              <p style={{ fontSize:14, color:"var(--text-1)", lineHeight:1.7, margin:0, fontStyle:"italic" }}>"{msgModal.text}"</p>
            </div>
            <div style={{ display:"flex", gap:8 }}>
              <button
                onClick={() => { navigator.clipboard.writeText(msgModal.text); showToastMsg("Message copied ✓"); setMsgModal(null); }}
                style={{ flex:1, padding:"10px", background:"var(--brand)", border:"none", borderRadius:"var(--radius-btn)", color:"white", fontSize:13, fontWeight:600, cursor:"pointer" }}
              >
                📋 Copy Message
              </button>
              {msgModal.phone && (
                <a
                  href={`https://wa.me/${msgModal.phone.replace(/[^0-9+]/g,"")}?text=${encodeURIComponent(msgModal.text)}`}
                  target="_blank" rel="noopener noreferrer"
                  style={{ flex:1, padding:"10px", background:"rgba(37,211,102,0.12)", border:"1px solid rgba(37,211,102,0.3)", borderRadius:"var(--radius-btn)", color:"#25d366", fontSize:13, fontWeight:600, cursor:"pointer", textAlign:"center", textDecoration:"none" }}
                >
                  WhatsApp →
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={S.pageHeader}>
        <div style={S.pageHeaderGlow} />
        <div style={{ position:"relative", zIndex:1 }}>
          <div style={S.pageEyebrow}>
            <div style={S.eyebrowDot} />
            <span style={S.eyebrowText}>FINANCE MODULE</span>
          </div>
          <h1 style={S.heading}>Udhaar Manager</h1>
          <p style={S.subheading}>Track who owes you, and whom you owe</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} style={{ ...S.btnPrimary, position:"relative", zIndex:1 }}>
          {showForm ? "✕ Cancel" : "+ Add Entry"}
        </button>
      </div>

      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px", marginBottom: "24px" }}>
        <div style={{ ...S.card, borderColor: "rgba(34,197,94,0.2)" }}>
          <p style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.06em" }}>They have to take it from me</p>
          <p style={{ fontSize: "20px", fontWeight: "700", color: "#22c55e" }}>{fmtAmt(totalGiven)}</p>
          <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>Given</p>
        </div>
        <div style={{ ...S.card, borderColor: "rgba(239,68,68,0.2)" }}>
          <p style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.06em" }}>I took it from someone</p>
          <p style={{ fontSize: "20px", fontWeight: "700", color: "#ef4444" }}>{fmtAmt(totalTaken)}</p>
          <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>Taken</p>
        </div>
        <div style={{ ...S.card, borderColor: net >= 0 ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)" }}>
          <p style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Net balance</p>
          <p style={{ fontSize: "20px", fontWeight: "700", color: net >= 0 ? "#22c55e" : "#ef4444" }}>
            {net >= 0 ? "+" : ""}{fmtAmt(Math.abs(net))}
          </p>
          <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>{net >= 0 ? "You are owed" : "You owe"} money</p>
        </div>
      </div>

      {/* Add form */}
      {showForm && (
        <div style={{ ...S.card, borderColor: "var(--brand-glow)", marginBottom: "16px", animation: "slideUp 0.25s ease" }}>
          <p style={S.cardTitle}>New Udhaar Entry</p>

          {/* Type toggle */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "16px" }}>
            {TYPES.map(t => (
              <button key={t.value} onClick={() => setType(t.value)}
                style={{ padding: "10px", borderRadius: "var(--radius-btn)", border: `1px solid ${type === t.value ? t.color : "var(--border)"}`, background: type === t.value ? t.bg : "var(--bg-3)", color: type === t.value ? t.color : "var(--text-secondary)", cursor: "pointer", transition: "all 0.15s", textAlign: "left" }}>
                <p style={{ fontSize: "13px", fontWeight: "600", marginBottom: "2px" }}>{t.label}</p>
                <p style={{ fontSize: "11px", opacity: 0.7 }}>{t.sub}</p>
              </button>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
            <div>
              <p style={S.label}>Name</p>
              <input style={S.input} placeholder="Ahmed Bhai" value={name} onChange={e => setName(e.target.value)} onFocus={focus} onBlur={blur} />
            </div>
            <div>
              <p style={S.label}>Amount (PKR)</p>
              <input style={S.input} type="number" placeholder="5000" value={amount} onChange={e => setAmount(e.target.value)} onFocus={focus} onBlur={blur} />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
            <div>
              <p style={S.label}>Note (optional)</p>
              <input style={S.input} placeholder="Marriage expenses..." value={note} onChange={e => setNote(e.target.value)} onFocus={focus} onBlur={blur} />
            </div>
            <div>
              <p style={S.label}>Due Date (optional)</p>
              <input style={S.input} type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} onFocus={focus} onBlur={blur} />
            </div>
          </div>

          <button onClick={handleSave} disabled={saving} style={{ ...S.btnPrimary, width: "100%", opacity: saving ? 0.6 : 1 }}>
            {saving ? "Saving..." : "Save Entry"}
          </button>
        </div>
      )}

      {/* Filter */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
        {[
          { value: "all",   label: `All (${records.length})` },
          { value: "given", label: "Given" },
          { value: "taken", label: "Taken" },
        ].map(f => (
          <button key={f.value} onClick={() => setFilterType(f.value)}
            style={{ padding: "5px 14px", borderRadius: "var(--radius-btn)", border: `1px solid ${filterType === f.value ? "var(--brand)" : "var(--border)"}`, background: filterType === f.value ? "var(--brand-dim)" : "transparent", color: filterType === f.value ? "var(--brand-light)" : "var(--text-muted)", fontSize: "12px", cursor: "pointer", transition: "all 0.15s" }}>
            {f.label}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        [1,2,3].map(i => <div key={i} className="skeleton" style={{ height: "72px", borderRadius: "12px", marginBottom: "8px" }} />)
      ) : filtered.length === 0 ? (
        <div style={{ ...S.card, padding: "48px", textAlign: "center" }}>
          <p style={{ fontSize: "32px", marginBottom: "10px" }}>💸</p>
          <p style={{ fontSize: "15px", fontWeight: "500", color: "var(--text-primary)", marginBottom: "4px" }}>No entries found</p>
          <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>Firstly, add a new udhaar entry</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {filtered.map(record => {
            const t = TYPES.find(x => x.value === record.type);
            const isOverdue = record.dueDate && new Date(record.dueDate) < new Date() && !record.settled;
            return (
              <div key={record.id} style={{ ...S.card, opacity: record.settled ? 0.5 : 1 }}
                onMouseEnter={e => e.currentTarget.style.borderColor = "var(--border-hover)"}
                onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border)"}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: t.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <svg width="16" height="16" fill="none" stroke={t.color} strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                      <p style={{ fontSize: "14px", fontWeight: "600", color: "var(--text-primary)" }}>{record.name}</p>
                      <span style={{ fontSize: "10px", padding: "2px 8px", borderRadius: "20px", background: t.bg, color: t.color, border: `1px solid ${t.color}30` }}>{t.label}</span>
                      {record.settled && <span style={{ fontSize: "10px", padding: "2px 8px", borderRadius: "20px", background: "rgba(34,197,94,0.1)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.2)" }}>Settled</span>}
                      {isOverdue && <span style={{ fontSize: "10px", padding: "2px 8px", borderRadius: "20px", background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" }}>Overdue</span>}
                    </div>
                    <div style={{ display: "flex", gap: "12px", marginTop: "3px", flexWrap: "wrap" }}>
                      {record.note && <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>{record.note}</p>}
                      {record.dueDate && <p style={{ fontSize: "12px", color: isOverdue ? "#ef4444" : "var(--text-muted)" }}>Due: {record.dueDate}</p>}
                    </div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <p style={{ fontSize: "16px", fontWeight: "700", color: t.color }}>{fmtAmt(record.amount)}</p>
                    {!record.settled && (
                      <div style={{ display: "flex", gap: "6px", marginTop: "6px", justifyContent: "flex-end" }}>
                        {record.type === "given" && (
                          <button
                            onClick={() => handleFollowUp(record)}
                            disabled={msgLoading === record.id}
                            style={{ padding: "3px 10px", background: "rgba(91,94,244,0.1)", border: "1px solid rgba(91,94,244,0.25)", borderRadius: "var(--radius-btn)", color: "#818cf8", fontSize: "11px", cursor: "pointer", fontWeight: 500 }}
                          >
                            {msgLoading === record.id ? "..." : "💬 Follow-up"}
                          </button>
                        )}
                        <button onClick={() => handleSettle(record.id)}
                          style={{ padding: "3px 10px", background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.25)", borderRadius: "var(--radius-btn)", color: "#22c55e", fontSize: "11px", cursor: "pointer" }}>
                          Settle
                        </button>
                        <button onClick={() => handleDelete(record.id)}
                          style={{ padding: "3px 8px", background: "transparent", border: "1px solid var(--border)", borderRadius: "var(--radius-btn)", color: "var(--text-muted)", fontSize: "11px", cursor: "pointer" }}
                          onMouseEnter={e => e.currentTarget.style.color = "var(--danger)"}
                          onMouseLeave={e => e.currentTarget.style.color = "var(--text-muted)"}>
                          ✕
                        </button>
                      </div>
                    )}
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
  pageHeader: {
    position:"relative", overflow:"hidden",
    background:"linear-gradient(135deg, #13080A 0%, #160A0C 50%, #1A0A0C 100%)",
    border:"1px solid rgba(224,71,76,0.15)",
    borderRadius:"var(--radius-xl)", padding:"28px 24px 24px",
    marginBottom:"28px", display:"flex",
    alignItems:"flex-end", justifyContent:"space-between", flexWrap:"wrap", gap:"16px",
    boxShadow:"0 4px 24px rgba(224,71,76,0.08)",
  },
  pageHeaderGlow: {
    position:"absolute", top:-60, left:-40,
    width:260, height:260,
    background:"radial-gradient(circle, rgba(224,71,76,0.14) 0%, transparent 70%)",
    borderRadius:"50%", pointerEvents:"none",
  },
  pageEyebrow: { display:"flex", alignItems:"center", gap:"7px", marginBottom:"10px" },
  eyebrowDot: {
    width:6, height:6, borderRadius:"50%",
    background:"var(--brand)", boxShadow:"0 0 8px rgba(224,71,76,0.7)",
  },
  eyebrowText: {
    fontSize:"9px", fontWeight:"700", color:"var(--brand)",
    letterSpacing:"0.2em", textTransform:"uppercase",
  },
  heading: {
    fontSize:"26px", fontWeight:"800",
    fontFamily:"'Sora', sans-serif",
    background:"linear-gradient(135deg, #FFFFFF 40%, rgba(224,71,76,0.8) 100%)",
    WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent",
    backgroundClip:"text",
    letterSpacing:"-0.03em", margin:0,
  },
  subheading: { fontSize:"13px", color:"rgba(255,255,255,0.35)", marginTop:"5px" },
  card:       { background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: "16px", transition: "border-color 0.2s" },
  cardTitle:  { fontSize: "14px", fontWeight: "600", color: "var(--text-1)", marginBottom: "16px", fontFamily:"'Sora', sans-serif" },
  label:      { fontSize: "11px", fontWeight: "500", color: "var(--text-2)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "5px" },
  input:      { width: "100%", padding: "9px 12px", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius)", color: "var(--text-1)", fontSize: "13px", outline: "none", transition: "border-color 0.2s", boxSizing: "border-box" },
  btnPrimary: { padding: "10px 20px", background: "var(--brand)", color: "white", border: "none", borderRadius: "var(--radius-btn)", fontSize: "13px", fontWeight: "600", cursor: "pointer", transition: "opacity 0.2s", boxShadow:"0 2px 8px var(--brand-glow)" },
  toast:      { position: "fixed", top: "16px", right: "16px", zIndex: 9999, padding: "10px 16px", borderRadius: "10px", border: "1px solid", fontSize: "13px", fontWeight: "500", animation: "slideRight 0.3s ease" },
};