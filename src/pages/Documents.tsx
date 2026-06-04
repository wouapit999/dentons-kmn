import React, { useState, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Search, Download, Lock, Unlock, File, X, Upload, CheckCircle, AlertCircle, RefreshCw } from "lucide-react";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { useApp } from "../context/AppContext";
import { useData } from "../context/DataContext";
import { storage } from "../config/firebase";
import { Document, DocumentType } from "../types";

const fmtSize = (b: number) => b >= 1048576 ? `${(b/1048576).toFixed(1)} MB` : b >= 1024 ? `${(b/1024).toFixed(0)} KB` : `${b} B`;

interface UploadState { fileName: string; progress: number; status: "uploading"|"done"|"error"; downloadUrl?: string; }

export default function Documents() {
  const { t } = useTranslation();
  const { currentUser } = useApp();
  const { documents, setDocuments, matters } = useData();

  const [search, setSearch]         = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [showModal, setShowModal]   = useState(false);
  const [dragging, setDragging]     = useState(false);
  const [uploads, setUploads]       = useState<UploadState[]>([]);
  const [form, setForm]             = useState<Partial<Document & { file?: File }>>({
    documentType: "other", tags: [], signed: false, version: 1,
  });
  const fileInputRef                = useRef<HTMLInputElement>(null);
  const dropRef                     = useRef<HTMLDivElement>(null);

  const getMatter   = (id?: string) => matters.find(m => m.id === id)?.title || "—";
  const getMatterId = (id?: string) => matters.find(m => m.id === id)?.matterId || "—";

  const filtered = documents.filter(d =>
    (!search || d.fileName.toLowerCase().includes(search.toLowerCase()) || (d.description||"").toLowerCase().includes(search.toLowerCase())) &&
    (typeFilter === "all" || d.documentType === typeFilter)
  );

  const fileIcon = (name: string) => {
    const ext = name.split(".").pop()?.toLowerCase() || "";
    if (ext === "pdf")                    return <div className="file-icon file-pdf">PDF</div>;
    if (["doc","docx"].includes(ext))     return <div className="file-icon file-doc">DOC</div>;
    if (["xls","xlsx"].includes(ext))     return <div className="file-icon file-xls">XLS</div>;
    return <div className="file-icon file-other"><File size={16}/></div>;
  };

  // ── Upload file to Firebase Storage ─────────────────────────────────────
  const uploadFile = useCallback((file: File, matterId?: string, documentType?: string, description?: string) => {
    const userId    = currentUser?.id || "u1";
    const timestamp = Date.now();
    const path      = `documents/${userId}/${timestamp}_${file.name}`;
    const storageRef = ref(storage, path);
    const task      = uploadBytesResumable(storageRef, file);

    setUploads(prev => [...prev, { fileName: file.name, progress: 0, status: "uploading" }]);

    task.on(
      "state_changed",
      snapshot => {
        const pct = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
        setUploads(prev => prev.map(u => u.fileName === file.name ? { ...u, progress: pct } : u));
      },
      err => {
        console.error("Upload error:", err);
        setUploads(prev => prev.map(u => u.fileName === file.name ? { ...u, status: "error" } : u));
        // Still save metadata even if upload fails (offline mode)
        saveDocumentRecord(file, matterId, documentType, description, "");
      },
      async () => {
        try {
          const url = await getDownloadURL(task.snapshot.ref);
          setUploads(prev => prev.map(u => u.fileName === file.name ? { ...u, status: "done", downloadUrl: url } : u));
          saveDocumentRecord(file, matterId, documentType, description, url);
          setTimeout(() => setUploads(prev => prev.filter(u => u.fileName !== file.name)), 4000);
        } catch {
          saveDocumentRecord(file, matterId, documentType, description, "");
        }
      }
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  const saveDocumentRecord = (file: File, matterId?: string, documentType?: string, description?: string, downloadUrl?: string) => {
    const newDoc: Document = {
      id:           `d${Date.now()}_${Math.random().toString(36).slice(2,7)}`,
      matterId,
      fileName:     file.name,
      fileSize:     file.size,
      fileType:     file.name.split(".").pop() || "other",
      documentType: (documentType || "other") as DocumentType,
      version:      1,
      uploadedBy:   currentUser?.id || "u1",
      uploadedAt:   new Date().toISOString(),
      tags:         [],
      signed:       false,
      description,
      downloadUrl,
    } as any;
    setDocuments(prev => [newDoc, ...prev]);
  };

  // ── Handle file selection (from input or drop) ───────────────────────────
  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    Array.from(files).forEach(file => {
      uploadFile(file, form.matterId, form.documentType as string, form.description);
    });
    setShowModal(false);
    setForm({ documentType: "other", tags: [], signed: false, version: 1 });
  };

  // ── Drag and drop handlers ───────────────────────────────────────────────
  const onDragOver  = (e: React.DragEvent) => { e.preventDefault(); setDragging(true); };
  const onDragLeave = ()                   => setDragging(false);
  const onDrop      = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  // ── Checkout toggle ──────────────────────────────────────────────────────
  const handleCheckout = (id: string) => {
    setDocuments(prev => prev.map(d => d.id === id
      ? { ...d, checkedOutBy: d.checkedOutBy ? undefined : currentUser?.id || "u1", checkedOutAt: d.checkedOutBy ? undefined : new Date().toISOString() }
      : d
    ));
  };

  return (
    <div>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.jpg,.jpeg,.png,.zip"
        style={{ display: "none" }}
        onChange={e => handleFiles(e.target.files)}
      />

      <div className="page-header">
        <div>
          <div className="page-header-title">{t("documents.title")}</div>
          <div className="page-header-subtitle">{filtered.length} documents</div>
        </div>
        <button className="btn btn-gold" onClick={() => setShowModal(true)}>
          <Upload size={15}/>{t("documents.uploadDocument")}
        </button>
      </div>

      {/* Upload progress toasts */}
      {uploads.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          {uploads.map(u => (
            <div key={u.fileName} className={`alert alert-${u.status==="done"?"success":u.status==="error"?"danger":"info"}`} style={{ marginBottom: 8 }}>
              {u.status==="uploading" ? <RefreshCw size={15} style={{ animation:"spin 1s linear infinite", flexShrink:0 }}/> : u.status==="done" ? <CheckCircle size={15} style={{flexShrink:0}}/> : <AlertCircle size={15} style={{flexShrink:0}}/>}
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:600, fontSize:13 }}>{u.fileName}</div>
                {u.status==="uploading" && (
                  <div style={{ marginTop:4 }}>
                    <div className="progress-bar"><div className="progress-fill" style={{ width:`${u.progress}%` }}/></div>
                    <div style={{ fontSize:11, marginTop:2 }}>{u.progress}%</div>
                  </div>
                )}
                {u.status==="done" && <div style={{ fontSize:12 }}>Upload complete</div>}
                {u.status==="error" && <div style={{ fontSize:12 }}>Upload failed — saved locally</div>}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="filters-row">
        <div className="search-box">
          <Search size={15} className="search-icon"/>
          <input className="form-control" style={{paddingLeft:38}} placeholder={t("common.search")} value={search} onChange={e => setSearch(e.target.value)}/>
        </div>
        <select className="filter-select" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
          <option value="all">{t("common.all")}</option>
          {["contract","brief","motion","correspondence","evidence","pleading","court","other"].map(t2 => (
            <option key={t2} value={t2}>{t(`documents.documentTypes.${t2}`)}</option>
          ))}
        </select>
      </div>

      {/* Drop zone */}
      <div
        ref={dropRef}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        style={{
          border: `2px dashed ${dragging ? "var(--gold)" : "var(--gray-300)"}`,
          borderRadius: 12,
          padding: "28px 20px",
          textAlign: "center",
          cursor: "pointer",
          marginBottom: 20,
          background: dragging ? "var(--gold-pale)" : "white",
          transition: "all 0.2s",
        }}
      >
        <Upload size={28} style={{ display:"block", margin:"0 auto 10px", color: dragging ? "var(--gold-dark)" : "var(--gray-400)" }}/>
        <div style={{ fontSize:15, fontWeight:600, color: dragging ? "var(--gold-dark)" : "var(--gray-600)" }}>
          {dragging ? "Drop files here to upload" : t("documents.dragDrop")}
        </div>
        <div style={{ fontSize:12, color:"var(--gray-400)", marginTop:4 }}>{t("documents.maxSize")} · PDF, Word, Excel, Images</div>
      </div>

      {/* Documents table */}
      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>{t("documents.fileName")}</th>
                <th>{t("documents.fileType")}</th>
                <th>{t("matters.matter")}</th>
                <th>{t("documents.version")}</th>
                <th>{t("common.date")}</th>
                <th>{t("common.status")}</th>
                <th>{t("common.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(doc => (
                <tr key={doc.id}>
                  <td>
                    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                      {fileIcon(doc.fileName)}
                      <div>
                        <div style={{ fontWeight:500, fontSize:13 }}>{doc.fileName}</div>
                        <div style={{ fontSize:11, color:"var(--gray-400)" }}>{fmtSize(doc.fileSize)}</div>
                      </div>
                    </div>
                  </td>
                  <td><span className="badge badge-blue">{t(`documents.documentTypes.${doc.documentType}`)}</span></td>
                  <td style={{ fontSize:12, maxWidth:160 }}>
                    <div className="truncate" title={getMatter(doc.matterId)}>{getMatterId(doc.matterId)}</div>
                    <div style={{fontSize:11,color:"var(--gray-400)"}} className="truncate">{getMatter(doc.matterId)}</div>
                  </td>
                  <td><span style={{ background:"var(--gray-100)", padding:"2px 8px", borderRadius:4, fontSize:12, fontWeight:600 }}>v{doc.version}</span></td>
                  <td style={{ fontSize:12, color:"var(--gray-500)" }}>{doc.uploadedAt?.split("T")[0]}</td>
                  <td>
                    <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
                      {doc.checkedOutBy && <span className="badge badge-orange"><Lock size={10}/>{t("documents.checkedOut")}</span>}
                      {doc.signed       && <span className="badge badge-green">{t("documents.signed")}</span>}
                    </div>
                  </td>
                  <td>
                    <div style={{ display:"flex", gap:4 }}>
                      {(doc as any).downloadUrl ? (
                        <a href={(doc as any).downloadUrl} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm btn-icon" title={t("common.download")}>
                          <Download size={14}/>
                        </a>
                      ) : (
                        <button className="btn btn-ghost btn-sm btn-icon" title={t("common.download")} disabled>
                          <Download size={14}/>
                        </button>
                      )}
                      <button className="btn btn-ghost btn-sm btn-icon" onClick={() => handleCheckout(doc.id)} title={doc.checkedOutBy ? t("documents.checkIn") : t("documents.checkOut")}>
                        {doc.checkedOutBy ? <Unlock size={14}/> : <Lock size={14}/>}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!filtered.length && (
                <tr><td colSpan={7}>
                  <div className="empty-state">
                    <div className="empty-state-icon"><Upload size={36}/></div>
                    <div className="empty-state-text">{t("common.noData")}</div>
                    <div className="empty-state-sub">Drag & drop files or click the upload button above</div>
                  </div>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upload modal — choose matter and type before uploading */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">{t("documents.uploadDocument")}</span>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}><X size={18}/></button>
            </div>
            <div className="modal-body">
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">{t("documents.fileType")}</label>
                  <select className="form-control" value={form.documentType||"other"} onChange={e => setForm(f => ({...f, documentType: e.target.value as DocumentType}))}>
                    {["contract","brief","motion","correspondence","evidence","pleading","court","other"].map(t2 => (
                      <option key={t2} value={t2}>{t(`documents.documentTypes.${t2}`)}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">{t("matters.matter")}</label>
                  <select className="form-control" value={form.matterId||""} onChange={e => setForm(f => ({...f, matterId: e.target.value}))}>
                    <option value="">— {t("matters.matter")} ({t("common.optional")}) —</option>
                    {matters.map(m => <option key={m.id} value={m.id}>{m.matterId} – {m.title}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">{t("common.description")}</label>
                <textarea className="form-control" value={form.description||""} onChange={e => setForm(f => ({...f, description: e.target.value}))} placeholder={t("common.description")}/>
              </div>

              {/* Drag & Drop zone inside modal */}
              <div
                onDragOver={e => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={e => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: `2px dashed ${dragging ? "var(--gold)" : "var(--gray-300)"}`,
                  borderRadius: 10,
                  padding: "32px 20px",
                  textAlign: "center",
                  cursor: "pointer",
                  background: dragging ? "var(--gold-pale)" : "var(--gray-50)",
                  transition: "all 0.2s",
                }}
              >
                <Upload size={32} style={{ display:"block", margin:"0 auto 12px", color:"var(--gold-dark)" }}/>
                <div style={{ fontSize:15, fontWeight:600, color:"var(--navy)" }}>
                  {dragging ? "Drop to upload" : "Click to browse or drag & drop files"}
                </div>
                <div style={{ fontSize:12, color:"var(--gray-400)", marginTop:6 }}>
                  PDF, Word, Excel, PowerPoint, Images — max 500 MB
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowModal(false)}>{t("common.cancel")}</button>
              <button className="btn btn-gold" onClick={() => fileInputRef.current?.click()}>
                <Upload size={15}/>Browse Files
              </button>
            </div>
          </div>
        </div>
      )}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}