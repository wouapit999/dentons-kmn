import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Search, Check, X, Edit2, AlertTriangle, Clock, Users } from "lucide-react";
import { useApp } from "../context/AppContext";
import { useData } from "../context/DataContext";
import { Task, TaskStatus, TaskPriority } from "../types";

// ── Multi-user selector component ─────────────────────────────────────────
function UserSelector({
  selected, onChange, users, label,
}: {
  selected: string[];
  onChange: (ids: string[]) => void;
  users: any[];
  label: string;
}) {
  const [open, setOpen] = useState(false);
  const toggle = (id: string) => {
    onChange(selected.includes(id) ? selected.filter(s => s !== id) : [...selected, id]);
  };
  const selectedUsers = users.filter(u => selected.includes(u.id));

  return (
    <div style={{ position: "relative" }}>
      <div
        onClick={() => setOpen(!open)}
        style={{
          border: "1.5px solid var(--gray-300)", borderRadius: "var(--radius)",
          padding: "8px 12px", cursor: "pointer", background: "white",
          display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap",
          minHeight: 40,
        }}
      >
        {selectedUsers.length === 0
          ? <span style={{ color: "var(--gray-400)", fontSize: 14 }}>— {label} —</span>
          : selectedUsers.map(u => (
            <span key={u.id} style={{
              background: "var(--navy)", color: "white", borderRadius: 20,
              padding: "2px 10px", fontSize: 12, fontWeight: 600,
              display: "inline-flex", alignItems: "center", gap: 5,
            }}>
              {u.firstName[0]}{u.lastName?.[0] || ""}
              <span style={{ opacity: 0.7 }}>{u.firstName}</span>
              <button onClick={e => { e.stopPropagation(); toggle(u.id); }}
                style={{ background: "none", border: "none", cursor: "pointer", color: "white", padding: 0, lineHeight: 1 }}>×</button>
            </span>
          ))}
        <span style={{ marginLeft: "auto", color: "var(--gray-400)", fontSize: 12 }}>▾</span>
      </div>
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0,
          background: "white", border: "1px solid var(--gray-200)", borderRadius: "var(--radius)",
          boxShadow: "var(--shadow-md)", zIndex: 200, maxHeight: 220, overflowY: "auto",
        }}>
          {users.filter(u => u.active && u.role !== "client").map(u => (
            <div key={u.id}
              onClick={() => toggle(u.id)}
              style={{
                display: "flex", alignItems: "center", gap: 10, padding: "9px 14px",
                cursor: "pointer", background: selected.includes(u.id) ? "var(--gold-pale)" : "white",
                borderBottom: "1px solid var(--gray-100)",
              }}
              onMouseEnter={e => (e.currentTarget.style.background = selected.includes(u.id) ? "var(--gold-pale)" : "var(--gray-50)")}
              onMouseLeave={e => (e.currentTarget.style.background = selected.includes(u.id) ? "var(--gold-pale)" : "white")}
            >
              <div style={{
                width: 30, height: 30, borderRadius: "50%",
                background: selected.includes(u.id) ? "var(--gold)" : "var(--navy)",
                color: "white", display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 12, fontWeight: 700, flexShrink: 0,
              }}>
                {u.firstName[0]}{u.lastName?.[0] || ""}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: "var(--navy)" }}>{u.firstName} {u.lastName}</div>
                <div style={{ fontSize: 11, color: "var(--gray-500)" }}>{u.role}</div>
              </div>
              {selected.includes(u.id) && <span style={{ color: "var(--gold-dark)", fontWeight: 700, fontSize: 14 }}>✓</span>}
            </div>
          ))}
        </div>
      )}
      {open && <div style={{ position: "fixed", inset: 0, zIndex: 199 }} onClick={() => setOpen(false)}/>}
    </div>
  );
}

