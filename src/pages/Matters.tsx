import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Search, Eye, Edit2, X } from "lucide-react";
import { mockMatters, mockClients, mockUsers, mockTasks, mockTimeEntries, mockDocuments } from "../data/mockData";
import { Matter, MatterStatus, PracticeArea } from "../types";

const fmt = (n: number) => new Intl.NumberFormat("fr-CM", { style: "currency", currency: "XAF", maximumFractionDigits: 0 }).format(n);

export default function Matters() {
  const { t } = useTranslation();
  const [matters, setMatters] = useState<Matter[]>(mockMatters);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [areaFilter, setAreaFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [selectedMatter, setSelectedMatter] = useState<Matter | null>(null);
  const [activeTab, setActiveTab] = useState("overview");

  const getClient = (id: string) => mockClients.find(c => c.id === id);
  const getUser = (id: string) => { const u = mockUsers.find(u => u.id === id); return u ? `${u.firstName} ${u.lastName}` : id; };

  const filtered = matters.filter(m => {
    const q = search.toLowerCase();
    const matchSearch = !q || m.title.toLowerCase().includes(q) || m.matterId.toLowerCase().includes(q) || (getClient(m.clientId)?.name || "").toLowerCase().includes(q);
    const matchStatus = statusFilter === "all" || m.status === statusFilter;
    const matchArea = areaFilter === "all" || m.practiceArea === areaFilter;
    return matchSearch && matchStatus && matchArea;
  });

  const statusBadge = (status: string) => {
    const map: Record<string, string> = { active: "badge-blue", open: "badge-green", pending: "badge-yellow", closed: "badge-gray", archived: "badge-gray" };
    return <span className={`badge ${map[status] || "badge-gray"}`}>{t(`matters.statuses.${status}`)}</span>;
  };

  const billingBadge = (model: string) => {
    const map: Record<string, string> = { hourly: "badge-purple", flatFee: "badge-blue", contingency: "badge-gold", retainer: "badge-green" };
    return <span className={`badge ${map[model] || "badge-gray"}`}>{t(`billing.billingModels.${model}`)}</span>;
  };

  const [form, setForm] = useState<Partial<Matter>>({ status: "open", billingModel: "hourly", team: [] });

  const handleSubmit = () => {
    if (!form.title || !form.clientId || !form.practiceArea) return;
    if (selectedMatter) {
      setMatters(prev => prev.map(m => m.id === selectedMatter.id ? { ...m, ...form } as Matter : m));
    } else {
      const newMatter: Matter = {
        id: `m${Date.now()}`,
        matterId: `DK-${new Date().getFullYear()}-${String(matters.length + 1).padStart(3, "0")}`,
        title: form.title!, clientId: form.clientId!, practiceArea: form.practiceArea as PracticeArea,
        status: (form.status || "open") as MatterStatus, openDate: new Date().toISOString().split("T")[0],
        jurisdiction: form.jurisdiction || "", billingModel: form.billingModel as any || "hourly",
        description: form.description, team: [],
      };
      setMatters(prev => [newMatter, ...prev]);
    }
    setShowModal(false);
    setForm({ status: "open", billingModel: "hourly", team: [] });
    setSelectedMatter(null);
  };

  const openEdit = (m: Matter) => { setSelectedMatter(m); setForm(m); setShowModal(true); };
  const openDetail = (m: Matter) => { setSelectedMatter(m); setActiveTab("overview"); };

  const matterDocs = selectedMatter ? mockDocuments.filter(d => d.matterId === selectedMatter.id) : [];
  const matterTasks = selectedMatter ? mockTasks.filter(t2 => t2.matterId === selectedMatter.id) : [];
  const matterTime = selectedMatter ? mockTimeEntries.filter(te => te.matterId === selectedMatter.id) : [];
  const totalHours = matterTime.reduce((s, te) => s + te.hours, 0);
  const billableHours = matterTime.filter(te => te.billable).reduce((s, te) => s + te.hours, 0);

  return (
    <div>
      {/* If viewing a specific matter */}
      {selectedMatter && !showModal ? (
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <button className="btn btn-ghost btn-sm" onClick={() => setSelectedMatter(null)}>← {t("common.back")}</button>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <h2 style={{ fontSize: 18, fontWeight: 700 }}>{selectedMatter.title}</h2>
                {statusBadge(selectedMatter.status)}
              </div>
              <div style={{ fontSize: 12, color: "var(--gray-500)", marginTop: 2 }}>
                {selectedMatter.matterId} · {getClient(selectedMatter.clientId)?.name}
              </div>
            </div>
            <button className="btn btn-outline btn-sm" onClick={() => openEdit(selectedMatter)}><Edit2 size={14} />{t("common.edit")}</button>
          </div>

          <div className="tabs">
            {["overview", "documents", "tasks", "time", "team"].map(tab => (
              <button key={tab} className={`tab-btn ${activeTab === tab ? "active" : ""}`} onClick={() => setActiveTab(tab)}>
                {tab === "overview" ? t("matters.matterDetails") : tab === "documents" ? t("nav.documents") : tab === "tasks" ? t("nav.tasks") : tab === "time" ? t("nav.timeTracking") : t("matters.matterTeam")}
              </button>
            ))}
          </div>

          {activeTab === "overview" && (
            <div className="form-row">
              <div className="card">
                <div className="card-header"><span className="card-title">{t("matters.matterDetails")}</span></div>
                <div className="card-body">
                  {[
                    [t("matters.matterId"), selectedMatter.matterId],
                    [t("matters.client"), getClient(selectedMatter.clientId)?.name],
                    [t("matters.practiceArea"), t(`matters.practiceAreas.${selectedMatter.practiceArea}`)],
                    [t("matters.status"), statusBadge(selectedMatter.status)],
                    [t("matters.openDate"), selectedMatter.openDate],
                    [t("matters.jurisdiction"), selectedMatter.jurisdiction],
                    [t("billing.billingModels.hourly").replace("Horaire","") + t("billing.title").split("").slice(0,10).join(""), billingBadge(selectedMatter.billingModel)],
                    [t("matters.opposingCounsel"), selectedMatter.opposingCounsel],
                    [t("matters.court"), selectedMatter.court],
                    [t("matters.judge"), selectedMatter.judge],
                  ].filter(([,v]) => v).map(([label, val], i) => (
                    <div key={i} style={{ display: "flex", gap: 12, padding: "8px 0", borderBottom: "1px solid var(--gray-100)" }}>
                      <div style={{ width: 160, fontSize: 12, color: "var(--gray-500)", fontWeight: 500, flexShrink: 0 }}>{label}</div>
                      <div style={{ fontSize: 13, color: "var(--gray-800)" }}>{val}</div>
                    </div>
                  ))}
                  {selectedMatter.description && (
                    <div style={{ marginTop: 12 }}>
                      <div style={{ fontSize: 12, color: "var(--gray-500)", fontWeight: 500, marginBottom: 4 }}>{t("common.description")}</div>
                      <p style={{ fontSize: 13, color: "var(--gray-700)", lineHeight: 1.6 }}>{selectedMatter.description}</p>
                    </div>
                  )}
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div className="card">
                  <div className="card-header"><span className="card-title">{t("nav.timeTracking")}</span></div>
                  <div className="card-body">
                    <div style={{ display: "flex", gap: 20 }}>
                      <div><div style={{ fontSize: 22, fontWeight: 700 }}>{totalHours.toFixed(1)}h</div><div style={{ fontSize: 12, color: "var(--gray-500)" }}>{t("time.totalHours")}</div></div>
                      <div><div style={{ fontSize: 22, fontWeight: 700, color: "var(--primary)" }}>{billableHours.toFixed(1)}h</div><div style={{ fontSize: 12, color: "var(--gray-500)" }}>{t("time.billableHours")}</div></div>
                    </div>
                  </div>
                </div>
                {selectedMatter.estimatedValue && (
                  <div className="card">
                    <div className="card-header"><span className="card-title">{t("common.amount")}</span></div>
                    <div className="card-body">
                      <div style={{ fontSize: 20, fontWeight: 700, color: "var(--success)" }}>{fmt(selectedMatter.estimatedValue)}</div>
                      <div style={{ fontSize: 12, color: "var(--gray-500)", marginTop: 2 }}>Valeur estimée du dossier</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "documents" && (
            <div className="card">
              <div className="card-header">
                <span className="card-title">{t("matters.relatedDocuments")} ({matterDocs.length})</span>
                <button className="btn btn-primary btn-sm"><Plus size={14} />{t("documents.uploadDocument")}</button>
              </div>
              <div className="table-container">
                <table>
                  <thead><tr><th>{t("documents.fileName")}</th><th>{t("documents.fileType")}</th><th>{t("documents.version")}</th><th>{t("documents.uploadedBy")}</th><th>{t("common.date")}</th></tr></thead>
                  <tbody>
                    {matterDocs.map(d => (
                      <tr key={d.id}>
                        <td style={{ fontWeight: 500 }}>{d.fileName}</td>
                        <td><span className="badge badge-blue">{t(`documents.documentTypes.${d.documentType}`)}</span></td>
                        <td>v{d.version}</td>
                        <td>{getUser(d.uploadedBy)}</td>
                        <td>{d.uploadedAt.split("T")[0]}</td>
                      </tr>
                    ))}
                    {!matterDocs.length && <tr><td colSpan={5}><div className="empty-state"><div className="empty-state-text">{t("common.noData")}</div></div></td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "tasks" && (
            <div className="card">
              <div className="card-header">
                <span className="card-title">{t("matters.relatedTasks")} ({matterTasks.length})</span>
              </div>
              <div className="table-container">
                <table>
                  <thead><tr><th>{t("tasks.taskTitle")}</th><th>{t("tasks.taskStatus")}</th><th>{t("tasks.priority")}</th><th>{t("tasks.assignee")}</th><th>{t("tasks.dueDate")}</th></tr></thead>
                  <tbody>
                    {matterTasks.map(task => (
                      <tr key={task.id}>
                        <td style={{ fontWeight: 500 }}>{task.title}</td>
                        <td><span className={`badge badge-${task.status === "done" ? "green" : task.status === "inProgress" ? "blue" : "gray"}`}>{t(`tasks.statuses.${task.status}`)}</span></td>
                        <td><span className={`priority-dot priority-${task.priority}`} />{t(`tasks.priorities.${task.priority}`)}</td>
                        <td>{getUser(task.assignedTo)}</td>
                        <td>{task.dueDate}</td>
                      </tr>
                    ))}
                    {!matterTasks.length && <tr><td colSpan={5}><div className="empty-state"><div className="empty-state-text">{t("common.noData")}</div></div></td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "time" && (
            <div className="card">
              <div className="card-header"><span className="card-title">{t("matters.timeEntries")}</span></div>
              <div className="table-container">
                <table>
                  <thead><tr><th>{t("common.date")}</th><th>{t("common.name")}</th><th>{t("time.activity")}</th><th>{t("time.hours")}</th><th>{t("time.billingRate")}</th><th>{t("time.billable")}</th></tr></thead>
                  <tbody>
                    {matterTime.map(te => (
                      <tr key={te.id}>
                        <td>{te.date}</td>
                        <td>{getUser(te.userId)}</td>
                        <td>{t(`time.activities.${te.activity}`)}</td>
                        <td>{te.hours}h</td>
                        <td>{fmt(te.billingRate)}/h</td>
                        <td><span className={`badge ${te.billable ? "badge-green" : "badge-gray"}`}>{te.billable ? t("time.billable") : t("time.nonBillable")}</span></td>
                      </tr>
                    ))}
                    {!matterTime.length && <tr><td colSpan={6}><div className="empty-state"><div className="empty-state-text">{t("common.noData")}</div></div></td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "team" && (
            <div className="card">
              <div className="card-header">
                <span className="card-title">{t("matters.matterTeam")}</span>
                <button className="btn btn-outline btn-sm"><Plus size={14} />{t("matters.addTeamMember")}</button>
              </div>
              <div className="card-body">
                {selectedMatter.team.map(member => {
                  const u = mockUsers.find(u => u.id === member.userId);
                  return u ? (
                    <div key={member.userId} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid var(--gray-100)" }}>
                      <div className="user-avatar" style={{ width: 38, height: 38, fontSize: 13 }}>{u.firstName[0]}{u.lastName[0]}</div>
                      <div>
                        <div style={{ fontWeight: 500 }}>{u.firstName} {u.lastName}</div>
                        <div style={{ fontSize: 12, color: "var(--gray-500)" }}>{member.role} · {t(`users.roles.${u.role}`)}</div>
                      </div>
                      <div style={{ marginLeft: "auto", fontSize: 13, color: "var(--gray-500)" }}>{fmt(u.billingRate)}/h</div>
                    </div>
                  ) : null;
                })}
              </div>
            </div>
          )}
        </div>
      ) : (
        <>
          {/* List view */}
          <div className="page-header">
            <div>
              <div className="page-header-title">{t("matters.title")}</div>
              <div className="page-header-subtitle">{filtered.length} {t("matters.matterList").toLowerCase()}</div>
            </div>
            <button className="btn btn-primary" onClick={() => { setSelectedMatter(null); setForm({ status: "open", billingModel: "hourly", team: [] }); setShowModal(true); }}>
              <Plus size={15} />{t("matters.newMatter")}
            </button>
          </div>

          <div className="filters-row">
            <div className="search-box">
              <Search size={15} className="search-icon" />
              <input className="form-control" style={{ paddingLeft: 36 }} placeholder={t("common.search")} value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select className="filter-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="all">{t("matters.filters.allStatuses")}</option>
              {["open","active","pending","closed","archived"].map(s => <option key={s} value={s}>{t(`matters.statuses.${s}`)}</option>)}
            </select>
            <select className="filter-select" value={areaFilter} onChange={e => setAreaFilter(e.target.value)}>
              <option value="all">{t("matters.filters.allAreas")}</option>
              {["corporate","litigation","employment","realEstate","ip","tax","banking","arbitration","family","criminal"].map(a => <option key={a} value={a}>{t(`matters.practiceAreas.${a}`)}</option>)}
            </select>
          </div>

          <div className="card">
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>{t("matters.matterId")}</th>
                    <th>{t("matters.matterTitle")}</th>
                    <th>{t("matters.client")}</th>
                    <th>{t("matters.practiceArea")}</th>
                    <th>{t("matters.status")}</th>
                    <th>{t("matters.openDate")}</th>
                    <th>{t("common.actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(m => (
                    <tr key={m.id}>
                      <td><span style={{ fontFamily: "monospace", fontSize: 12, background: "var(--gray-100)", padding: "2px 6px", borderRadius: 4 }}>{m.matterId}</span></td>
                      <td>
                        <div style={{ fontWeight: 500, color: "var(--gray-900)", cursor: "pointer" }} onClick={() => openDetail(m)}>{m.title}</div>
                        {m.court && <div style={{ fontSize: 11, color: "var(--gray-400)", marginTop: 1 }}>{m.court}</div>}
                      </td>
                      <td>{getClient(m.clientId)?.name}</td>
                      <td><span style={{ fontSize: 12 }}>{t(`matters.practiceAreas.${m.practiceArea}`)}</span></td>
                      <td>{statusBadge(m.status)}</td>
                      <td style={{ fontSize: 12, color: "var(--gray-500)" }}>{m.openDate}</td>
                      <td>
                        <div style={{ display: "flex", gap: 4 }}>
                          <button className="btn btn-ghost btn-sm btn-icon" onClick={() => openDetail(m)} title={t("common.view")}><Eye size={14} /></button>
                          <button className="btn btn-ghost btn-sm btn-icon" onClick={() => openEdit(m)} title={t("common.edit")}><Edit2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!filtered.length && (
                    <tr><td colSpan={7}><div className="empty-state"><div className="empty-state-text">{t("common.noData")}</div></div></td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">{selectedMatter ? t("matters.editMatter") : t("matters.newMatter")}</span>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label required">{t("matters.matterTitle")}</label>
                <input className="form-control" value={form.title || ""} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label required">{t("matters.client")}</label>
                  <select className="form-control" value={form.clientId || ""} onChange={e => setForm(f => ({ ...f, clientId: e.target.value }))}>
                    <option value="">-- {t("matters.client")} --</option>
                    {mockClients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label required">{t("matters.practiceArea")}</label>
                  <select className="form-control" value={form.practiceArea || ""} onChange={e => setForm(f => ({ ...f, practiceArea: e.target.value as PracticeArea }))}>
                    <option value="">-- {t("matters.practiceArea")} --</option>
                    {["corporate","litigation","employment","realEstate","ip","tax","banking","arbitration","family","criminal"].map(a => <option key={a} value={a}>{t(`matters.practiceAreas.${a}`)}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">{t("matters.status")}</label>
                  <select className="form-control" value={form.status || "open"} onChange={e => setForm(f => ({ ...f, status: e.target.value as MatterStatus }))}>
                    {["open","active","pending","closed","archived"].map(s => <option key={s} value={s}>{t(`matters.statuses.${s}`)}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">{t("matters.jurisdiction")}</label>
                  <input className="form-control" value={form.jurisdiction || ""} onChange={e => setForm(f => ({ ...f, jurisdiction: e.target.value }))} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">{t("matters.court")}</label>
                  <input className="form-control" value={form.court || ""} onChange={e => setForm(f => ({ ...f, court: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">{t("billing.billingModels.hourly").replace("Horaire","Modèle de facturation")}</label>
                  <select className="form-control" value={form.billingModel || "hourly"} onChange={e => setForm(f => ({ ...f, billingModel: e.target.value as any }))}>
                    {["hourly","flatFee","contingency","retainer"].map(b => <option key={b} value={b}>{t(`billing.billingModels.${b}`)}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">{t("common.description")}</label>
                <textarea className="form-control" value={form.description || ""} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowModal(false)}>{t("common.cancel")}</button>
              <button className="btn btn-primary" onClick={handleSubmit}>{t("common.save")}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
