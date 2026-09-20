/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║           PATTERN 6: COMPOSITE PATTERN                          ║
 * ║  File: src/patterns/composite/SidebarComposite.jsx              ║
 * ║                                                                  ║
 * ║  WHAT IT DOES:                                                   ║
 * ║  Treats individual nav items and nav groups uniformly through   ║
 * ║  a component tree. Both leaves (NavItem) and composites         ║
 * ║  (NavGroup containing many NavItems) share the same render()    ║
 * ║  interface. The Sidebar builds its entire nav tree from this.   ║
 * ║                                                                  ║
 * ║  CLASSIC COMPOSITE STRUCTURE:                                    ║
 * ║  Component (interface) — render()                               ║
 * ║  ├── Leaf: NavItem      — a single nav button                   ║
 * ║  └── Composite: NavGroup — contains NavItems + a group label    ║
 * ║                                                                  ║
 * ║  WHERE IT'S APPLIED:                                             ║
 * ║  → Sidebar.jsx: the NAV array is now built using NavGroup and   ║
 * ║    NavItem classes. Sidebar renders tree.render() instead of    ║
 * ║    mapping raw objects. Adding a new group or item requires     ║
 * ║    only adding to the tree — no layout changes needed.          ║
 * ╚══════════════════════════════════════════════════════════════════╝
 */

import React from "react";

// ── SVG Icon helper (shared by all nav items) ────────────────────
function NavIcon({ d, type, size = 15 }) {
  if (type === "rect") {
    return (
      <svg width={size} height={size} fill="none" stroke="currentColor"
        strokeWidth="1.75" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
        <rect x="3"  y="3"  width="7" height="7" rx="1" />
        <rect x="14" y="3"  width="7" height="7" rx="1" />
        <rect x="3"  y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    );
  }
  return (
    <svg width={size} height={size} fill="none" stroke="currentColor"
      strokeWidth="1.75" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
      <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    </svg>
  );
}

// ═══════════════════════════════════════════════════════════════════
// LEAF — NavItem
// Renders a single navigation button.
// ═══════════════════════════════════════════════════════════════════
class NavItem {
  /**
   * @param {object} config
   * @param {string} config.path
   * @param {string} config.label
   * @param {string} [config.d]      — SVG path data
   * @param {string} [config.type]   — "rect" for grid icon
   * @param {string} [config.badge]  — "New" badge text
   */
  constructor({ path, label, d, type, badge }) {
    this.path  = path;
    this.label = label;
    this.d     = d;
    this.type  = type;
    this.badge = badge;
  }

  /**
   * render — returns JSX for this nav item.
   * @param {object} props
   * @param {string}   props.currentPath — current router pathname
   * @param {function} props.navigate    — react-router navigate
   * @param {function} props.onClose     — mobile sidebar close
   */
  render({ currentPath, navigate, onClose }) {
    const active = currentPath === this.path;

    function go() {
      navigate(this.path);
      if (onClose) onClose();
    }

    const itemStyle = {
      display: "flex", alignItems: "center", gap: "9px",
      width: "100%", padding: "7px 12px",
      borderRadius: "var(--radius-btn)", cursor: "pointer",
      color: active ? "rgba(255,255,255,0.88)" : "rgba(255,255,255,0.38)",
      fontSize: "13px",
      fontWeight: active ? "500" : "400",
      marginBottom: "1px",
      background: active ? "rgba(248,113,113,0.08)" : "transparent",
      border: "none",
      boxShadow: active ? "inset 0 0 0 1px rgba(248,113,113,0.12)" : "none",
      transition: "all 0.15s",
      position: "relative",
      letterSpacing: "0.01em",
    };

    const badgeStyle = {
      fontSize: "9px", padding: "2px 7px", borderRadius: "4px",
      background: "rgba(248,113,113,0.12)", color: "#F87171",
      fontWeight: "700", letterSpacing: "0.04em",
      border: "1px solid rgba(248,113,113,0.18)",
    };

    return (
      <button
        key={this.path}
        onClick={go.bind(this)}
        style={itemStyle}
        onMouseEnter={e => {
          if (!active) {
            e.currentTarget.style.background = "rgba(255,255,255,0.06)";
            e.currentTarget.style.color = "rgba(255,255,255,0.75)";
          }
        }}
        onMouseLeave={e => {
          if (!active) {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "rgba(255,255,255,0.38)";
          }
        }}
      >
        {/* Active left border accent */}
        {active && (
          <div style={{
            position: "absolute", left: 0, top: "50%",
            transform: "translateY(-50%)",
            width: "3px", height: "16px", borderRadius: "0 2px 2px 0",
            background: "linear-gradient(to bottom, #F87171, #E0474C)",
            boxShadow: "0 0 8px rgba(248,113,113,0.5)",
          }} />
        )}

        <span style={{ color: active ? "#F87171" : "inherit", transition: "color 0.15s" }}>
          <NavIcon d={this.d} type={this.type} />
        </span>

        <span style={{ flex: 1, textAlign: "left" }}>{this.label}</span>

        {this.badge && (
          <span style={badgeStyle}>{this.badge}</span>
        )}
      </button>
    );
  }
}

