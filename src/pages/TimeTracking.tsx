import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Play, Square, Check, X } from "lucide-react";
import { useApp } from "../context/AppContext";
import { useData } from "../context/DataContext";
import { TimeEntry, TimeActivity } from "../types";

const fmt = (n: number) => new Intl.NumberFormat("fr-CM", { style:"currency", currency:"XAF", maximumFractionDigits:0 }).format(n);

export default function TimeTracking() {
  const { t } = useTranslation();
  const { users, currentUser } = useApp();
  const { timeEntries, setTimeEntries, matters } = useData();
  const [showModal, setShowModal] = useState(false);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [form, setForm] = useState<Partial<TimeEntry>>({
    date: new Date().toISOString().split("T")[0],
    billable: true, hours: 1, activity: "drafting",
    billingRate: currentUser.billingRate || 45000,
  });
  const [errors, setErrors] = useState<Record<string,string>>({});

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timerRunning) { interval = setInterval(() => setTimerSeconds(s=>s+1), 1000); }
    return () => clearInterval(interval);
  }, [timerRunning]);

  const formatTimer = (s: number) => `${String(Math.floor(s/3600)).padStart(2,"0")}:${String(Math.floor((s%3600)/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;

  const getUser = (id: string) => { const u = users.find(u=>u.id===id); return u?`${u.firstName} ${u.lastName}`:id; };
  const getMatter = (id: string) => matters.find(m=>m.id===id);

  const totalBillable = timeEntries.filter(e=>e.billable).reduce((s,e)=>s+e.hours,0);
  const totalAmount   = timeEntries.filter(e=>e.billable).reduce((s,e)=>s+e.hours*e.billingRate,0);
  const pending       = timeEntries.filter(e=>!e.approved).length;

  const validate = () => {
    const e: Record<string,string> = {};
    if (!form.matterId) e.matterId = t("errors.required");
    if (!form.hours || form.hours <= 0) e.hours = t("errors.required");
    setErrors(e); return Object.keys(e).length===0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    setTimeEntries(prev => [{
      id:`te${Date.now()}`, matterId:form.matterId!, userId:currentUser.id,
      date:form.date||new Date().toISOString().split("T")[0],
      hours:form.hours!, activity:(form.activity||"drafting") as TimeActivity,
      description:form.description||"", billable:form.billable!==false,
      billed:false, approved:false, billingRate:form.billingRate||45000,
    }, ...prev]);
    setShowModal(false);
    setForm({ date:new Date().toISOString().split("T")[0], billable:true, hours:1, activity:"drafting", billingRate:currentUser.billingRate||45000 });
    setErrors({});
  };

  const stopTimer = () => {
    setTimerRunning(false);
    setForm(f => ({ ...f, hours: Math.round(timerSeconds/360)/10 }));
    setTimerSeconds(0);
    setShowModal(true);
  };

  return (
    <div>
      <div className="page-header">
        <div><div className="page-header-title">{t("time.title")}</div><div className="page-header-subtitle">{totalBillable.toFixed(1)}h {t("time.billableHours").toLowerCase()}</div></div>
        <div style={{ display:"flex", gap:12 }}>
          <button className={`btn ${timerRunning?"btn-danger":"btn-outline"}`} onClick={()=>timerRunning?stopTimer():setTimerRunning(true)}>
            {timerRunning?<><Square size={15}/>{formatTimer(timerSeconds)}</>:<><Play size={15}/>{t("time.startTimer")}</>}
          </button>
          <button className="btn btn-gold" onClick={()=>setShowModal(true)}><Plus size={15}/>{t("time.newEntry")}</button>
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(4, 1fr)", gap:16, marginBottom:20 }}>
        {[
          { label:t("time.billableHours"), value:`${totalBillable.toFixed(1)}h`, color:"var(--navy)" },
          { label:t("billing.amountDue"),  value:fmt(totalAmount), color:"var(--success)" },
          { label:"Total entries",          value:String(timeEntries.length), color:"var(--info)" },
          { label:t("time.pending"),        value:String(pending), color:"var(--warning)" },
        ].map((s,i)=>(
          <div key={i} className="card" style={{ padding:"18px 20px" }}>
            <div style={{ fontSize:12, color:"var(--gray-500)", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.05em" }}>{s.label}</div>
            <div style={{ fontSize:22, fontWeight:800, color:s.color, marginTop:6 }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-header"><span className="card-title">{t("time.timesheet")}</span></div>
        <div className="table-container">
          <table>
            <thead><tr><th>{t("common.date")}</th><th>{t("common.name")}</th><th>{t("matters.matter")}</th><th>{t("time.activity")}</th><th>{t("time.hours")}</th><th>{t("time.billingRate")}</th><th>{t("common.amount")}</th><th>{t("time.billable")}</th><th>{t("common.status")}</th><th>{t("common.actions")}</th></tr></thead>
            <tbody>
              {timeEntries.map(te => {
                const matter = getMatter(te.matterId);
                return (
                  <tr key={te.id}>
                    <td style={{fontSize:12}}>{te.date}</td>
                    <td style={{fontSize:13}}>{getUser(te.userId)}</td>
                    <td style={{fontSize:12,maxWidth:140}}><div className="truncate" title={matter?.title}>{matter?.matterId||"—"}</div></td>
                    <td style={{fontSize:12}}>{t(`time.activities.${te.activity}`)}</td>
                    <td style={{fontWeight:600,textAlign:"right"}}>{te.hours}h</td>
                    <td style={{fontSize:12}}>{fmt(te.billingRate)}/h</td>
                    <td style={{fontWeight:600,color:"var(--success)",textAlign:"right"}}>{fmt(te.hours*te.billingRate)}</td>
                    <td><span className={`badge ${te.billable?"badge-green":"badge-gray"}`}>{te.billable?t("time.billable"):t("time.nonBillable")}</span></td>
                    <td>{te.billed?<span className="badge badge-blue">{t("time.billed")}</span>:te.approved?<span className="badge badge-green">{t("time.approved")}</span>:<span className="badge badge-yellow">{t("time.pending")}</span>}</td>
                    <td>{!te.approved&&<button className="btn btn-ghost btn-sm btn-icon" onClick={()=>setTimeEntries(prev=>prev.map(e=>e.id===te.id?{...e,approved:true}:e))} title={t("time.approveEntry")}><Check size={14}/></button>}</td>
                  </tr>
                );
              })}
              {!timeEntries.length && <tr><td colSpan={10}><div className="empty-state"><div className="empty-state-text">{t("common.noData")}</div></div></td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={()=>setShowModal(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">{t("time.newEntry")}</span>
              <button className="btn btn-ghost btn-icon" onClick={()=>setShowModal(false)}><X size={18}/></button>
            </div>
            <div className="modal-body">
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label required">{t("common.date")}</label>
                  <input className="form-control" type="date" value={form.date||""} onChange={e=>setForm(f=>({...f,date:e.target.value}))}/>
                </div>
                <div className="form-group">
                  <label className="form-label required">{t("time.hours")}</label>
                  <input className="form-control" type="number" min="0.1" step="0.5" max="24" value={form.hours||""} onChange={e=>setForm(f=>({...f,hours:parseFloat(e.target.value)}))}/>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label required">{t("matters.matter")}</label>
                <select className="form-control" value={form.matterId||""} onChange={e=>setForm(f=>({...f,matterId:e.target.value}))}>
                  <option value="">— {t("matters.matter")} —</option>
                  {matters.filter(m=>m.status!=="closed"&&m.status!=="archived").map(m=><option key={m.id} value={m.id}>{m.matterId} – {m.title}</option>)}
                </select>
                {errors.matterId&&<div className="form-error">{errors.matterId}</div>}
                {matters.length===0&&<div className="form-hint" style={{color:"var(--warning)"}}>⚠ No matters yet. Create a matter first.</div>}
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">{t("time.activity")}</label>
                  <select className="form-control" value={form.activity||"drafting"} onChange={e=>setForm(f=>({...f,activity:e.target.value as TimeActivity}))}>
                    {["legal_research","drafting","review","court","client_meeting","negotiation","correspondence","filing","travel","other"].map(a=><option key={a} value={a}>{t(`time.activities.${a}`)}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">{t("time.billingRate")} (FCFA/h)</label>
                  <input className="form-control" type="number" value={form.billingRate||""} onChange={e=>setForm(f=>({...f,billingRate:parseInt(e.target.value)||0}))}/>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">{t("common.description")}</label>
                <textarea className="form-control" value={form.description||""} onChange={e=>setForm(f=>({...f,description:e.target.value}))} placeholder={t("common.description")}/>
              </div>
              <div className="form-group">
                <label className="checkbox-label">
                  <input type="checkbox" checked={form.billable!==false} onChange={e=>setForm(f=>({...f,billable:e.target.checked}))}/>
                  {t("time.billable")}
                </label>
              </div>
              {form.hours&&form.billingRate&&form.hours>0&&(
                <div style={{ background:"var(--gold-pale)", borderRadius:8, padding:"12px 16px", display:"flex", justifyContent:"space-between", border:"1px solid rgba(201,168,76,0.3)" }}>
                  <span style={{fontSize:13,color:"var(--gray-600)",fontWeight:600}}>{t("common.total")}</span>
                  <span style={{fontWeight:800,fontSize:16,color:"var(--navy)"}}>{fmt(form.hours*form.billingRate)}</span>
                </div>
              )}
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