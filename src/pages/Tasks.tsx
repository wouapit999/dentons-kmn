import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Search, Check, X, Edit2, AlertTriangle, Clock } from "lucide-react";
import { useApp } from "../context/AppContext";
import { useData } from "../context/DataContext";
import { Task, TaskStatus, TaskPriority } from "../types";

export default function Tasks() {
  const { t } = useTranslation();
  const { users } = useApp();
  const { tasks, setTasks, matters } = useData();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Task|null>(null);
  const [form, setForm] = useState<Partial<Task>>({ status:"todo", priority:"medium" });
  const [errors, setErrors] = useState<Record<string,string>>({});

  const today = new Date().toISOString().split("T")[0];
  const isOverdue = (tk: Task) => tk.dueDate < today && tk.status!=="done" && tk.status!=="cancelled";
  const isDueToday = (tk: Task) => tk.dueDate === today;

  const getUser = (id: string) => { const u = users.find(u=>u.id===id); return u?`${u.firstName} ${u.lastName}`:id; };
  const getMatter = (id?: string) => matters.find(m=>m.id===id);

  const filtered = tasks.filter(tk =>
    (!search || tk.title.toLowerCase().includes(search.toLowerCase())) &&
    (statusFilter==="all" || tk.status===statusFilter) &&
    (priorityFilter==="all" || tk.priority===priorityFilter)
  );

  const validate = () => {
    const e: Record<string,string> = {};
    if (!form.title?.trim()) e.title = t("errors.required");
    if (!form.assignedTo) e.assignedTo = t("errors.required");
    if (!form.dueDate) e.dueDate = t("errors.required");
    setErrors(e); return Object.keys(e).length===0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    if (editing) {
      setTasks(prev => prev.map(tk => tk.id===editing.id ? {...tk,...form} as Task : tk));
    } else {
      setTasks(prev => [{
        id:`t${Date.now()}`, title:form.title!, assignedTo:form.assignedTo!,
        status:(form.status||"todo") as TaskStatus, priority:(form.priority||"medium") as TaskPriority,
        dueDate:form.dueDate!, createdAt:new Date().toISOString(),
        matterId:form.matterId, description:form.description,
      }, ...prev]);
    }
    setShowModal(false); setEditing(null); setForm({ status:"todo", priority:"medium" }); setErrors({});
  };

  const markDone = (id: string) => setTasks(prev => prev.map(tk => tk.id===id ? {...tk, status:"done" as TaskStatus, completedAt:new Date().toISOString()} : tk));
  const openEdit = (tk: Task) => { setEditing(tk); setForm(tk); setShowModal(true); };

  const priorityBadge = (p: string) => {
    const map: Record<string,string> = { low:"badge-gray", medium:"badge-blue", high:"badge-yellow", urgent:"badge-red" };
    return <span className={`badge ${map[p]}`} style={{display:"inline-flex",alignItems:"center",gap:4}}><span className={`priority-dot priority-${p}`}/>{t(`tasks.priorities.${p}`)}</span>;
  };
  const statusBadge = (s: string) => {
    const map: Record<string,string> = { todo:"badge-gray", inProgress:"badge-blue", review:"badge-yellow", done:"badge-green", cancelled:"badge-gray" };
    return <span className={`badge ${map[s]}`}>{t(`tasks.statuses.${s}`)}</span>;
  };

  const cols = [
    { status:"todo",       color:"var(--gray-400)" },
    { status:"inProgress", color:"var(--info)" },
    { status:"review",     color:"var(--warning)" },
    { status:"done",       color:"var(--success)" },
  ];

  return (
    <div>
      <div className="page-header">
        <div><div className="page-header-title">{t("tasks.title")}</div><div className="page-header-subtitle">{tasks.filter(tk=>tk.status!=="done"&&tk.status!=="cancelled").length} {t("dashboard.pendingTasks").toLowerCase()}</div></div>
        <button className="btn btn-gold" onClick={() => { setEditing(null); setForm({ status:"todo", priority:"medium" }); setErrors({}); setShowModal(true); }}>
          <Plus size={15}/>{t("tasks.newTask")}
        </button>
      </div>

      <div className="filters-row">
        <div className="search-box"><Search size={15} className="search-icon"/><input className="form-control" style={{paddingLeft:38}} placeholder={t("common.search")} value={search} onChange={e=>setSearch(e.target.value)}/></div>
        <select className="filter-select" value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}>
          <option value="all">{t("common.all")}</option>
          {["todo","inProgress","review","done","cancelled"].map(s=><option key={s} value={s}>{t(`tasks.statuses.${s}`)}</option>)}
        </select>
        <select className="filter-select" value={priorityFilter} onChange={e=>setPriorityFilter(e.target.value)}>
          <option value="all">{t("common.all")}</option>
          {["urgent","high","medium","low"].map(p=><option key={p} value={p}>{t(`tasks.priorities.${p}`)}</option>)}
        </select>
      </div>

      {/* Kanban */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4, 1fr)", gap:16, marginBottom:24 }}>
        {cols.map(col => {
          const colTasks = filtered.filter(tk => tk.status===col.status);
          return (
            <div key={col.status}>
              <div className="kanban-col-header">
                <div style={{ width:10, height:10, borderRadius:"50%", background:col.color }}/>
                <span className="kanban-col-title">{t(`tasks.statuses.${col.status}`)}</span>
                <span className="kanban-count">{colTasks.length}</span>
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:10, minHeight:100 }}>
                {colTasks.map(tk => (
                  <div key={tk.id} className="card" style={{ padding:14 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:8 }}>
                      <div style={{ fontWeight:500, fontSize:13, flex:1, lineHeight:1.4 }}>{tk.title}</div>
                      <div style={{ display:"flex", gap:4, flexShrink:0 }}>
                        {tk.status!=="done" && <button className="btn btn-ghost btn-sm btn-icon" onClick={()=>markDone(tk.id)} title={t("tasks.markComplete")}><Check size={13}/></button>}
                        <button className="btn btn-ghost btn-sm btn-icon" onClick={()=>openEdit(tk)}><Edit2 size={13}/></button>
                      </div>
                    </div>
                    {tk.matterId && <div style={{ fontSize:11, color:"var(--gray-400)", marginTop:5 }}>📁 {getMatter(tk.matterId)?.matterId}</div>}
                    <div style={{ display:"flex", alignItems:"center", gap:6, marginTop:8, flexWrap:"wrap" }}>
                      {priorityBadge(tk.priority)}
                      {isOverdue(tk) && <span className="badge badge-red"><AlertTriangle size={10}/>{t("tasks.overdue")}</span>}
                      {isDueToday(tk) && !isOverdue(tk) && <span className="badge badge-yellow"><Clock size={10}/>{t("tasks.dueToday")}</span>}
                    </div>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:10 }}>
                      <div style={{ fontSize:11, color:"var(--gray-400)" }}><Clock size={10} style={{marginRight:3,verticalAlign:"middle"}}/>{tk.dueDate}</div>
                      <div className="user-avatar" style={{ width:24, height:24, fontSize:10, fontWeight:700, border:"1px solid var(--gold)" }} title={getUser(tk.assignedTo)}>
                        {getUser(tk.assignedTo).split(" ").map(n=>n[0]).join("").slice(0,2)}
                      </div>
                    </div>
                  </div>
                ))}
                {colTasks.length===0 && <div style={{ border:"2px dashed var(--gray-200)", borderRadius:8, padding:20, textAlign:"center", color:"var(--gray-300)", fontSize:12 }}>{t("common.noData")}</div>}
              </div>
            </div>
          );
        })}
      </div>

      {/* Table */}
      <div className="card">
        <div className="card-header"><span className="card-title">{t("tasks.allTasks")}</span></div>
        <div className="table-container">
          <table>
            <thead><tr><th>{t("tasks.taskTitle")}</th><th>{t("tasks.priority")}</th><th>{t("tasks.taskStatus")}</th><th>{t("tasks.assignee")}</th><th>{t("tasks.dueDate")}</th><th>{t("matters.matter")}</th><th>{t("common.actions")}</th></tr></thead>
            <tbody>
              {filtered.map(tk => (
                <tr key={tk.id} style={{ opacity:tk.status==="done"?0.6:1 }}>
                  <td><div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    {isOverdue(tk) && <AlertTriangle size={14} color="var(--danger)"/>}
                    <span style={{ fontWeight:500, textDecoration:tk.status==="done"?"line-through":"none" }}>{tk.title}</span>
                  </div></td>
                  <td>{priorityBadge(tk.priority)}</td>
                  <td>{statusBadge(tk.status)}</td>
                  <td style={{fontSize:13}}>{getUser(tk.assignedTo)}</td>
                  <td style={{ fontSize:12, color:isOverdue(tk)?"var(--danger)":"var(--gray-600)", fontWeight:isOverdue(tk)?700:400 }}>{tk.dueDate}</td>
                  <td style={{fontSize:12,color:"var(--gray-500)"}}>{getMatter(tk.matterId)?.matterId||"—"}</td>
                  <td><div style={{display:"flex",gap:4}}>
                    {tk.status!=="done" && <button className="btn btn-ghost btn-sm btn-icon" onClick={()=>markDone(tk.id)} title={t("tasks.markComplete")}><Check size={14}/></button>}
                    <button className="btn btn-ghost btn-sm btn-icon" onClick={()=>openEdit(tk)}><Edit2 size={14}/></button>
                  </div></td>
                </tr>
              ))}
              {!filtered.length && <tr><td colSpan={7}><div className="empty-state"><div className="empty-state-text">{t("common.noData")}</div></div></td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={()=>setShowModal(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">{editing?t("tasks.editTask"):t("tasks.newTask")}</span>
              <button className="btn btn-ghost btn-icon" onClick={()=>setShowModal(false)}><X size={18}/></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label required">{t("tasks.taskTitle")}</label>
                <input className="form-control" value={form.title||""} onChange={e=>setForm(f=>({...f,title:e.target.value}))} placeholder={t("tasks.taskTitle")}/>
                {errors.title&&<div className="form-error">{errors.title}</div>}
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label required">{t("tasks.assignee")}</label>
                  <select className="form-control" value={form.assignedTo||""} onChange={e=>setForm(f=>({...f,assignedTo:e.target.value}))}>
                    <option value="">— {t("tasks.assignee")} —</option>
                    {users.filter(u=>u.active).map(u=><option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>)}
                  </select>
                  {errors.assignedTo&&<div className="form-error">{errors.assignedTo}</div>}
                </div>
                <div className="form-group">
                  <label className="form-label required">{t("tasks.dueDate")}</label>
                  <input className="form-control" type="date" value={form.dueDate||""} onChange={e=>setForm(f=>({...f,dueDate:e.target.value}))}/>
                  {errors.dueDate&&<div className="form-error">{errors.dueDate}</div>}
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">{t("tasks.priority")}</label>
                  <select className="form-control" value={form.priority||"medium"} onChange={e=>setForm(f=>({...f,priority:e.target.value as TaskPriority}))}>
                    {["urgent","high","medium","low"].map(p=><option key={p} value={p}>{t(`tasks.priorities.${p}`)}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">{t("tasks.taskStatus")}</label>
                  <select className="form-control" value={form.status||"todo"} onChange={e=>setForm(f=>({...f,status:e.target.value as TaskStatus}))}>
                    {["todo","inProgress","review","done","cancelled"].map(s=><option key={s} value={s}>{t(`tasks.statuses.${s}`)}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">{t("tasks.relatedMatter")}</label>
                <select className="form-control" value={form.matterId||""} onChange={e=>setForm(f=>({...f,matterId:e.target.value}))}>
                  <option value="">— {t("tasks.relatedMatter")} ({t("common.optional")}) —</option>
                  {matters.map(m=><option key={m.id} value={m.id}>{m.matterId} – {m.title}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">{t("common.description")}</label>
                <textarea className="form-control" value={form.description||""} onChange={e=>setForm(f=>({...f,description:e.target.value}))} placeholder={t("common.description")}/>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={()=>setShowModal(false)}>{t("common.cancel")}</button>
              <button className="btn btn-gold" onClick={handleSubmit}><Plus size={15}/>{t("common.save")}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}