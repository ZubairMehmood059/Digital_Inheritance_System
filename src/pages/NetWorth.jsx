import { useState, useEffect } from "react";
import { doc, setDoc, getDoc, addDoc, collection, getDocs, orderBy, query, limit } from "firebase/firestore";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts";
// ── PATTERN 1: Singleton ──────────────────────────────────────────
import firebaseService from "../patterns/singleton/FirebaseService";
// ── PATTERN 2: Factory ────────────────────────────────────────────
import PageFactory from "../patterns/factory/PageFactory";

// ── Asset definitions with icons ─────────────────────────────────
const ASSET_DEFS = [
  { name: "Bank Accounts",     key: "bank",    icon: "🏦", color: "#E0474C" },
  { name: "Physical Cash",     key: "cash",    icon: "💵", color: "#10B981" },
  { name: "Real Estate",       key: "realestate", icon: "🏠", color: "#F59E0B" },
  { name: "Gold / Jewelry",    key: "gold",    icon: "💎", color: "#F87171" },
  { name: "Crypto",            key: "crypto",  icon: "₿",  color: "#7C3AED" },
  { name: "Other Investments", key: "other",   icon: "📈", color: "#C73D42" },
];

const DEFAULT_ASSETS = ASSET_DEFS.map(a => ({ name: a.name, key: a.key, value: 0 }));

// ── Format large PKR numbers nicely ──────────────────────────────
function fmtPKR(n) {
  if (n === 0) return "Rs. 0";
  if (Math.abs(n) >= 10_000_000) return `Rs. ${(n / 10_000_000).toFixed(2)} Cr`;
  if (Math.abs(n) >= 100_000)    return `Rs. ${(n / 100_000).toFixed(2)} L`;
  return `Rs. ${Number(n).toLocaleString("en-PK")}`;
}

// ── Custom tooltip for the pie chart ─────────────────────────────
function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  const total = d.payload._total;
  const pct   = total > 0 ? ((d.value / total) * 100).toFixed(1) : 0;
  return (
    <div style={{
      background: "#13080A", border: "1px solid rgba(224,71,76,0.3)",
      borderRadius: 10, padding: "10px 14px", color: "#fff",
      fontSize: 13, minWidth: 160,
    }}>
      <p style={{ fontWeight: 700, marginBottom: 4, color: d.payload.fill || "#fff" }}>
        {d.name}
      </p>
      <p style={{ color: "rgba(255,255,255,0.7)" }}>
        {fmtPKR(d.value)}
      </p>
      <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 11, marginTop: 2 }}>
        {pct}% of portfolio
      </p>
    </div>
  );
}

