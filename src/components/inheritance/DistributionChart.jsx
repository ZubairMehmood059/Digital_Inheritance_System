// DistributionChart — SVG donut chart showing beneficiary percentages
// No external chart library needed — pure SVG

const COLORS = ["var(--primary)", "var(--secondary)", "var(--accent)", "var(--warning)", "var(--info)", "var(--danger)"];

export default function DistributionChart({ beneficiaries }) {
  if (!beneficiaries || beneficiaries.length === 0) {
    return (
      <div style={styles.empty}>
        <svg width="120" height="120" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="48" fill="none" stroke="var(--border)" strokeWidth="16" />
        </svg>
        <p style={styles.emptyText}>No beneficiaries to display</p>
      </div>
    );
  }

  const total = beneficiaries.reduce((s, b) => s + (b.percentage || 0), 0);
  const radius = 48;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  const segments = beneficiaries.map((b, i) => {
    const pct = (b.percentage || 0) / 100;
    const dash = pct * circumference;
    const gap = circumference - dash;
    const rotation = (offset / 100) * 360 - 90;
    offset += b.percentage || 0;
    return { ...b, dash, gap, rotation, color: COLORS[i % COLORS.length] };
  });

  return (
    <div style={styles.wrapper}>
      <div style={styles.chartWrap}>
        <svg width="140" height="140" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r={radius} fill="none" stroke="var(--card-bg)" strokeWidth="16" />
          {segments.map((seg, i) => (
            <circle
              key={i}
              cx="60" cy="60" r={radius}
              fill="none"
              stroke={seg.color}
              strokeWidth="16"
              strokeDasharray={`${seg.dash} ${seg.gap}`}
              strokeDashoffset={0}
              transform={`rotate(${seg.rotation} 60 60)`}
              style={{ transition: "stroke-dasharray 0.6s ease" }}
            />
          ))}
          <text x="60" y="56" textAnchor="middle" fill="var(--text-1)" fontSize="18" fontWeight="600">
            {Math.round(total)}%
          </text>
          <text x="60" y="70" textAnchor="middle" fill="var(--text-2)" fontSize="9">
            allocated
          </text>
        </svg>
      </div>

      {/* Legend */}
      <div style={styles.legend}>
        {segments.map((seg, i) => (
          <div key={i} style={styles.legendRow}>
            <span style={{ ...styles.dot, background: seg.color }} />
            <span style={styles.legendName}>{seg.nomineeName || "Unknown"}</span>
            <span style={styles.legendPct}>{seg.percentage}%</span>
          </div>
        ))}
        {total < 100 && (
          <div style={styles.legendRow}>
            <span style={{ ...styles.dot, background: "var(--border)" }} />
            <span style={styles.legendName}>Unallocated</span>
            <span style={{ ...styles.legendPct, color: "var(--danger)" }}>{100 - total}%</span>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  wrapper: { display: "flex", alignItems: "center", gap: "1.5rem", flexWrap: "wrap" },
  chartWrap: { flexShrink: 0 },
  legend: { flex: 1, minWidth: "140px" },
  legendRow: { display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" },
  dot: { width: "10px", height: "10px", borderRadius: "50%", flexShrink: 0 },
  legendName: { color: "var(--text-2)", fontSize: "13px", flex: 1 },
  legendPct: { color: "var(--text-1)", fontSize: "13px", fontWeight: "600" },
  empty: { display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" },
  emptyText: { color: "var(--text-2)", fontSize: "12px", margin: 0 },
};
