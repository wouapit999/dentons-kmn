import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Search, Download, Lock, Unlock, File, X, Link, ExternalLink, FileText, Plus } from "lucide-react";
import { useApp } from "../context/AppContext";
import { useData } from "../context/DataContext";
import { Document, DocumentType } from "../types";


export default function Documents() {
  const { t } = useTranslation();
  const { currentUser } = useApp();
  const { documents, setDocuments, matters } = useData();

  const [search, setSearch]       = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm]           = useState<Partial<Document>>({
    documentType: "other", tags: [], signed: false, version: 1,
  });
  const [errors, setErrors]       = useState<Record<string,string>>({});

  const getMatter   = (id?: string) => matters.find(m => m.id === id)?.title   || "—";
  const getMatterId = (id?: string) => matters.find(m => m.id === id)?.matterId || "—";

  const filtered = documents.filter(d =>
    (!search || d.fileName.toLowerCase().includes(search.toLowerCase()) || (d.description||"").toLowerCase().includes(search.toLowerCase())) &&
    (typeFilter === "all" || d.documentType === typeFilter)
  );

  const fileIcon = (name: string) => {
    const ext = (name || "").split(".").pop()?.toLowerCase() || "";
    if (ext === "pdf")                return <div className="file-icon file-pdf">PDF</div>;
    if (["doc","docx"].includes(ext)) return <div className="file-icon file-doc">DOC</div>;
    if (["xls","xlsx"].includes(ext)) return <div className="file-icon file-xls">XLS</div>;
    return <div className="file-icon file-other"><File size={16}/></div>;
  };

  const validate = () => {
    const e: Record<string,string> = {};
    if (!form.fileName?.trim()) e.fileName = t("errors.required");
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    const newDoc: Document = {
      id:           `d${Date.now()}`,
      matterId:     form.matterId,
      fileName:     form.fileName!,
      fileSize:     0,
      fileType:     form.fileName!.split(".").pop() || "other",
      documentType: (form.documentType || "other") as DocumentType,
      version:      1,
      uploadedBy:   currentUser?.id || "u1",
      uploadedAt:   new Date().toISOString(),
      tags:         [],
      signed:       false,
      description:  form.description,
      downloadUrl:  (form as any).downloadUrl || "",
    } as any;
    setDocuments(prev => [newDoc, ...prev]);
    setShowModal(false);
    setForm({ documentType: "other", tags: [], signed: false, version: 1 });
    setErrors({});
  };

  const handleCheckout = (id: string) => {
    setDocuments(prev => prev.map(d => d.id === id
      ? { ...d,
          checkedOutBy: d.checkedOutBy ? undefined : currentUser?.id || "u1",
          checkedOutAt: d.checkedOutBy ? undefined : new Date().toISOString()
        }
      : d
    ));
  };

  const docTypes = ["contract","brief","motion","correspondence","evidence","pleading","court","other"];

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-header-title">{t("documents.title")}</div>
          <div className="page-header-subtitle">{filtered.length} documents</div>
        </div>
        <button className="btn btn-gold" onClick={() => setShowModal(true)}>
          <Plus size={15}/>{t("documents.uploadDocument")}
        </button>
      </div>

      {/* Info banner */}
      <div className="alert alert-info" style={{ marginBottom: 20 }}>
        <Link size={15} style={{ flexShrink: 0 }}/>
        <div>
          <div style={{ fontWeight: 600 }}>Cloud Storage Integration</div>
          <div style={{ fontSize: 12, marginTop: 2 }}>
            Store files on <strong>Google Drive, OneDrive or Dropbox</strong> and paste the share link here.
            Files stay in your cloud storage — the system tracks and organises the links per matter.
          </div>
        </div>
      </div>

      <div className="filters-row">
        <div className="search-box">
          <Search size={15} className="search-icon"/>
          <input className="form-control" style={{ paddingLeft: 38 }} placeholder={t("common.search")} value={search} onChange={e => setSearch(e.target.value)}/>
        </div>
        <select className="filter-select" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
          <option value="all">{t("common.all")}</option>
          {docTypes.map(t2 => <option key={t2} value={t2}>{t(`documents.documentTypes.${t2}`)}</option>)}
        </select>
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
                        {doc.description && <div style={{ fontSize:11, color:"var(--gray-400)" }}>{doc.description}</div>}
                      </div>
                    </div>
                  </td>
                  <td><span className="badge badge-blue">{t(`documents.documentTypes.${doc.documentType}`)}</span></td>
                  <td style={{ fontSize:12, maxWidth:160 }}>
                    <div className="truncate" title={getMatter(doc.matterId)}>{getMatterId(doc.matterId)}</div>
                    <div style={{ fontSize:11, color:"var(--gray-400)" }} className="truncate">{getMatter(doc.matterId)}</div>
                  </td>
                  <td>
                    <span style={{ background:"var(--gray-100)", padding:"2px 8px", borderRadius:4, fontSize:12, fontWeight:600 }}>v{doc.version}</span>
                  </td>
                  <td style={{ fontSize:12, color:"var(--gray-500)" }}>{doc.uploadedAt?.split("T")[0]}</td>
                  <td>
                    <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
                      {doc.checkedOutBy && <span className="badge badge-orange"><Lock size={10}/>{t("documents.checkedOut")}</span>}
                      {doc.signed       && <span className="badge badge-green">{t("documents.signed")}</span>}
                      {(doc as any).downloadUrl && <span className="badge badge-blue"><Link size={10}/>Linked</span>}
                    </div>
                  </td>
                  <td>
                    <div style={{ display:"flex", gap:4 }}>
                      {(doc as any).downloadUrl ? (
                        <a
                          href={(doc as any).downloadUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-ghost btn-sm btn-icon"
                          title="Open document"
                        >
                          <ExternalLink size={14}/>
                        </a>
                      ) : (
                        <button className="btn btn-ghost btn-sm btn-icon" disabled title="No link attached">
                          <Download size={14}/>
                        </button>
                      )}
                      <button
                        className="btn btn-ghost btn-sm btn-icon"
                        onClick={() => handleCheckout(doc.id)}
                        title={doc.checkedOutBy ? t("documents.checkIn") : t("documents.checkOut")}
                      >
                        {doc.checkedOutBy ? <Unlock size={14}/> : <Lock size={14}/>}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!filtered.length && (
                <tr><td colSpan={7}>
                  <div className="empty-state">
                    <div className="empty-state-icon"><FileText size={40}/></div>
                    <div className="empty-state-text">{t("common.noData")}</div>
                    <div className="empty-state-sub">Click "+ Add Document" to register a document</div>
                  </div>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">{t("documents.uploadDocument")}</span>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}><X size={18}/></button>
            </div>
            <div className="modal-body">

              {/* How to get a share link */}
              <div style={{ background:"var(--gray-50)", border:"1px solid var(--gray-200)", borderRadius:10, padding:"14px 16px", marginBottom:20 }}>
                <div style={{ fontWeight:700, fontSize:13, color:"var(--navy)", marginBottom:8 }}>📎 How to get a document link</div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10 }}>
                  {[
                    { name:"Google Drive", icon:"🟢", steps:"Upload file → Right-click → Share → Copy link" },
                    { name:"OneDrive",     icon:"🔵", steps:"Upload file → Share → Copy link" },
                    { name:"Dropbox",      icon:"📦", steps:"Upload file → Share → Create link" },
                  ].map(s => (
                    <div key={s.name} style={{ background:"white", borderRadius:8, padding:"10px 12px", border:"1px solid var(--gray-200)" }}>
                      <div style={{ fontSize:13, fontWeight:600 }}>{s.icon} {s.name}</div>
                      <div style={{ fontSize:11, color:"var(--gray-500)", marginTop:4, lineHeight:1.5 }}>{s.steps}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label required">{t("documents.fileName")}</label>
                <input
                  className="form-control"
                  value={form.fileName||""}
                  onChange={e => setForm(f => ({...f, fileName: e.target.value}))}
                  placeholder="e.g. Contract_SCP_v1.pdf"
                />
                {errors.fileName && <div className="form-error">{errors.fileName}</div>}
              </div>

              <div className="form-group">
                <label className="form-label">Document Link <span style={{ fontSize:11, color:"var(--gray-400)", fontWeight:400 }}>(Google Drive / OneDrive / Dropbox)</span></label>
                <div style={{ position:"relative" }}>
                  <Link size={15} style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", color:"var(--gray-400)" }}/>
                  <input
                    className="form-control"
                    style={{ paddingLeft:36 }}
                    value={(form as any).downloadUrl||""}
                    onChange={e => setForm(f => ({...f, downloadUrl: e.target.value} as any))}
                    placeholder="https://drive.google.com/file/d/..."
                  />
                </div>
                <div className="form-hint">Paste your share link here. Leave blank if you will add it later.</div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">{t("documents.fileType")}</label>
                  <select className="form-control" value={form.documentType||"other"} onChange={e => setForm(f => ({...f, documentType: e.target.value as DocumentType}))}>
                    {docTypes.map(t2 => <option key={t2} value={t2}>{t(`documents.documentTypes.${t2}`)}</option>)}
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
                <textarea
                  className="form-control"
                  value={form.description||""}
                  onChange={e => setForm(f => ({...f, description: e.target.value}))}
                  placeholder="Brief description of this document..."
                />
              </div>

            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowModal(false)}>{t("common.cancel")}</button>
              <button className="btn btn-gold" onClick={handleSubmit}>
                <Plus size={15}/>{t("common.save")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}