// src/components/layout/AppLayout.jsx
// CHANGE: Accepts theme + toggleTheme props, passes them to Sidebar
// Everything else is exactly the same as original

import { useState } from "react";
import Sidebar from "./Sidebar";

export default function AppLayout({ children, userName, theme, toggleTheme }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div style={{ display:"flex", minHeight:"100vh", background:"var(--bg)" }}>
      <Sidebar
        userName={userName}
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
        theme={theme}
        toggleTheme={toggleTheme}
      />

      {/* Mobile topbar — unchanged */}
      <div style={S.mobileBar}>
        <button onClick={() => setMobileOpen(true)} style={S.hamburger}>
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
          <div style={{ width:"22px", height:"22px", borderRadius:"6px", background:"var(--brand)", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <svg width="11" height="11" fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <span style={{ fontSize:"13px", fontWeight:"700", color:"var(--text-1)" }}>myDigitalVault</span>
        </div>
        <div style={{ width:"32px" }} />
      </div>

      <main style={S.main}>
        <div style={S.inner}>{children}</div>
      </main>
    </div>
  );
}

const S = {
  mobileBar: {
    display:"none",
    position:"fixed", top:0, left:0, right:0, height:"52px",
    background:"var(--bg-card)", borderBottom:"1px solid var(--border)",
    alignItems:"center", justifyContent:"space-between",
    padding:"0 16px", zIndex:98,
  },
  hamburger: {
    background:"transparent", border:"1px solid var(--border)",
    borderRadius:"var(--radius-sm)", padding:"6px 8px",
    color:"var(--text-2)", cursor:"pointer",
    display:"flex", alignItems:"center",
  },
  main: { flex:1, marginLeft:"220px", minHeight:"100vh" },
  inner: { maxWidth:"1040px", margin:"0 auto", padding:"28px 28px 56px" },
};