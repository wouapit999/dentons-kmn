import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Search, Check, X, Edit2, AlertTriangle, Clock } from "lucide-react";
import { mockTasks, mockMatters, mockUsers } from "../data/mockData";
import { Task, TaskStatus, TaskPriority } from "../types";

export default function Tasks() {
  const { t } = useTranslation();
  const [tasks, setTasks] = useState<Task[]>(mockTasks);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [form, setForm] = useState<Partial<Task>>({ status: "todo", priority: "medium" });

  const getUser = (id: string) => { const u = mockUsers.find(u => u.id === id); return u ? `${u.firstName} ${u.lastName}` : id; };
  const getMatter = (id?: string) => mockMatters.find(m => m.id === id);

  const today = new Date().toISOString().split("T")[0];
  const isOverdue = (task: Task) => task.dueDate < today && task.status !== "done" && task.status !== "cancelled";
  const isDueToday = (task: Task) => task.dueDate === today;

  const filtered = tasks.filter(task => {
    const q = search.toLowerCase();
    return (!q || task.title.toLowerCase().includes(q))
      && (statusFilter === "all" || task.status === statusFilter)
      && (priorityFilter === "all" || task.priority === priorityFilter);
  });

  const statusBadge = (status: string) => {
    const map: Record<string, string> = { todo: "badge-gray", inProgress: "badge-blue", review: "badge-yellow", done: "badge-green", cancelled: "badge-gray" };
    return <span className={`badge ${map[status]}`}>{t(`tasks.statuses.${status}`)}</span>;
  };

  const priorityBadge = (priority: string) => {
    const map: Record<string, string> = { low: "badge-gray", medium: "badge-blue", high: "badge-yellow", urgent: "badge-red" };
    return (
      <span className={`badge ${map[priority]}`} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
        <span className={`priority-dot priority-${priority}`} />{t(`tasks.priorities.${priority}`)}
      </span>
    );
  };

  const markDone = (id: string) => {
    setTasks(prev => prev.map(t2 => t2.id === id ? { ...t2, status: "done" as TaskStatus, completedAt: new Date().toISOString() } : t2));
  };

  const handleSubmit = () => {
    if (!form.title || !form.assignedTo || !form.dueDate) return;
    if (editing) {
      setTasks(prev => prev.map(t2 => t2.id === editing.id ? { ...t2, ...form } as Task : t2));
    } else {
      const newTask: Task = {
        id: `t${Date.now()}`, title: form.title!, assignedTo: form.assignedTo!,
        status: (form.status || "todo") as TaskStatus, priority: (form.priority || "medium") as TaskPriority,
        dueDate: form.dueDate!, createdAt: new Date().toISOString(),
        matterId: form.matterId, description: form.description,
      };
      setTasks(prev => [newTask, ...prev]);
    }
    setShowModal(false);
    setEditing(null);
    setForm({ status: "todo", priority: "medium" });
  };

  const openEdit = (task: Task) => { setEditing(task); setForm(task); setShowModal(true); };

  const todo = filtered.filter(t2 => t2.status === "todo");
  const inProgress = filtered.filter(t2 => t2.status === "inProgress");
  const review = filtered.filter(t2 => t2.status === "review");
  const done = filtered.filter(t2 => t2.status === "done");

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-header-title">{t("tasks.title")}</div>
          <div className="page-header-subtitle">{filtered.filter(t2 => t2.status !== "done" && t2.status !== "cancelled").length} {t("dashboard.pendingTasks").toLowerCase()}</div>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditing(null); setForm({ status: "todo", priority: "medium" }); setShowModal(true); }}>
          <Plus size={15} />{t("tasks.newTask")}
        </button>
      </div>

      <div className="filters-row">
        <div className="search-box">
          <Search size={15} className="search-icon" />
          <input className="form-control" style={{ paddingLeft: 36 }} placeholder={t("common.search")} value={search} onChange={e => setSearch(e.target.value)} />
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

      {/* Kanban-style columns */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
        {[
          { status: "todo", tasks: todo, color: "var(--gray-500)" },
          { status: "inProgress", tasks: inProgress, color: "var(--info)" },
          { status: "review", tasks: review, color: "var(--warning)" },
          { status: "done", tasks: done, color: "var(--success)" },
        ].map(col => (
          <div key={col.status}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: col.color }} />
              <span style={{ fontWeight: 600, fontSize: 13, color: "var(--gray-700)" }}>{t(`tasks.statuses.${col.status}`)}</span>
              <span style={{ marginLeft: "auto", background: "var(--gray-200)", color: "var(--gray-600)", borderRadius: 10, padding: "1px 7px", fontSize: 11, fontWeight: 600 }}>{col.tasks.length}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, minHeight: 200 }}>
              {col.tasks.map(task => (
                <div key={task.id} className="card" style={{ padding: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                    <div style={{ fontWeight: 500, fontSize: 13, flex: 1, lineHeight: 1.4 }}>{task.title}</div>
                    <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                      {task.status !== "done" && (
                        <button className="btn btn-ghost btn-sm btn-icon" onClick={() => markDone(task.id)} title={t("tasks.markComplete")}>
                          <Check size={13} />
                        </button>
                      )}
                      <button className="btn btn-ghost btn-sm btn-icon" onClick={() => openEdit(task)}><Edit2 size={13} /></button>
                    </div>
                  </div>

                  {task.matterId && (
                    <div style={{ fontSize: 11, color: "var(--gray-400)", marginTop: 6, display: "flex", alignItems: "center", gap: 4 }}>
                      <span>📁</span> {getMatter(task.matterId)?.matterId}
                    </div>
                  )}

                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8 }}>
                    {priorityBadge(task.priority)}
                    {isOverdue(task) && (
                      <span className="badge badge-red" style={{ gap: 3 }}>
                        <AlertTriangle size={10} />{t("tasks.overdue")}
                      </span>
                    )}
                    {isDueToday(task) && !isOverdue(task) && (
                      <span className="badge badge-yellow" style={{ gap: 3 }}>
                        <Clock size={10} />{t("tasks.dueToday")}
                      </span>
                    )}
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
                    <div style={{ fontSize: 11, color: "var(--gray-400)" }}>
                      <Clock size={11} style={{ marginRight: 3, verticalAlign: "middle" }} />
                      {task.dueDate}
                    </div>
                    <div style={{ width: 24, height: 24, borderRadius: "50%", background: "var(--primary)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 600 }} title={getUser(task.assignedTo)}>
                      {getUser(task.assignedTo).split(" ").map(n => n[0]).join("").slice(0,2)}
                    </div>
                  </div>
                </div>
              ))}
              {col.tasks.length === 0 && (
                <div style={{ border: "2px dashed var(--gray-200)", borderRadius: 8, padding: 20, textAlign: "center", color: "var(--gray-300)", fontSize: 12 }}>
                  {t("common.noData")}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Also show a table below */}
      <div className="card" style={{ marginTop: 24 }}>
        <div className="card-header"><span className="card-title">{t("tasks.allTasks")}</span></div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>{t("tasks.taskTitle")}</th>
                <th>{t("tasks.priority")}</th>
                <th>{t("tasks.taskStatus")}</th>
                <th>{t("tasks.assignee")}</th>
                <th>{t("tasks.dueDate")}</th>
                <th>{t("matters.matter")}</th>
                <th>{t("common.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(task => (
                <tr key={task.id} style={{ opacity: task.status === "done" ? 0.6 : 1 }}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      {isOverdue(task) && <AlertTriangle size={14} color="var(--danger)" />}
                      <span style={{ fontWeight: 500, textDecoration: task.status === "done" ? "line-through" : "none" }}>{task.title}</span>
                    </div>
                  </td>
                  <td>{priorityBadge(task.priority)}</td>
                  <td>{statusBadge(task.status)}</td>
                  <td style={{ fontSize: 13 }}>{getUser(task.assignedTo)}</td>
                  <td style={{ fontSize: 12, color: isOverdue(task) ? "var(--danger)" : "var(--gray-600)", fontWeight: isOverdue(task) ? 600 : 400 }}>{task.dueDate}</td>
                  <td style={{ fontSize: 12, color: "var(--gray-500)" }}>{getMatter(task.matterId)?.matterId || "-"}</td>
                  <td>
                    <div style={{ display: "flex", gap: 4 }}>
                      {task.status !== "done" && <button className="btn btn-ghost btn-sm btn-icon" onClick={() => markDone(task.id)} title={t("tasks.markComplete")}><Check size={14} /></button>}
                      <button className="btn btn-ghost btn-sm btn-icon" onClick={() => openEdit(task)}><Edit2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">{editing ? t("tasks.editTask") : t("tasks.newTask")}</span>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label required">{t("tasks.taskTitle")}</label>
                <input className="form-control" value={form.title || ""} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label required">{t("tasks.assignee")}</label>
                  <select className="form-control" value={form.assignedTo || ""} onChange={e => setForm(f => ({ ...f, assignedTo: e.target.value }))}>
                    <option value="">-- {t("tasks.assignee")} --</option>
                    {mockUsers.filter(u => u.role !== "client").map(u => <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label required">{t("tasks.dueDate")}</label>
                  <input className="form-control" type="date" value={form.dueDate || ""} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">{t("tasks.priority")}</label>
                  <select className="form-control" value={form.priority || "medium"} onChange={e => setForm(f => ({ ...f, priority: e.target.value as TaskPriority }))}>
                    {["urgent","high","medium","low"].map(p => <option key={p} value={p}>{t(`tasks.priorities.${p}`)}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">{t("tasks.taskStatus")}</label>
                  <select className="form-control" value={form.status || "todo"} onChange={e => setForm(f => ({ ...f, status: e.target.value as TaskStatus }))}>
                    {["todo","inProgress","review","done","cancelled"].map(s => <option key={s} value={s}>{t(`tasks.statuses.${s}`)}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">{t("tasks.relatedMatter")}</label>
                <select className="form-control" value={form.matterId || ""} onChange={e => setForm(f => ({ ...f, matterId: e.target.value }))}>
                  <option value="">-- {t("tasks.relatedMatter")} --</option>
                  {mockMatters.map(m => <option key={m.id} value={m.id}>{m.matterId} – {m.title}</option>)}
                </select>
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
