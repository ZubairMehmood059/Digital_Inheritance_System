// src/components/layout/Sidebar.jsx
import { useNavigate, useLocation } from "react-router-dom";
import { logOut } from "../../firebase/auth";
// ── PATTERN 6: Composite — nav tree built from NavGroup + NavItem ─
import navTree from "../../patterns/composite/SidebarComposite";

function ThemeToggleRow({ theme, toggleTheme }) {
  const isDark = theme === "dark";
  return (
    <button
      onClick={toggleTheme}
      style={{
        display:"flex", alignItems:"center", gap:"10px",
        width:"100%", padding:"8px 12px",
        borderRadius:"var(--radius-btn)", cursor:"pointer",
        color:"rgba(255,255,255,0.4)", fontSize:"12px", fontWeight:"500",
        background:"transparent", border:"none",
        transition:"all 0.15s", letterSpacing:"0.02em",
      }}
      onMouseEnter={e => e.currentTarget.style.color = "rgba(255,255,255,0.7)"}
      onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.4)"}
    >
      {/* Pill toggle */}
      <div style={{ width:"32px", height:"18px", borderRadius:"9px", background: isDark ? "var(--brand)" : "rgba(255,255,255,0.15)", position:"relative", transition:"background 0.3s", flexShrink:0, border:"1px solid rgba(255,255,255,0.1)" }}>
        <div style={{ position:"absolute", top:"2px", left: isDark ? "16px" : "2px", width:"12px", height:"12px", borderRadius:"50%", background:"white", transition:"left 0.25s ease", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"7px", boxShadow:"0 1px 4px rgba(0,0,0,0.3)" }}>
          {isDark ? "🌙" : "☀️"}
        </div>
      </div>
      <span>{isDark ? "Dark mode" : "Light mode"}</span>
    </button>
  );
}

