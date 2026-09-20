// src/pages/DocumentVault.jsx
// Secure document storage with Firebase Storage
// Categories: CNIC, Passport, Degree, Certificates, Medical, Property, Other

import { useState, useEffect, useCallback, useRef } from "react";
import { db, auth } from "../firebase/config";
import { getStorage, ref, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
import { collection, addDoc, getDocs, deleteDoc, doc, query, where, serverTimestamp, updateDoc } from "firebase/firestore";

const CATS = [
  { value:"cnic",        label:"CNIC",           color:"#5B67F1", bg:"#EEF0FD", icon:"M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0" },
  { value:"passport",    label:"Passport",        color:"#14B8A6", bg:"#F0FDFA", icon:"M3 10a7 7 0 1014 0A7 7 0 003 10zm0 0h14M10 3v14" },
  { value:"degree",      label:"Degree",          color:"#8B5CF6", bg:"#F5F3FF", icon:"M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" },
  { value:"certificate", label:"Certificates",    color:"#F59E0B", bg:"#FFFBEB", icon:"M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" },
  { value:"medical",     label:"Medical",         color:"#EF4444", bg:"#FEF2F2", icon:"M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" },
  { value:"property",    label:"Property",        color:"#22C55E", bg:"#F0FDF4", icon:"M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
  { value:"other",       label:"Other",           color:"#94A3B8", bg:"#F8FAFC", icon:"M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8" },
];

function getCat(v) { return CATS.find(c => c.value === v) || CATS[6]; }

function Icon({ d, size = 15, color = "currentColor" }) {
  return (
    <svg width={size} height={size} fill="none" stroke={color} strokeWidth="1.75" viewBox="0 0 24 24" style={{ flexShrink:0 }}>
      <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    </svg>
  );
}

function fmtSize(bytes) {
  if (!bytes) return "";
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024*1024) return (bytes/1024).toFixed(1) + " KB";
  return (bytes/(1024*1024)).toFixed(1) + " MB";
}

function fmtDate(ts) {
  if (!ts) return "";
  const d = ts.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
  return d.toLocaleDateString("en-PK", { day:"numeric", month:"short", year:"numeric" });
}

export default function DocumentVault() {
  const uid = auth.currentUser?.uid;
  const storage = getStorage();
  const fileRef = useRef();

  const [docs,      setDocs]      = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [uploading, setUploading] = useState(false);
  const [progress,  setProgress]  = useState(0);
  const [toast,     setToast]     = useState(null);
  const [filter,    setFilter]    = useState("all");
  const [search,    setSearch]    = useState("");
  const [selCat,    setSelCat]    = useState("other");
  const [docName,   setDocName]   = useState("");
  const [showForm,  setShowForm]  = useState(false);
  const [file,      setFile]      = useState(null);

  const loadDocs = useCallback(async () => {
    if (!uid) return;
    const q = query(collection(db, "documents"), where("uid", "==", uid));
    const snap = await getDocs(q);
    const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    list.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
    setDocs(list);
    setLoading(false);
  }, [uid]);

  useEffect(() => { loadDocs(); }, [loadDocs]);

  function showToast(msg, type = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }

  function handleFileSelect(e) {
    const f = e.target.files[0];
    if (!f) return;
    if (f.size > 10 * 1024 * 1024) { showToast("File must be under 10MB", "error"); return; }
    setFile(f);
    if (!docName) setDocName(f.name.replace(/\.[^/.]+$/, ""));
  }

  async function handleUpload() {
    if (!file) { showToast("Pehle file select karo", "error"); return; }
    if (!docName.trim()) { showToast("Document name required", "error"); return; }
    setUploading(true);

    const path = `documents/${uid}/${Date.now()}_${file.name}`;
    const storageRef = ref(storage, path);
    const task = uploadBytesResumable(storageRef, file);

    task.on("state_changed",
      snap => setProgress(Math.round(snap.bytesTransferred / snap.totalBytes * 100)),
      err  => { showToast("Upload failed: " + err.message, "error"); setUploading(false); },
      async () => {
        const url = await getDownloadURL(task.snapshot.ref);
        await addDoc(collection(db, "documents"), {
          uid, name: docName.trim(), category: selCat,
          fileName: file.name, fileSize: file.size,
          fileType: file.type, url, storagePath: path,
          pinned: false, createdAt: serverTimestamp(),
        });
        setFile(null); setDocName(""); setSelCat("other");
        setProgress(0); setUploading(false); setShowForm(false);
        if (fileRef.current) fileRef.current.value = "";
        showToast("Document uploaded ✓");
        loadDocs();
      }
    );
  }

  async function handleDelete(docItem) {
    try {
      const sRef = ref(storage, docItem.storagePath);
      await deleteObject(sRef);
    } catch (error) {
      console.warn("Document storage cleanup failed:", error);
    }
    await deleteDoc(doc(db, "documents", docItem.id));
    showToast("Document removed");
    loadDocs();
  }

  async function handlePin(docItem) {
    await updateDoc(doc(db, "documents", docItem.id), { pinned: !docItem.pinned });
    loadDocs();
  }

  const filtered = docs
    .filter(d => filter === "all" || d.category === filter)
    .filter(d => !search || d.name.toLowerCase().includes(search.toLowerCase()));

  const pinnedDocs = filtered.filter(d => d.pinned);
  const otherDocs  = filtered.filter(d => !d.pinned);
  const counts     = CATS.reduce((acc, c) => ({ ...acc, [c.value]: docs.filter(d => d.category === c.value).length }), {});

  return (
    <div style={{ animation:"fadeIn 0.3s ease" }}>

      {/* Toast */}
      {toast && (
        <div style={{ ...S.toast, background: toast.type==="error" ? "var(--danger-bg)" : "var(--success-bg)", borderColor: toast.type==="error" ? "#FCA5A5" : "#86EFAC", color: toast.type==="error" ? "var(--danger)" : "#16A34A" }}>
          {toast.type==="error" ? "⚠ " : "✓ "}{toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"24px" }}>
        <div>
          <h1 style={S.heading}>Documents</h1>
          <p style={S.sub}>{docs.length} {docs.length === 1 ? "document" : "documents"} stored securely</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} style={S.btnPrimary}>
          {showForm ? "✕ Cancel" : "+ Upload"}
        </button>
      </div>

      {/* Upload form */}
      {showForm && (
        <div style={{ ...S.card, borderColor:"rgba(91,103,241,0.3)", marginBottom:"16px", animation:"slideDown 0.2s ease" }}>
          <p style={S.cardTitle}>Upload Document</p>

          {/* Category picker */}
          <p style={S.label}>Category</p>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"7px", marginBottom:"16px" }}>
            {CATS.map(c => (
              <button key={c.value} onClick={() => setSelCat(c.value)}
                style={{ padding:"8px 6px", borderRadius:"var(--radius-btn)", border:`1.5px solid ${selCat===c.value ? c.color : "var(--border)"}`, background: selCat===c.value ? c.bg : "white", color: selCat===c.value ? c.color : "var(--text-3)", fontSize:"11px", cursor:"pointer", transition:"all 0.15s", fontWeight: selCat===c.value ? "600" : "400" }}>
                {c.label}
              </button>
            ))}
          </div>

          <p style={S.label}>Document Name</p>
          <input style={{ ...S.input, marginBottom:"14px" }} placeholder="e.g. National ID Card"
            value={docName} onChange={e => setDocName(e.target.value)}
            onFocus={e => e.target.style.borderColor = "var(--brand)"}
            onBlur={e => e.target.style.borderColor = "var(--border)"} />

          {/* File drop zone */}
          <div
            onClick={() => fileRef.current?.click()}
            style={{ border:`2px dashed ${file ? "var(--brand)" : "var(--border)"}`, borderRadius:"var(--radius-lg)", padding:"24px", textAlign:"center", cursor:"pointer", transition:"all 0.2s", background: file ? "var(--brand-light)" : "var(--bg)", marginBottom:"14px" }}
            onMouseEnter={e => e.currentTarget.style.borderColor = "var(--brand)"}
            onMouseLeave={e => e.currentTarget.style.borderColor = file ? "var(--brand)" : "var(--border)"}
          >
            <input ref={fileRef} type="file" style={{ display:"none" }} onChange={handleFileSelect}
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx" />
            {file ? (
              <div>
                <p style={{ fontSize:"14px", fontWeight:"600", color:"var(--brand)", marginBottom:"4px" }}>📄 {file.name}</p>
                <p style={{ fontSize:"12px", color:"var(--text-3)" }}>{fmtSize(file.size)} · Click to change</p>
              </div>
            ) : (
              <div>
                <div style={{ width:"40px", height:"40px", borderRadius:"var(--radius)", background:"var(--brand-light)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 10px" }}>
                  <Icon d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" color="var(--brand)" />
                </div>
                <p style={{ fontSize:"13px", fontWeight:"500", color:"var(--text-1)", marginBottom:"3px" }}>Click to upload file</p>
                <p style={{ fontSize:"11px", color:"var(--text-3)" }}>PDF, JPG, PNG, DOC — max 10MB</p>
              </div>
            )}
          </div>

          {/* Progress bar */}
          {uploading && (
            <div style={{ marginBottom:"12px" }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"4px" }}>
                <span style={{ fontSize:"12px", color:"var(--text-2)" }}>Uploading...</span>
                <span style={{ fontSize:"12px", color:"var(--brand)", fontWeight:"600" }}>{progress}%</span>
              </div>
              <div style={{ height:"4px", background:"var(--bg)", borderRadius:"4px", overflow:"hidden" }}>
                <div style={{ height:"100%", width:`${progress}%`, background:"var(--brand)", borderRadius:"4px", transition:"width 0.3s" }} />
              </div>
            </div>
          )}

          <button onClick={handleUpload} disabled={uploading || !file} style={{ ...S.btnPrimary, width:"100%", opacity: (uploading || !file) ? 0.6 : 1 }}>
            {uploading ? `Uploading ${progress}%...` : "Upload Document"}
          </button>
        </div>
      )}

      {/* Search + filter */}
      <div style={{ display:"flex", gap:"10px", marginBottom:"16px", flexWrap:"wrap", alignItems:"center" }}>
        <div style={{ position:"relative", flex:1, minWidth:"180px" }}>
          <svg width="14" height="14" fill="none" stroke="var(--text-3)" strokeWidth="2" viewBox="0 0 24 24" style={{ position:"absolute", left:"10px", top:"50%", transform:"translateY(-50%)" }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input style={{ ...S.input, paddingLeft:"32px" }} placeholder="Search documents..."
            value={search} onChange={e => setSearch(e.target.value)}
            onFocus={e => e.target.style.borderColor = "var(--brand)"}
            onBlur={e => e.target.style.borderColor = "var(--border)"} />
        </div>
        <div style={{ display:"flex", gap:"6px", flexWrap:"wrap" }}>
          {[{ value:"all", label:`All (${docs.length})` }, ...CATS.filter(c => counts[c.value] > 0).map(c => ({ value:c.value, label:`${c.label} (${counts[c.value]})`, color:c.color, bg:c.bg }))].map(f => (
            <button key={f.value} onClick={() => setFilter(f.value)}
              style={{ padding:"5px 12px", borderRadius:"var(--radius-btn)", border:`1.5px solid ${filter===f.value ? (f.color || "var(--brand)") : "var(--border)"}`, background: filter===f.value ? (f.bg || "var(--brand-light)") : "white", color: filter===f.value ? (f.color || "var(--brand)") : "var(--text-3)", fontSize:"11px", cursor:"pointer", transition:"all 0.15s", fontWeight: filter===f.value ? "600" : "400" }}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Document grid */}
      {loading ? (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))", gap:"12px" }}>
          {[1,2,3,4,5,6].map(i => <div key={i} className="skeleton" style={{ height:"130px" }} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ ...S.card, padding:"56px", textAlign:"center" }}>
          <div style={{ width:"52px", height:"52px", borderRadius:"var(--radius-lg)", background:"var(--brand-light)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 14px" }}>
            <Icon d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" size={22} color="var(--brand)" />
          </div>
          <p style={{ fontSize:"15px", fontWeight:"600", color:"var(--text-1)", marginBottom:"6px" }}>
            {search ? "No documents found" : "Your document vault is empty"}
          </p>
          <p style={{ fontSize:"13px", color:"var(--text-3)" }}>
            {search ? "Try a different search term" : "Upload your first important document"}
          </p>
        </div>
      ) : (
        <>
          {pinnedDocs.length > 0 && (
            <div style={{ marginBottom:"20px" }}>
              <p style={{ fontSize:"11px", fontWeight:"700", color:"var(--text-3)", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:"8px" }}>📌 Pinned</p>
              <DocGrid items={pinnedDocs} onDelete={handleDelete} onPin={handlePin} />
            </div>
          )}
          {otherDocs.length > 0 && (
            <div>
              {pinnedDocs.length > 0 && <p style={{ fontSize:"11px", fontWeight:"700", color:"var(--text-3)", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:"8px" }}>All documents</p>}
              <DocGrid items={otherDocs} onDelete={handleDelete} onPin={handlePin} />
            </div>
          )}
        </>
      )}
    </div>
  );
}

