// BeneficiaryRow — single beneficiary entry with percentage slider + remove

const COLORS = ["var(--card-bg)", "var(--primary)", "var(--secondary)", "var(--accent)", "var(--warning)", "var(--info)"];

const RELATION_EMOJI = {
  spouse: "💑", child: "👶", parent: "👨‍👩‍👧", sibling: "👫", friend: "🤝", other: "👤",
};

export default function BeneficiaryRow({ beneficiary, index, onChange, onRemove, remainingPct }) {
  const color = COLORS[index % COLORS.length];

  function handlePctChange(val) {
    const num = Math.min(100, Math.max(0, Number(val)));
    onChange({ ...beneficiary, percentage: num });
  }

  return (
    <div style={styles.row}>
      {/* Avatar */}
      <div style={{ ...styles.avatar, background: color }}>
        {(beneficiary.nomineeName || "?").charAt(0).toUpperCase()}
      </div>

      {/* Info */}
      <div style={styles.info}>
        <div style={styles.nameRow}>
          <span style={styles.name}>{beneficiary.nomineeName}</span>
          <span style={styles.relation}>
            {RELATION_EMOJI[beneficiary.relation] || "👤"} {beneficiary.relation}
          </span>
        </div>

        {/* Percentage slider */}
        <div style={styles.sliderRow}>
          <input
            type="range"
            min="0"
            max={beneficiary.percentage + remainingPct}
            value={beneficiary.percentage}
            onChange={(e) => handlePctChange(e.target.value)}
            style={{ ...styles.slider, accentColor: color }}
          />
          <div style={styles.pctBox}>
            <input
              type="number"
              min="0"
              max="100"
              value={beneficiary.percentage}
              onChange={(e) => handlePctChange(e.target.value)}
              style={{ ...styles.pctInput, borderColor: color }}
            />
            <span style={styles.pctSymbol}>%</span>
          </div>
        </div>
      </div>

      {/* Remove */}
      <button onClick={onRemove} style={styles.removeBtn} title="Remove">
        ✕
      </button>
    </div>
  );
}

const styles = {
  row: {
    display: "flex", alignItems: "center", gap: "12px",
    background: "#111", border: "1px solid #2a2a2a",
    borderRadius: "10px", padding: "12px", marginBottom: "8px",
  },
  avatar: {
    width: "38px", height: "38px", borderRadius: "50%",
    display: "flex", alignItems: "center", justifyContent: "center",
    color: "var(--text-1)", fontSize: "16px", fontWeight: "600", flexShrink: 0,
  },
  info: { flex: 1, minWidth: 0 },
  nameRow: { display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px", flexWrap: "wrap" },
  name: { color: "var(--text-1)", fontSize: "14px", fontWeight: "500" },
  relation: { color: "var(--text-2)", fontSize: "11px", background: "var(--card-bg)", padding: "2px 8px", borderRadius: "20px" },
  sliderRow: { display: "flex", alignItems: "center", gap: "10px" },
  slider: { flex: 1, height: "4px", cursor: "pointer" },
  pctBox: { display: "flex", alignItems: "center", gap: "2px", flexShrink: 0 },
  pctInput: {
    width: "52px", padding: "4px 6px", background: "var(--card-bg)",
    border: "1px solid var(--border)", borderRadius: "6px",
    color: "var(--text-1)", fontSize: "13px", textAlign: "center",
  },
  pctSymbol: { color: "var(--text-2)", fontSize: "13px" },
  removeBtn: {
    background: "transparent", border: "none", color: "var(--text-2)",
    cursor: "pointer", fontSize: "14px", padding: "4px",
    flexShrink: 0, transition: "color 0.2s",
  },
};
