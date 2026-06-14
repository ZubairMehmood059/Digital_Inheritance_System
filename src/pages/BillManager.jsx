// src/pages/BillManager.jsx
// Pakistani Utility Bill Management
// Supports: K-Electric, LESCO, SNGPL, SSGC, PTCL, Nayatel, StormFiber, KWSB
// Features: Status tracking, Due date reminders, Monthly chart, OCR placeholder

import { useState, useEffect, useCallback, useMemo } from "react";
import { db, auth } from "../firebase/config";
import {
  collection, addDoc, getDocs, deleteDoc, doc,
  query, where, serverTimestamp, updateDoc,
} from "firebase/firestore";
// ── PATTERN 4: Adapter — unified notification interface ───────────
import notificationAdapter from "../patterns/adapter/NotificationAdapter";

// ─── Constants ────────────────────────────────────────────────────────────────

const BILL_TYPES = [
  {
    value: "electricity",
    label: "Electricity",
    icon: "⚡",
    color: "#F59E0B",
    bg: "#FFFBEB",
    darkBg: "#1F1508",
    providers: ["K-Electric (KE)", "LESCO", "FESCO", "IESCO", "PESCO", "HESCO", "MEPCO", "QESCO", "GEPCO", "SEPCO"],
  },
  {
    value: "gas",
    label: "Gas",
    icon: "🔥",
    color: "#EF4444",
    bg: "#FEF2F2",
    darkBg: "#200A0A",
    providers: ["SNGPL (Sui Northern)", "SSGC (Sui Southern)"],
  },
  {
    value: "internet",
    label: "Internet",
    icon: "🌐",
    color: "#3B82F6",
    bg: "#EFF6FF",
    darkBg: "#0A1628",
    providers: ["PTCL", "Nayatel", "StormFiber", "Transworld", "Cybernet", "Wi-Tribe", "Zong Home", "Jazz Home Broadband", "Other"],
  },
  {
    value: "water",
    label: "Water",
    icon: "💧",
    color: "#14B8A6",
    bg: "#F0FDFA",
    darkBg: "#041F1E",
    providers: ["KWSB (Karachi)", "WASA Lahore", "WASA Rawalpindi", "WASA Faisalabad", "WASA Multan", "Other"],
  },
  {
    value: "phone",
    label: "Phone / SIM",
    icon: "📱",
    color: "#8B5CF6",
    bg: "#F5F3FF",
    darkBg: "#13072B",
    providers: ["Jazz", "Telenor", "Zong", "Ufone", "PTCL Landline"],
  },
  {
    value: "other",
    label: "Other",
    icon: "🧾",
    color: "#94A3B8",
    bg: "#F8FAFC",
    darkBg: "#111827",
    providers: ["Other"],
  },
];

const STATUS_CONFIG = {
  unpaid:  { label: "Unpaid",  color: "#F59E0B", bg: "#FFFBEB", darkBg: "#1F1508", icon: "⏳" },
  paid:    { label: "Paid",    color: "#22C55E", bg: "#F0FDF4", darkBg: "#0A2218", icon: "✓"  },
  overdue: { label: "Overdue", color: "#EF4444", bg: "#FEF2F2", darkBg: "#200A0A", icon: "🔴" },
};

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function getType(v) { return BILL_TYPES.find(t => t.value === v) || BILL_TYPES[5]; }

function fmtDate(str) {
  if (!str) return "—";
  const d = new Date(str);
  return d.toLocaleDateString("en-PK", { day:"numeric", month:"short", year:"numeric" });
}

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const diff = new Date(dateStr) - new Date();
  return Math.ceil(diff / 86400000);
}

