/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║           PATTERN 2: FACTORY PATTERN                            ║
 * ║  File: src/patterns/factory/PageFactory.jsx                     ║
 * ║                                                                  ║
 * ║  WHAT IT DOES:                                                   ║
 * ║  Instead of every page building its own header from scratch     ║
 * ║  (all 15 pages repeat the same pageHeader JSX structure),       ║
 * ║  PageFactory.createPageHeader(config) produces the correct      ║
 * ║  header component based on a module "type".                     ║
 * ║                                                                  ║
 * ║  WHERE IT'S APPLIED:                                             ║
 * ║  → NetWorth.jsx        (FINANCE module header)                  ║
 * ║  → MedicalPassport.jsx (HEALTH module header)                   ║
 * ║  → AIChatAssistant.jsx (ASSISTANT module header)                ║
 * ║  → UdhaarManager.jsx   (FINANCE module header)                  ║
 * ║  → TimeCapsule.jsx     (LEGACY module header)                   ║
 * ╚══════════════════════════════════════════════════════════════════╝
 */

// ── Module type → visual identity mapping ─────────────────────────
const MODULE_THEMES = {
  FINANCE: {
    eyebrowText: "FINANCE MODULE",
    gradient: "linear-gradient(135deg, #13080A 0%, #160A0C 50%, #1A0A0C 100%)",
    glowColor:  "rgba(224,71,76,0.14)",
    borderColor: "rgba(224,71,76,0.15)",
    shadowColor: "rgba(224,71,76,0.08)",
    dotColor:   "var(--brand)",
    dotShadow:  "0 0 8px rgba(224,71,76,0.7)",
  },
  HEALTH: {
    eyebrowText: "HEALTH MODULE",
    gradient: "linear-gradient(135deg, #130808 0%, #1A0808 50%, #140505 100%)",
    glowColor:  "rgba(239,68,68,0.14)",
    borderColor: "rgba(239,68,68,0.15)",
    shadowColor: "rgba(239,68,68,0.08)",
    dotColor:   "#EF4444",
    dotShadow:  "0 0 8px rgba(239,68,68,0.7)",
  },
  ASSISTANT: {
    eyebrowText: "ASSISTANT MODULE",
    gradient: "linear-gradient(135deg, #130810 0%, #1A080A 50%, #140608 100%)",
    glowColor:  "rgba(124,58,237,0.14)",
    borderColor: "rgba(124,58,237,0.15)",
    shadowColor: "rgba(124,58,237,0.08)",
    dotColor:   "#7C3AED",
    dotShadow:  "0 0 8px rgba(124,58,237,0.7)",
  },
  LEGACY: {
    eyebrowText: "LEGACY MODULE",
    gradient: "linear-gradient(135deg, #0D0816 0%, #130820 50%, #0A0A14 100%)",
    glowColor:  "rgba(139,92,246,0.14)",
    borderColor: "rgba(139,92,246,0.15)",
    shadowColor: "rgba(139,92,246,0.08)",
    dotColor:   "#8B5CF6",
    dotShadow:  "0 0 8px rgba(139,92,246,0.7)",
  },
  AI: {
    eyebrowText: "AI MODULE",
    gradient: "linear-gradient(135deg, #130810 0%, #1A080A 50%, #140608 100%)",
    glowColor:  "rgba(224,71,76,0.14)",
    borderColor: "rgba(224,71,76,0.15)",
    shadowColor: "rgba(224,71,76,0.08)",
    dotColor:   "var(--brand)",
    dotShadow:  "0 0 8px rgba(224,71,76,0.7)",
  },
};