// ── Avatar stack for multiple assignees ───────────────────────────────────
function AssigneeAvatars({ ids, users, max = 3 }: { ids: string[]; users: any[]; max?: number }) {
  const shown = ids.slice(0, max);
  const rest  = ids.length - max;
  return (
    <div style={{ display: "flex", alignItems: "center" }}>
      {shown.map((id, i) => {
        const u = users.find(u => u.id === id);
        return u ? (
          <div key={id} title={`${u.firstName} ${u.lastName}`} style={{
            width: 24, height: 24, borderRadius: "50%",
            background: "var(--navy)", color: "white",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 10, fontWeight: 700, border: "2px solid white",
            marginLeft: i > 0 ? -8 : 0, zIndex: shown.length - i,
            position: "relative",
          }}>
            {u.firstName[0]}{u.lastName?.[0] || ""}
          </div>
        ) : null;
      })}
      {rest > 0 && (
        <div style={{
          width: 24, height: 24, borderRadius: "50%",
          background: "var(--gray-400)", color: "white",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 9, fontWeight: 700, border: "2px solid white",
          marginLeft: -8, position: "relative",
        }}>
          +{rest}
        </div>
      )}
    </div>
  );
}

export default function Tasks() {
  const { t } = useTranslation();
  const { users, session } = useApp();
  const { tasks, setTasks, matters } = useData();
  const [search, setSearch]           = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [myTasksOnly, setMyTasksOnly] = useState(false);
  const [showModal, setShowModal]     = useState(false);
  const [editing, setEditing]         = useState<Task | null>(null);
  const [form, setForm]               = useState<Partial<Task & { assignees: string[] }>>({
    status: "todo", priority: "medium", assignees: [],
  });
  const [errors, setErrors]           = useState<Record<string,string>>({});

  const today    = new Date().toISOString().split("T")[0];
  const getUser  = (id: string) => { const u = users.find(u => u.id === id); return u ? `${u.firstName} ${u.lastName}` : id; };
  const getMatter = (id?: string) => matters.find(m => m.id === id);
  const isOverdue = (tk: Task) => tk.dueDate < today && tk.status !== "done" && tk.status !== "cancelled";
  const isDueToday = (tk: Task) => tk.dueDate === today;

  // Helper: get all assignee IDs for a task
  const getAssignees = (tk: Task): string[] => {
    if (tk.assignees && tk.assignees.length > 0) return tk.assignees;
    if (tk.assignedTo) return [tk.assignedTo];
    return [];
  };

  const filtered = tasks.filter(tk => {
    const q = search.toLowerCase();
    const matchSearch    = !q || tk.title.toLowerCase().includes(q);
    const matchStatus    = statusFilter === "all" || tk.status === statusFilter;
    const matchPriority  = priorityFilter === "all" || tk.priority === priorityFilter;
    const matchMyTasks   = !myTasksOnly || getAssignees(tk).includes(session?.userId || "");
    return matchSearch && matchStatus && matchPriority && matchMyTasks;
  });

  const validate = () => {
    const e: Record<string,string> = {};
    if (!form.title?.trim()) e.title = t("errors.required");
    if (!form.assignees?.length) e.assignees = t("errors.required");
    if (!form.dueDate) e.dueDate = t("errors.required");
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    const primaryAssignee = form.assignees?.[0] || "";
    if (editing) {
      setTasks(prev => prev.map(tk => tk.id === editing.id
        ? { ...tk, ...form, assignedTo: primaryAssignee, assignees: form.assignees || [] } as Task
        : tk
      ));
    } else {
      const newTask: Task = {
        id:          `t${Date.now()}`,
        title:       form.title!,
        assignedTo:  primaryAssignee,
        assignees:   form.assignees || [primaryAssignee],
        status:      (form.status || "todo") as TaskStatus,
        priority:    (form.priority || "medium") as TaskPriority,
        dueDate:     form.dueDate!,
        createdAt:   new Date().toISOString(),
        matterId:    form.matterId,
        description: form.description,
      };
      setTasks(prev => [newTask, ...prev]);
    }
    setShowModal(false);
    setEditing(null);
    setForm({ status: "todo", priority: "medium", assignees: [] });
    setErrors({});
  };

  const markDone  = (id: string) => setTasks(prev => prev.map(tk =>
    tk.id === id ? { ...tk, status: "done" as TaskStatus, completedAt: new Date().toISOString() } : tk
  ));
  const openEdit  = (tk: Task) => {
    setEditing(tk);
    setForm({ ...tk, assignees: getAssignees(tk) });
    setShowModal(true);
  };

  const priorityBadge = (p: string) => {
    const map: Record<string,string> = { low:"badge-gray", medium:"badge-blue", high:"badge-yellow", urgent:"badge-red" };
    return (
      <span className={`badge ${map[p]}`} style={{ display:"inline-flex", alignItems:"center", gap:4 }}>
        <span className={`priority-dot priority-${p}`}/>
        {t(`tasks.priorities.${p}`)}
      </span>
    );
  };

  const statusBadge = (s: string) => {
    const map: Record<string,string> = { todo:"badge-gray", inProgress:"badge-blue", review:"badge-yellow", done:"badge-green", cancelled:"badge-gray" };
    return <span className={`badge ${map[s]}`}>{t(`tasks.statuses.${s}`)}</span>;
  };

  const cols = [
    { status:"todo",       color:"var(--gray-400)", label:t("tasks.statuses.todo") },
    { status:"inProgress", color:"var(--info)",     label:t("tasks.statuses.inProgress") },
    { status:"review",     color:"var(--warning)",  label:t("tasks.statuses.review") },
    { status:"done",       color:"var(--success)",  label:t("tasks.statuses.done") },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-header-title">{t("tasks.title")}</div>
          <div className="page-header-subtitle">
            {tasks.filter(tk => tk.status !== "done" && tk.status !== "cancelled").length} {t("dashboard.pendingTasks").toLowerCase()}
          </div>
        </div>
        <div style={{ display:"flex", gap:10, alignItems:"center" }}>
          <label style={{ display:"flex", alignItems:"center", gap:7, fontSize:13, cursor:"pointer", color:"var(--gray-600)", fontWeight:500 }}>
            <input type="checkbox" checked={myTasksOnly} onChange={e => setMyTasksOnly(e.target.checked)} style={{ accentColor:"var(--navy)" }}/>
            {t("tasks.myTasks")}
          </label>
          <button className="btn btn-gold" onClick={() => { setEditing(null); setForm({ status:"todo", priority:"medium", assignees:[] }); setErrors({}); setShowModal(true); }}>
            <Plus size={15}/>{t("tasks.newTask")}
          </button>
        </div>
      </div>

      <div className="filters-row">
        <div className="search-box">
          <Search size={15} className="search-icon"/>
          <input className="form-control" style={{ paddingLeft:38 }} placeholder={t("common.search")} value={search} onChange={e => setSearch(e.target.value)}/>
        </div>
        <select className="filter-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="all">{t("common.all")}</option>
          {["todo","inProgress","review","done","cancelled"].map(s => <option key={s} value={s}>{t(`tasks.statuses.${s}`)}</option>)}
        </select>
        <select className="filter-select" value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}>
          <option value="all">{t("common.all")}</option>
          {["urgent","high","medium","low"].map(p => <option key={p} value={p}>{t(`tasks.priorities.${p}`)}</option>)}
        </select>
      </div>

      {/* Kanban board */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16, marginBottom:24 }}>
        {cols.map(col => {
          const colTasks = filtered.filter(tk => tk.status === col.status);
          return (
            <div key={col.status}>
              <div className="kanban-col-header">
                <div style={{ width:10, height:10, borderRadius:"50%", background:col.color }}/>
                <span className="kanban-col-title">{col.label}</span>
                <span className="kanban-count">{colTasks.length}</span>
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:10, minHeight:80 }}>
                {colTasks.map(tk => {
                  const assigneeIds = getAssignees(tk);
                  return (
                    <div key={tk.id} className="card" style={{ padding:14 }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:8 }}>
                        <div style={{ fontWeight:500, fontSize:13, flex:1, lineHeight:1.4 }}>{tk.title}</div>
                        <div style={{ display:"flex", gap:3, flexShrink:0 }}>
                          {tk.status !== "done" && (
                            <button className="btn btn-ghost btn-sm btn-icon" onClick={() => markDone(tk.id)} title={t("tasks.markComplete")}><Check size={13}/></button>
                          )}
                          <button className="btn btn-ghost btn-sm btn-icon" onClick={() => openEdit(tk)}><Edit2 size={13}/></button>
                        </div>
                      </div>

                      {tk.matterId && (
                        <div style={{ fontSize:11, color:"var(--gray-400)", marginTop:5 }}>
                          📁 {getMatter(tk.matterId)?.matterId}
                        </div>
                      )}

                      <div style={{ display:"flex", alignItems:"center", gap:6, marginTop:8, flexWrap:"wrap" }}>
                        {priorityBadge(tk.priority)}
                        {isOverdue(tk)   && <span className="badge badge-red"  style={{ gap:3 }}><AlertTriangle size={10}/>{t("tasks.overdue")}</span>}
                        {isDueToday(tk) && !isOverdue(tk) && <span className="badge badge-yellow" style={{ gap:3 }}><Clock size={10}/>{t("tasks.dueToday")}</span>}
                      </div>

                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:10 }}>
                        <div style={{ fontSize:11, color:"var(--gray-400)" }}>
                          <Clock size={10} style={{ marginRight:3, verticalAlign:"middle" }}/>{tk.dueDate}
                        </div>
                        {/* Multi-assignee avatars */}
                        <AssigneeAvatars ids={assigneeIds} users={users}/>
                      </div>
                    </div>
                  );
                })}
                {colTasks.length === 0 && (
                  <div style={{ border:"2px dashed var(--gray-200)", borderRadius:8, padding:20, textAlign:"center", color:"var(--gray-300)", fontSize:12 }}>
                    {t("common.noData")}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Full table */}
      <div className="card">
        <div className="card-header"><span className="card-title">{t("tasks.allTasks")}</span></div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>{t("tasks.taskTitle")}</th>
                <th>{t("tasks.priority")}</th>
                <th>{t("tasks.taskStatus")}</th>
                <th><Users size={13} style={{ marginRight:4, verticalAlign:"middle" }}/>{t("tasks.assignee")}(s)</th>
                <th>{t("tasks.dueDate")}</th>
                <th>{t("matters.matter")}</th>
                <th>{t("common.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(tk => {
                const assigneeIds = getAssignees(tk);
                return (
                  <tr key={tk.id} style={{ opacity: tk.status === "done" ? 0.6 : 1 }}>
                    <td>
                      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                        {isOverdue(tk) && <AlertTriangle size={14} color="var(--danger)"/>}
                        <span style={{ fontWeight:500, textDecoration: tk.status === "done" ? "line-through" : "none" }}>
                          {tk.title}
                        </span>
                      </div>
                    </td>
                    <td>{priorityBadge(tk.priority)}</td>
                    <td>{statusBadge(tk.status)}</td>
                    <td>
                      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                        <AssigneeAvatars ids={assigneeIds} users={users}/>
                        <span style={{ fontSize:12, color:"var(--gray-500)" }}>
                          {assigneeIds.slice(0,2).map(id => getUser(id).split(" ")[0]).join(", ")}
                          {assigneeIds.length > 2 && ` +${assigneeIds.length - 2}`}
                        </span>
                      </div>
                    </td>
                    <td style={{ fontSize:12, color: isOverdue(tk) ? "var(--danger)" : "var(--gray-600)", fontWeight: isOverdue(tk) ? 700 : 400 }}>
                      {tk.dueDate}
                    </td>
                    <td style={{ fontSize:12, color:"var(--gray-500)" }}>{getMatter(tk.matterId)?.matterId || "—"}</td>
                    <td>
                      <div style={{ display:"flex", gap:4 }}>
                        {tk.status !== "done" && (
                          <button className="btn btn-ghost btn-sm btn-icon" onClick={() => markDone(tk.id)} title={t("tasks.markComplete")}><Check size={14}/></button>
                        )}
                        <button className="btn btn-ghost btn-sm btn-icon" onClick={() => openEdit(tk)}><Edit2 size={14}/></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!filtered.length && (
                <tr><td colSpan={7}><div className="empty-state"><div className="empty-state-text">{t("common.noData")}</div></div></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">{editing ? t("tasks.editTask") : t("tasks.newTask")}</span>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}><X size={18}/></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label required">{t("tasks.taskTitle")}</label>
                <input className="form-control" value={form.title || ""} onChange={e => setForm(f => ({...f, title: e.target.value}))} placeholder={t("tasks.taskTitle")}/>
                {errors.title && <div className="form-error">{errors.title}</div>}
              </div>

              {/* Multi-user assignee selector */}
              <div className="form-group">
                <label className="form-label required" style={{ display:"flex", alignItems:"center", gap:6 }}>
                  <Users size={13}/>{t("tasks.assignee")}(s)
                  <span style={{ fontSize:11, color:"var(--gray-400)", fontWeight:400 }}>— {t("common.optional").toLowerCase()} multiple</span>
                </label>
                <UserSelector
                  selected={form.assignees || []}
                  onChange={ids => setForm(f => ({ ...f, assignees: ids, assignedTo: ids[0] || "" }))}
                  users={users.filter(u => u.active)}
                  label={t("tasks.assignee")}
                />
                {errors.assignees && <div className="form-error">{errors.assignees}</div>}
                {(form.assignees?.length || 0) > 1 && (
                  <div className="form-hint" style={{ color:"var(--info)" }}>
                    ℹ️ This task will be shared with {form.assignees!.length} team members. Each will receive a reminder notification.
                  </div>
                )}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label required">{t("tasks.dueDate")}</label>
                  <input className="form-control" type="date" value={form.dueDate || ""} onChange={e => setForm(f => ({...f, dueDate: e.target.value}))}/>
                  {errors.dueDate && <div className="form-error">{errors.dueDate}</div>}
                </div>
                <div className="form-group">
                  <label className="form-label">{t("tasks.priority")}</label>
                  <select className="form-control" value={form.priority || "medium"} onChange={e => setForm(f => ({...f, priority: e.target.value as TaskPriority}))}>
                    {["urgent","high","medium","low"].map(p => <option key={p} value={p}>{t(`tasks.priorities.${p}`)}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">{t("tasks.taskStatus")}</label>
                  <select className="form-control" value={form.status || "todo"} onChange={e => setForm(f => ({...f, status: e.target.value as TaskStatus}))}>
                    {["todo","inProgress","review","done","cancelled"].map(s => <option key={s} value={s}>{t(`tasks.statuses.${s}`)}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">{t("tasks.relatedMatter")}</label>
                  <select className="form-control" value={form.matterId || ""} onChange={e => setForm(f => ({...f, matterId: e.target.value}))}>
                    <option value="">— {t("tasks.relatedMatter")} ({t("common.optional")}) —</option>
                    {matters.map(m => <option key={m.id} value={m.id}>{m.matterId} – {m.title}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">{t("common.description")}</label>
                <textarea className="form-control" value={form.description || ""} onChange={e => setForm(f => ({...f, description: e.target.value}))} placeholder={t("common.description")}/>
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