// ─── Mini Bar Chart ───────────────────────────────────────────────────────────
function MonthlyChart({ bills }) {
  // Aggregate paid bills by month (last 6 months)
  const now = new Date();
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
    return { key: `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`, label: MONTHS[d.getMonth()], total: 0 };
  });

  bills.forEach(bill => {
    if (bill.status === "paid" && bill.billDate) {
      const monthKey = bill.billDate.slice(0, 7);
      const slot = months.find(m => m.key === monthKey);
      if (slot) slot.total += Number(bill.amount) || 0;
    }
  });

  const maxVal = Math.max(...months.map(m => m.total), 1);

  return (
    <div style={{ padding:"18px 20px" }}>
      <p style={{ fontSize:"11px", fontWeight:"700", color:"var(--text-3)", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:"16px" }}>Monthly Spend (Last 6 Months)</p>
      <div style={{ display:"flex", alignItems:"flex-end", gap:"10px", height:"80px" }}>
        {months.map((m, i) => (
          <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:"6px" }}>
            <p style={{ fontSize:"9px", color:"var(--text-3)", fontWeight:"600" }}>
              {m.total > 0 ? `${Math.round(m.total/1000)}k` : ""}
            </p>
            <div style={{ width:"100%", position:"relative", height:"56px", display:"flex", alignItems:"flex-end" }}>
              <div style={{
                width:"100%",
                height:`${Math.max(4, (m.total / maxVal) * 56)}px`,
                borderRadius:"4px 4px 0 0",
                background: m.key === months[5].key
                  ? "var(--brand)"
                  : "var(--border)",
                transition:"height 0.6s ease",
              }} />
            </div>
            <p style={{ fontSize:"9px", color:"var(--text-3)" }}>{m.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── OCR Placeholder Component ────────────────────────────────────────────────
// Future-ready: swap the inner content for actual OCR integration
function ScanBillPlaceholder({ onClose }) {
  return (
    <div style={{
      position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", zIndex:200,
      display:"flex", alignItems:"center", justifyContent:"center", padding:"20px",
      backdropFilter:"blur(4px)",
    }}>
      <div style={{ background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:"var(--radius-xl)", padding:"32px", maxWidth:"380px", width:"100%", textAlign:"center", boxShadow:"var(--shadow-lg)" }}>
        {/* Camera viewfinder placeholder */}
        <div style={{ width:"180px", height:"120px", margin:"0 auto 20px", border:"2px dashed var(--border)", borderRadius:"var(--radius-lg)", display:"flex", alignItems:"center", justifyContent:"center", position:"relative", background:"var(--bg)" }}>
          {/* Corner brackets */}
          {[["top","left"],["top","right"],["bottom","left"],["bottom","right"]].map(([v,h], i) => (
            <div key={i} style={{ position:"absolute", [v]:"6px", [h]:"6px", width:"16px", height:"16px",
              borderTop: v==="top" ? "2.5px solid var(--brand)" : "none",
              borderBottom: v==="bottom" ? "2.5px solid var(--brand)" : "none",
              borderLeft: h==="left" ? "2.5px solid var(--brand)" : "none",
              borderRight: h==="right" ? "2.5px solid var(--brand)" : "none",
            }} />
          ))}
          <div style={{ textAlign:"center" }}>
            <p style={{ fontSize:"28px", marginBottom:"4px" }}>📄</p>
            <p style={{ fontSize:"10px", color:"var(--text-3)" }}>Place bill here</p>
          </div>
        </div>

        <h3 style={{ fontSize:"16px", fontWeight:"700", color:"var(--text-1)", marginBottom:"8px" }}>Scan Bill (Coming Soon)</h3>
        <p style={{ fontSize:"13px", color:"var(--text-2)", marginBottom:"8px", lineHeight:"1.6" }}>
          OCR bill scanning will automatically extract amount, due date, and provider from your physical or PDF bill.
        </p>
        <p style={{ fontSize:"11px", color:"var(--brand)", marginBottom:"20px", fontWeight:"500" }}>
          🔧 Integration ready — backend connector hookup pending
        </p>

        <div style={{ display:"flex", gap:"8px" }}>
          <button onClick={onClose} style={{ flex:1, padding:"10px", background:"var(--bg)", border:"1px solid var(--border)", borderRadius:"var(--radius-btn)", color:"var(--text-2)", fontSize:"13px", cursor:"pointer", fontWeight:"500" }}>
            Close
          </button>
          {/* Future: <button onClick={triggerOCR} style={{ flex:2, ... }}>📷 Open Camera</button> */}
          <button disabled style={{ flex:2, padding:"10px", background:"var(--brand)", border:"none", borderRadius:"var(--radius-btn)", color:"white", fontSize:"13px", fontWeight:"600", opacity:0.5, cursor:"not-allowed" }}>
            📷 Open Camera
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function BillManager() {
  const uid = auth.currentUser?.uid;

  const [bills,      setBills]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [showForm,   setShowForm]   = useState(false);
  const [showScan,   setShowScan]   = useState(false);
  const [toast,      setToast]      = useState(null);
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  // Form state
  const [billType,   setBillType]   = useState("electricity");
  const [provider,   setProvider]   = useState("");
  const [amount,     setAmount]     = useState("");
  const [billDate,   setBillDate]   = useState(""); // month of bill
  const [dueDate,    setDueDate]    = useState("");
  const [refNo,      setRefNo]      = useState("");
  const [note,       setNote]       = useState("");
  const [status,     setStatus]     = useState("unpaid");
  const [saving,     setSaving]     = useState(false);

  const loadBills = useCallback(async () => {
    if (!uid) return;
    const q = query(collection(db, "utilityBills"), where("uid", "==", uid));
    const snap = await getDocs(q);
    const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    // Auto-mark overdue
    list.forEach(b => {
      if (b.status === "unpaid" && b.dueDate && new Date(b.dueDate) < new Date()) {
        b.status = "overdue";
      }
    });
    list.sort((a, b) => {
      // Sort: overdue first, then unpaid, then paid; within each by due date
      const order = { overdue:0, unpaid:1, paid:2 };
      if (order[a.status] !== order[b.status]) return order[a.status] - order[b.status];
      return new Date(a.dueDate || 0) - new Date(b.dueDate || 0);
    });
    setBills(list);
    setLoading(false);

    // PATTERN 4: Adapter — routes bill alerts through unified interface
    notificationAdapter.notifyDueItems(list, "bill", setToast);
  }, [uid]);

  useEffect(() => {
    // PATTERN 4: Adapter — delegates permission request
    notificationAdapter.requestPermission();
    loadBills();
  }, [loadBills]);

  // When bill type changes, reset provider
  useEffect(() => {
    const t = getType(billType);
    setProvider(t.providers[0]);
  }, [billType]);

  function showToastMsg(msg, type = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }

  async function handleSave() {
    if (!amount || !dueDate) { showToastMsg("Amount aur due date zaroori hai", "error"); return; }
    setSaving(true);
    await addDoc(collection(db, "utilityBills"), {
      uid, billType, provider: provider || getType(billType).providers[0],
      amount: Number(amount), billDate: billDate || null,
      dueDate, refNo: refNo.trim(), note: note.trim(),
      status, createdAt: serverTimestamp(),
    });
    setBillType("electricity"); setAmount(""); setBillDate("");
    setDueDate(""); setRefNo(""); setNote(""); setStatus("unpaid");
    setSaving(false); setShowForm(false);
    showToastMsg("Bill saved ✓");
    loadBills();
  }

  async function markPaid(id) {
    await updateDoc(doc(db, "utilityBills", id), { status: "paid", paidAt: new Date().toISOString() });
    showToastMsg("Marked as paid ✓");
    loadBills();
  }

  async function handleDelete(id) {
    await deleteDoc(doc(db, "utilityBills", id));
    showToastMsg("Removed");
    loadBills();
  }

  // Derived stats
  const totalUnpaid  = bills.filter(b => b.status !== "paid").reduce((s, b) => s + Number(b.amount), 0);
  const totalPaidThisMonth = useMemo(() => {
    const m = new Date().toISOString().slice(0,7);
    return bills.filter(b => b.status === "paid" && b.dueDate?.startsWith(m)).reduce((s, b) => s + Number(b.amount), 0);
  }, [bills]);
  const overdueCount = bills.filter(b => b.status === "overdue").length;
  const upcomingBills = bills.filter(b => {
    const d = daysUntil(b.dueDate);
    return b.status === "unpaid" && d !== null && d >= 0 && d <= 7;
  });

  const filtered = bills
    .filter(b => filterType === "all" || b.billType === filterType)
    .filter(b => filterStatus === "all" || b.status === filterStatus);

  const typeCounts = BILL_TYPES.reduce((acc, t) => ({
    ...acc, [t.value]: bills.filter(b => b.billType === t.value).length
  }), {});

  const focus = e => e.target.style.borderColor = "var(--border-focus)";
  const blur  = e => e.target.style.borderColor = "var(--border)";
  const selectedType = getType(billType);

  return (
    <div style={{ animation:"fadeIn 0.3s ease" }}>

      {/* Toast */}
      {toast && (
        <div style={{ ...S.toast, background: toast.type==="error" ? "var(--danger-bg)" : "var(--success-bg)", borderColor: toast.type==="error" ? "#FCA5A5" : "#86EFAC", color: toast.type==="error" ? "var(--danger)" : "var(--success)" }}>
          {toast.type==="error" ? "⚠ " : "✓ "}{toast.msg}
        </div>
      )}

      {/* OCR Modal */}
      {showScan && <ScanBillPlaceholder onClose={() => setShowScan(false)} />}

      {/* ── Header ── */}
      <div style={S.pageHeader}>
        <div style={S.pageHeaderGlow} />
        <div style={{ position:"relative", zIndex:1 }}>
          <div style={S.pageEyebrow}>
            <div style={S.eyebrowDot} />
            <span style={S.eyebrowText}>FINANCE MODULE</span>
          </div>
          <h1 style={S.heading}>Utility Bills</h1>
          <p style={S.sub}>Track electricity, gas, internet & water bills</p>
        </div>
        <div style={{ display:"flex", gap:"8px", position:"relative", zIndex:1 }}>
          <button onClick={() => setShowScan(true)} style={S.btnScan}
            title="Scan bill with OCR (coming soon)">
            📷 Scan Bill
          </button>
          <button onClick={() => setShowForm(!showForm)} style={S.btnPrimary}>
            {showForm ? "✕ Cancel" : "+ Add Bill"}
          </button>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))", gap:"12px", marginBottom:"24px" }}>
        <div style={S.statCard}>
          <p style={S.statLabel}>Pending Amount</p>
          <p style={{ ...S.statValue, color:"var(--warning)" }}>PKR {Math.round(totalUnpaid).toLocaleString()}</p>
          <p style={S.statSub}>{bills.filter(b=>b.status!=="paid").length} bills unpaid</p>
        </div>
        <div style={S.statCard}>
          <p style={S.statLabel}>Paid This Month</p>
          <p style={{ ...S.statValue, color:"var(--success)" }}>PKR {Math.round(totalPaidThisMonth).toLocaleString()}</p>
          <p style={S.statSub}>Cleared successfully</p>
        </div>
        <div style={{ ...S.statCard, borderColor: overdueCount > 0 ? "rgba(239,68,68,0.3)" : "var(--border)" }}>
          <p style={S.statLabel}>Overdue</p>
          <p style={{ ...S.statValue, color: overdueCount > 0 ? "var(--danger)" : "var(--text-1)" }}>{overdueCount}</p>
          <p style={S.statSub}>{overdueCount > 0 ? "Need immediate attention" : "All clear 🎉"}</p>
        </div>
        <div style={S.statCard}>
          <p style={S.statLabel}>Total Bills</p>
          <p style={S.statValue}>{bills.length}</p>
          <p style={S.statSub}>Tracked</p>
        </div>
      </div>

      {/* ── Upcoming Due Soon Banner ── */}
      {upcomingBills.length > 0 && (
        <div style={{ ...S.card, borderColor:"rgba(245,158,11,0.3)", background:"var(--warning-bg)", marginBottom:"16px" }}>
          <p style={{ fontSize:"12px", fontWeight:"700", color:"var(--warning)", marginBottom:"10px", textTransform:"uppercase", letterSpacing:"0.06em" }}>
            ⏰ Due Within 7 Days
          </p>
          <div style={{ display:"flex", flexDirection:"column", gap:"6px" }}>
            {upcomingBills.map(b => {
              const t = getType(b.billType);
              const d = daysUntil(b.dueDate);
              return (
                <div key={b.id} style={{ display:"flex", alignItems:"center", gap:"10px", justifyContent:"space-between" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
                    <span style={{ fontSize:"16px" }}>{t.icon}</span>
                    <div>
                      <p style={{ fontSize:"13px", fontWeight:"600", color:"var(--text-1)" }}>{b.provider}</p>
                      <p style={{ fontSize:"11px", color:"var(--text-2)" }}>Due {fmtDate(b.dueDate)}</p>
                    </div>
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
                    <p style={{ fontSize:"14px", fontWeight:"700", color:"var(--warning)" }}>PKR {Number(b.amount).toLocaleString()}</p>
                    <span style={{ fontSize:"10px", padding:"2px 8px", borderRadius:"20px", background:"rgba(245,158,11,0.15)", color:"var(--warning)", fontWeight:"600" }}>
                      {d === 0 ? "Today" : `${d}d`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Monthly Chart ── */}
      {bills.length > 0 && (
        <div style={{ ...S.card, marginBottom:"16px", padding:0, overflow:"hidden" }}>
          <MonthlyChart bills={bills} />
        </div>
      )}

      {/* ── Add Bill Form ── */}
      {showForm && (
        <div style={{ ...S.card, borderColor:"var(--brand-glow)", marginBottom:"16px", animation:"slideDown 0.2s ease" }}>
          <p style={S.cardTitle}>🧾 Add Utility Bill</p>

          {/* Bill type selector */}
          <p style={S.label}>Bill Type</p>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"7px", marginBottom:"14px" }}>
            {BILL_TYPES.map(t => (
              <button key={t.value} onClick={() => setBillType(t.value)}
                style={{
                  padding:"8px 6px", borderRadius:"var(--radius-btn)",
                  border:`1px solid ${billType===t.value ? t.color : "var(--border)"}`,
                  background: billType===t.value ? t.bg : "var(--bg)",
                  color: billType===t.value ? t.color : "var(--text-2)",
                  fontSize:"11px", cursor:"pointer", transition:"all 0.15s",
                  display:"flex", flexDirection:"column", alignItems:"center", gap:"3px",
                }}>
                <span style={{ fontSize:"16px" }}>{t.icon}</span>
                {t.label}
              </button>
            ))}
          </div>

          {/* Provider */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px", marginBottom:"12px" }}>
            <div>
              <p style={S.label}>Provider</p>
              <select style={S.input} value={provider} onChange={e => setProvider(e.target.value)} onFocus={focus} onBlur={blur}>
                {selectedType.providers.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <p style={S.label}>Status</p>
              <select style={S.input} value={status} onChange={e => setStatus(e.target.value)} onFocus={focus} onBlur={blur}>
                <option value="unpaid">Unpaid</option>
                <option value="paid">Paid</option>
              </select>
            </div>
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px", marginBottom:"12px" }}>
            <div>
              <p style={S.label}>Amount (PKR)</p>
              <input style={S.input} type="number" placeholder="3500"
                value={amount} onChange={e => setAmount(e.target.value)} onFocus={focus} onBlur={blur} />
            </div>
            <div>
              <p style={S.label}>Due Date</p>
              <input style={S.input} type="date"
                value={dueDate} onChange={e => setDueDate(e.target.value)} onFocus={focus} onBlur={blur} />
            </div>
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px", marginBottom:"12px" }}>
            <div>
              <p style={S.label}>Bill Month <span style={{ color:"var(--text-3)", fontWeight:"400" }}>(optional)</span></p>
              <input style={S.input} type="month"
                value={billDate} onChange={e => setBillDate(e.target.value)} onFocus={focus} onBlur={blur} />
            </div>
            <div>
              <p style={S.label}>Reference No. <span style={{ color:"var(--text-3)", fontWeight:"400" }}>(optional)</span></p>
              <input style={S.input} placeholder="e.g. 12345678"
                value={refNo} onChange={e => setRefNo(e.target.value)} onFocus={focus} onBlur={blur} />
            </div>
          </div>

          <div style={{ marginBottom:"16px" }}>
            <p style={S.label}>Note <span style={{ color:"var(--text-3)", fontWeight:"400" }}>(optional)</span></p>
            <input style={S.input} placeholder="e.g. High usage this month"
              value={note} onChange={e => setNote(e.target.value)} onFocus={focus} onBlur={blur} />
          </div>

          {/* OCR hint */}
          <div style={{ display:"flex", alignItems:"center", gap:"8px", padding:"10px 12px", borderRadius:"var(--radius-sm)", background:"var(--brand-light)", border:"1px solid rgba(91,103,241,0.15)", marginBottom:"16px" }}>
            <span style={{ fontSize:"14px" }}>📷</span>
            <p style={{ fontSize:"12px", color:"var(--brand)", flex:1 }}>
              Coming soon: Scan your bill to auto-fill these fields
            </p>
            <button onClick={() => { setShowForm(false); setShowScan(true); }}
              style={{ fontSize:"11px", color:"var(--brand)", background:"transparent", border:"1px solid var(--brand)", borderRadius:"var(--radius-btn)", padding:"3px 8px", cursor:"pointer", fontWeight:"600", whiteSpace:"nowrap" }}>
              Try Scan
            </button>
          </div>

          <button onClick={handleSave} disabled={saving}
            style={{ ...S.btnPrimary, width:"100%", opacity: saving ? 0.6 : 1 }}>
            {saving ? "Saving..." : "Save Bill"}
          </button>
        </div>
      )}

      {/* ── Filters ── */}
      <div style={{ display:"flex", gap:"8px", flexWrap:"wrap", marginBottom:"16px" }}>
        {/* Type filter */}
        <div style={{ display:"flex", gap:"6px", flexWrap:"wrap" }}>
          <button onClick={() => setFilterType("all")}
            style={{ ...S.filterBtn, ...(filterType==="all" ? S.filterBtnActive : {}) }}>
            All ({bills.length})
          </button>
          {BILL_TYPES.filter(t => typeCounts[t.value] > 0).map(t => (
            <button key={t.value} onClick={() => setFilterType(t.value)}
              style={{ ...S.filterBtn, ...(filterType===t.value ? { borderColor:t.color, background:t.bg, color:t.color } : {}) }}>
              {t.icon} {t.label} ({typeCounts[t.value]})
            </button>
          ))}
        </div>

        <div style={{ width:"1px", background:"var(--border)", alignSelf:"stretch", margin:"0 4px" }} />

        {/* Status filter */}
        {["all","unpaid","paid","overdue"].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)}
            style={{ ...S.filterBtn, ...(filterStatus===s ? S.filterBtnActive : {}) }}>
            {s === "all" ? "All Status" : STATUS_CONFIG[s]?.label || s}
          </button>
        ))}
      </div>

      {/* ── Bill List ── */}
      {loading ? (
        [1,2,3].map(i => <div key={i} className="skeleton" style={{ height:"84px", borderRadius:"var(--radius-lg)", marginBottom:"8px" }} />)
      ) : filtered.length === 0 ? (
        <div style={{ ...S.card, padding:"56px", textAlign:"center" }}>
          <p style={{ fontSize:"36px", marginBottom:"12px" }}>🧾</p>
          <p style={{ fontSize:"15px", fontWeight:"600", color:"var(--text-1)", marginBottom:"6px" }}>
            {bills.length === 0 ? "No bills tracked yet" : "No bills match this filter"}
          </p>
          <p style={{ fontSize:"13px", color:"var(--text-3)" }}>
            {bills.length === 0 ? "Add your electricity, gas, or internet bill above" : "Try changing the filter"}
          </p>
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
          {filtered.map(bill => <BillCard key={bill.id} bill={bill} onMarkPaid={markPaid} onDelete={handleDelete} />)}
        </div>
      )}

      <style>{`
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes slideDown{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}
        @keyframes slideRight{from{opacity:0;transform:translateX(12px)}to{opacity:1;transform:translateX(0)}}
      `}</style>
    </div>
  );
}

// ─── Bill Card ────────────────────────────────────────────────────────────────
function BillCard({ bill, onMarkPaid, onDelete }) {
  const [hover, setHover] = useState(false);
  const t = getType(bill.billType);
  const st = STATUS_CONFIG[bill.status] || STATUS_CONFIG.unpaid;
  const days = daysUntil(bill.dueDate);
  const isUrgent = bill.status !== "paid" && days !== null && days <= 3 && days >= 0;

  return (
    <div
      style={{ ...S.card, transform: hover ? "translateY(-1px)" : "none", boxShadow: hover ? "var(--shadow)" : "var(--shadow-sm)", transition:"all 0.2s",
        borderLeft:`3px solid ${bill.status==="overdue" ? "var(--danger)" : bill.status==="paid" ? "var(--success)" : isUrgent ? "var(--warning)" : t.color}`,
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div style={{ display:"flex", alignItems:"center", gap:"12px" }}>
        {/* Icon */}
        <div style={{ width:"44px", height:"44px", borderRadius:"var(--radius)", background:t.bg, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, fontSize:"20px" }}>
          {t.icon}
        </div>

        {/* Info */}
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:"7px", flexWrap:"wrap", marginBottom:"3px" }}>
            <p style={{ fontSize:"14px", fontWeight:"600", color:"var(--text-1)" }}>{bill.provider}</p>
            <span style={{ fontSize:"10px", padding:"2px 7px", borderRadius:"20px", background:t.bg, color:t.color, fontWeight:"600" }}>{t.label}</span>
            <span style={{ fontSize:"10px", padding:"2px 7px", borderRadius:"20px", background:st.bg, color:st.color, fontWeight:"600" }}>
              {st.icon} {st.label}
            </span>
            {isUrgent && (
              <span style={{ fontSize:"10px", padding:"2px 7px", borderRadius:"20px", background:"rgba(245,158,11,0.12)", color:"var(--warning)", fontWeight:"600", animation:"pulse 2s infinite" }}>
                ⏰ Due soon
              </span>
            )}
          </div>
          <div style={{ display:"flex", gap:"14px", flexWrap:"wrap" }}>
            <p style={{ fontSize:"12px", color:"var(--text-3)" }}>Due: {fmtDate(bill.dueDate)}
              {bill.status !== "paid" && days !== null && (
                <span style={{ color: days < 0 ? "var(--danger)" : days <= 7 ? "var(--warning)" : "var(--text-3)", fontWeight:"600", marginLeft:"4px" }}>
                  ({days < 0 ? `${Math.abs(days)}d ago` : days === 0 ? "Today" : `${days}d left`})
                </span>
              )}
            </p>
            {bill.refNo && <p style={{ fontSize:"12px", color:"var(--text-3)" }}>Ref: {bill.refNo}</p>}
            {bill.note && <p style={{ fontSize:"12px", color:"var(--text-3)", fontStyle:"italic" }}>{bill.note}</p>}
          </div>
        </div>

        {/* Amount + Actions */}
        <div style={{ textAlign:"right", flexShrink:0 }}>
          <p style={{ fontSize:"17px", fontWeight:"700", color:"var(--text-1)", marginBottom:"6px" }}>
            PKR {Number(bill.amount).toLocaleString()}
          </p>
          <div style={{ display:"flex", gap:"6px", justifyContent:"flex-end" }}>
            {bill.status !== "paid" && (
              <button onClick={() => onMarkPaid(bill.id)}
                style={{ padding:"4px 10px", background:"var(--success-bg)", border:"1px solid rgba(34,197,94,0.3)", borderRadius:"var(--radius-btn)", color:"var(--success)", fontSize:"11px", cursor:"pointer", fontWeight:"600" }}>
                Mark Paid
              </button>
            )}
            <button onClick={() => onDelete(bill.id)}
              style={{ padding:"4px 8px", background:"transparent", border:"1px solid var(--border)", borderRadius:"var(--radius-btn)", color:"var(--text-3)", fontSize:"11px", cursor:"pointer" }}
              onMouseEnter={e => { e.currentTarget.style.color="var(--danger)"; e.currentTarget.style.borderColor="#FCA5A5"; }}
              onMouseLeave={e => { e.currentTarget.style.color="var(--text-3)"; e.currentTarget.style.borderColor="var(--border)"; }}>
              ✕
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
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
  sub:       { fontSize:"13px", color:"rgba(255,255,255,0.35)", marginTop:"5px" },
  card:      { background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:"var(--radius-lg)", padding:"16px", boxShadow:"var(--shadow-sm)" },
  cardTitle: { fontSize:"14px", fontWeight:"600", color:"var(--text-1)", marginBottom:"16px", fontFamily:"'Sora', sans-serif" },
  label:     { fontSize:"11px", fontWeight:"600", color:"var(--text-2)", marginBottom:"5px", display:"block", textTransform:"uppercase", letterSpacing:"0.04em" },
  input:     { width:"100%", padding:"9px 12px", background:"var(--bg-card)", border:"1.5px solid var(--border)", borderRadius:"var(--radius)", color:"var(--text-1)", fontSize:"13px", outline:"none", transition:"border-color 0.15s", boxSizing:"border-box" },
  btnPrimary:{ padding:"10px 18px", background:"var(--brand)", color:"white", border:"none", borderRadius:"var(--radius-btn)", fontSize:"13px", fontWeight:"600", cursor:"pointer", boxShadow:"0 2px 8px var(--brand-glow)" },
  btnScan:   { padding:"9px 14px", background:"var(--bg-card)", color:"var(--text-1)", border:"1px solid var(--border)", borderRadius:"var(--radius-btn)", fontSize:"13px", fontWeight:"600", cursor:"pointer", display:"flex", alignItems:"center", gap:"6px", boxShadow:"var(--shadow-sm)" },
  filterBtn: { padding:"5px 12px", borderRadius:"var(--radius-btn)", border:"1px solid var(--border)", background:"transparent", color:"var(--text-3)", fontSize:"11px", cursor:"pointer", transition:"all 0.15s", fontWeight:"500" },
  filterBtnActive: { borderColor:"var(--brand)", background:"var(--brand-light)", color:"var(--brand)", fontWeight:"700" },
  statCard:  { background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:"var(--radius-lg)", padding:"16px", boxShadow:"var(--shadow-sm)" },
  statLabel: { fontSize:"11px", color:"var(--text-3)", marginBottom:"6px", textTransform:"uppercase", letterSpacing:"0.06em", fontWeight:"600" },
  statValue: { fontSize:"22px", fontWeight:"800", color:"var(--text-1)", marginBottom:"2px", fontFamily:"'Sora', sans-serif" },
  statSub:   { fontSize:"11px", color:"var(--text-3)" },
  toast:     { position:"fixed", top:"16px", right:"16px", zIndex:9999, padding:"10px 16px", borderRadius:"var(--radius)", border:"1px solid", fontSize:"13px", fontWeight:"500", animation:"slideRight 0.25s ease", boxShadow:"var(--shadow)" },
};