// ── Factory class ─────────────────────────────────────────────────
class PageFactory {
  /**
   * createPageHeader — produces a styled page header React element.
   *
   * @param {object} config
   * @param {string} config.moduleType   - "FINANCE" | "HEALTH" | "ASSISTANT" | "LEGACY" | "AI"
   * @param {string} config.title        - Main heading text
   * @param {string} config.subtitle     - Subheading / description
   * @param {React.ReactNode} [config.action] - Optional right-side button/element
   * @returns {JSX.Element}
   */
  static createPageHeader({ moduleType = "FINANCE", title, subtitle, action }) {
    const theme = MODULE_THEMES[moduleType] ?? MODULE_THEMES.FINANCE;

    return (
      <div style={{
        position: "relative", overflow: "hidden",
        background: theme.gradient,
        border: `1px solid ${theme.borderColor}`,
        borderRadius: "var(--radius-xl)", padding: "28px 24px 24px",
        marginBottom: "28px", display: "flex",
        alignItems: "flex-end", justifyContent: "space-between",
        flexWrap: "wrap", gap: "16px",
        boxShadow: `0 4px 24px ${theme.shadowColor}`,
      }}>
        {/* Ambient glow orb */}
        <div style={{
          position: "absolute", top: -60, left: -40,
          width: 260, height: 260,
          background: `radial-gradient(circle, ${theme.glowColor} 0%, transparent 70%)`,
          borderRadius: "50%", pointerEvents: "none",
        }} />

        {/* Text block */}
        <div style={{ position: "relative", zIndex: 1 }}>
          {/* Eyebrow row */}
          <div style={{ display: "flex", alignItems: "center", gap: "7px", marginBottom: "10px" }}>
            <div style={{
              width: 6, height: 6, borderRadius: "50%",
              background: theme.dotColor,
              boxShadow: theme.dotShadow,
            }} />
            <span style={{
              fontSize: "9px", fontWeight: "700",
              color: theme.dotColor,
              letterSpacing: "0.2em", textTransform: "uppercase",
            }}>
              {theme.eyebrowText}
            </span>
          </div>

          {/* Heading */}
          <h1 style={{
            fontSize: "26px", fontWeight: "800",
            fontFamily: "'Sora', sans-serif",
            background: "linear-gradient(135deg, #FFFFFF 40%, rgba(224,71,76,0.8) 100%)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            letterSpacing: "-0.03em", margin: 0,
          }}>
            {title}
          </h1>

          {/* Subtitle */}
          <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.35)", marginTop: "5px" }}>
            {subtitle}
          </p>
        </div>

        {/* Optional action slot */}
        {action && (
          <div style={{ position: "relative", zIndex: 1 }}>
            {action}
          </div>
        )}
      </div>
    );
  }

  /**
   * createLoadingState — produces a consistent loading skeleton.
   * @param {string} [message]
   * @returns {JSX.Element}
   */
  static createLoadingState(message = "Loading...") {
    return (
      <div style={{
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: "64px", gap: "12px",
      }}>
        <div style={{
          width: 32, height: 32,
          border: "2.5px solid rgba(224,71,76,0.2)",
          borderTop: "2.5px solid var(--brand)",
          borderRadius: "50%",
          animation: "spin 0.9s linear infinite",
        }} />
        <p style={{ color: "var(--text-3)", fontSize: "13px" }}>{message}</p>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  /**
   * createEmptyState — produces a consistent empty-state block.
   * @param {object} config
   * @param {string} config.emoji
   * @param {string} config.title
   * @param {string} config.subtitle
   * @param {React.ReactNode} [config.action]
   * @returns {JSX.Element}
   */
  static createEmptyState({ emoji = "📭", title, subtitle, action }) {
    return (
      <div style={{
        background: "var(--bg-card)", border: "1px solid var(--border)",
        borderRadius: "var(--radius-lg)", padding: "56px",
        textAlign: "center", boxShadow: "var(--shadow-sm)",
      }}>
        <p style={{ fontSize: "40px", marginBottom: "12px" }}>{emoji}</p>
        <p style={{ fontSize: "15px", fontWeight: "600", color: "var(--text-1)", marginBottom: "6px" }}>
          {title}
        </p>
        <p style={{ fontSize: "13px", color: "var(--text-3)", marginBottom: action ? "20px" : 0 }}>
          {subtitle}
        </p>
        {action}
      </div>
    );
  }
}

export default PageFactory;