export default function NetWorth() {
  const [assets, setAssets] = useState(DEFAULT_ASSETS);
  const [debts,  setDebts]  = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [saveError, setSaveError] = useState("");
  const [loadError, setLoadError] = useState("");
  // FEATURE: Net Worth Trend
  const [trendData, setTrendData] = useState([]);

  // ── Fetch on mount ────────────────────────────────────────────
  useEffect(() => {
    const fetchDoc = async () => {
      const currentUser = firebaseService.auth.currentUser;
      if (!currentUser) { setLoading(false); return; }
      const snap = await getDoc(doc(firebaseService.db, "netWorth", currentUser.uid))
        .catch((err) => {
          setLoadError(`Unable to load your saved net worth: ${err.message}`);
          return null;
        });
      if (snap?.exists()) {
        const data = snap.data();
        if (data.assets) {
          setAssets(DEFAULT_ASSETS.map(def => {
            const saved = (data.assets || []).find(a => a.name === def.name || a.key === def.key);
            return { ...def, value: saved?.value ?? 0 };
          }));
        }
        if (data.debts !== undefined) setDebts(Number(data.debts) || 0);
      }

      // History is optional: an older deployment may not have its subcollection
      // rules yet, but the main net-worth document should remain usable.
      try {
        const trendQ = query(
          collection(firebaseService.db, "netWorthHistory", currentUser.uid, "snapshots"),
          orderBy("savedAt", "asc"),
          limit(12)
        );
        const trendSnap = await getDocs(trendQ);
        setTrendData(trendSnap.docs.map(d => d.data()));
      } catch (err) {
        setLoadError(`Net worth history is unavailable: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };
    fetchDoc();
  }, []);

  // ── Save + write trend snapshot ──────────────────────────────
  const handleSave = async () => {
    const currentUser = firebaseService.auth.currentUser;
    if (!currentUser) return;
    setSaving(true);
    setSaveError("");
    try {
      const totalA = assets.reduce((s, a) => s + (a.value || 0), 0);
      const nw     = totalA - debts;
      const now    = new Date();

      // Save main doc
      await setDoc(
        doc(firebaseService.db, "netWorth", currentUser.uid),
        { assets, debts },
        { merge: true }
      );

      // FEATURE: Save trend snapshot (one per save)
      await addDoc(
        collection(firebaseService.db, "netWorthHistory", currentUser.uid, "snapshots"),
        {
          savedAt:     now.toISOString(),
          label:       now.toLocaleDateString("en-PK", { day: "numeric", month: "short" }),
          totalAssets: totalA,
          debts,
          netWorth:    nw,
        }
      );

      // Refresh trend
      const trendQ = query(
        collection(firebaseService.db, "netWorthHistory", currentUser.uid, "snapshots"),
        orderBy("savedAt", "asc"),
        limit(12)
      );
      const trendSnap = await getDocs(trendQ);
      setTrendData(trendSnap.docs.map(d => d.data()));

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setSaveError("Save failed: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  // ── Input handler — FIX: store raw number, not parseFloat ────
  const handleAssetChange = (index, raw) => {
    // Allow empty string while typing; store 0 for blank
    const num = raw === "" ? 0 : Math.max(0, Number(raw));
    if (isNaN(num)) return; // reject non-numeric
    setAssets(prev => prev.map((a, i) => i === index ? { ...a, value: num } : a));
  };

  const handleDebtChange = (raw) => {
    const num = raw === "" ? 0 : Math.max(0, Number(raw));
    if (!isNaN(num)) setDebts(num);
  };

  // ── Derived values ────────────────────────────────────────────
  const totalAssets = assets.reduce((s, a) => s + (a.value || 0), 0);
  const netWorth    = totalAssets - debts;

  // Only show assets with value > 0 in chart; attach _total for tooltip %
  const chartData = assets
    .filter(a => a.value > 0)
    .map(a => ({
      name:   a.name,
      value:  a.value,
      fill:   ASSET_DEFS.find(d => d.key === a.key)?.color ?? "#E0474C",
      _total: totalAssets,
    }));

  // Health score: 0–100 based on asset diversification
  const filledCount   = assets.filter(a => a.value > 0).length;
  const diversityScore = Math.round((filledCount / ASSET_DEFS.length) * 100);

  if (loading) return PageFactory.createLoadingState("Loading Asset Tracker...");

  return (
    <div style={{ animation: "fadeIn 0.3s ease" }}>
      {/* PATTERN 2: Factory header */}
      {PageFactory.createPageHeader({
        moduleType: "FINANCE",
        title:      "Asset Tracker",
        subtitle:   "Track your global net worth and asset allocation",
        action: (
          <button onClick={handleSave} disabled={saving} style={{
            ...S.btnPrimary,
            opacity: saving ? 0.7 : 1,
            background: saved ? "#10B981" : "var(--brand)",
          }}>
            {saving ? "Saving..." : saved ? "✓ Saved" : "Save Changes"}
          </button>
        ),
      })}

      {/* Save error banner */}
      {loadError && (
        <div style={S.errorBanner}>⚠ {loadError}</div>
      )}
      {saveError && (
        <div style={S.errorBanner}>⚠ {saveError}</div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.6fr", gap: "20px" }}>

        {/* ── LEFT: Inputs ──────────────────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={S.card}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <p style={S.cardTitle}>Asset Portfolio</p>
              <span style={S.diversityBadge}>
                {filledCount}/{ASSET_DEFS.length} filled
              </span>
            </div>

            {assets.map((asset, i) => {
              const def = ASSET_DEFS.find(d => d.key === asset.key) || ASSET_DEFS[i];
              return (
                <div key={asset.key || asset.name} style={{ marginBottom: 14 }}>
                  <label style={S.label}>
                    <span style={{ marginRight: 6 }}>{def.icon}</span>
                    {asset.name} (PKR)
                  </label>
                  <div style={{ position: "relative" }}>
                    <input
                      type="number"
                      min="0"
                      style={{
                        ...S.input,
                        // FIX: show actual value (never empty for 0, show 0 as placeholder)
                        borderColor: asset.value > 0 ? `${def.color}66` : "var(--border)",
                      }}
                      // FIX: show "" when 0 so user can type freely; display 0 as placeholder
                      value={asset.value === 0 ? "" : asset.value}
                      onChange={(e) => handleAssetChange(i, e.target.value)}
                      placeholder="0"
                      onFocus={(e) => (e.target.style.borderColor = def.color)}
                      onBlur={(e)  => (e.target.style.borderColor = asset.value > 0 ? `${def.color}66` : "var(--border)")}
                    />
                    {/* Live formatted value hint */}
                    {asset.value > 0 && (
                      <span style={S.valueHint}>{fmtPKR(asset.value)}</span>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Debts */}
            <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
              <label style={{ ...S.label, color: "#EF4444" }}>
                <span style={{ marginRight: 6 }}>💸</span>
                Total Outstanding Debts (PKR)
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type="number"
                  min="0"
                  style={{
                    ...S.input,
                    borderColor: debts > 0 ? "rgba(239,68,68,0.5)" : "var(--border)",
                  }}
                  value={debts === 0 ? "" : debts}
                  onChange={(e) => handleDebtChange(e.target.value)}
                  placeholder="0"
                  onFocus={(e) => (e.target.style.borderColor = "#EF4444")}
                  onBlur={(e)  => (e.target.style.borderColor = debts > 0 ? "rgba(239,68,68,0.5)" : "var(--border)")}
                />
                {debts > 0 && (
                  <span style={{ ...S.valueHint, color: "#EF4444" }}>{fmtPKR(debts)}</span>
                )}
              </div>
            </div>
          </div>

          {/* Diversification health */}
          <div style={S.card}>
            <p style={S.cardTitle}>Portfolio Health</p>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
              <div style={{ flex: 1 }}>
                <div style={{ height: 8, borderRadius: 4, background: "var(--border)", overflow: "hidden" }}>
                  <div style={{
                    height: "100%", borderRadius: 4,
                    width: `${diversityScore}%`,
                    background: diversityScore >= 80 ? "#10B981"
                      : diversityScore >= 50 ? "#F59E0B"
                      : "#EF4444",
                    transition: "width 0.5s ease",
                  }} />
                </div>
              </div>
              <span style={{
                fontSize: 13, fontWeight: 700,
                color: diversityScore >= 80 ? "#10B981"
                  : diversityScore >= 50 ? "#F59E0B"
                  : "#EF4444",
              }}>
                {diversityScore}%
              </span>
            </div>
            <p style={{ fontSize: 12, color: "var(--text-3)" }}>
              {diversityScore >= 80 ? "Well diversified portfolio" :
               diversityScore >= 50 ? "Moderate diversification — add more asset types" :
               "Low diversification — consider spreading wealth across more categories"}
            </p>
          </div>
        </div>

        {/* ── RIGHT: Stats + Chart ───────────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

          {/* Stat cards row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div style={S.statCard}>
              <p style={S.statLabel}>📊 Total Assets</p>
              <p style={S.statValue}>{fmtPKR(totalAssets)}</p>
              <p style={S.statSub}>{assets.filter(a => a.value > 0).length} categories</p>
            </div>
            <div style={{
              ...S.statCard,
              borderColor: netWorth >= 0 ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)",
              background: netWorth >= 0
                ? "linear-gradient(135deg, var(--bg-card) 0%, #041A0F 100%)"
                : "linear-gradient(135deg, var(--bg-card) 0%, #1A0505 100%)",
            }}>
              <p style={S.statLabel}>💰 Net Worth</p>
              <p style={{ ...S.statValue, color: netWorth >= 0 ? "#10B981" : "#EF4444" }}>
                {fmtPKR(netWorth)}
              </p>
              <p style={S.statSub}>After {fmtPKR(debts)} debt</p>
            </div>
          </div>

          {/* Debt-to-asset ratio */}
          {totalAssets > 0 && debts > 0 && (
            <div style={{
              ...S.card,
              borderColor: "rgba(239,68,68,0.2)",
              padding: "14px 20px",
              display: "flex", alignItems: "center", gap: 12,
            }}>
              <span style={{ fontSize: 20 }}>⚠️</span>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text-1)", marginBottom: 2 }}>
                  Debt-to-Asset Ratio
                </p>
                <p style={{ fontSize: 12, color: "var(--text-3)" }}>
                  {((debts / totalAssets) * 100).toFixed(1)}% of your assets are liabilities
                </p>
              </div>
              <span style={{
                fontSize: 15, fontWeight: 700,
                color: (debts / totalAssets) > 0.5 ? "#EF4444" : "#F59E0B",
              }}>
                {((debts / totalAssets) * 100).toFixed(1)}%
              </span>
            </div>
          )}

          {/* Pie chart */}
          <div style={{ ...S.card, flex: 1 }}>
            <p style={S.cardTitle}>Asset Allocation</p>

            {chartData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={110}
                      paddingAngle={chartData.length > 1 ? 4 : 0}
                      dataKey="value"
                      stroke="none"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>

                {/* Manual legend (more readable than recharts default) */}
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "8px",
                  marginTop: 8,
                }}>
                  {chartData.map((entry) => (
                    <div key={entry.name} style={{
                      display: "flex", alignItems: "center", gap: 8,
                      padding: "6px 10px",
                      background: "var(--bg)",
                      borderRadius: 8,
                      border: "1px solid var(--border)",
                    }}>
                      <div style={{
                        width: 10, height: 10, borderRadius: "50%",
                        background: entry.fill, flexShrink: 0,
                      }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 11, color: "var(--text-2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {entry.name}
                        </p>
                        <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text-1)" }}>
                          {fmtPKR(entry.value)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              PageFactory.createEmptyState({
                emoji: "📊",
                title: "No assets yet",
                subtitle: "Enter values on the left to see your allocation chart",
              })
            )}
          </div>
          {/* FEATURE: Net Worth Trend Chart */}
          {trendData.length >= 2 && (
            <div style={S.card}>
              <p style={{ ...S.cardTitle, marginBottom: 14 }}>📈 Net Worth Trend</p>
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={trendData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 10, fill: "var(--text-3)" }}
                    axisLine={false} tickLine={false}
                  />
                  <YAxis
                    tickFormatter={v => v >= 100000 ? `${(v/100000).toFixed(0)}L` : v}
                    tick={{ fontSize: 10, fill: "var(--text-3)" }}
                    axisLine={false} tickLine={false} width={36}
                  />
                  <Tooltip
                    formatter={(v) => [fmtPKR(v), "Net Worth"]}
                    contentStyle={{ background: "#13080A", border: "1px solid rgba(224,71,76,0.3)", borderRadius: 8, color: "#fff", fontSize: 12 }}
                  />
                  <Line
                    type="monotone" dataKey="netWorth"
                    stroke="#10B981" strokeWidth={2.5}
                    dot={{ fill: "#10B981", r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
              <p style={{ fontSize: 11, color: "var(--text-3)", marginTop: 8, textAlign: "right" }}>
                Each point = one save. Save regularly to track growth.
              </p>
            </div>
          )}

        </div>

      </div>
      <style>{`@keyframes fadeIn{from{opacity:0}to{opacity:1}}`}</style>
    </div>
  );
}

const S = {
  errorBanner: {
    background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
    borderRadius: "var(--radius)", padding: "10px 16px", marginBottom: 16,
    color: "#EF4444", fontSize: 13, fontWeight: 500,
  },
  card: {
    background: "var(--bg-card)", border: "1px solid var(--border)",
    borderRadius: "var(--radius-lg)", padding: "20px", boxShadow: "var(--shadow-sm)",
  },
  statCard: {
    background: "linear-gradient(135deg, var(--bg-card) 0%, #160A0C 100%)",
    border: "1px solid var(--border)", borderRadius: "var(--radius-lg)",
    padding: "20px", boxShadow: "var(--shadow-sm)",
  },
  cardTitle: {
    fontSize: "14px", fontWeight: "600", color: "var(--text-1)",
    marginBottom: 0, fontFamily: "'Sora', sans-serif",
  },
  statLabel: {
    fontSize: "11px", fontWeight: "600", color: "var(--text-2)",
    marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.06em",
  },
  statValue: {
    fontSize: "22px", fontWeight: "800", color: "var(--text-1)",
    fontFamily: "'Sora', sans-serif", marginBottom: 4,
  },
  statSub: { fontSize: "11px", color: "var(--text-3)" },
  label: {
    fontSize: "11px", fontWeight: "600", color: "var(--text-2)",
    marginBottom: "5px", display: "block", textTransform: "uppercase",
    letterSpacing: "0.04em",
  },
  input: {
    width: "100%", padding: "10px 12px",
    background: "var(--bg-card)", border: "1.5px solid var(--border)",
    borderRadius: "var(--radius)", color: "var(--text-1)",
    fontSize: "14px", outline: "none",
    transition: "border-color 0.15s", boxSizing: "border-box",
  },
  valueHint: {
    position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
    fontSize: 11, color: "var(--text-3)", pointerEvents: "none",
    fontWeight: 500,
  },
  diversityBadge: {
    fontSize: 11, padding: "3px 10px", borderRadius: 20,
    background: "var(--bg)", border: "1px solid var(--border)",
    color: "var(--text-3)", fontWeight: 600,
  },
  btnPrimary: {
    padding: "10px 20px", color: "white", border: "none",
    borderRadius: "var(--radius-btn)", fontSize: "13px", fontWeight: "600",
    cursor: "pointer", boxShadow: "0 2px 12px var(--brand-glow)",
    transition: "background 0.3s",
  },
};