export default function Sidebar({ userName, mobileOpen, onClose, theme, toggleTheme }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  async function handleLogout() {
    await logOut();
    navigate("/login");
  }

  return (
    <>
      {mobileOpen && (
        <div
          className="mobile-nav-backdrop"
          onClick={onClose}
          role="presentation"
          style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.6)", zIndex:99, backdropFilter:"blur(4px)" }}
        />
      )}
      <aside className={`app-sidebar${mobileOpen ? " is-open" : ""}`} style={{ ...S.sidebar, ...(mobileOpen ? { transform:"translateX(0)" } : {}) }}>

        {/* Ambient glow */}
        <div style={S.sidebarGlow} />

        {/* Logo */}
        <div style={S.logo}>
          <div style={S.logoMark}>
            <svg width="16" height="16" fill="none" stroke="white" strokeWidth="2.2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div>
            <p style={S.logoTitle}>myDigitalVault</p>
            <p style={S.logoSub}>Your Digital Legacy</p>
          </div>
        </div>

        {/* Nav — PATTERN 6: Composite renders the full nav tree */}
        {navTree.render({ currentPath: pathname, navigate, onClose })}

        {/* Theme toggle */}
        <div style={{ padding:"6px 10px", borderTop:"1px solid rgba(255,255,255,0.06)" }}>
          <ThemeToggleRow theme={theme} toggleTheme={toggleTheme} />
        </div>

        {/* User section */}
        <div style={{ padding:"10px", borderTop:"1px solid rgba(255,255,255,0.06)" }}>
          <div style={S.userBox}>
            <div style={S.avatar}>{(userName || "U").charAt(0).toUpperCase()}</div>
            <div style={{ flex:1, minWidth:0 }}>
              <p style={S.userName}>{userName || "User"}</p>
              <p style={S.userPlan}>Free plan</p>
            </div>
            <button onClick={handleLogout} title="Sign out"
              style={S.logoutBtn}
              onMouseEnter={e => { e.currentTarget.style.color = "#F87171"; e.currentTarget.style.background = "rgba(248,113,113,0.1)"; }}
              onMouseLeave={e => { e.currentTarget.style.color = "rgba(255,255,255,0.25)"; e.currentTarget.style.background = "transparent"; }}
            >
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

const S = {
  sidebar: {
    position:"fixed", left:0, top:0,
    width:"220px", height:"100vh",
    background:"rgba(6,7,12,0.96)",
    backdropFilter:"blur(24px)",
    WebkitBackdropFilter:"blur(24px)",
    borderRight:"1px solid rgba(255,255,255,0.07)",
    display:"flex", flexDirection:"column",
    zIndex:100,
    transition:"transform 0.25s ease",
    overflow:"hidden",
  },
  sidebarGlow: {
    position:"absolute", top:-60, left:-60,
    width:200, height:200,
    background:"radial-gradient(circle, rgba(224,71,76,0.08) 0%, transparent 70%)",
    borderRadius:"50%", pointerEvents:"none",
  },
  logo: {
    display:"flex", alignItems:"center", gap:"10px",
    padding:"18px 14px 16px",
    borderBottom:"1px solid rgba(255,255,255,0.06)",
    position:"relative", zIndex:1,
  },
  logoMark: {
    width:"34px", height:"34px", borderRadius:"10px",
    background:"linear-gradient(135deg, #E0474C 0%, #9B1C1C 100%)",
    display:"flex", alignItems:"center", justifyContent:"center",
    flexShrink:0,
    boxShadow:"0 4px 16px rgba(224,71,76,0.4), inset 0 1px 0 rgba(255,255,255,0.15)",
  },
  logoTitle: {
    fontSize:"13px", fontWeight:"700", color:"rgba(255,255,255,0.90)",
    letterSpacing:"-0.01em", fontFamily:"'Sora', sans-serif",
  },
  logoSub: {
    fontSize:"9px", color:"rgba(255,255,255,0.28)",
    marginTop:"2px", letterSpacing:"0.08em", textTransform:"uppercase",
  },
  groupLabel: {
    fontSize:"9px", fontWeight:"700", color:"rgba(255,255,255,0.22)",
    textTransform:"uppercase", letterSpacing:"0.12em",
    marginBottom:"4px", paddingLeft:"12px",
  },
  navItem: {
    display:"flex", alignItems:"center", gap:"9px",
    width:"100%", padding:"7px 12px",
    borderRadius:"var(--radius-btn)", cursor:"pointer",
    color:"rgba(255,255,255,0.38)", fontSize:"13px", fontWeight:"400",
    marginBottom:"1px", background:"transparent", border:"none",
    transition:"all 0.15s", position:"relative",
    letterSpacing:"0.01em",
  },
  navActive: {
    color:"rgba(255,255,255,0.88)", fontWeight:"500",
    background:"rgba(248,113,113,0.08)",
    boxShadow:"inset 0 0 0 1px rgba(248,113,113,0.12)",
  },
  activeBorder: {
    position:"absolute", left:0, top:"50%", transform:"translateY(-50%)",
    width:"3px", height:"16px", borderRadius:"0 2px 2px 0",
    background:"linear-gradient(to bottom, #F87171, #E0474C)",
    boxShadow:"0 0 8px rgba(248,113,113,0.5)",
  },
  badge: {
    fontSize:"9px", padding:"2px 7px", borderRadius:"4px",
    background:"rgba(248,113,113,0.12)", color:"#F87171",
    fontWeight:"700", letterSpacing:"0.04em",
    border:"1px solid rgba(248,113,113,0.18)",
  },
  userBox: {
    display:"flex", alignItems:"center", gap:"8px",
    padding:"8px 10px", borderRadius:"var(--radius-sm)",
    background:"rgba(255,255,255,0.04)",
    border:"1px solid rgba(255,255,255,0.07)",
  },
  avatar: {
    width:"28px", height:"28px", borderRadius:"50%",
    background:"linear-gradient(135deg, #E0474C, #7C3AED)",
    display:"flex", alignItems:"center", justifyContent:"center",
    fontSize:"11px", fontWeight:"700", color:"white", flexShrink:0,
    boxShadow:"0 0 0 2px rgba(224,71,76,0.3)",
  },
  userName: {
    fontSize:"12px", fontWeight:"600", color:"rgba(255,255,255,0.78)",
    overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
  },
  userPlan: {
    fontSize:"10px", color:"rgba(255,255,255,0.25)", marginTop:"1px",
  },
  logoutBtn: {
    background:"transparent", border:"none",
    color:"rgba(255,255,255,0.25)", cursor:"pointer",
    padding:"5px", borderRadius:"var(--radius-sm)",
    display:"flex", alignItems:"center",
    transition:"all 0.15s",
  },
};