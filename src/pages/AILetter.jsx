import { useState } from "react";
import { getUserData } from "../firebase/db";

export default function AILetter() {
  const [notes, setNotes]   = useState("");
  const [letter, setLetter] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState("");
  const [copied, setCopied] = useState(false);

  async function generateLetter() {
    if (!notes.trim()) { setError("Write something about yourself first"); return; }
    setLoading(true); setError(""); setLetter("");
    try {
      const userData = await getUserData();
      const userName = userData?.name || "A Beloved Person";
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${import.meta.env.VITE_GROQ_API_KEY}` },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          max_tokens: 1000,
          messages: [{ role: "user", content: `You are helping write a deeply emotional farewell letter.\nUser's name: ${userName}\nTheir notes: ${notes}\nWrite a heartfelt farewell letter that:\n- Is in Urdu/English mix (Hinglish style)\n- Is addressed to nominees/family\n- Has 3-4 paragraphs\n- Has an emotional but hopeful tone\n- Starts with "Mere Aziz Priyajano"\n- Ends with "${userName}"\nWrite only the letter, no explanation.` }],
        }),
      });
      const data = await response.json();
      if (!response.ok) { setError(data.error?.message || "API error"); setLoading(false); return; }
      setLetter(data.choices[0].message.content);
    } catch {
      setError("Network error — check your connection");
    }
    setLoading(false);
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(letter);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div style={{ animation: "fadeIn 0.3s ease" }}>

      {/* Header */}
      <div style={S.pageHeader}>
        <div style={S.pageHeaderGlow} />
        <div style={{ position:"relative", zIndex:1 }}>
          <div style={S.pageEyebrow}>
            <div style={S.eyebrowDot} />
            <span style={S.eyebrowText}>AI MODULE</span>
          </div>
          <h1 style={S.heading}>AI Farewell Letter</h1>
          <p style={S.subheading}>Write something about yourself — AI will craft an emotional letter for your family</p>
        </div>
      </div>

      {/* Input card */}
      <div style={{ ...S.card, marginBottom: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
          <div style={{ width: "38px", height: "38px", borderRadius: "10px", background: "var(--brand-light)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", flexShrink: 0 }}>🤖</div>
          <div>
            <p style={{ fontSize: "14px", fontWeight: "600", color: "var(--text-primary)", marginBottom: "2px" }}>Your Thoughts</p>
            <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>Love for family, advice, special memories, anything from the heart</p>
          </div>
        </div>

        <textarea
          style={{ ...S.input, height: "140px", resize: "none", marginBottom: "14px" }}
          placeholder="I want to tell my daughter that her every happiness is my prayer... I want my son to know that I am always proud of him..."
          value={notes}
          onChange={e => setNotes(e.target.value)}
          onFocus={e => e.target.style.borderColor = "var(--brand)"}
          onBlur={e => e.target.style.borderColor = "var(--border)"}
        />

        {error && (
          <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", padding: "12px 14px", borderRadius: "10px", background: "rgba(255,77,77,0.08)", border: "1px solid rgba(255,77,77,0.2)", marginBottom: "14px" }}>
            <p style={{ fontSize: "12px", color: "var(--danger)" }}>⚠ {error}</p>
          </div>
        )}

        <button onClick={generateLetter} disabled={loading} style={{ ...S.btnPrimary, width: "100%", opacity: loading ? 0.7 : 1 }}>
          {loading ? (
            <span style={{ display: "flex", alignItems: "center", gap: "8px", justifyContent: "center" }}>
              <span style={S.spinner} /> AI is writing your letter...
            </span>
          ) : "⚡ Generate Letter"}
        </button>
      </div>

      {/* Generated letter */}
      {letter && (
        <div style={{ ...S.card, borderColor: "var(--brand-glow)", animation: "slideUp 0.35s ease" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: "16px", borderBottom: "1px solid var(--border)", marginBottom: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--brand)", animation: "pulseSlow 3s infinite" }} />
              <p style={{ fontSize: "14px", fontWeight: "600", color: "var(--text-primary)" }}>Your Farewell Letter</p>
            </div>
            <button onClick={handleCopy}
              style={{ padding: "6px 14px", background: "transparent", border: `1px solid ${copied ? "rgba(0,214,143,0.4)" : "var(--border)"}`, borderRadius: "var(--radius-btn)", color: copied ? "var(--success)" : "var(--text-muted)", fontSize: "12px", cursor: "pointer", transition: "all 0.2s" }}>
              {copied ? "✓ Copied" : "Copy"}
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {letter.split("\n").filter(p => p.trim()).map((para, i) => (
              <p key={i} style={{ fontSize: "14px", color: "var(--text-secondary)", lineHeight: "1.8", fontFamily: "Georgia, serif" }}>{para}</p>
            ))}
          </div>

          <div style={{ marginTop: "20px", padding: "10px 14px", borderRadius: "10px", background: "var(--bg-3)", border: "1px solid var(--border)" }}>
            <p style={{ fontSize: "11px", color: "var(--text-muted)" }}>ℹ This letter will be delivered to your nominees when your legacy is triggered</p>
          </div>
        </div>
      )}

      <style>{`@keyframes fadeIn{from{opacity:0}to{opacity:1}} @keyframes slideUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}} @keyframes spin{to{transform:rotate(360deg)}} @keyframes pulseSlow{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
    </div>
  );
}

const S = {
  pageHeader: {
    position:"relative", overflow:"hidden",
    background:"linear-gradient(135deg, #130810 0%, #1A080A 50%, #140608 100%)",
    border:"1px solid rgba(224,71,76,0.15)",
    borderRadius:"var(--radius-xl)", padding:"28px 24px 24px",
    marginBottom:"28px", display:"flex",
    flexDirection:"column",
    boxShadow:"0 4px 24px rgba(224,71,76,0.08)",
  },
  pageHeaderGlow: {
    position:"absolute", top:-60, left:-40,
    width:260, height:260,
    background:"radial-gradient(circle, rgba(224,71,76,0.14) 0%, transparent 70%)",
    borderRadius:"50%", pointerEvents:"none",
  },
  pageEyebrow: { display:"flex", alignItems:"center", gap:"7px", marginBottom:"10px" },
  eyebrowDot: {
    width:6, height:6, borderRadius:"50%",
    background:"var(--brand)", boxShadow:"0 0 8px rgba(224,71,76,0.7)",
  },
  eyebrowText: {
    fontSize:"9px", fontWeight:"700", color:"var(--brand)",
    letterSpacing:"0.2em", textTransform:"uppercase",
  },
  heading: {
    fontSize:"26px", fontWeight:"800",
    fontFamily:"'Sora', sans-serif",
    background:"linear-gradient(135deg, #FFFFFF 40%, rgba(224,71,76,0.8) 100%)",
    WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent",
    backgroundClip:"text",
    letterSpacing:"-0.03em", margin:0,
  },
  subheading: { fontSize:"13px", color:"rgba(255,255,255,0.35)", marginTop:"5px" },
  card: { background: "var(--bg-2)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: "20px", transition: "border-color 0.2s" },
  input: { width: "100%", padding: "10px 14px", background: "var(--bg-1)", border: "1px solid var(--border)", borderRadius: "var(--radius)", color: "var(--text-primary)", fontSize: "13px", outline: "none", transition: "border-color 0.2s", boxSizing: "border-box" },
  btnPrimary: { padding: "12px 20px", background: "var(--brand)", color: "white", border: "none", borderRadius: "var(--radius-btn)", fontSize: "14px", fontWeight: "600", cursor: "pointer", boxShadow: "0 4px 16px var(--brand-glow)", transition: "opacity 0.2s", fontFamily:"'Sora', sans-serif" },
  spinner: { width: "14px", height: "14px", border: "2px solid rgba(255,255,255,0.2)", borderTop: "2px solid white", borderRadius: "50%", display: "inline-block", animation: "spin 0.8s linear infinite" },
};
