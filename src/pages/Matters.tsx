import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Search, Eye, Edit2, X } from "lucide-react";
import { useApp } from "../context/AppContext";
import { useData } from "../context/DataContext";
import { Matter, MatterStatus, PracticeArea } from "../types";

const fmt = (n: number) => new Intl.NumberFormat("fr-CM", { style: "currency", currency: "XAF", maximumFractionDigits: 0 }).format(n);

export default function Matters() {
  const { t } = useTranslation();
  const { users } = useApp();
  const { matters, setMatters, clients, documents, tasks, timeEntries } = useData();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [areaFilter, setAreaFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState<Matter | null>(null);
  const [detailView, setDetailView] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [form, setForm] = useState<Partial<Matter>>({ status: "open", billingModel: "hourly", team: [] });
  const [errors, setErrors] = useState<Record<string,string>>({});

  const getClient   = (id: string) => clients.find(c => c.id === id);
  const getUser     = (id: string) => { const u = users.find(u => u.id === id); return u ? `${u.firstName} ${u.lastName}` : id; };

  const filtered = matters.filter(m => {
    const q = search.toLowerCase();
    const matchSearch = !q || m.title.toLowerCase().includes(q) || m.matterId.toLowerCase().includes(q) || (getClient(m.clientId)?.name || "").toLowerCase().includes(q);
    return matchSearch && (statusFilter === "all" || m.status === statusFilter) && (areaFilter === "all" || m.practiceArea === areaFilter);
  });

  const statusBadge = (status: string) => {
    const map: Record<string,string> = { active:"badge-blue", open:"badge-green", pending:"badge-yellow", closed:"badge-gray", archived:"badge-gray" };
    return <span className={`badge ${map[status]||"badge-gray"}`}>{t(`matters.statuses.${status}`)}</span>;
  };

  const validate = () => {
    const e: Record<string,string> = {};
    if (!form.title?.trim()) e.title = t("errors.required");
    if (!form.clientId) e.clientId = t("errors.required");
    if (!form.practiceArea) e.practiceArea = t("errors.required");
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    if (selected && !detailView) {
      setMatters(prev => prev.map(m => m.id === selected.id ? { ...m, ...form } as Matter : m));
    } else {
      const year = new Date().getFullYear();
      const num  = String(matters.length + 1).padStart(3, "0");
      const newMatter: Matter = {
        id:           `m${Date.now()}`,
        matterId:     `DK-${year}-${num}`,
        title:        form.title!,
        clientId:     form.clientId!,
        practiceArea: form.practiceArea as PracticeArea,
        status:       (form.status || "open") as MatterStatus,
        openDate:     new Date().toISOString().split("T")[0],
        jurisdiction: form.jurisdiction || "",
        billingModel: (form.billingModel as any) || "hourly",
        description:  form.description,
        opposingCounsel: form.opposingCounsel,
        court:        form.court,
        judge:        form.judge,
        team:         [],
      };
      setMatters(prev => [newMatter, ...prev]);
    }
    setShowModal(false);
    setForm({ status: "open", billingModel: "hourly", team: [] });
    setSelected(null);
    setErrors({});
  };

  const openEdit   = (m: Matter) => { setSelected(m); setForm(m); setDetailView(false); setShowModal(true); };
  const openDetail = (m: Matter) => { setSelected(m); setDetailView(true); setActiveTab("overview"); };

  const practiceAreas = ["corporate","litigation","employment","realEstate","ip","tax","banking","arbitration","family","criminal"];
  const billingModels = ["hourly","flatFee","contingency","retainer"];

  if (detailView && selected) {
    const mDocs  = documents.filter(d => d.matterId === selected.id);
    const mTasks = tasks.filter(t2 => t2.matterId === selected.id);
    const mTime  = timeEntries.filter(te => te.matterId === selected.id);
    const totalH = mTime.reduce((s,te) => s+te.hours, 0);
    const billH  = mTime.filter(te => te.billable).reduce((s,te) => s+te.hours, 0);

    return (
      <div>
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:20 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => setDetailView(false)}>← {t("common.back")}</button>
          <div style={{ flex:1 }}>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <h2 style={{ fontSize:18, fontWeight:700, color:"var(--navy)" }}>{selected.title}</h2>
              {statusBadge(selected.status)}
            </div>
            <div style={{ fontSize:12, color:"var(--gray-500)", marginTop:2 }}>{selected.matterId} · {getClient(selected.clientId)?.name}</div>
          </div>
          <button className="btn btn-outline btn-sm" onClick={() => openEdit(selected)}><Edit2 size={14}/>{t("common.edit")}</button>
        </div>

        <div className="tabs">
          {["overview","documents","tasks","time","team"].map(tab => (
            <button key={tab} className={`tab-btn ${activeTab===tab?"active":""}`} onClick={() => setActiveTab(tab)}>
              {tab==="overview"?t("matters.matterDetails"):tab==="documents"?`${t("nav.documents")} (${mDocs.length})`:tab==="tasks"?`${t("nav.tasks")} (${mTasks.length})`:tab==="time"?t("nav.timeTracking"):t("matters.matterTeam")}
            </button>
          ))}
        </div>

        {activeTab==="overview" && (
          <div className="form-row">
            <div className="card">
              <div className="card-header"><span className="card-title">{t("matters.matterDetails")}</span></div>
              <div className="card-body">
                {([
                  [t("matters.matterId"),       selected.matterId],
                  [t("matters.client"),          getClient(selected.clientId)?.name],
                  [t("matters.practiceArea"),    t(`matters.practiceAreas.${selected.practiceArea}`)],
                  [t("matters.status"),          statusBadge(selected.status)],
                  [t("matters.openDate"),        selected.openDate],
                  [t("matters.jurisdiction"),    selected.jurisdiction],
                  [t("matters.opposingCounsel"), selected.opposingCounsel],
                  [t("matters.court"),           selected.court],
                  [t("matters.judge"),           selected.judge],
                ] as [string,any][]).filter(([,v]) => v).map(([l,v],i) => (
                  <div key={i} style={{ display:"flex", gap:12, padding:"8px 0", borderBottom:"1px solid var(--gray-100)" }}>
                    <div style={{ width:160, fontSize:12, color:"var(--gray-500)", fontWeight:600, flexShrink:0 }}>{l}</div>
                    <div style={{ fontSize:13 }}>{v}</div>
                  </div>
                ))}
                {selected.description && <p style={{ marginTop:12, fontSize:13, color:"var(--gray-700)", lineHeight:1.6 }}>{selected.description}</p>}
              </div>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
              <div className="card">
                <div className="card-header"><span className="card-title">{t("time.totalHours")}</span></div>
                <div className="card-body">
                  <div style={{ display:"flex", gap:24 }}>
                    <div><div style={{ fontSize:26, fontWeight:800, color:"var(--navy)" }}>{totalH.toFixed(1)}h</div><div style={{ fontSize:12, color:"var(--gray-500)" }}>{t("time.totalHours")}</div></div>
                    <div><div style={{ fontSize:26, fontWeight:800, color:"var(--gold-dark)" }}>{billH.toFixed(1)}h</div><div style={{ fontSize:12, color:"var(--gray-500)" }}>{t("time.billableHours")}</div></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab==="documents" && (
          <div className="card">
            <div className="card-header"><span className="card-title">{t("matters.relatedDocuments")}</span></div>
            {mDocs.length === 0
              ? <div className="empty-state"><div className="empty-state-text">{t("common.noData")}</div></div>
              : <div className="table-container"><table><thead><tr><th>{t("documents.fileName")}</th><th>{t("documents.fileType")}</th><th>{t("documents.version")}</th><th>{t("common.date")}</th></tr></thead><tbody>
                {mDocs.map(d => <tr key={d.id}><td style={{fontWeight:500}}>{d.fileName}</td><td><span className="badge badge-blue">{t(`documents.documentTypes.${d.documentType}`)}</span></td><td>v{d.version}</td><td style={{fontSize:12}}>{d.uploadedAt.split("T")[0]}</td></tr>)}
              </tbody></table></div>}
          </div>
        )}

        {activeTab==="tasks" && (
          <div className="card">
            <div className="card-header"><span className="card-title">{t("matters.relatedTasks")}</span></div>
            {mTasks.length === 0
              ? <div className="empty-state"><div className="empty-state-text">{t("common.noData")}</div></div>
              : <div className="table-container"><table><thead><tr><th>{t("tasks.taskTitle")}</th><th>{t("tasks.taskStatus")}</th><th>{t("tasks.priority")}</th><th>{t("tasks.assignee")}</th><th>{t("tasks.dueDate")}</th></tr></thead><tbody>
                {mTasks.map(tk => <tr key={tk.id}><td style={{fontWeight:500}}>{tk.title}</td><td><span className={`badge badge-${tk.status==="done"?"green":tk.status==="inProgress"?"blue":"gray"}`}>{t(`tasks.statuses.${tk.status}`)}</span></td><td><span className={`priority-dot priority-${tk.priority}`}/>{t(`tasks.priorities.${tk.priority}`)}</td><td>{getUser(tk.assignedTo)}</td><td style={{fontSize:12}}>{tk.dueDate}</td></tr>)}
              </tbody></table></div>}
          </div>
        )}

        {activeTab==="time" && (
          <div className="card">
            <div className="card-header"><span className="card-title">{t("matters.timeEntries")}</span></div>
            {mTime.length === 0
              ? <div className="empty-state"><div className="empty-state-text">{t("common.noData")}</div></div>
              : <div className="table-container"><table><thead><tr><th>{t("common.date")}</th><th>{t("common.name")}</th><th>{t("time.activity")}</th><th>{t("time.hours")}</th><th>{t("time.billingRate")}</th><th>{t("time.billable")}</th></tr></thead><tbody>
                {mTime.map(te => <tr key={te.id}><td style={{fontSize:12}}>{te.date}</td><td>{getUser(te.userId)}</td><td>{t(`time.activities.${te.activity}`)}</td><td style={{fontWeight:600}}>{te.hours}h</td><td>{fmt(te.billingRate)}/h</td><td><span className={`badge ${te.billable?"badge-green":"badge-gray"}`}>{te.billable?t("time.billable"):t("time.nonBillable")}</span></td></tr>)}
              </tbody></table></div>}
          </div>
        )}

        {activeTab==="team" && (
          <div className="card">
            <div className="card-header"><span className="card-title">{t("matters.matterTeam")}</span></div>
            <div className="card-body">
              {selected.team.length === 0
                ? <div style={{ textAlign:"center", padding:32, color:"var(--gray-400)" }}>{t("common.noData")}</div>
                : selected.team.map(m => { const u = users.find(u => u.id === m.userId); return u ? (
                  <div key={m.userId} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 0", borderBottom:"1px solid var(--gray-100)" }}>
                    <div className="user-avatar" style={{ width:38, height:38, fontSize:13 }}>{u.firstName[0]}{u.lastName?.[0]||""}</div>
                    <div><div style={{fontWeight:500}}>{u.firstName} {u.lastName}</div><div style={{fontSize:12,color:"var(--gray-500)"}}>{m.role}</div></div>
                    <div style={{ marginLeft:"auto", fontSize:13, color:"var(--gray-500)" }}>{fmt(u.billingRate)}/h</div>
                  </div>
                ) : null; })}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-header-title">{t("matters.title")}</div>
          <div className="page-header-subtitle">{filtered.length} {t("matters.matterList").toLowerCase()}</div>
        </div>
        <button className="btn btn-gold" onClick={() => { setSelected(null); setDetailView(false); setForm({ status:"open", billingModel:"hourly", team:[] }); setErrors({}); setShowModal(true); }}>
          <Plus size={15}/>{t("matters.newMatter")}
        </button>
      </div>

      <div className="filters-row">
        <div className="search-box">
          <Search size={15} className="search-icon"/>
          <input className="form-control" style={{paddingLeft:38}} placeholder={t("common.search")} value={search} onChange={e => setSearch(e.target.value)}/>
        </div>
        <select className="filter-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="all">{t("matters.filters.allStatuses")}</option>
          {["open","active","pending","closed","archived"].map(s => <option key={s} value={s}>{t(`matters.statuses.${s}`)}</option>)}
        </select>
        <select className="filter-select" value={areaFilter} onChange={e => setAreaFilter(e.target.value)}>
          <option value="all">{t("matters.filters.allAreas")}</option>
          {practiceAreas.map(a => <option key={a} value={a}>{t(`matters.practiceAreas.${a}`)}</option>)}
        </select>
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead><tr><th>{t("matters.matterId")}</th><th>{t("matters.matterTitle")}</th><th>{t("matters.client")}</th><th>{t("matters.practiceArea")}</th><th>{t("matters.status")}</th><th>{t("matters.openDate")}</th><th>{t("common.actions")}</th></tr></thead>
            <tbody>
              {filtered.map(m => (
                <tr key={m.id}>
                  <td><span style={{fontFamily:"monospace",fontSize:12,background:"var(--gray-100)",padding:"2px 6px",borderRadius:4}}>{m.matterId}</span></td>
                  <td><div style={{fontWeight:500,color:"var(--navy)",cursor:"pointer"}} onClick={() => openDetail(m)}>{m.title}</div>{m.court&&<div style={{fontSize:11,color:"var(--gray-400)",marginTop:1}}>{m.court}</div>}</td>
                  <td>{getClient(m.clientId)?.name||<span style={{color:"var(--gray-400)",fontStyle:"italic"}}>—</span>}</td>
                  <td style={{fontSize:12}}>{t(`matters.practiceAreas.${m.practiceArea}`)}</td>
                  <td>{statusBadge(m.status)}</td>
                  <td style={{fontSize:12,color:"var(--gray-500)"}}>{m.openDate}</td>
                  <td><div style={{display:"flex",gap:4}}>
                    <button className="btn btn-ghost btn-sm btn-icon" onClick={() => openDetail(m)}><Eye size={14}/></button>
                    <button className="btn btn-ghost btn-sm btn-icon" onClick={() => openEdit(m)}><Edit2 size={14}/></button>
                  </div></td>
                </tr>
              ))}
              {!filtered.length && <tr><td colSpan={7}><div className="empty-state"><div className="empty-state-icon"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg></div><div className="empty-state-text">{t("common.noData")}</div><div className="empty-state-sub">{t("matters.newMatter")} →</div></div></td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">{selected&&!detailView ? t("matters.editMatter") : t("matters.newMatter")}</span>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}><X size={18}/></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label required">{t("matters.matterTitle")}</label>
                <input className="form-control" value={form.title||""} onChange={e => setForm(f=>({...f,title:e.target.value}))} placeholder={t("matters.matterTitle")}/>
                {errors.title && <div className="form-error">{errors.title}</div>}
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label required">{t("matters.client")}</label>
                  <select className="form-control" value={form.clientId||""} onChange={e => setForm(f=>({...f,clientId:e.target.value}))}>
                    <option value="">— {t("matters.client")} —</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  {errors.clientId && <div className="form-error">{errors.clientId}</div>}
                  {clients.length===0 && <div className="form-hint" style={{color:"var(--warning)"}}>⚠ {t("clients.title")} — {t("common.noData")}. {t("clients.newClient")} first.</div>}
                </div>
                <div className="form-group">
                  <label className="form-label required">{t("matters.practiceArea")}</label>
                  <select className="form-control" value={form.practiceArea||""} onChange={e => setForm(f=>({...f,practiceArea:e.target.value as PracticeArea}))}>
                    <option value="">— {t("matters.practiceArea")} —</option>
                    {practiceAreas.map(a => <option key={a} value={a}>{t(`matters.practiceAreas.${a}`)}</option>)}
                  </select>
                  {errors.practiceArea && <div className="form-error">{errors.practiceArea}</div>}
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">{t("matters.status")}</label>
                  <select className="form-control" value={form.status||"open"} onChange={e => setForm(f=>({...f,status:e.target.value as MatterStatus}))}>
                    {["open","active","pending","closed","archived"].map(s => <option key={s} value={s}>{t(`matters.statuses.${s}`)}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">{t("matters.jurisdiction")}</label>
                  <input className="form-control" value={form.jurisdiction||""} onChange={e => setForm(f=>({...f,jurisdiction:e.target.value}))} placeholder="e.g. TGI Wouri, Douala"/>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">{t("matters.court")}</label>
                  <input className="form-control" value={form.court||""} onChange={e => setForm(f=>({...f,court:e.target.value}))}/>
                </div>
                <div className="form-group">
                  <label className="form-label">{t("matters.judge")}</label>
                  <input className="form-control" value={form.judge||""} onChange={e => setForm(f=>({...f,judge:e.target.value}))}/>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">{t("matters.opposingCounsel")}</label>
                  <input className="form-control" value={form.opposingCounsel||""} onChange={e => setForm(f=>({...f,opposingCounsel:e.target.value}))}/>
                </div>
                <div className="form-group">
                  <label className="form-label">{t("billing.title")} — {t("billing.billingModels.hourly").toLowerCase()}</label>
                  <select className="form-control" value={form.billingModel||"hourly"} onChange={e => setForm(f=>({...f,billingModel:e.target.value as any}))}>
                    {billingModels.map(b => <option key={b} value={b}>{t(`billing.billingModels.${b}`)}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">{t("common.description")}</label>
                <textarea className="form-control" value={form.description||""} onChange={e => setForm(f=>({...f,description:e.target.value}))} placeholder={t("common.description")}/>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowModal(false)}>{t("common.cancel")}</button>
              <button className="btn btn-gold" onClick={handleSubmit}><Plus size={15}/>{t("common.save")}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}