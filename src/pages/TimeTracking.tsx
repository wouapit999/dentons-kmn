import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Play, Square, Check, X, Edit2 } from "lucide-react";
import { mockTimeEntries, mockMatters, mockUsers } from "../data/mockData";
import { TimeEntry, TimeActivity } from "../types";

const fmt = (n: number) => new Intl.NumberFormat("fr-CM", { style: "currency", currency: "XAF", maximumFractionDigits: 0 }).format(n);

export default function TimeTracking() {
  const { t } = useTranslation();
  const [entries, setEntries] = useState<TimeEntry[]>(mockTimeEntries);
  const [showModal, setShowModal] = useState(false);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [form, setForm] = useState<Partial<TimeEntry>>({ date: new Date().toISOString().split("T")[0], billable: true, hours: 1, activity: "drafting", billingRate: 45000 });

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timerRunning) {
      interval = setInterval(() => setTimerSeconds(s => s + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timerRunning]);

  const formatTimer = (s: number) => `${String(Math.floor(s / 3600)).padStart(2,"0")}:${String(Math.floor((s % 3600) / 60)).padStart(2,"0")}:${String(s % 60).padStart(2,"0")}`;

  const getUser = (id: string) => { const u = mockUsers.find(u => u.id === id); return u ? `${u.firstName} ${u.lastName}` : id; };
  const getMatter = (id: string) => mockMatters.find(m => m.id === id);

  const totalBillable = entries.filter(e => e.billable).reduce((s, e) => s + e.hours, 0);
  const totalAmount = entries.filter(e => e.billable).reduce((s, e) => s + e.hours * e.billingRate, 0);
  const pending = entries.filter(e => !e.approved).length;

  const handleSubmit = () => {
    if (!form.matterId || !form.hours || !form.activity) return;
    const newEntry: TimeEntry = {
      id: `te${Date.now()}`, matterId: form.matterId!, userId: "u1",
      date: form.date || new Date().toISOString().split("T")[0],
      hours: form.hours!, activity: form.activity as TimeActivity,
      description: form.description || "", billable: form.billable !== false,
      billed: false, approved: false, billingRate: form.billingRate || 45000,
    };
    setEntries(prev => [newEntry, ...prev]);
    setShowModal(false);
    setForm({ date: new Date().toISOString().split("T")[0], billable: true, hours: 1, activity: "drafting", billingRate: 45000 });
  };

  const stopTimer = () => {
    setTimerRunning(false);
    setForm(f => ({ ...f, hours: Math.round(timerSeconds / 360) / 10 }));
    setTimerSeconds(0);
    setShowModal(true);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-header-title">{t("time.title")}</div>
          <div className="page-header-subtitle">{totalBillable.toFixed(1)}h {t("time.billableHours").toLowerCase()}</div>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <button className={`btn ${timerRunning ? "btn-danger" : "btn-outline"}`} onClick={() => timerRunning ? stopTimer() : setTimerRunning(true)}>
            {timerRunning ? <><Square size={15} /> {formatTimer(timerSeconds)}</> : <><Play size={15} />{t("time.startTimer")}</>}
          </button>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}><Plus size={15} />{t("time.newEntry")}</button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 20 }}>
        <div className="stat-card">
          <div className="stat-icon blue" style={{ width: 40, height: 40 }}><span style={{ fontSize: 20 }}>⏱</span></div>
          <div>
            <div className="stat-value">{totalBillable.toFixed(1)}h</div>
            <div className="stat-label">{t("time.billableHours")}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green" style={{ width: 40, height: 40 }}><span style={{ fontSize: 20 }}>💰</span></div>
          <div>
            <div className="stat-value" style={{ fontSize: 16 }}>{fmt(totalAmount)}</div>
            <div className="stat-label">{t("billing.amountDue")}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon yellow" style={{ width: 40, height: 40 }}><span style={{ fontSize: 20 }}>📋</span></div>
          <div>
            <div className="stat-value">{entries.length}</div>
            <div className="stat-label">Saisies totales</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon red" style={{ width: 40, height: 40 }}><span style={{ fontSize: 20 }}>⏳</span></div>
          <div>
            <div className="stat-value">{pending}</div>
            <div className="stat-label">{t("time.pending")}</div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">{t("time.timesheet")}</span>
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>{t("common.date")}</th>
                <th>{t("common.name")}</th>
                <th>{t("matters.matter")}</th>
                <th>{t("time.activity")}</th>
                <th>{t("time.hours")}</th>
                <th>{t("time.billingRate")}</th>
                <th>Montant</th>
                <th>{t("time.billable")}</th>
                <th>{t("common.status")}</th>
                <th>{t("common.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {entries.map(entry => {
                const matter = getMatter(entry.matterId);
                return (
                  <tr key={entry.id}>
                    <td style={{ fontSize: 12 }}>{entry.date}</td>
                    <td style={{ fontSize: 13 }}>{getUser(entry.userId)}</td>
                    <td style={{ fontSize: 12, maxWidth: 160 }}>
                      <div className="truncate" title={matter?.title}>{matter?.matterId}</div>
                      <div style={{ fontSize: 11, color: "var(--gray-400)" }} className="truncate">{matter?.title}</div>
                    </td>
                    <td style={{ fontSize: 12 }}>{t(`time.activities.${entry.activity}`)}</td>
                    <td style={{ fontWeight: 600, textAlign: "right" }}>{entry.hours}h</td>
                    <td style={{ fontSize: 12 }}>{fmt(entry.billingRate)}/h</td>
                    <td style={{ fontWeight: 600, color: "var(--success)", textAlign: "right" }}>{fmt(entry.hours * entry.billingRate)}</td>
                    <td>
                      <span className={`badge ${entry.billable ? "badge-green" : "badge-gray"}`}>
                        {entry.billable ? t("time.billable") : t("time.nonBillable")}
                      </span>
                    </td>
                    <td>
                      {entry.billed ? <span className="badge badge-blue">{t("time.billed")}</span>
                        : entry.approved ? <span className="badge badge-green">{t("time.approved")}</span>
                        : <span className="badge badge-yellow">{t("time.pending")}</span>}
                    </td>
                    <td>
                      {!entry.approved && (
                        <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setEntries(prev => prev.map(e => e.id === entry.id ? { ...e, approved: true } : e))} title={t("time.approveEntry")}>
                          <Check size={14} />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">{t("time.newEntry")}</span>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label required">{t("common.date")}</label>
                  <input className="form-control" type="date" value={form.date || ""} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label required">{t("time.hours")}</label>
                  <input className="form-control" type="number" min="0.1" step="0.1" max="24" value={form.hours || ""} onChange={e => setForm(f => ({ ...f, hours: parseFloat(e.target.value) }))} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label required">{t("matters.matter")}</label>
                <select className="form-control" value={form.matterId || ""} onChange={e => setForm(f => ({ ...f, matterId: e.target.value }))}>
                  <option value="">-- {t("matters.matter")} --</option>
                  {mockMatters.filter(m => m.status !== "closed").map(m => <option key={m.id} value={m.id}>{m.matterId} – {m.title}</option>)}
                </select>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">{t("time.activity")}</label>
                  <select className="form-control" value={form.activity || "drafting"} onChange={e => setForm(f => ({ ...f, activity: e.target.value as TimeActivity }))}>
                    {["legal_research","drafting","review","court","client_meeting","negotiation","correspondence","filing","travel","other"].map(a => (
                      <option key={a} value={a}>{t(`time.activities.${a}`)}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">{t("time.billingRate")} (FCFA/h)</label>
                  <input className="form-control" type="number" value={form.billingRate || ""} onChange={e => setForm(f => ({ ...f, billingRate: parseInt(e.target.value) }))} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">{t("common.description")}</label>
                <textarea className="form-control" value={form.description || ""} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Description des travaux effectués..." />
              </div>
              <div className="form-group">
                <label className="checkbox-label">
                  <input type="checkbox" checked={form.billable !== false} onChange={e => setForm(f => ({ ...f, billable: e.target.checked }))} />
                  {t("time.billable")}
                </label>
              </div>
              {form.hours && form.billingRate && (
                <div style={{ background: "var(--gray-50)", borderRadius: 8, padding: 12, display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 13, color: "var(--gray-600)" }}>Montant total</span>
                  <span style={{ fontWeight: 700, fontSize: 15, color: "var(--success)" }}>{fmt(form.hours * form.billingRate)}</span>
                </div>
              )}
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
