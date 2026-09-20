import { useState, useRef, useEffect } from "react";
import { GoogleGenAI } from "@google/genai";

<<<<<<< HEAD
const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
=======
const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY;
>>>>>>> da8dc0b (Fix Netlify deployment)

export default function AIChatAssistant() {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hello! I am your AI Life Advisor. I can help you summarize your tasks, draft emails, or offer guidance on organizing your digital legacy. How can I assist you today?" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg = { role: "user", content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
<<<<<<< HEAD
=======
      if (!geminiApiKey) {
        throw new Error("VITE_GEMINI_API_KEY is not configured");
      }

      const ai = new GoogleGenAI({ apiKey: geminiApiKey });
>>>>>>> da8dc0b (Fix Netlify deployment)
      // Build conversation history for Gemini
      // Gemini uses "user" and "model" roles (not "assistant")
      const history = messages
        .slice(1) // skip the initial greeting
        .map(m => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.content }],
        }));

      const chat = ai.chats.create({
        model: "gemini-2.5-flash",
        config: { maxOutputTokens: 1000 },
        systemInstruction: "You are a helpful AI Life Advisor integrated into myDigitalVault — a secure digital legacy management app. You help users manage their legacy, summarize their financial data (if they provide it), and give general life organization advice. Keep answers concise, empathetic, and professional.",
        history,
      });

      const response = await chat.sendMessage({
        message: userMsg.content,
      });

      const text = response.text || "Sorry, I couldn't generate a response.";
      setMessages(prev => [...prev, { role: "assistant", content: text }]);
    } catch (err) {
      console.error("Gemini error:", err.message);
      setMessages(prev => [...prev, { role: "assistant", content: "Sorry, I encountered an error. Please try again." }]);
    }

    setLoading(false);
  };

  return (
    <div style={{ animation: "fadeIn 0.3s ease", display: "flex", flexDirection: "column", height: "calc(100vh - 80px)" }}>
      {/* Header */}
      <div style={S.pageHeader}>
        <div style={S.pageHeaderGlow} />
        <div style={{ position:"relative", zIndex:1 }}>
          <div style={S.pageEyebrow}>
            <div style={S.eyebrowDot} />
            <span style={S.eyebrowText}>ASSISTANT MODULE</span>
          </div>
          <h1 style={S.heading}>AI Life Advisor</h1>
          <p style={S.sub}>Your personal, context-aware AI assistant</p>
        </div>
      </div>

      {/* Chat Container */}
      <div style={S.chatContainer}>
        <div style={S.messageList}>
          {messages.map((msg, idx) => (
            <div key={idx} style={{ 
              display: "flex", 
              justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
              marginBottom: "16px"
            }}>
              <div style={{
                maxWidth: "75%",
                padding: "12px 16px",
                borderRadius: msg.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                background: msg.role === "user" ? "var(--brand)" : "var(--bg-card)",
                border: msg.role === "user" ? "none" : "1px solid var(--border)",
                color: msg.role === "user" ? "#fff" : "var(--text-1)",
                fontSize: "14px",
                lineHeight: "1.5",
                boxShadow: msg.role === "user" ? "0 4px 12px var(--brand-glow)" : "var(--shadow-sm)"
              }}>
                {msg.content}
              </div>
            </div>
          ))}
          {loading && (
            <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: "16px" }}>
              <div style={{ padding: "12px 16px", borderRadius: "16px 16px 16px 4px", background: "var(--bg-card)", border: "1px solid var(--border)" }}>
                <span style={S.spinner} />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div style={S.inputArea}>
          <input
            style={S.input}
            placeholder="Ask your life advisor..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            onFocus={(e) => (e.target.style.borderColor = "var(--brand)")}
            onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
          />
          <button style={S.sendBtn} onClick={handleSend} disabled={loading || !input.trim()}>
            Send ↗
          </button>
        </div>
      </div>
    </div>
  );
}

const S = {
  pageHeader: {
    position:"relative", overflow:"hidden",
    background:"linear-gradient(135deg, #130810 0%, #1A080A 50%, #140608 100%)",
    border:"1px solid rgba(224,71,76,0.15)",
    borderRadius:"var(--radius-xl)", padding:"24px",
    marginBottom:"20px", display:"flex",
    alignItems:"flex-end", justifyContent:"space-between", flexWrap:"wrap", gap:"16px",
    boxShadow:"0 4px 24px rgba(224,71,76,0.08)",
    flexShrink: 0
  },
  pageHeaderGlow: {
    position:"absolute", top:-60, left:-40,
    width:260, height:260,
    background:"radial-gradient(circle, rgba(224,71,76,0.14) 0%, transparent 70%)",
    borderRadius:"50%", pointerEvents:"none",
  },
  pageEyebrow: { display:"flex", alignItems:"center", gap:"7px", marginBottom:"8px" },
  eyebrowDot: {
    width:6, height:6, borderRadius:"50%",
    background:"var(--brand)", boxShadow:"0 0 8px rgba(224,71,76,0.7)",
  },
  eyebrowText: {
    fontSize:"9px", fontWeight:"700", color:"var(--brand)",
    letterSpacing:"0.2em", textTransform:"uppercase",
  },
  heading: {
    fontSize:"24px", fontWeight:"800",
    fontFamily:"'Sora', sans-serif",
    background:"linear-gradient(135deg, #FFFFFF 40%, rgba(224,71,76,0.8) 100%)",
    WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent",
    backgroundClip:"text",
    letterSpacing:"-0.03em", margin:0,
  },
  sub: { fontSize:"13px", color:"rgba(255,255,255,0.35)", marginTop:"4px" },
  chatContainer: {
    flex: 1,
    background: "var(--bg-card)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-lg)",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    boxShadow: "var(--shadow-sm)"
  },
  messageList: {
    flex: 1,
    padding: "20px",
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
  },
  inputArea: {
    padding: "16px",
    borderTop: "1px solid var(--border)",
    display: "flex",
    gap: "12px",
    background: "var(--bg)"
  },
  input: {
    flex: 1,
    padding: "12px 16px",
    background: "var(--bg-card)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-btn)",
    color: "var(--text-1)",
    fontSize: "14px",
    outline: "none",
    transition: "border-color 0.2s"
  },
  sendBtn: {
    padding: "0 24px",
    background: "var(--brand)",
    color: "#fff",
    border: "none",
    borderRadius: "var(--radius-btn)",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    boxShadow: "0 4px 12px var(--brand-glow)",
    fontFamily: "'Sora', sans-serif"
  },
  spinner: { width: "16px", height: "16px", border: "2px solid rgba(224,71,76,0.2)", borderTop: "2px solid var(--brand)", borderRadius: "50%", display: "inline-block", animation: "spin 0.8s linear infinite" },
};
