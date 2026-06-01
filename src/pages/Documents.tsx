import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Search, Download, Lock, Unlock, Tag, FileText, File, X, Upload } from "lucide-react";
import { mockDocuments, mockMatters, mockUsers } from "../data/mockData";
import { Document, DocumentType } from "../types";

const fmtSize = (bytes: number) => bytes >= 1048576 ? `${(bytes / 1048576).toFixed(1)} Mo` : `${(bytes / 1024).toFixed(0)} Ko`;

export default function Documents() {
  const { t } = useTranslation();
  const [documents, setDocuments] = useState<Document[]>(mockDocuments);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<Partial<Document>>({ documentType: "other", tags: [], signed: false, version: 1 });

  const getUser = (id: string) => { const u = mockUsers.find(u => u.id === id); return u ? `${u.firstName} ${u.lastName}` : id; };
  const getMatter = (id?: string) => mockMatters.find(m => m.id === id)?.title || "-";

  const filtered = documents.filter(d => {
    const q = search.toLowerCase();
    return (!q || d.fileName.toLowerCase().includes(q) || (d.description || "").toLowerCase().includes(q))
      && (typeFilter === "all" || d.documentType === typeFilter);
  });

  const fileExtIcon = (name: string) => {
    const ext = name.split(".").pop()?.toLowerCase();
    if (ext === "pdf") return <div className="file-icon file-pdf">PDF</div>;
    if (["doc","docx"].includes(ext || "")) return <div className="file-icon file-doc">DOC</div>;
    if (["xls","xlsx"].includes(ext || "")) return <div className="file-icon file-xls">XLS</div>;
    return <div className="file-icon file-other"><File size={16} /></div>;
  };

  const handleCheckout = (id: string) => {
    setDocuments(prev => prev.map(d => d.id === id
      ? { ...d, checkedOutBy: d.checkedOutBy ? undefined : "u1", checkedOutAt: d.checkedOutBy ? undefined : new Date().toISOString() }
      : d
    ));
  };

  const handleSubmit = () => {
    if (!form.fileName) return;
    const newDoc: Document = {
      id: `d${Date.now()}`, matterId: form.matterId, clientId: form.clientId,
      fileName: form.fileName!, fileSize: 1024000, fileType: form.fileName.split(".").pop() || "other",
      documentType: form.documentType as DocumentType || "other",
      version: 1, uploadedBy: "u1", uploadedAt: new Date().toISOString(),
      tags: form.tags || [], signed: false, description: form.description,
    };
    setDocuments(prev => [newDoc, ...prev]);
    setShowModal(false);
    setForm({ documentType: "other", tags: [], signed: false, version: 1 });
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-header-title">{t("documents.title")}</div>
          <div className="page-header-subtitle">{filtered.length} documents</div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Upload size={15} />{t("documents.uploadDocument")}
        </button>
      </div>

      <div className="filters-row">
        <div className="search-box">
          <Search size={15} className="search-icon" />
          <input className="form-control" style={{ paddingLeft: 36 }} placeholder={t("common.search")} value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="filter-select" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
          <option value="all">{t("common.all")}</option>
          {["contract","brief","motion","correspondence","evidence","pleading","court","other"].map(t2 => (
            <option key={t2} value={t2}>{t(`documents.documentTypes.${t2}`)}</option>
          ))}
        </select>
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>{t("documents.fileName")}</th>
                <th>{t("documents.fileType")}</th>
                <th>{t("matters.matter")}</th>
                <th>{t("documents.version")}</th>
                <th>{t("documents.uploadedBy")}</th>
                <th>{t("common.date")}</th>
                <th>{t("common.status")}</th>
                <th>{t("common.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(doc => (
                <tr key={doc.id}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      {fileExtIcon(doc.fileName)}
                      <div>
                        <div style={{ fontWeight: 500, fontSize: 13 }}>{doc.fileName}</div>
                        <div style={{ fontSize: 11, color: "var(--gray-400)" }}>{fmtSize(doc.fileSize)}</div>
                      </div>
                    </div>
                  </td>
                  <td><span className="badge badge-blue">{t(`documents.documentTypes.${doc.documentType}`)}</span></td>
                  <td style={{ fontSize: 12, maxWidth: 180 }}>
                    <div className="truncate" title={getMatter(doc.matterId)}>{getMatter(doc.matterId)}</div>
                  </td>
                  <td>
                    <span style={{ background: "var(--gray-100)", padding: "2px 8px", borderRadius: 4, fontSize: 12, fontWeight: 500 }}>v{doc.version}</span>
                  </td>
                  <td style={{ fontSize: 12 }}>{getUser(doc.uploadedBy)}</td>
                  <td style={{ fontSize: 12, color: "var(--gray-500)" }}>{doc.uploadedAt.split("T")[0]}</td>
                  <td>
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                      {doc.checkedOutBy && (
                        <span className="badge badge-orange" title={`Extrait par ${getUser(doc.checkedOutBy)}`}>
                          <Lock size={10} style={{ marginRight: 3 }} />{t("documents.checkedOut")}
                        </span>
                      )}
                      {doc.signed && <span className="badge badge-green">{t("documents.signed")}</span>}
                      {doc.tags.slice(0,2).map(tag => <span key={tag} className="badge badge-gray">{tag}</span>)}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: 4 }}>
                      <button className="btn btn-ghost btn-sm btn-icon" title={t("common.download")}><Download size={14} /></button>
                      <button className="btn btn-ghost btn-sm btn-icon" onClick={() => handleCheckout(doc.id)} title={doc.checkedOutBy ? t("documents.checkIn") : t("documents.checkOut")}>
                        {doc.checkedOutBy ? <Unlock size={14} /> : <Lock size={14} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!filtered.length && (
                <tr><td colSpan={8}><div className="empty-state"><div className="empty-state-text">{t("common.noData")}</div></div></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upload area */}
      <div className="card" style={{ marginTop: 20 }}>
        <div className="card-header"><span className="card-title">{t("documents.uploadDocument")}</span></div>
        <div className="card-body">
          <div style={{
            border: "2px dashed var(--gray-300)", borderRadius: 12, padding: "40px 20px",
            textAlign: "center", cursor: "pointer", transition: "all 0.15s", color: "var(--gray-400)"
          }}
            onDragOver={e => { e.preventDefault(); }}
            onClick={() => setShowModal(true)}
          >
            <Upload size={32} style={{ margin: "0 auto 12px", display: "block" }} />
            <div style={{ fontSize: 15, color: "var(--gray-600)", fontWeight: 500 }}>{t("documents.dragDrop")}</div>
            <div style={{ fontSize: 12, marginTop: 6 }}>{t("documents.maxSize")}</div>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">{t("documents.uploadDocument")}</span>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label required">{t("documents.fileName")}</label>
                <input className="form-control" placeholder="nom_fichier.pdf" value={form.fileName || ""} onChange={e => setForm(f => ({ ...f, fileName: e.target.value }))} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">{t("documents.fileType")}</label>
                  <select className="form-control" value={form.documentType || "other"} onChange={e => setForm(f => ({ ...f, documentType: e.target.value as DocumentType }))}>
                    {["contract","brief","motion","correspondence","evidence","pleading","court","other"].map(t2 => (
                      <option key={t2} value={t2}>{t(`documents.documentTypes.${t2}`)}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">{t("matters.matter")}</label>
                  <select className="form-control" value={form.matterId || ""} onChange={e => setForm(f => ({ ...f, matterId: e.target.value }))}>
                    <option value="">-- {t("matters.matter")} --</option>
                    {mockMatters.map(m => <option key={m.id} value={m.id}>{m.matterId} – {m.title}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">{t("common.description")}</label>
                <textarea className="form-control" value={form.description || ""} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div style={{ border: "2px dashed var(--gray-300)", borderRadius: 8, padding: "30px 20px", textAlign: "center", color: "var(--gray-400)", marginBottom: 16 }}>
                <Upload size={24} style={{ margin: "0 auto 8px", display: "block" }} />
                <div style={{ fontSize: 13 }}>{t("documents.dragDrop")}</div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowModal(false)}>{t("common.cancel")}</button>
              <button className="btn btn-primary" onClick={handleSubmit}><Upload size={15} />{t("documents.uploadDocument")}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