function DocGrid({ items, onDelete, onPin }) {
  return (
    <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))", gap:"12px" }}>
      {items.map(item => <DocCard key={item.id} item={item} onDelete={onDelete} onPin={onPin} />)}
    </div>
  );
}

function DocCard({ item, onDelete, onPin }) {
  const cat = getCat(item.category);
  const [hover, setHover] = useState(false);

  return (
    <div
      style={{ ...S.card, padding:"16px", position:"relative", overflow:"hidden", transform: hover ? "translateY(-1px)" : "none", boxShadow: hover ? "var(--shadow)" : "var(--shadow-sm)", transition:"all 0.2s" }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {item.pinned && (
        <div style={{ position:"absolute", top:0, right:0, background:"var(--warning)", color:"white", fontSize:"8px", fontWeight:"700", padding:"3px 7px 3px 10px", borderRadius:"0 var(--radius-lg) 0 20px", letterSpacing:"0.06em" }}>PINNED</div>
      )}
      <div style={{ display:"flex", alignItems:"flex-start", gap:"10px", marginBottom:"12px" }}>
        <div style={{ width:"38px", height:"38px", borderRadius:"var(--radius)", background:cat.bg, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
          <svg width="16" height="16" fill="none" stroke={cat.color} strokeWidth="1.75" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d={cat.icon} />
          </svg>
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <p style={{ fontSize:"13px", fontWeight:"600", color:"var(--text-1)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{item.name}</p>
          <span style={{ fontSize:"10px", padding:"2px 7px", borderRadius:"4px", background:cat.bg, color:cat.color, fontWeight:"600" }}>{cat.label}</span>
        </div>
      </div>
      <p style={{ fontSize:"11px", color:"var(--text-3)", marginBottom:"12px", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
        📄 {item.fileName} {item.fileSize ? `· ${fmtSize(item.fileSize)}` : ""}
      </p>
      <p style={{ fontSize:"10px", color:"var(--text-3)", marginBottom:"12px" }}>{fmtDate(item.createdAt)}</p>
      <div style={{ display:"flex", gap:"6px" }}>
        <a href={item.url} target="_blank" rel="noreferrer"
          style={{ flex:1, padding:"6px", background:"var(--brand-light)", border:"1px solid rgba(91,103,241,0.2)", borderRadius:"var(--radius-btn)", color:"var(--brand)", fontSize:"11px", fontWeight:"600", textAlign:"center", cursor:"pointer" }}>
          Open
        </a>
        <button onClick={() => onPin(item)} title={item.pinned ? "Unpin" : "Pin"}
          style={{ padding:"6px 8px", background: item.pinned ? "var(--warning-bg)" : "var(--bg)", border:"1px solid var(--border)", borderRadius:"var(--radius-btn)", color: item.pinned ? "var(--warning)" : "var(--text-3)", fontSize:"12px", cursor:"pointer" }}>
          📌
        </button>
        <button onClick={() => onDelete(item)} title="Delete"
          style={{ padding:"6px 8px", background:"var(--bg)", border:"1px solid var(--border)", borderRadius:"var(--radius-btn)", color:"var(--text-3)", fontSize:"12px", cursor:"pointer" }}
          onMouseEnter={e => { e.currentTarget.style.background = "var(--danger-bg)"; e.currentTarget.style.color = "var(--danger)"; e.currentTarget.style.borderColor = "#FCA5A5"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "var(--bg)"; e.currentTarget.style.color = "var(--text-3)"; e.currentTarget.style.borderColor = "var(--border)"; }}>
          🗑
        </button>
      </div>
    </div>
  );
}

const S = {
  heading: { fontSize:"22px", fontWeight:"700", color:"var(--text-1)", letterSpacing:"-0.02em", margin:0 },
  sub:     { fontSize:"13px", color:"var(--text-3)", marginTop:"3px" },
  card:    { background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:"var(--radius-lg)", padding:"20px", boxShadow:"var(--shadow-sm)" },
  cardTitle: { fontSize:"14px", fontWeight:"600", color:"var(--text-1)", marginBottom:"16px" },
  label:   { fontSize:"11px", fontWeight:"600", color:"var(--text-2)", marginBottom:"6px", display:"block", letterSpacing:"0.01em" },
  input:   { width:"100%", padding:"9px 12px", background:"white", border:"1.5px solid var(--border)", borderRadius:"var(--radius)", color:"var(--text-1)", fontSize:"13px", outline:"none", transition:"border-color 0.15s", boxSizing:"border-box" },
  btnPrimary: { padding:"9px 18px", background:"var(--brand)", color:"white", border:"none", borderRadius:"var(--radius-btn)", fontSize:"13px", fontWeight:"600", cursor:"pointer", transition:"opacity 0.15s", boxShadow:"0 2px 6px rgba(91,103,241,0.25)" },
  toast: { position:"fixed", top:"16px", right:"16px", zIndex:9999, padding:"10px 16px", borderRadius:"var(--radius)", border:"1px solid", fontSize:"13px", fontWeight:"500", animation:"slideRight 0.25s ease", boxShadow:"var(--shadow)" },
};