// InheritancePreview — full-screen modal showing distribution summary before saving
import DistributionChart from "./DistributionChart";

const CATEGORY_ICON = {
  bank: "🏦", crypto: "💰", property: "🏠", social: "📱",
  email: "📧", vehicle: "🚗", jewelry: "💎", other: "📦",
};

const RELATION_EMOJI = {
  spouse: "💑", child: "👶", parent: "👨‍👩‍👧", sibling: "👫", friend: "🤝", other: "👤",
};

export default function InheritancePreview({ plan, onConfirm, onClose, saving }) {
  const total = plan.beneficiaries.reduce((s, b) => s + (b.percentage || 0), 0);
  const isValid = total === 100 && plan.beneficiaries.length > 0;

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div style={styles.header}>
          <div>
            <p style={styles.headerLabel}>Inheritance Preview</p>
            <h2 style={styles.headerTitle}>
              {CATEGORY_ICON[plan.assetCategory] || "📦"} {plan.assetTitle}
            </h2>
          </div>
          <button onClick={onClose} style={styles.closeBtn}>✕</button>
        </div>

        {/* Asset meta */}
        <div style={styles.metaRow}>
          <div style={styles.metaChip}>
            <span style={styles.metaLabel}>Category</span>
            <span style={styles.metaValue}>{plan.assetCategory}</span>
          </div>
          {plan.totalValue > 0 && (
            <div style={styles.metaChip}>
              <span style={styles.metaLabel}>Value</span>
              <span style={styles.metaValue}>{plan.currency} {Number(plan.totalValue).toLocaleString()}</span>
            </div>
          )}
          <div style={styles.metaChip}>
            <span style={styles.metaLabel}>Release Delay</span>
            <span style={styles.metaValue}>
              {plan.delayDays === 0 ? "Immediate" : `${plan.delayDays} days after trigger`}
            </span>
          </div>
        </div>

        {/* Chart */}
        <div style={styles.chartSection}>
          <DistributionChart beneficiaries={plan.beneficiaries} />
        </div>

        {/* Beneficiary breakdown */}
        <div style={styles.breakdownSection}>
          <p style={styles.sectionLabel}>Distribution Breakdown</p>
          {plan.beneficiaries.map((b, i) => (
            <div key={i} style={styles.breakdownRow}>
              <div style={styles.breakdownLeft}>
                <span style={styles.breakdownEmoji}>{RELATION_EMOJI[b.relation] || "👤"}</span>
                <div>
                  <p style={styles.breakdownName}>{b.nomineeName}</p>
                  <p style={styles.breakdownRelation}>{b.relation}</p>
                </div>
              </div>
              <div style={styles.breakdownRight}>
                <span style={styles.breakdownPct}>{b.percentage}%</span>
                {plan.totalValue > 0 && (
                  <span style={styles.breakdownVal}>
                    ≈ {plan.currency} {Math.round(plan.totalValue * b.percentage / 100).toLocaleString()}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Validation warning */}
        {!isValid && (
          <div style={styles.warning}>
            ⚠️ Total {total}% — 100% is required for a valid distribution.
          </div>
        )}

        {/* Actions */}
        <div style={styles.actions}>
          <button onClick={onClose} style={styles.cancelBtn}>Edit</button>
          <button
            onClick={onConfirm}
            disabled={!isValid || saving}
            style={{ ...styles.confirmBtn, opacity: (!isValid || saving) ? 0.5 : 1 }}
          >
            {saving ? "Saving..." : "✅ Confirm & Save"}
          </button>
        </div>

      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed", inset: 0, background: "var(--overlay)", backdropFilter: "blur(4px)",
    display: "flex", alignItems: "center", justifyContent: "center",
    zIndex: 1000, padding: "1rem",
  },
  modal: {
    background: "#141414", border: "1px solid #2a2a2a", borderRadius: "20px",
    width: "100%", maxWidth: "560px", maxHeight: "90vh",
    overflowY: "auto", padding: "1.75rem",
  },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem" },
  headerLabel: { color: "#666", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 4px" },
  headerTitle: { color: "#fff", fontSize: "20px", margin: 0, fontWeight: "600" },
  closeBtn: { background: "transparent", border: "1px solid #333", color: "#888", width: "32px", height: "32px", borderRadius: "var(--radius-btn)", cursor: "pointer", fontSize: "14px" },
  metaRow: { display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "1.5rem" },
  metaChip: { background: "#1e1e1e", border: "1px solid #2a2a2a", borderRadius: "8px", padding: "8px 12px" },
  metaLabel: { display: "block", color: "#666", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "2px" },
  metaValue: { color: "#fff", fontSize: "13px", fontWeight: "500" },
  chartSection: { background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: "12px", padding: "1.25rem", marginBottom: "1.25rem" },
  breakdownSection: { marginBottom: "1.25rem" },
  sectionLabel: { color: "#666", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px" },
  breakdownRow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #1e1e1e" },
  breakdownLeft: { display: "flex", alignItems: "center", gap: "10px" },
  breakdownEmoji: { fontSize: "20px" },
  breakdownName: { color: "#fff", fontSize: "14px", margin: "0 0 2px", fontWeight: "500" },
  breakdownRelation: { color: "#666", fontSize: "11px", margin: 0 },
  breakdownRight: { textAlign: "right" },
  breakdownPct: { display: "block", color: "#6c47ff", fontSize: "18px", fontWeight: "700" },
  breakdownVal: { color: "#888", fontSize: "11px" },
  warning: { background: "#2a1a00", border: "1px solid #ffaa00", borderRadius: "8px", color: "#ffaa00", fontSize: "13px", padding: "10px 14px", marginBottom: "1rem" },
  actions: { display: "flex", gap: "10px" },
  cancelBtn: { flex: 1, padding: "12px", background: "transparent", border: "1px solid #333", color: "#888", borderRadius: "var(--radius-btn)", cursor: "pointer", fontSize: "14px" },
  confirmBtn: { flex: 2, padding: "12px", background: "#6c47ff", color: "#fff", border: "none", borderRadius: "var(--radius-btn)", cursor: "pointer", fontSize: "14px", fontWeight: "600" },
};