// ═══════════════════════════════════════════════════════════════════
// COMPOSITE — NavGroup
// Renders a labeled group containing multiple NavItems.
// ═══════════════════════════════════════════════════════════════════
class NavGroup {
  /**
   * @param {string} groupLabel — e.g. "Finance", "Legacy"
   */
  constructor(groupLabel) {
    this.groupLabel = groupLabel;
    this.children   = []; // NavItem[] — the leaf nodes
  }

  /** Add a NavItem (leaf) to this group */
  add(navItem) {
    this.children.push(navItem);
    return this; // fluent
  }

  /**
   * render — renders the group label + all child NavItems.
   * Delegates render() to each child — uniform interface.
   */
  render({ currentPath, navigate, onClose }) {
    return (
      <div key={this.groupLabel} style={{ marginBottom: "22px" }}>
        {/* Group label */}
        <p style={{
          fontSize: "9px", fontWeight: "700",
          color: "rgba(255,255,255,0.22)",
          textTransform: "uppercase", letterSpacing: "0.12em",
          marginBottom: "4px", paddingLeft: "12px",
        }}>
          {this.groupLabel}
        </p>

        {/* Render each child leaf */}
        {this.children.map(child =>
          <React.Fragment key={child.path}>
            {child.render({ currentPath, navigate, onClose })}
          </React.Fragment>
        )}
      </div>
    );
  }
}

// ═══════════════════════════════════════════════════════════════════
// ROOT COMPOSITE — NavTree
// The top-level composite that holds all NavGroups.
// ═══════════════════════════════════════════════════════════════════
class NavTree {
  constructor() {
    this.groups = [];
  }

  addGroup(navGroup) {
    this.groups.push(navGroup);
    return this;
  }

  render({ currentPath, navigate, onClose }) {
    return (
      <nav style={{ flex: 1, padding: "10px 10px", overflowY: "auto" }}>
        {this.groups.map(group =>
          <React.Fragment key={group.groupLabel}>
            {group.render({ currentPath, navigate, onClose })}
          </React.Fragment>
        )}
      </nav>
    );
  }
}

// ═══════════════════════════════════════════════════════════════════
// BUILD THE NAV TREE
// This is the single source of truth for sidebar navigation.
// To add a new page: add a NavItem to the relevant NavGroup.
// ═══════════════════════════════════════════════════════════════════
const navTree = new NavTree();

// ── Workspace group ───────────────────────────────────────────────
const workspace = new NavGroup("Workspace");
workspace
  .add(new NavItem({ path: "/dashboard",       label: "Overview",          type: "rect" }))
  .add(new NavItem({ path: "/vault",            label: "Vault",             d: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" }))
  .add(new NavItem({ path: "/nominees",         label: "Trusted Contacts",  d: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" }))
  .add(new NavItem({ path: "/documents",        label: "Documents",         d: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" }))
  .add(new NavItem({ path: "/medical-passport", label: "Medical Passport",  d: "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z", badge: "New" }));

// ── Finance group ─────────────────────────────────────────────────
const finance = new NavGroup("Finance");
finance
  .add(new NavItem({ path: "/net-worth",    label: "Asset Tracker",   d: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z", badge: "New" }))
  .add(new NavItem({ path: "/udhaar",       label: "Udhaar Manager",  d: "M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" }))
  .add(new NavItem({ path: "/subscriptions",label: "Subscriptions",   d: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" }))
  .add(new NavItem({ path: "/bills",        label: "Utility Bills",   d: "M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" }));

// ── Assistant group ───────────────────────────────────────────────
const assistant = new NavGroup("Assistant");
assistant
  .add(new NavItem({ path: "/ai-assistant", label: "AI Life Advisor", d: "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z", badge: "New" }))
  .add(new NavItem({ path: "/time-capsule", label: "Time Capsule",    d: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" }));

// ── Legacy group ──────────────────────────────────────────────────
const legacy = new NavGroup("Legacy");
legacy
  .add(new NavItem({ path: "/inheritance",    label: "Inheritance",     d: "M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" }))
  .add(new NavItem({ path: "/ai-letter",      label: "Farewell Letter", d: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" }))
  .add(new NavItem({ path: "/emergency-card", label: "Emergency Card",  d: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" }))
  .add(new NavItem({ path: "/legacy-trigger", label: "Legacy Trigger",  d: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" }));

// Assemble the full tree
navTree
  .addGroup(workspace)
  .addGroup(finance)
  .addGroup(assistant)
  .addGroup(legacy);

// ── Export tree and classes for use in Sidebar ────────────────────
export { NavItem, NavGroup, NavTree, navTree };
export default navTree;
