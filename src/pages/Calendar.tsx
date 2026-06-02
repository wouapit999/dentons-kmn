import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronLeft, ChevronRight, Plus, X } from "lucide-react";
import { useData } from "../context/DataContext";
import { CalendarEvent } from "../types";

export default function CalendarPage() {
  const { t, i18n } = useTranslation();
  const isFr = i18n.language === "fr";
  const { calendarEvents, setCalendarEvents, matters } = useData();

  const MONTHS_EN = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const MONTHS_FR = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];
  const DAYS_EN = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  const DAYS_FR = ["Dim","Lun","Mar","Mer","Jeu","Ven","Sam"];
  const MONTHS = isFr ? MONTHS_FR : MONTHS_EN;
  const DAYS   = isFr ? DAYS_FR   : DAYS_EN;

  const now = new Date();
  const [currentDate, setCurrentDate] = useState(new Date(now.getFullYear(), now.getMonth(), 1));
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<Partial<CalendarEvent>>({ type:"meeting", attendees:[] });
  const [errors, setErrors] = useState<Record<string,string>>({});

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month+1, 0).getDate();

  const getEventsForDay = (day: number) => {
    const dateStr = `${year}-${String(month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
    return calendarEvents.filter(ev => ev.startDate.startsWith(dateStr));
  };

  const typeColor: Record<string,string> = { courtDate:"#C0392B", meeting:"#1D6FA4", deadline:"#B45309", hearing:"#6741D9", deposition:"#1A7F4B", reminder:"#868E96" };
  const isToday = (day: number) => now.getFullYear()===year && now.getMonth()===month && now.getDate()===day;

  const validate = () => {
    const e: Record<string,string> = {};
    if (!form.title?.trim()) e.title = t("errors.required");
    if (!form.startDate) e.startDate = t("errors.required");
    setErrors(e); return Object.keys(e).length===0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    setCalendarEvents(prev => [{
      id:`ev${Date.now()}`, title:form.title!, type:(form.type||"meeting") as any,
      startDate:form.startDate!, endDate:form.endDate||form.startDate!,
      matterId:form.matterId, location:form.location, attendees:form.attendees||[],
    }, ...prev]);
    setShowModal(false);
    setForm({ type:"meeting", attendees:[] });
    setErrors({});
  };

  return (
    <div>
      <div className="page-header">
        <div><div className="page-header-title">{t("calendar.title")}</div></div>
        <button className="btn btn-gold" onClick={()=>setShowModal(true)}><Plus size={15}/>{t("calendar.newEvent")}</button>
      </div>

      {/* Legend */}
      <div style={{ display:"flex", gap:16, marginBottom:16, flexWrap:"wrap" }}>
        {Object.entries(typeColor).map(([type,color])=>(
          <div key={type} style={{ display:"flex", alignItems:"center", gap:6, fontSize:12, color:"var(--gray-600)" }}>
            <div style={{ width:10, height:10, borderRadius:2, background:color }}/>{t(`calendar.eventTypes.${type}`)}
          </div>
        ))}
      </div>

      <div className="card">
        <div style={{ padding:"16px 20px", borderBottom:"1px solid var(--gray-100)", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <button className="btn btn-ghost btn-icon" onClick={()=>setCurrentDate(new Date(year,month-1,1))}><ChevronLeft size={18}/></button>
          <div style={{ fontWeight:700, fontSize:17, color:"var(--navy)", fontFamily:"Playfair Display, serif" }}>{MONTHS[month]} {year}</div>
          <button className="btn btn-ghost btn-icon" onClick={()=>setCurrentDate(new Date(year,month+1,1))}><ChevronRight size={18}/></button>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", borderBottom:"1px solid var(--gray-100)" }}>
          {DAYS.map(d=><div key={d} style={{ padding:"10px 0", textAlign:"center", fontSize:11, fontWeight:700, color:"var(--gray-400)", textTransform:"uppercase", letterSpacing:"0.05em" }}>{d}</div>)}
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)" }}>
          {Array.from({length:firstDay}).map((_,i)=><div key={`e${i}`} style={{ minHeight:90, borderRight:"1px solid var(--gray-100)", borderBottom:"1px solid var(--gray-100)", background:"var(--gray-50)" }}/>)}
          {Array.from({length:daysInMonth}).map((_,i)=>{
            const day = i+1;
            const dayEvents = getEventsForDay(day);
            return (
              <div key={day} style={{ minHeight:90, borderRight:"1px solid var(--gray-100)", borderBottom:"1px solid var(--gray-100)", padding:"6px 8px", cursor:"pointer" }}
                onClick={()=>{ const d=`${year}-${String(month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`; setForm(f=>({...f,startDate:`${d}T09:00:00`,endDate:`${d}T10:00:00`})); setShowModal(true); }}
              >
                <div style={{ width:26, height:26, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:isToday(day)?700:400, background:isToday(day)?"var(--navy)":"transparent", color:isToday(day)?"white":"var(--gray-800)", marginBottom:4 }}>{day}</div>
                <div style={{ display:"flex", flexDirection:"column", gap:2 }}>
                  {dayEvents.slice(0,3).map(ev=>(
                    <div key={ev.id} style={{ background:typeColor[ev.type]||"var(--gray-500)", color:"white", borderRadius:3, padding:"1px 5px", fontSize:11, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }} title={ev.title}>{ev.title}</div>
                  ))}
                  {dayEvents.length>3&&<div style={{fontSize:10,color:"var(--gray-400)"}}>+{dayEvents.length-3}</div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Upcoming events */}
      <div className="card" style={{marginTop:20}}>
        <div className="card-header"><span className="card-title">{t("dashboard.upcomingDeadlines")}</span></div>
        <div className="card-body" style={{padding:0}}>
          {calendarEvents.length===0
            ? <div className="empty-state"><div className="empty-state-text">{t("common.noData")}</div></div>
            : [...calendarEvents].sort((a,b)=>a.startDate.localeCompare(b.startDate)).slice(0,8).map(ev=>(
              <div key={ev.id} style={{ display:"flex", alignItems:"center", gap:14, padding:"12px 20px", borderBottom:"1px solid var(--gray-100)" }}>
                <div style={{ width:4, height:40, borderRadius:2, background:typeColor[ev.type], flexShrink:0 }}/>
                <div style={{ flexShrink:0, minWidth:46, textAlign:"center" }}>
                  <div style={{ fontSize:20, fontWeight:700, color:"var(--navy)" }}>{new Date(ev.startDate).getDate()}</div>
                  <div style={{ fontSize:10, textTransform:"uppercase", color:"var(--gray-400)" }}>{MONTHS[new Date(ev.startDate).getMonth()].slice(0,3)}</div>
                </div>
                <div style={{flex:1}}>
                  <div style={{fontWeight:600,fontSize:13}}>{ev.title}</div>
                  <div style={{fontSize:11,color:"var(--gray-400)",marginTop:2}}>{t(`calendar.eventTypes.${ev.type}`)}{ev.location&&` · ${ev.location}`} · {ev.startDate.split("T")[1]?.slice(0,5)}</div>
                </div>
                <span className="badge" style={{background:typeColor[ev.type]+"22",color:typeColor[ev.type]}}>{t(`calendar.eventTypes.${ev.type}`)}</span>
              </div>
            ))}
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={()=>setShowModal(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">{t("calendar.newEvent")}</span>
              <button className="btn btn-ghost btn-icon" onClick={()=>setShowModal(false)}><X size={18}/></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label required">{t("calendar.event")}</label>
                <input className="form-control" value={form.title||""} onChange={e=>setForm(f=>({...f,title:e.target.value}))} placeholder={t("calendar.event")}/>
                {errors.title&&<div className="form-error">{errors.title}</div>}
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">{t("common.type")}</label>
                  <select className="form-control" value={form.type||"meeting"} onChange={e=>setForm(f=>({...f,type:e.target.value as any}))}>
                    {["courtDate","meeting","deadline","hearing","deposition","reminder"].map(t2=><option key={t2} value={t2}>{t(`calendar.eventTypes.${t2}`)}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label required">{t("calendar.startTime")}</label>
                  <input className="form-control" type="datetime-local" value={form.startDate?.slice(0,16)||""} onChange={e=>setForm(f=>({...f,startDate:e.target.value+":00"}))}/>
                  {errors.startDate&&<div className="form-error">{errors.startDate}</div>}
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">{t("calendar.location")}</label>
                  <input className="form-control" value={form.location||""} onChange={e=>setForm(f=>({...f,location:e.target.value}))}/>
                </div>
                <div className="form-group">
                  <label className="form-label">{t("matters.matter")}</label>
                  <select className="form-control" value={form.matterId||""} onChange={e=>setForm(f=>({...f,matterId:e.target.value}))}>
                    <option value="">— {t("matters.matter")} ({t("common.optional")}) —</option>
                    {matters.map(m=><option key={m.id} value={m.id}>{m.matterId} – {m.title}</option>)}
                  </select>
                </div>
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