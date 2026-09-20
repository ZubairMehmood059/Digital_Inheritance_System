import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  getAssets, getNominees,
  addInheritancePlan, getInheritancePlans,
  updateInheritancePlan, deleteInheritancePlan,
} from "../firebase/db";
import DistributionChart from "../components/inheritance/DistributionChart";
import BeneficiaryRow from "../components/inheritance/BeneficiaryRow";
import InheritancePreview from "../components/inheritance/InheritancePreview";
// ── PATTERN 3: Builder — constructs & validates the plan object ───
import InheritancePlanBuilder from "../patterns/builder/InheritancePlanBuilder";

const CAT_ICON = { bank:"🏦", crypto:"💰", property:"🏠", social:"📱", email:"📧", vehicle:"🚗", jewelry:"💎", other:"📦" };
const DELAY_OPTIONS = [
  { label: "Immediate", value: 0 }, { label: "7 days", value: 7 },
  { label: "30 days", value: 30 },  { label: "90 days", value: 90 },
  { label: "6 months", value: 180 },{ label: "1 year", value: 365 },
];
const blankPlan = () => ({ assetId:"", assetTitle:"", assetCategory:"other", totalValue:"", currency:"PKR", delayDays:0, beneficiaries:[] });

export default function Inheritance() {
  const navigate = useNavigate();
  const [assets,      setAssets]      = useState([]);
  const [nominees,    setNominees]    = useState([]);
  const [plans,       setPlans]       = useState([]);
  const [view,        setView]        = useState("list");
  const [activePlan,  setActivePlan]  = useState(blankPlan());
  const [editingId,   setEditingId]   = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [saving,      setSaving]      = useState(false);
  const [loading,     setLoading]     = useState(true);
  const [toast,       setToast]       = useState(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    const [a, n, p] = await Promise.all([getAssets(), getNominees(), getInheritancePlans()]);
    setAssets(a); setNominees(n); setPlans(p);
    setLoading(false);
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  function showToast(msg, type = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  function handleAssetSelect(assetId) {
    const asset = assets.find(a => a.id === assetId);
    if (!asset) return;
    setActivePlan(p => ({ ...p, assetId, assetTitle: asset.title, assetCategory: asset.category || "other" }));
  }

  function addBeneficiary(nomineeId) {
    const nominee = nominees.find(n => n.id === nomineeId);
    if (!nominee) return;
    if (activePlan.beneficiaries.find(b => b.nomineeId === nomineeId)) { showToast("Nominee already added", "error"); return; }
    const used = activePlan.beneficiaries.reduce((s, b) => s + (b.percentage || 0), 0);
    setActivePlan(p => ({ ...p, beneficiaries: [...p.beneficiaries, { nomineeId, nomineeName: nominee.name, relation: nominee.relation, percentage: Math.max(0, 100 - used) }] }));
  }

  function updateBeneficiary(index, updated) {
    setActivePlan(p => { const list = [...p.beneficiaries]; list[index] = updated; return { ...p, beneficiaries: list }; });
  }

  function removeBeneficiary(index) {
    setActivePlan(p => ({ ...p, beneficiaries: p.beneficiaries.filter((_, i) => i !== index) }));
  }

  const usedPct      = activePlan.beneficiaries.reduce((s, b) => s + (b.percentage || 0), 0);
  const remainingPct = Math.max(0, 100 - usedPct);

  async function handleSave() {
    setSaving(true);
    try {
      // PATTERN 3: Builder — assemble and validate before saving to Firestore
      const builder = new InheritancePlanBuilder();
      const payload = builder
        .setAsset(activePlan.assetId, activePlan.assetTitle, activePlan.assetCategory)
        .setValue(activePlan.totalValue, activePlan.currency)
        .setDelay(activePlan.delayDays)
        .setBeneficiaries(activePlan.beneficiaries)
        .build(); // throws if invalid

      if (editingId) { await updateInheritancePlan(editingId, payload); showToast("Plan updated ✓"); }
      else           { await addInheritancePlan(payload);               showToast("Plan saved ✓"); }
    } catch (err) {
      // Builder validation error — show user-friendly message
      showToast(err.message.replace("[InheritancePlanBuilder] Validation failed: ", ""), "error");
      setSaving(false);
      return;
    }
    setSaving(false); setShowPreview(false); setView("list");
    setActivePlan(blankPlan()); setEditingId(null);
    loadAll();
  }

  function startEdit(plan) { setActivePlan({ ...plan }); setEditingId(plan.id); setView("create"); }

  async function handleDelete(planId) {
    await deleteInheritancePlan(planId);
    showToast("Plan deleted"); loadAll();
  }

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
          <h1 style={S.heading}>Inheritance Engine</h1>
          <p style={S.subheading}>Distribute your digital legacy to beneficiaries</p>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          {view === "list" && (
            <button onClick={() => { setActivePlan(blankPlan()); setEditingId(null); setView("create"); }} style={S.btnPrimary}>
              + New Plan
            </button>
          )}
          {view === "create" && (
            <button onClick={() => { setView("list"); setActivePlan(blankPlan()); setEditingId(null); }} style={S.btnGhost}>
              ✕ Cancel
            </button>
          )}
        </div>
      </div>

      {/* ── LIST VIEW ── */}
      {view === "list" && (
        <div>
          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "64px", gap: "12px" }}>
              <div style={S.spinner} />
              <p style={{ color: "var(--text-muted)", fontSize: "13px" }}>Loading plans...</p>
            </div>
          ) : plans.length === 0 ? (
            <div style={{ ...S.card, padding: "64px", textAlign: "center" }}>
              <p style={{ fontSize: "48px", marginBottom: "16px" }}>⚖️</p>
              <p style={{ fontSize: "16px", fontWeight: "500", color: "var(--text-primary)", marginBottom: "8px" }}>No inheritance plans yet</p>
              <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "20px" }}>Assign your assets to beneficiaries</p>
              <button onClick={() => setView("create")} style={S.btnPrimary}>+ Create First Plan</button>
            </div>
          ) : (
            <>
              {/* Stats */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "10px", marginBottom: "16px" }}>
                {[
                  { label: "Total Plans",   value: plans.length },
                  { label: "Beneficiaries", value: [...new Set(plans.flatMap(p => p.beneficiaries.map(b => b.nomineeId)))].length },
                  { label: "Complete",      value: plans.filter(p => p.beneficiaries.reduce((s,b) => s+b.percentage,0) === 100).length },
                ].map(s => (
                  <div key={s.label} style={{ ...S.card, textAlign: "center" }}>
                    <p style={{ fontSize: "28px", fontWeight: "700", color: "var(--text-primary)", marginBottom: "4px" }}>{s.value}</p>
                    <p style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Plan cards */}
              {plans.map(plan => {
                const total = plan.beneficiaries.reduce((s,b) => s+(b.percentage||0), 0);
                const isComplete = total === 100;
                return (
                  <div key={plan.id} style={{ ...S.card, marginBottom: "10px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px", flexWrap: "wrap", gap: "8px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <span style={{ fontSize: "28px" }}>{CAT_ICON[plan.assetCategory] || "📦"}</span>
                        <div>
                          <p style={{ fontSize: "15px", fontWeight: "600", color: "var(--text-primary)", marginBottom: "6px" }}>{plan.assetTitle}</p>
                          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                            <span style={S.badge}>{plan.assetCategory}</span>
                            {plan.totalValue > 0 && <span style={S.badge}>{plan.currency} {Number(plan.totalValue).toLocaleString()}</span>}
                            {plan.delayDays > 0 && <span style={{ ...S.badge, color: "#ffb020" }}>⏱ {plan.delayDays}d delay</span>}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: isComplete ? "var(--success)" : "var(--warning)", display: "inline-block" }} />
                        <button onClick={() => startEdit(plan)} style={S.btnGhost}>Edit</button>
                        <button onClick={() => handleDelete(plan.id)}
                          style={{ background: "transparent", border: "none", cursor: "pointer", fontSize: "16px" }}>🗑️</button>
                      </div>
                    </div>
                    <DistributionChart beneficiaries={plan.beneficiaries} />
                    <div style={{ height: "4px", background: "var(--bg-3)", borderRadius: "2px", overflow: "hidden", marginTop: "12px", marginBottom: "6px" }}>
                      <div style={{ height: "100%", borderRadius: "2px", width: `${Math.min(total,100)}%`, background: isComplete ? "var(--success)" : "var(--brand)", transition: "width 0.4s ease" }} />
                    </div>
                    <p style={{ fontSize: "11px", color: "var(--text-muted)" }}>{total}% allocated{!isComplete && ` — ${100-total}% remaining`}</p>
                  </div>
                );
              })}
            </>
          )}
        </div>
      )}

      {/* ── CREATE / EDIT VIEW ── */}
      {view === "create" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: "16px", alignItems: "start" }}>

          {/* LEFT — Form */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>

            {/* Step 1 */}
            <div style={S.card}>
              <p style={S.stepLabel}>Step 1 — Select Asset</p>
              {assets.length === 0 ? (
                <div style={S.emptyBox}>
                  <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "10px" }}>Add assets in Vault first</p>
                  <button onClick={() => navigate("/vault")} style={S.btnOutline}>Open Vault →</button>
                </div>
              ) : (
                <select style={S.select} value={activePlan.assetId} onChange={e => handleAssetSelect(e.target.value)}>
                  <option value="">— Select an asset —</option>
                  {assets.map(a => <option key={a.id} value={a.id}>{CAT_ICON[a.category]||"📦"} {a.title}</option>)}
                </select>
              )}
              {activePlan.assetId && (
                <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px", borderRadius: "10px", background: "var(--bg-3)", border: "1px solid var(--border)", marginBottom: "10px" }}>
                  <span style={{ fontSize: "22px" }}>{CAT_ICON[activePlan.assetCategory]||"📦"}</span>
                  <div>
                    <p style={{ fontSize: "13px", fontWeight: "500", color: "var(--text-primary)", marginBottom: "2px" }}>{activePlan.assetTitle}</p>
                    <p style={{ fontSize: "11px", color: "var(--text-muted)" }}>{activePlan.assetCategory}</p>
                  </div>
                </div>
              )}
              <div style={{ display: "flex", gap: "8px" }}>
                <select style={{ ...S.select, width: "90px", marginBottom: 0 }} value={activePlan.currency} onChange={e => setActivePlan(p => ({ ...p, currency: e.target.value }))}>
                  {["PKR","USD","EUR","GBP","AED"].map(c => <option key={c}>{c}</option>)}
                </select>
                <input type="number" style={{ ...S.input, flex: 1 }} placeholder="Estimated value (optional)"
                  value={activePlan.totalValue} onChange={e => setActivePlan(p => ({ ...p, totalValue: e.target.value }))}
                  onFocus={e => e.target.style.borderColor = "rgba(108,71,255,0.6)"}
                  onBlur={e => e.target.style.borderColor = "var(--border)"} />
              </div>
            </div>

            {/* Step 2 */}
            <div style={S.card}>
              <p style={S.stepLabel}>Step 2 — Release Timeline</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "8px", marginBottom: "10px" }}>
                {DELAY_OPTIONS.map(opt => (
                  <button key={opt.value} onClick={() => setActivePlan(p => ({ ...p, delayDays: opt.value }))}
                    style={{ padding: "8px", borderRadius: "var(--radius-btn)", border: `1px solid ${activePlan.delayDays === opt.value ? "var(--brand)" : "var(--border)"}`, background: activePlan.delayDays === opt.value ? "rgba(108,71,255,0.15)" : "var(--bg-3)", color: activePlan.delayDays === opt.value ? "var(--brand-light)" : "var(--text-muted)", fontSize: "12px", cursor: "pointer", fontWeight: activePlan.delayDays === opt.value ? "600" : "400", transition: "all 0.15s" }}>
                    {opt.label}
                  </button>
                ))}
              </div>
              {activePlan.delayDays > 0 && (
                <p style={{ fontSize: "12px", color: "var(--warning)" }}>⏱ Assets will be released {activePlan.delayDays} days after trigger</p>
              )}
            </div>

            {/* Step 3 */}
            <div style={S.card}>
              <p style={S.stepLabel}>Step 3 — Add Beneficiaries</p>
              {nominees.length === 0 ? (
                <div style={S.emptyBox}>
                  <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "10px" }}>Add nominees first</p>
                  <button onClick={() => navigate("/nominees")} style={S.btnOutline}>Open Nominees →</button>
                </div>
              ) : (
                <select style={S.select} value="" onChange={e => { if (e.target.value) addBeneficiary(e.target.value); }}>
                  <option value="">+ Add a nominee as beneficiary</option>
                  {nominees.filter(n => !activePlan.beneficiaries.find(b => b.nomineeId === n.id)).map(n => (
                    <option key={n.id} value={n.id}>{n.name} ({n.relation})</option>
                  ))}
                </select>
              )}

              {activePlan.beneficiaries.map((b, i) => (
                <BeneficiaryRow key={b.nomineeId} beneficiary={b} index={i} remainingPct={remainingPct}
                  onChange={updated => updateBeneficiary(i, updated)}
                  onRemove={() => removeBeneficiary(i)} />
              ))}

              {activePlan.beneficiaries.length > 0 && (
                <div style={{ padding: "10px 14px", borderRadius: "8px", border: `1px solid ${usedPct===100?"rgba(0,214,143,0.3)":usedPct>100?"rgba(255,77,77,0.3)":"rgba(255,176,32,0.3)"}`, background: usedPct===100?"rgba(0,214,143,0.08)":usedPct>100?"rgba(255,77,77,0.08)":"rgba(255,176,32,0.08)", fontSize: "13px", color: usedPct===100?"var(--success)":usedPct>100?"var(--danger)":"var(--warning)", marginTop: "8px" }}>
                  {usedPct===100 ? "✓ 100% allocated — ready to save" : usedPct>100 ? `✕ ${usedPct}% — cannot exceed 100%` : `⚠ ${usedPct}% allocated — ${remainingPct}% remaining`}
                </div>
              )}
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={() => setShowPreview(true)}
                disabled={!activePlan.assetId || activePlan.beneficiaries.length === 0}
                style={{ flex: 1, padding: "12px", background: "transparent", border: "1px solid rgba(108,71,255,0.4)", color: "var(--brand-light)", borderRadius: "var(--radius-btn)", cursor: "pointer", fontSize: "14px", fontWeight: "600", opacity: (!activePlan.assetId || activePlan.beneficiaries.length===0) ? 0.35 : 1, transition: "opacity 0.2s" }}>
                👁 Preview
              </button>
              <button onClick={handleSave}
                disabled={saving || usedPct !== 100 || !activePlan.assetId}
                style={{ flex: 2, padding: "12px", background: "linear-gradient(135deg,#6c47ff,#4f2fe0)", color: "white", border: "none", borderRadius: "var(--radius-btn)", cursor: "pointer", fontSize: "14px", fontWeight: "600", opacity: (saving||usedPct!==100||!activePlan.assetId) ? 0.35 : 1, boxShadow: "0 4px 16px rgba(108,71,255,0.3)", transition: "opacity 0.2s" }}>
                {saving ? "Saving..." : editingId ? "💾 Update Plan" : "💾 Save Plan"}
              </button>
            </div>
          </div>

          {/* RIGHT — Live chart */}
          <div style={{ ...S.card, position: "sticky", top: "24px" }}>
            <p style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "14px" }}>Live Distribution</p>
            <DistributionChart beneficiaries={activePlan.beneficiaries} />
            {activePlan.assetTitle && (
              <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: "1px solid var(--border)" }}>
                <p style={{ fontSize: "13px", fontWeight: "500", color: "var(--text-primary)", marginBottom: "4px" }}>
                  {CAT_ICON[activePlan.assetCategory]} {activePlan.assetTitle}
                </p>
                {activePlan.totalValue > 0 && (
                  <p style={{ fontSize: "16px", fontWeight: "700", color: "var(--brand-light)" }}>
                    {activePlan.currency} {Number(activePlan.totalValue).toLocaleString()}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && (
        <InheritancePreview plan={activePlan} onConfirm={handleSave} onClose={() => setShowPreview(false)} saving={saving} />
      )}

      <style>{`@keyframes fadeIn{from{opacity:0}to{opacity:1}} @keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

const S = {
  toast: { position: "fixed", top: "16px", right: "16px", zIndex: 9999, padding: "12px 18px", borderRadius: "12px", border: "1px solid var(--border)", background: "var(--bg-2)", color: "var(--text-primary)", fontSize: "13px", fontWeight: "500" },
  header: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" },
  heading: { fontSize: "22px", fontWeight: "600", color: "var(--text-primary)", margin: 0 },
  subheading: { fontSize: "13px", color: "var(--text-secondary)", marginTop: "4px" },
  card: { background: "var(--bg-2)", border: "1px solid var(--border)", borderRadius: "14px", padding: "18px", transition: "border-color 0.2s" },
  stepLabel: { fontSize: "10px", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: "600", marginBottom: "14px" },
  select: { width: "100%", padding: "10px 12px", background: "var(--bg-1)", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text-primary)", fontSize: "13px", marginBottom: "10px", boxSizing: "border-box", cursor: "pointer", outline: "none" },
  input: { width: "100%", padding: "10px 14px", background: "var(--bg-1)", border: "1px solid var(--border)", borderRadius: "10px", color: "var(--text-primary)", fontSize: "13px", outline: "none", transition: "border-color 0.2s", boxSizing: "border-box" },
  badge: { background: "var(--bg-3)", color: "var(--text-secondary)", fontSize: "10px", padding: "2px 8px", borderRadius: "20px", border: "1px solid var(--border)" },
  
  // Buttons ko ab var() use karke update kar diya hai
  btnPrimary: { padding: "10px 18px",zIndex: 1, background: "var(--brand-color, #4427b6)", color: "#ffffff", border: "none", borderRadius: "var(--radius-btn)", fontSize: "13px", fontWeight: "500", cursor: "pointer" },
  btnGhost: { padding: "8px 14px",zIndex: 1, background: "transparent", border: "1px solid var(--border)", color: "var(--text-secondary)", borderRadius: "var(--radius-btn)", cursor: "pointer", fontSize: "12px" },
  btnOutline: { background: "transparent",zIndex: 1, border: "1px solid var(--border)", color: "var(--text-primary)", padding: "8px 16px", borderRadius: "var(--radius-btn)", cursor: "pointer", fontSize: "13px" },
  
  emptyBox: { background: "var(--bg-3)",zIndex: 1, border: "1px dashed var(--border)", borderRadius: "8px", padding: "20px", textAlign: "center", marginBottom: "10px", color: "var(--text-secondary)" },
  spinner: { width: "32px", height: "32px", border: "2px solid var(--border)", borderTop: "2px solid var(--brand-color, #6c47ff)", borderRadius: "50%", animation: "spin 0.8s linear infinite" },

  
};