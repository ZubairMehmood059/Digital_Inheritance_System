// src/pages/TimeCapsule.jsx
// Write messages to be unlocked on a future date

import { useState, useEffect, useCallback } from "react";
import { db, auth } from "../firebase/config";
import { collection, addDoc, getDocs, deleteDoc, doc, query, where, serverTimestamp } from "firebase/firestore";
import { getStorage, ref as sRef, uploadBytesResumable, getDownloadURL } from "firebase/storage";

function countdown(unlockDate) {
  const diff = new Date(unlockDate) - new Date();
  if (diff <= 0) return null;
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  if (d > 365) return `${Math.floor(d/365)}y ${Math.floor((d%365)/30)}mo`;
  if (d > 30) return `${Math.floor(d/30)} months`;
  if (d > 0) return `${d} days`;
  return `${h} hours`;
}

export default function TimeCapsule() {
  const uid = auth.currentUser?.uid;
  const [capsules,  setCapsules]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [showForm,  setShowForm]  = useState(false);
  const [toast,     setToast]     = useState(null);

  const [title,       setTitle]       = useState("");
  const [message,     setMessage]     = useState("");
  const [unlockDate,  setUnlockDate]  = useState("");
  const [recipient,   setRecipient]   = useState("");
  const [saving,      setSaving]      = useState(false);
  const [file,        setFile]        = useState(null);
  const [uploadProg,  setUploadProg]  = useState(0);

  // Minimum unlock date: tomorrow
  const minDate = new Date(Date.now() + 86400000).toISOString().split("T")[0];

  const load = useCallback(async () => {
    if (!uid) return;
    const q = query(collection(db, "timeCapsules"), where("uid", "==", uid));
    const snap = await getDocs(q);
    const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    list.sort((a, b) => new Date(a.unlockDate) - new Date(b.unlockDate));
    setCapsules(list);
    setLoading(false);
  }, [uid]);

  useEffect(() => { load(); }, [load]);

  function showToast(msg, type = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }

  async function handleSave() {
    if (!title.trim() || !message.trim() || !unlockDate) {
      showToast("Title, message aur unlock date required hai", "error"); return;
    }
    setSaving(true);
    let mediaUrl = null;
    let mediaType = null;

    if (file) {
      try {
        const storage = getStorage();
        const ext = file.name.split(".").pop();
        const path = `capsules/${uid}/${Date.now()}_${Math.random().toString(36).substr(2,5)}.${ext}`;
        const storageRef = sRef(storage, path);
        const uploadTask = uploadBytesResumable(storageRef, file);

        await new Promise((resolve, reject) => {
          uploadTask.on("state_changed",
            (snap) => {
              const prog = Math.round((snap.bytesTransferred / snap.totalBytes) * 100);
              setUploadProg(prog);
            },
            (err) => reject(err),
            async () => {
              mediaUrl = await getDownloadURL(uploadTask.snapshot.ref);
              mediaType = file.type.startsWith("video/") ? "video" : "image";
              resolve();
            }
          );
        });
      } catch {
        setSaving(false);
        setUploadProg(0);
        showToast("Failed to upload media", "error");
        return;
      }
    }

    await addDoc(collection(db, "timeCapsules"), {
      uid, title: title.trim(), message: message.trim(),
      unlockDate, recipient: recipient.trim(),
      mediaUrl, mediaType,
      locked: true, createdAt: serverTimestamp(),
    });
    setTitle(""); setMessage(""); setUnlockDate(""); setRecipient("");
    setFile(null); setUploadProg(0);
    setSaving(false); setShowForm(false);
    showToast("Time capsule created ✓");
    load();
  }

  async function handleDelete(id) {
    await deleteDoc(doc(db, "timeCapsules", id));
    showToast("Deleted");
    load();
  }

  const isUnlocked = (c) => new Date(c.unlockDate) <= new Date();

  return (
    <div style={{ animation:"fadeIn 0.3s ease" }}>

      {toast && (
        <div style={{ ...S.toast, background: toast.type==="error" ? "var(--danger-bg)" : "var(--success-bg)", borderColor: toast.type==="error" ? "#FCA5A5" : "#86EFAC", color: toast.type==="error" ? "var(--danger)" : "#16A34A" }}>
          {toast.type==="error" ? "⚠ " : "✓ "}{toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={S.pageHeader}>
        <div style={S.pageHeaderGlow} />
        <div style={{ position:"relative", zIndex:1 }}>
          <div style={S.pageEyebrow}>
            <div style={S.eyebrowDot} />
            <span style={S.eyebrowText}>LEGACY MODULE</span>
          </div>
          <h1 style={S.heading}>Time Capsule</h1>
          <p style={S.sub}>Messages that unlock in the future — written for the ones you love</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} style={{ ...S.btnPrimary, position:"relative", zIndex:1 }}>
          {showForm ? "✕ Cancel" : "+ New Capsule"}
        </button>
      </div>

      {/* Banner */}
      {!showForm && capsules.length === 0 && !loading && (
        <div style={{ ...S.card, padding:"40px", textAlign:"center", marginBottom:"20px", borderColor:"rgba(139,92,246,0.3)", background:"var(--card-bg)" }}>
          <div style={{ fontSize:"40px", marginBottom:"12px" }}>⏳</div>
          <h2 style={{ fontSize:"17px", fontWeight:"700", color:"var(--text-1)", marginBottom:"6px" }}>Create Your First Time Capsule</h2>
          <p style={{ fontSize:"13px", color:"var(--text-2)", marginBottom:"20px", maxWidth:"340px", margin:"0 auto 20px" }}>
            Write a message that will unlock in 1 year, 10 years, or on a special day. Perfect for future reminders, letters to your future self, or messages for loved ones.
          </p>
          <button onClick={() => setShowForm(true)} style={S.btnPrimary}>Create Time Capsule</button>
        </div>
      )}

      {/* Create form */}
      {showForm && (
        <div style={{ ...S.card, borderColor:"rgba(139,92,246,0.3)", marginBottom:"16px", animation:"slideDown 0.2s ease" }}>
          <p style={S.cardTitle}>🕰 New Time Capsule</p>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px", marginBottom:"12px" }}>
            <div>
              <label style={S.label}>Title</label>
              <input style={S.input} placeholder="Message to my future self"
                value={title} onChange={e => setTitle(e.target.value)}
                onFocus={e => e.target.style.borderColor = "var(--brand)"}
                onBlur={e => e.target.style.borderColor = "var(--border)"} />
            </div>
            <div>
              <label style={S.label}>Unlock Date</label>
              <input style={S.input} type="date" min={minDate}
                value={unlockDate} onChange={e => setUnlockDate(e.target.value)}
                onFocus={e => e.target.style.borderColor = "var(--brand)"}
                onBlur={e => e.target.style.borderColor = "var(--border)"}
                placeholder="Select a date" />
            </div>
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px", marginBottom:"12px" }}>
            <div>
              <label style={S.label}>Recipient (optional)</label>
              <input style={S.input} placeholder="e.g. My future self..."
                value={recipient} onChange={e => setRecipient(e.target.value)}
                onFocus={e => e.target.style.borderColor = "var(--brand)"}
                onBlur={e => e.target.style.borderColor = "var(--border)"} />
            </div>
            <div>
              <label style={S.label}>Attachment (Image/Video)</label>
              <input style={{...S.input, padding: "6px 12px"}} type="file" accept="image/*,video/*"
                onChange={e => setFile(e.target.files[0])} />
            </div>
          </div>

          <div style={{ marginBottom:"16px" }}>
            <label style={S.label}>Your Message</label>
            <textarea style={{ ...S.input, height:"130px", resize:"none" }}
              placeholder="Dear future me, I hope you're doing well..."
              value={message} onChange={e => setMessage(e.target.value)}
              onFocus={e => e.target.style.borderColor = "var(--brand)"}
              onBlur={e => e.target.style.borderColor = "var(--border)"} />
          </div>

          {unlockDate && (
            <div style={{ padding:"10px 14px", borderRadius:"var(--radius)", background:"var(--card-bg)", border:"1px solid rgba(139,92,246,0.2)", marginBottom:"14px" }}>
              <p style={{ fontSize:"12px", color:"#8B5CF6", fontWeight:"500" }}>
                ⏳This Message <strong>{new Date(unlockDate).toLocaleDateString("en-PK",{day:"numeric",month:"long",year:"numeric"})}</strong> will unlock on the specified date.
                {countdown(unlockDate) ? ` — ${countdown(unlockDate)} remaining` : ""}
              </p>
            </div>
          )}

          <button onClick={handleSave} disabled={saving} style={{ ...S.btnPurple, width:"100%", opacity: saving ? 0.6 : 1, position: "relative", overflow: "hidden" }}>
            {uploadProg > 0 && uploadProg < 100 && (
              <div style={{ position:"absolute", left:0, top:0, height:"100%", width:`${uploadProg}%`, background:"rgba(255,255,255,0.2)", transition:"width 0.2s" }} />
            )}
            <span style={{ position:"relative", zIndex:1 }}>
              {saving ? (uploadProg > 0 ? `Uploading ${uploadProg}%...` : "Saving...") : "🔒 Seal Capsule"}
            </span>
          </button>
        </div>
      )}

      {/* Capsules list */}
      {loading ? (
        [1,2,3].map(i => <div key={i} className="skeleton" style={{ height:"100px", borderRadius:"var(--radius-lg)", marginBottom:"10px" }} />)
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
          {capsules.map(cap => {
            const unlocked = isUnlocked(cap);
            const ct = countdown(cap.unlockDate);
            return (
              <div key={cap.id} style={{ ...S.card, borderLeft:`3px solid ${unlocked ? "#22C55E" : "#8B5CF6"}` }}>
                <div style={{ display:"flex", alignItems:"flex-start", gap:"12px" }}>
                  <div style={{ width:"40px", height:"40px", borderRadius:"var(--radius)", background: unlocked ? "var(--success-bg)" : "#F5F3FF", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                    <span style={{ fontSize:"18px" }}>{unlocked ? "📬" : "🔒"}</span>
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:"8px", marginBottom:"4px", flexWrap:"wrap" }}>
                      <p style={{ fontSize:"14px", fontWeight:"600", color:"var(--text-1)" }}>{cap.title}</p>
                      {cap.recipient && <span style={{ fontSize:"10px", color:"var(--text-3)" }}>→ {cap.recipient}</span>}
                      <span style={{ fontSize:"10px", padding:"2px 8px", borderRadius:"4px", fontWeight:"600", background: unlocked ? "var(--success-bg)" : "#F5F3FF", color: unlocked ? "#16A34A" : "#8B5CF6" }}>
                        {unlocked ? "✓ Unlocked" : "Locked"}
                      </span>
                    </div>
                    {unlocked ? (
                      <div style={{ marginTop:"6px" }}>
                        <p style={{ fontSize:"13px", color:"var(--text-2)", lineHeight:"1.6", fontStyle:"italic", marginBottom: cap.mediaUrl ? "12px" : "0" }}>"{cap.message}"</p>
                        {cap.mediaUrl && (
                          <div style={{ borderRadius:"var(--radius)", overflow:"hidden", border:"1px solid var(--border)", maxWidth: "100%", width: "fit-content" }}>
                            {cap.mediaType === "video" ? (
                              <video src={cap.mediaUrl} controls style={{ display:"block", maxWidth:"100%", maxHeight:"300px" }} />
                            ) : (
                              <img src={cap.mediaUrl} alt="Capsule attachment" style={{ display:"block", maxWidth:"100%", maxHeight:"300px", objectFit:"contain" }} />
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <p style={{ fontSize:"12px", color:"var(--text-3)" }}>
                        🗓 Unlock: <strong>{new Date(cap.unlockDate).toLocaleDateString("en-PK",{day:"numeric",month:"long",year:"numeric"})}</strong>
                        {ct && <span style={{ color:"#8B5CF6", fontWeight:"500" }}> · {ct} remaining</span>}
                      </p>
                    )}
                  </div>
                  <button onClick={() => handleDelete(cap.id)}
                    style={{ background:"transparent", border:"none", color:"var(--text-3)", cursor:"pointer", padding:"4px", fontSize:"14px" }}
                    onMouseEnter={e => e.currentTarget.style.color = "var(--danger)"}
                    onMouseLeave={e => e.currentTarget.style.color = "var(--text-3)"}>
                    ✕
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const S = {
  pageHeader: {
    position:"relative", overflow:"hidden",
    background:"linear-gradient(135deg, #0D0816 0%, #130820 50%, #0A0A14 100%)",
    border:"1px solid rgba(139,92,246,0.15)",
    borderRadius:"var(--radius-xl)", padding:"28px 24px 24px",
    marginBottom:"28px", display:"flex",
    alignItems:"flex-end", justifyContent:"space-between", flexWrap:"wrap", gap:"16px",
    boxShadow:"0 4px 24px rgba(139,92,246,0.08)",
  },
  pageHeaderGlow: {
    position:"absolute", top:-60, left:-40,
    width:260, height:260,
    background:"radial-gradient(circle, rgba(139,92,246,0.14) 0%, transparent 70%)",
    borderRadius:"50%", pointerEvents:"none",
  },
  pageEyebrow: { display:"flex", alignItems:"center", gap:"7px", marginBottom:"10px" },
  eyebrowDot: {
    width:6, height:6, borderRadius:"50%",
    background:"#8B5CF6", boxShadow:"0 0 8px rgba(139,92,246,0.7)",
  },
  eyebrowText: {
    fontSize:"9px", fontWeight:"700", color:"rgba(139,92,246,0.6)",
    letterSpacing:"0.2em", textTransform:"uppercase",
  },
  heading: {
    fontSize:"26px", fontWeight:"800",
    fontFamily:"'Sora', sans-serif",
    background:"linear-gradient(135deg, #FFFFFF 40%, rgba(139,92,246,0.8) 100%)",
    WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent",
    backgroundClip:"text",
    letterSpacing:"-0.03em", margin:0,
  },
  sub: { fontSize:"13px", color:"rgba(255,255,255,0.35)", marginTop:"5px" },
  card: { background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:"var(--radius-lg)", padding:"18px", boxShadow:"var(--shadow-sm)", transition:"box-shadow 0.2s" },
  cardTitle: { fontSize:"14px", fontWeight:"600", color:"var(--text-1)", marginBottom:"16px", fontFamily:"'Sora', sans-serif" },
  label:   { display:"block", fontSize:"11px", fontWeight:"600", color:"var(--text-2)", marginBottom:"5px", letterSpacing:"0.04em", textTransform:"uppercase" },
  input:   { width:"100%", padding:"9px 12px", background:"var(--bg-card)", border:"1.5px solid var(--border)", borderRadius:"var(--radius)", color:"var(--text-1)", fontSize:"13px", outline:"none", transition:"border-color 0.15s", boxSizing:"border-box" },
  btnPrimary: { padding:"10px 20px", background:"linear-gradient(135deg, #8B5CF6, #6D28D9)", color:"white", border:"none", borderRadius:"var(--radius-btn)", fontSize:"13px", fontWeight:"600", cursor:"pointer", boxShadow:"0 2px 12px rgba(139,92,246,0.3)", letterSpacing:"0.02em" },
  btnPurple:  { padding:"11px 18px", background:"#8B5CF6", color:"white", border:"none", borderRadius:"var(--radius-btn)", fontSize:"14px", fontWeight:"600", cursor:"pointer", boxShadow:"0 2px 8px rgba(139,92,246,0.3)" },
  toast: { position:"fixed", top:"16px", right:"16px", zIndex:9999, padding:"10px 16px", borderRadius:"var(--radius)", border:"1px solid", fontSize:"13px", fontWeight:"500", animation:"slideRight 0.25s ease", boxShadow:"var(--shadow)" },
};