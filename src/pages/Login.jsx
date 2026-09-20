import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { signIn, signInGoogle } from "../firebase/auth";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleLogin(e) {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      await signIn(email, password);
      navigate("/dashboard");
    } catch (err) {
      const map = {
        "auth/user-not-found": "No account found with this email",
        "auth/wrong-password": "Incorrect password",
        "auth/invalid-credential": "Invalid email or password",
        "auth/too-many-requests": "Too many attempts — try again later",
      };
      setError(map[err.code] || "Login failed — check your credentials");
    }
    setLoading(false);
  }

  async function handleGoogle() {
    setError(""); setLoading(true);
    try { await signInGoogle(); navigate("/dashboard"); }
    catch { setError("Google sign-in failed"); }
    setLoading(false);
  }

  return (
    <div style={S.page}>
      <div style={S.wrap}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div style={S.logoIcon}>
            <svg width="20" height="20" fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h1 style={{ fontSize: "18px", fontWeight: "700", color: "var(--text-1)", marginTop: "12px", letterSpacing: "-0.02em" }}>myDigitalVault</h1>
          <p style={{ fontSize: "13px", color: "var(--text-3)", marginTop: "3px" }}>Your digital legacy, secured</p>
        </div>

        {/* Card */}
        <div style={S.card}>
          <h2 style={{ fontSize: "16px", fontWeight: "600", color: "var(--text-1)", marginBottom: "4px" }}>Welcome back</h2>
          <p style={{ fontSize: "13px", color: "var(--text-3)", marginBottom: "20px" }}>Sign in to your account</p>

          {error && (
            <div style={S.errorBox}>
              <svg width="14" height="14" fill="none" stroke="var(--danger)" strokeWidth="2" viewBox="0 0 24 24" style={{ flexShrink: 0, marginTop: "1px" }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p style={{ fontSize: "12px", color: "var(--danger)" }}>{error}</p>
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div>
              <label style={S.label}>Email address</label>
              <input style={S.input} type="email" placeholder="you@example.com"
                value={email} onChange={e => setEmail(e.target.value)} required
                onFocus={e => e.target.style.borderColor = "var(--brand)"}
                onBlur={e => e.target.style.borderColor = "var(--border)"} />
            </div>
            <div>
              <label style={S.label}>Password</label>
              <input style={S.input} type="password" placeholder="••••••••"
                value={password} onChange={e => setPassword(e.target.value)} required
                onFocus={e => e.target.style.borderColor = "var(--brand)"}
                onBlur={e => e.target.style.borderColor = "var(--border)"} />
            </div>
            <button type="submit" disabled={loading} style={{ ...S.btnPrimary, opacity: loading ? 0.7 : 1 }}>
              {loading ? <Spinner /> : "Sign In"}
            </button>
          </form>

          <div style={S.divider}>
            <div style={S.divLine} /><span style={S.divText}>or</span><div style={S.divLine} />
          </div>

          <button color="primary" onClick={handleGoogle} disabled={loading} style={S.btnGoogle}
            onMouseEnter={e => e.currentTarget.style.borderColor = "var(--brand)"}
            onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border)"}>
            <GoogleIcon />
            Continue with Google
          </button>

          <p style={{ textAlign: "center", fontSize: "13px", color: "var(--text-3)", marginTop: "20px" }}>
            No account?{" "}
            <Link to="/signup" style={{ color: "var(--brand)", fontWeight: "500" }}>Create one free</Link>
          </p>
        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

function Spinner() {
  return (
    <span style={{ display: "flex", alignItems: "center", gap: "8px", justifyContent: "center" }}>
      <span style={{ width: "14px", height: "14px", border: "2px solid rgba(255,255,255,0.3)", borderTop: "2px solid white", borderRadius: "50%", animation: "spin 0.8s linear infinite", display: "inline-block" }} />
      Signing in...
    </span>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

// const S = {
//   page:   { minHeight:"100vh", background:"var(--bg)", display:"flex", alignItems:"center", justifyContent:"center", padding:"16px" },
//   wrap:   { width:"100%", maxWidth:"380px", animation:"slideUp 0.3s ease" },
//   logoIcon: { width:"48px", height:"48px", borderRadius:"14px", background:"var(--brand)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto", boxShadow:"0 4px 16px rgba(91,103,241,0.35)" },
//   card:   { background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:"var(--radius-xl)", padding:"28px", boxShadow:"var(--shadow-md)" },
//   label:  { display:"block", fontSize:"12px", fontWeight:"500", color:"var(--text-2)", marginBottom:"6px" },
//   input:  { width:"100%", padding:"10px 12px", background:"white", border:"1.5px solid var(--border)", borderRadius:"var(--radius)", color:"var(--text-1)", fontSize:"13px", outline:"none", transition:"border-color 0.15s", boxSizing:"border-box" },
//   btnPrimary: { width:"100%", padding:"11px", background:"var(--brand)", color:"white", border:"none", borderRadius:"var(--radius)", fontSize:"14px", fontWeight:"600", cursor:"pointer", transition:"opacity 0.15s", boxShadow:"0 2px 8px rgba(91,103,241,0.3)" },
//   btnGoogle:  { display:"flex", alignItems:"center", justifyContent:"center", gap:"10px", width:"100%", padding:"10px", background:"white", border:"1.5px solid var(--border)", borderRadius:"var(--radius)", color:"var(--text-1)", fontSize:"13px", fontWeight:"500", cursor:"pointer", transition:"border-color 0.15s" },
//   errorBox:   { display:"flex", alignItems:"flex-start", gap:"8px", padding:"10px 12px", borderRadius:"var(--radius)", background:"var(--danger-bg)", border:"1px solid #FCA5A5", marginBottom:"14px" },
//   divider:    { display:"flex", alignItems:"center", gap:"12px", margin:"18px 0" },
//   divLine:    { flex:1, height:"1px", background:"var(--border)" },
//   divText:    { fontSize:"11px", color:"var(--text-3)", fontWeight:"500" },
// };

const S = {
  page: { minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" },
  wrap: { width: "100%", maxWidth: "380px", animation: "slideUp 0.3s ease" },
  logoIcon: { width: "48px", height: "48px", borderRadius: "14px", background: "var(--brand)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto", boxShadow: "0 4px 16px rgba(91,103,241,0.35)" },
  card: { background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius-xl)", padding: "28px", boxShadow: "var(--shadow-md)" },
  label: { display: "block", fontSize: "12px", fontWeight: "500", color: "var(--text-2)", marginBottom: "6px" },

  // FIX: "white" background ko "var(--bg-1)" se replace kiya hai
  input: { width: "100%", padding: "10px 12px", background: "var(--bg-1)", border: "1.5px solid var(--border)", borderRadius: "var(--radius)", color: "var(--text-1)", fontSize: "13px", outline: "none", transition: "border-color 0.15s", boxSizing: "border-box" },

  btnPrimary: { width: "100%", padding: "11px", background: "var(--brand)", color: "white", border: "none", borderRadius: "var(--radius-btn)", fontSize: "14px", fontWeight: "600", cursor: "pointer", transition: "opacity 0.15s", boxShadow: "0 2px 8px rgba(91,103,241,0.3)" },

  // FIX: Google button ka background bhi ab "var(--bg-1)" use karega
  btnGoogle: { display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", width: "100%", padding: "10px", background: "var(--bg-1)", border: "1.5px solid var(--border)", borderRadius: "var(--radius-btn)", color: "var(--text-1)", fontSize: "13px", fontWeight: "500", cursor: "pointer", transition: "border-color 0.15s" },

  // FIX: Hardcoded border color ko dynamic "var(--danger)" kiya hai
  errorBox: { display: "flex", alignItems: "flex-start", gap: "8px", padding: "10px 12px", borderRadius: "var(--radius)", background: "var(--danger-bg)", border: "1px solid var(--danger)", marginBottom: "14px" },

  divider: { display: "flex", alignItems: "center", gap: "12px", margin: "18px 0" },
  divLine: { flex: 1, height: "1px", background: "var(--border)" },
  divText: { fontSize: "11px", color: "var(--text-3)", fontWeight: "500" },
};