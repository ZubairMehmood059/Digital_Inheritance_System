/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║           PATTERN 5: BRIDGE PATTERN                             ║
 * ║  File: src/patterns/bridge/ThemeBridge.js                       ║
 * ║                                                                  ║
 * ║  WHAT IT DOES:                                                   ║
 * ║  Separates the ABSTRACTION (what the UI component wants:        ║
 * ║  "give me the card background color") from the IMPLEMENTATION   ║
 * ║  (how that color is provided: CSS variable lookup vs hardcoded   ║
 * ║  hex value for dark/light mode).                                 ║
 * ║                                                                  ║
 * ║  WHY IT'S NEEDED HERE:                                           ║
 * ║  The app has a light/dark theme toggle (App_updated.jsx sets    ║
 * ║  data-theme on <html>). But pages inconsistently mix CSS vars   ║
 * ║  ("var(--bg-card)") with hardcoded colors ("#13080A", "#fff").  ║
 * ║  The bridge decouples components from the concrete theme engine. ║
 * ║                                                                  ║
 * ║  STRUCTURE:                                                      ║
 * ║  Abstraction:      ThemeToken (what token we want)              ║
 * ║  Implementor:      IThemeEngine (interface)                      ║
 * ║  ConcreteImpl A:   CSSVariableEngine (uses CSS custom props)     ║
 * ║  ConcreteImpl B:   HardcodedEngine   (fallback hex values)       ║
 * ║                                                                  ║
 * ║  WHERE IT'S APPLIED:                                             ║
 * ║  → AppLayout.jsx / Sidebar.jsx for layout colors                ║
 * ║  → EmergencyPublic.jsx HC (high-contrast) vs normal mode        ║
 * ║  → Dashboard.jsx stat cards dynamic color resolution            ║
 * ╚══════════════════════════════════════════════════════════════════╝
 */

// ── Implementor Interface (documented as comments in JS) ──────────
// IThemeEngine {
//   getColor(token: string): string
//   getBackground(token: string): string
//   getBorder(token: string): string
// }

// ── Concrete Implementor A: CSS Variable Engine ───────────────────
class CSSVariableEngine {
  // Resolves a token through the CSS custom property system
  // Falls back to a hardcoded value if the variable is not defined.
  getColor(token) {
    return `var(--${token})`;
  }

  getBackground(token) {
    return `var(--${token})`;
  }

  getBorder(token) {
    return `var(--${token})`;
  }

  // Read a CSS variable's actual computed value at runtime
  resolve(token) {
    return getComputedStyle(document.documentElement)
      .getPropertyValue(`--${token}`)
      .trim();
  }
}

// ── Concrete Implementor B: Hardcoded Dark Engine (fallback) ──────
class HardcodedDarkEngine {
  #tokens = {
    "bg":          "#0A0A0F",
    "bg-card":     "#13080A",
    "bg-1":        "#1A0A0C",
    "border":      "rgba(255,255,255,0.08)",
    "border-hover":"rgba(255,255,255,0.14)",
    "text-1":      "#FFFFFF",
    "text-2":      "rgba(255,255,255,0.55)",
    "text-3":      "rgba(255,255,255,0.28)",
    "brand":       "#E0474C",
    "brand-glow":  "rgba(224,71,76,0.35)",
    "brand-light": "rgba(224,71,76,0.12)",
    "danger":      "#EF4444",
    "success":     "#22C55E",
    "warning":     "#F59E0B",
  };

  getColor(token)      { return this.#tokens[token] ?? "#fff"; }
  getBackground(token) { return this.#tokens[token] ?? "transparent"; }
  getBorder(token)     { return this.#tokens[token] ?? "rgba(255,255,255,0.1)"; }
  resolve(token)       { return this.#tokens[token] ?? ""; }
}

// ── Concrete Implementor C: Hardcoded Light Engine ────────────────
class HardcodedLightEngine {
  #tokens = {
    "bg":          "#F8F9FA",
    "bg-card":     "#FFFFFF",
    "bg-1":        "#F1F3F5",
    "border":      "rgba(0,0,0,0.10)",
    "border-hover":"rgba(0,0,0,0.18)",
    "text-1":      "#0D0D0D",
    "text-2":      "rgba(0,0,0,0.55)",
    "text-3":      "rgba(0,0,0,0.35)",
    "brand":       "#E0474C",
    "brand-glow":  "rgba(224,71,76,0.25)",
    "brand-light": "rgba(224,71,76,0.08)",
    "danger":      "#DC2626",
    "success":     "#16A34A",
    "warning":     "#D97706",
  };

  getColor(token)      { return this.#tokens[token] ?? "#000"; }
  getBackground(token) { return this.#tokens[token] ?? "transparent"; }
  getBorder(token)     { return this.#tokens[token] ?? "rgba(0,0,0,0.1)"; }
  resolve(token)       { return this.#tokens[token] ?? ""; }
}

// ── Abstraction: ThemeBridge ──────────────────────────────────────
// The bridge decouples the abstraction from the implementor.
// Components use the bridge — they never talk to engines directly.
class ThemeBridge {
  #engine;

  constructor(engine) {
    this.#engine = engine;
  }

  // Switch the underlying engine at runtime (light ↔ dark ↔ CSS)
  setEngine(engine) {
    this.#engine = engine;
  }

  // ── Public API (what components call) ────────────────────────────

  /** Returns a CSS value for a semantic color token */
  color(token) {
    return this.#engine.getColor(token);
  }

  /** Returns a CSS value for a background token */
  bg(token) {
    return this.#engine.getBackground(token);
  }

  /** Returns a CSS value for a border token */
  border(token) {
    return this.#engine.getBorder(token);
  }

  /**
   * Builds a complete style object for a "card" component.
   * Demonstrates how the bridge abstracts style construction.
   */
  cardStyle(overrides = {}) {
    return {
      background:   this.bg("bg-card"),
      border:       `1px solid ${this.border("border")}`,
      borderRadius: "var(--radius-lg)",
      padding:      "20px",
      boxShadow:    "var(--shadow-sm)",
      ...overrides,
    };
  }

  /**
   * Builds a complete style object for the primary button.
   */
  btnPrimaryStyle(overrides = {}) {
    return {
      padding:      "10px 20px",
      background:   this.color("brand"),
      color:        "white",
      border:       "none",
      borderRadius: "var(--radius-btn)",
      fontSize:     "13px",
      fontWeight:   "600",
      cursor:       "pointer",
      boxShadow:    `0 2px 12px ${this.color("brand-glow")}`,
      ...overrides,
    };
  }

  // Expose raw engine for advanced use
  get engine() { return this.#engine; }
}

// ── Engines ───────────────────────────────────────────────────────
export const cssEngine   = new CSSVariableEngine();
export const darkEngine  = new HardcodedDarkEngine();
export const lightEngine = new HardcodedLightEngine();

// ── Default bridge — uses CSS variables (preferred) ───────────────
const themeBridge = new ThemeBridge(cssEngine);

/**
 * switchTheme — call this when the user toggles dark/light mode.
 * @param {"css"|"dark"|"light"} mode
 */
export function switchTheme(mode) {
  if (mode === "dark")  themeBridge.setEngine(darkEngine);
  else if (mode === "light") themeBridge.setEngine(lightEngine);
  else themeBridge.setEngine(cssEngine);
}

export default themeBridge;
