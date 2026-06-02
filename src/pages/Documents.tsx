import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Search, Download, Lock, Unlock, File, X, Upload } from "lucide-react";
import { useApp } from "../context/AppContext";
import { useData } from "../context/DataContext";
import { Document, DocumentType } from "../types";

const fmtSize = (b: number) => b >= 1048576 ? `${(b/1048576).toFixed(1)} MB` : `${(b/1024).toFixed(0)} KB`;

export default function Documents() {
  const { t } = useTranslation();
  const { currentUser } = useApp();
  const { documents, setDocuments, matters } = useData();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<Partial<Document>>({ documentType:"other", tags:[], signed:false, version:1 });
  const [errors, setErrors] = useState<Record<string,string>>({});

  const getMatter = (id?: string) => matters.find(m=>m.id===id)?.title||"—";

  const filtered = documents.filter(d =>
    (!search || d.fileName.toLowerCase().includes(search.toLowerCase()) || (d.description||"").toLowerCase().includes(search.toLowerCase())) &&
    (typeFilter==="all" || d.documentType===typeFilter)
  );

  const fileExt = (name: string) => {
    const ext = name.split(".").pop()?.toLowerCase()||"";
    if (ext==="pdf") return <div className="file-icon file-pdf">PDF</div>;
    if (["doc","docx"].includes(ext)) return <div className="file-icon file-doc">DOC</div>;
    if (["xls","xlsx"].includes(ext)) return <div className="file-icon file-xls">XLS</div>;
    return <div className="file-icon file-other"><File size={16}/></div>;
  };

  const handleCheckout = (id: string) => {
    setDocuments(prev => prev.map(d => d.id===id
      ? { ...d, checkedOutBy:d.checkedOutBy?undefined:currentUser.id, checkedOutAt:d.checkedOutBy?undefined:new Date().toISOString() }
      : d
    ));
  };

  const validate = () => {
    const e: Record<string,string> = {};
    if (!form.fileName?.trim()) e.fileName = t("errors.required");
    setErrors(e); return Object.keys(e).length===0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    setDocuments(prev => [{
      id:`d${Date.now()}`, matterId:form.matterId, clientId:form.clientId,
      fileName:form.fileName!, fileSize:1024000,
      fileType:form.fileName!.split(".").pop()||"other",
      documentType:(form.documentType||"other") as DocumentType,
      version:1, uploadedBy:currentUser.id, uploadedAt:new Date().toISOString(),
      tags:[], signed:false, description:form.description,
    }, ...prev]);
    setShowModal(false);
    setForm({ documentType:"other", tags:[], signed:false, version:1 });
    setErrors({});
  };

  return (
    <div>
      <div className="page-header">
        <div><div className="page-header-title">{t("documents.title")}</div><div className="page-header-subtitle">{filtered.length} documents</div></div>
        <button className="btn btn-gold" onClick={()=>setShowModal(true)}><Upload size={15}/>{t("documents.uploadDocument")}</button>
      </div>
      <div className="filters-row">
        <div className="search-box"><Search size={15} className="search-icon"/><input className="form-control" style={{paddingLeft:38}} placeholder={t("common.search")} value={search} onChange={e=>setSearch(e.target.value)}/></div>
        <select className="filter-select" value={typeFilter} onChange={e=>setTypeFilter(e.target.value)}>
          <option value="all">{t("common.all")}</option>
          {["contract","brief","motion","correspondence","evidence","pleading","court","other"].map(t2=><option key={t2} value={t2}>{t(`documents.documentTypes.${t2}`)}</option>)}
        </select>
      </div>
      <div className="card">
        <div className="table-container">
          <table>
            <thead><tr><th>{t("documents.fileName")}</th><th>{t("documents.fileType")}</th><th>{t("matters.matter")}</th><th>{t("documents.version")}</th><th>{t("common.date")}</th><th>{t("common.status")}</th><th>{t("common.actions")}</th></tr></thead>
            <tbody>
              {filtered.map(doc => (
                <tr key={doc.id}>
                  <td><div style={{ display:"flex", alignItems:"center", gap:10 }}>{fileExt(doc.fileName)}<div><div style={{fontWeight:500,fontSize:13}}>{doc.fileName}</div><div style={{fontSize:11,color:"var(--gray-400)"}}>{fmtSize(doc.fileSize)}</div></div></div></td>
                  <td><span className="badge badge-blue">{t(`documents.documentTypes.${doc.documentType}`)}</span></td>
                  <td style={{fontSize:12,maxWidth:160}}><div className="truncate">{getMatter(doc.matterId)}</div></td>
                  <td><span style={{background:"var(--gray-100)",padding:"2px 8px",borderRadius:4,fontSize:12,fontWeight:600}}>v{doc.version}</span></td>
                  <td style={{fontSize:12,color:"var(--gray-500)"}}>{doc.uploadedAt.split("T")[0]}</td>
                  <td><div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                    {doc.checkedOutBy&&<span className="badge badge-orange"><Lock size={10}/>{t("documents.checkedOut")}</span>}
                    {doc.signed&&<span className="badge badge-green">{t("documents.signed")}</span>}
                  </div></td>
                  <td><div style={{display:"flex",gap:4}}>
                    <button className="btn btn-ghost btn-sm btn-icon" title={t("common.download")}><Download size={14}/></button>
                    <button className="btn btn-ghost btn-sm btn-icon" onClick={()=>handleCheckout(doc.id)} title={doc.checkedOutBy?t("documents.checkIn"):t("documents.checkOut")}>
                      {doc.checkedOutBy?<Unlock size={14}/>:<Lock size={14}/>}
                    </button>
                  </div></td>
                </tr>
              ))}
              {!filtered.length && <tr><td colSpan={7}><div className="empty-state"><div className="empty-state-text">{t("common.noData")}</div></div></td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* Drop zone */}
      <div className="card" style={{marginTop:20}}>
        <div className="card-header"><span className="card-title">{t("documents.uploadDocument")}</span></div>
        <div className="card-body">
          <div style={{ border:"2px dashed var(--gray-300)", borderRadius:12, padding:"40px 20px", textAlign:"center", cursor:"pointer", color:"var(--gray-400)" }} onClick={()=>setShowModal(true)}>
            <Upload size={32} style={{margin:"0 auto 12px",display:"block"}}/>
            <div style={{fontSize:15,color:"var(--gray-600)",fontWeight:500}}>{t("documents.dragDrop")}</div>
            <div style={{fontSize:12,marginTop:6}}>{t("documents.maxSize")}</div>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={()=>setShowModal(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">{t("documents.uploadDocument")}</span>
              <button className="btn btn-ghost btn-icon" onClick={()=>setShowModal(false)}><X size={18}/></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label required">{t("documents.fileName")}</label>
                <input className="form-control" placeholder="filename.pdf" value={form.fileName||""} onChange={e=>setForm(f=>({...f,fileName:e.target.value}))}/>
                {errors.fileName&&<div className="form-error">{errors.fileName}</div>}
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">{t("documents.fileType")}</label>
                  <select className="form-control" value={form.documentType||"other"} onChange={e=>setForm(f=>({...f,documentType:e.target.value as DocumentType}))}>
                    {["contract","brief","motion","correspondence","evidence","pleading","court","other"].map(t2=><option key={t2} value={t2}>{t(`documents.documentTypes.${t2}`)}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">{t("matters.matter")}</label>
                  <select className="form-control" value={form.matterId||""} onChange={e=>setForm(f=>({...f,matterId:e.target.value}))}>
                    <option value="">— {t("matters.matter")} ({t("common.optional")}) —</option>
                    {matters.map(m=><option key={m.id} value={m.id}>{m.matterId} – {m.title}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">{t("common.description")}</label>
                <textarea className="form-control" value={form.description||""} onChange={e=>setForm(f=>({...f,description:e.target.value}))} placeholder={t("common.description")}/>
              </div>
              <div style={{border:"2px dashed var(--gray-300)",borderRadius:8,padding:"24px",textAlign:"center",color:"var(--gray-400)",marginBottom:16}}>
                <Upload size={22} style={{margin:"0 auto 8px",display:"block"}}/><div style={{fontSize:13}}>{t("documents.dragDrop")}</div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={()=>setShowModal(false)}>{t("common.cancel")}</button>
              <button className="btn btn-gold" onClick={handleSubmit}><Upload size={15}/>{t("documents.uploadDocument")}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}