import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { signUp } from "../firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/config";

export default function Signup() {
  const [name, setName]         = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  const navigate = useNavigate();

  async function handleSignup(e) {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const result = await signUp(email, password);
      await setDoc(doc(db, "users", result.user.uid), {
        name, email,
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
        inactivityDays: 180,
        status: "active",
      });
      navigate("/dashboard");
    } catch (err) {
      const map = {
        "auth/email-already-in-use": "This email is already registered — sign in instead",
        "auth/weak-password":        "Password must be at least 6 characters",
        "auth/invalid-email":        "Invalid email format",
      };
      setError(map[err.code] || err.message);
    }
    setLoading(false);
  }

  const focusStyle  = (e) => e.target.style.borderColor = "rgba(108,71,255,0.6)";
  const blurStyle   = (e) => e.target.style.borderColor = "var(--border)";

  return (
    <div style={S.page}>
      <div style={S.wrap}>

        {/* Logo */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "32px" }}>
          <div style={S.logoIcon}>
            <svg width="24" height="24" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h1 style={{ fontSize: "18px", fontWeight: "600", color: "var(--text-primary)", marginTop: "14px" }}>myDigitalVault</h1>
          <p style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "4px" }}>Protect your digital legacy</p>
        </div>

        {/* Card */}
        <div style={S.card}>
          <div style={{ marginBottom: "20px" }}>
            <h2 style={{ fontSize: "15px", fontWeight: "600", color: "var(--text-primary)" }}>Create account</h2>
            <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "3px" }}>Get started in seconds</p>
          </div>

          {error && (
            <div style={S.errorBox}>
              <svg width="16" height="16" fill="none" stroke="var(--danger)" strokeWidth="2" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p style={{ fontSize: "12px", color: "var(--danger)" }}>{error}</p>
            </div>
          )}

          <form onSubmit={handleSignup} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div>
              <label style={S.label}>Full Name</label>
              <input style={S.input} type="text" placeholder="Ahmed Khan"
                value={name} onChange={(e) => setName(e.target.value)} required
                onFocus={focusStyle} onBlur={blurStyle} />
            </div>
            <div>
              <label style={S.label}>Email</label>
              <input style={S.input} type="email" placeholder="you@example.com"
                value={email} onChange={(e) => setEmail(e.target.value)} required
                onFocus={focusStyle} onBlur={blurStyle} />
            </div>
            <div>
              <label style={S.label}>Password</label>
              <input style={S.input} type="password" placeholder="Min. 6 characters"
                value={password} onChange={(e) => setPassword(e.target.value)} required
                onFocus={focusStyle} onBlur={blurStyle} />
            </div>
            <button type="submit" disabled={loading} style={{ ...S.btnPrimary, opacity: loading ? 0.6 : 1 }}>
              {loading ? (
                <span style={{ display: "flex", alignItems: "center", gap: "8px", justifyContent: "center" }}>
                  <span style={S.spinner} /> Creating account...
                </span>
              ) : "Create Account"}
            </button>
          </form>

          <p style={{ textAlign: "center", fontSize: "12px", color: "var(--text-muted)", marginTop: "16px" }}>
            Already have an account?{" "}
            <Link to="/login" style={{ color: "var(--brand)" }}>Sign in</Link>
          </p>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } } @keyframes slideUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }`}</style>
    </div>
  );
}

// const S = {
//   page: { minHeight: "100vh", background: "var(--bg-base)", display: "flex", alignItems: "center", justifyContent: "center", padding: "16px", backgroundImage: "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(108,71,255,0.12) 0%, transparent 60%)" },
//   wrap: { width: "100%", maxWidth: "360px", animation: "slideUp 0.35s ease forwards" },
//   logoIcon: { width: "52px", height: "52px", borderRadius: "16px", background: "linear-gradient(135deg,#6c47ff,#4f2fe0)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 24px rgba(108,71,255,0.4)" },
//   card: { background: "var(--bg-2)", border: "1px solid var(--border)", borderRadius: "16px", padding: "24px" },
//   label: { display: "block", fontSize: "11px", fontWeight: "500", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "6px" },
//   input: { width: "100%", padding: "10px 14px", background: "var(--bg-1)", border: "1px solid var(--border)", borderRadius: "10px", color: "var(--text-primary)", fontSize: "13px", outline: "none", transition: "border-color 0.2s", boxSizing: "border-box" },
//   btnPrimary: { width: "100%", padding: "11px", background: "linear-gradient(135deg,#6c47ff,#4f2fe0)", color: "white", border: "none", borderRadius: "10px", fontSize: "14px", fontWeight: "500", cursor: "pointer", boxShadow: "0 4px 20px rgba(108,71,255,0.3)", transition: "opacity 0.2s" },
//   errorBox: { display: "flex", alignItems: "flex-start", gap: "10px", padding: "12px 14px", borderRadius: "10px", background: "rgba(255,77,77,0.08)", border: "1px solid rgba(255,77,77,0.2)", marginBottom: "14px" },
//   spinner: { width: "14px", height: "14px", border: "2px solid rgba(255,255,255,0.2)", borderTop: "2px solid white", borderRadius: "50%", display: "inline-block", animation: "spin 0.8s linear infinite" },
// };

const S = {
  // Page background ab variable se dynamic hoga
  page: { 
    minHeight: "100vh", 
    background: "var(--bg)", // 'var(--bg-base)' ki jagah 'var(--bg)' use karein jo aapne index.css mein define kiya hai
    display: "flex", 
    alignItems: "center", 
    justifyContent: "center", 
    padding: "16px" 
  },
  wrap: { width: "100%", maxWidth: "360px", animation: "slideUp 0.35s ease forwards" },
  logoIcon: { width: "52px", height: "52px", borderRadius: "16px", background: "var(--brand)", display: "flex", alignItems: "center", justifyContent: "center" },
  card: { 
    background: "var(--bg-card)", // 'var(--bg-2)' ki jagah 'var(--bg-card)'
    border: "1px solid var(--border)", 
    borderRadius: "16px", 
    padding: "24px" 
  },
  label: { display: "block", fontSize: "11px", fontWeight: "500", color: "var(--text-2)", textTransform: "uppercase", marginBottom: "6px" },
  input: { 
    width: "100%", padding: "10px 14px", background: "var(--bg-1)", 
    border: "1px solid var(--border)", borderRadius: "10px", 
    color: "var(--text-1)", fontSize: "13px", outline: "none", boxSizing: "border-box" 
  },
  btnPrimary: { width: "100%", padding: "11px", background: "var(--brand)", color: "white", border: "none", borderRadius: "var(--radius-btn)", fontSize: "14px", fontWeight: "500", cursor: "pointer" },
  errorBox: { display: "flex", alignItems: "center", gap: "10px", padding: "10px", borderRadius: "10px", background: "var(--danger-bg)", border: "1px solid var(--danger)", marginBottom: "14px" },
  spinner: { width: "14px", height: "14px", border: "2px solid rgba(255,255,255,0.3)", borderTop: "2px solid white", borderRadius: "50%", animation: "spin 0.8s linear infinite" },
};