import React, { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  ChevronLeft, ChevronRight, Plus, X, Users, Eye, Edit2, Trash2,
  Calendar as CalIcon, List, LayoutGrid, MapPin, Clock, Briefcase,
  User, Scale, Building2
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { useData } from "../context/DataContext";
import { CalendarEvent } from "../types";

/* ── Attendee multi-select ─────────────────────────────────────────────── */
function AttendeeSelector({ selected, onChange, users, label }: { selected:string[]; onChange:(ids:string[])=>void; users:any[]; label:string }) {
  const [open, setOpen] = useState(false);
  const toggle = (id: string) => onChange(selected.includes(id) ? selected.filter(s=>s!==id) : [...selected,id]);
  const selectedUsers = users.filter(u => selected.includes(u.id));
  return (
    <div style={{ position:"relative" }}>
      <div onClick={()=>setOpen(!open)} style={{ border:"1.5px solid var(--gray-300)", borderRadius:6, padding:"8px 12px", cursor:"pointer", background:"white", display:"flex", alignItems:"center", gap:8, flexWrap:"wrap", minHeight:40 }}>
        {selectedUsers.length===0
          ? <span style={{ color:"var(--gray-400)", fontSize:13 }}>— {label} —</span>
          : selectedUsers.map(u=>(
            <span key={u.id} style={{ background:"var(--navy)", color:"white", borderRadius:20, padding:"2px 10px", fontSize:11, fontWeight:600, display:"inline-flex", alignItems:"center", gap:4 }}>
              {u.firstName} {u.lastName?.[0]||""}
              <button onClick={e=>{e.stopPropagation();toggle(u.id);}} style={{background:"none",border:"none",cursor:"pointer",color:"white",padding:0,lineHeight:1,fontSize:13}}>×</button>
            </span>
          ))}
        <span style={{marginLeft:"auto",color:"var(--gray-400)",fontSize:11}}>▾</span>
      </div>
      {open && (
        <div style={{ position:"absolute", top:"calc(100% + 4px)", left:0, right:0, background:"white", border:"1px solid var(--gray-200)", borderRadius:6, boxShadow:"0 8px 24px rgba(0,0,0,0.12)", zIndex:200, maxHeight:200, overflowY:"auto" }}>
          {users.filter(u=>u.active&&u.role!=="client").map(u=>(
            <div key={u.id} onClick={()=>toggle(u.id)} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 14px", cursor:"pointer", background:selected.includes(u.id)?"#f0f4ff":"white", borderBottom:"1px solid var(--gray-50)" }}>
              <div style={{ width:26,height:26,borderRadius:"50%",background:selected.includes(u.id)?"var(--gold)":"var(--navy)",color:"white",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,flexShrink:0 }}>
                {u.firstName[0]}{u.lastName?.[0]||""}
              </div>
              <div style={{flex:1}}><div style={{fontSize:12,fontWeight:500,color:"var(--navy)"}}>{u.firstName} {u.lastName}</div></div>
              {selected.includes(u.id)&&<span style={{color:"var(--gold-dark)",fontWeight:700,fontSize:14}}>✓</span>}
            </div>
          ))}
        </div>
      )}
      {open&&<div style={{position:"fixed",inset:0,zIndex:199}} onClick={()=>setOpen(false)}/>}
    </div>
  );
}

/* ── Type colors ───────────────────────────────────────────────────────── */
const TYPE_COLOR: Record<string,{bg:string;fg:string;border:string}> = {
  courtDate:   { bg:"#FEF2F2", fg:"#991B1B", border:"#C0392B" },
  meeting:     { bg:"#EFF6FF", fg:"#1E40AF", border:"#1D6FA4" },
  deadline:    { bg:"#FFFBEB", fg:"#92400E", border:"#B45309" },
  hearing:     { bg:"#F5F3FF", fg:"#5B21B6", border:"#6741D9" },
  deposition:  { bg:"#ECFDF5", fg:"#065F46", border:"#1A7F4B" },
  reminder:    { bg:"#F9FAFB", fg:"#4B5563", border:"#868E96" },
};
const getTypeStyle = (type: string) => TYPE_COLOR[type] || TYPE_COLOR.reminder;

/* ── Main Component ────────────────────────────────────────────────────── */
export default function CalendarPage() {
  const { t, i18n } = useTranslation();
  const { users, currentUser, session } = useApp();
  const isFr = i18n.language === "fr";
  const { calendarEvents, setCalendarEvents, matters, clients } = useData();

  const MONTHS_EN = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const MONTHS_FR = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];
  const DAYS_EN = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  const DAYS_FR = ["Dim","Lun","Mar","Mer","Jeu","Ven","Sam"];
  const DAYS_FULL_EN = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  const DAYS_FULL_FR = ["Dimanche","Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi"];
  const MONTHS = isFr ? MONTHS_FR : MONTHS_EN;
  const DAYS = isFr ? DAYS_FR : DAYS_EN;
  const DAYS_FULL = isFr ? DAYS_FULL_FR : DAYS_FULL_EN;

  const myUserId = currentUser?.id || session?.userId || "";
  const myRole = currentUser?.role || session?.role || "";
  const isAdmin = myRole === "admin";

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")}`;
  const [currentDate, setCurrentDate] = useState(new Date(now.getFullYear(), now.getMonth(), 1));
  const [view, setView] = useState<"month"|"agenda">("month");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<Partial<CalendarEvent>>({ type:"meeting", attendees:[] });
  const [errors, setErrors] = useState<Record<string,string>>({});
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent|null>(null);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent|null>(null);
  const [selectedDay, setSelectedDay] = useState<string|null>(todayStr);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month+1, 0).getDate();

  const canEditEvent = (ev: CalendarEvent) => isAdmin || ev.createdBy === myUserId || (!ev.createdBy && (ev.attendees||[]).includes(myUserId));
  const getUser = (id?: string) => { if (!id) return isFr?"Inconnu":"Unknown"; const u=users.find(u=>u.id===id); return u?`${u.firstName} ${u.lastName}`:id; };

  const getEventsForDay = (dateStr: string) => calendarEvents.filter(ev => ev.startDate.startsWith(dateStr));
  const isToday = (day: number) => now.getFullYear()===year && now.getMonth()===month && now.getDate()===day;

  const selectedDayEvents = useMemo(() => {
    if (!selectedDay) return [];
    return calendarEvents.filter(ev => ev.startDate.startsWith(selectedDay)).sort((a,b)=>a.startDate.localeCompare(b.startDate));
  }, [calendarEvents, selectedDay]);

  const agendaEvents = useMemo(() => {
    return [...calendarEvents].sort((a,b)=>a.startDate.localeCompare(b.startDate));
  }, [calendarEvents]);

  const agendaGrouped = useMemo(() => {
    const groups: Record<string, CalendarEvent[]> = {};
    agendaEvents.forEach(ev => {
      const day = ev.startDate.split("T")[0];
      if (!groups[day]) groups[day] = [];
      groups[day].push(ev);
    });
    return Object.entries(groups).sort(([a],[b])=>a.localeCompare(b));
  }, [agendaEvents]);

  const validate = () => {
    const e: Record<string,string> = {};
    if (!form.title?.trim()) e.title = isFr?"Titre requis":"Title required";
    if (!form.startDate) e.startDate = isFr?"Date requise":"Date required";
    setErrors(e); return Object.keys(e).length===0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    if (editingEvent) {
      setCalendarEvents(prev => prev.map(ev => ev.id === editingEvent.id ? {
        ...ev, title:form.title!, type:(form.type||"meeting") as any,
        startDate:form.startDate!, endDate:form.endDate||form.startDate!,
        matterId:form.matterId, location:form.location, attendees:form.attendees||[],
      } : ev));
    } else {
      setCalendarEvents(prev => [{
        id:`ev${Date.now()}`, title:form.title!, type:(form.type||"meeting") as any,
        startDate:form.startDate!, endDate:form.endDate||form.startDate!,
        matterId:form.matterId, location:form.location, attendees:form.attendees||[],
        createdBy: myUserId,
      }, ...prev]);
    }
    setShowModal(false); setEditingEvent(null);
    setForm({ type:"meeting", attendees:[] }); setErrors({});
  };

  const deleteEvent = (ev: CalendarEvent) => {
    if (window.confirm(isFr?"Supprimer cet événement ?":"Delete this event?")) {
      setCalendarEvents(prev => prev.filter(e => e.id !== ev.id));
      setSelectedEvent(null);
    }
  };

  const openNewEvent = (dateStr?: string) => {
    const d = dateStr || todayStr;
    setForm({ type:"courtDate", attendees:[], startDate:`${d}T09:00:00`, endDate:`${d}T10:00:00` });
    setEditingEvent(null); setErrors({}); setShowModal(true);
  };

  /* ── Event detail card (used in side panel and agenda) ──────────────── */
  const EventCard = ({ ev, compact=false }: { ev: CalendarEvent; compact?: boolean }) => {
    const matter = matters.find(m=>m.id===ev.matterId);
    const client = matter ? clients.find(c=>c.id===matter.clientId) : null;
    const lawyers = matter?.team?.length ? matter.team.map(tm=>{const u=users.find(u=>u.id===tm.userId); return u?{name:`${u.firstName} ${u.lastName}`,role:tm.role}:null;}).filter(Boolean) as {name:string;role:string}[] : [];
    const attendeeUsers = users.filter(u=>(ev.attendees||[]).includes(u.id));
    const ts = getTypeStyle(ev.type);
    const editable = canEditEvent(ev);
    const isSelected = selectedEvent?.id === ev.id;

    return (
      <div
        onClick={()=>setSelectedEvent(isSelected?null:ev)}
        style={{
          background: isSelected ? ts.bg : "white",
          border: `1px solid ${isSelected ? ts.border : "var(--gray-150, #e5e7eb)"}`,
          borderLeft: `4px solid ${ts.border}`,
          borderRadius: 8, padding: compact ? "10px 14px" : "14px 18px",
          cursor:"pointer", transition:"all 0.15s",
          boxShadow: isSelected ? `0 2px 8px ${ts.border}22` : "0 1px 3px rgba(0,0,0,0.04)",
          marginBottom: 8,
        }}
        onMouseEnter={e=>{if(!isSelected)e.currentTarget.style.boxShadow="0 2px 8px rgba(0,0,0,0.08)";}}
        onMouseLeave={e=>{if(!isSelected)e.currentTarget.style.boxShadow="0 1px 3px rgba(0,0,0,0.04)";}}
      >
        {/* Header row */}
        <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:8,marginBottom:isSelected?10:4}}>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontWeight:700,fontSize:compact?13:15,color:"var(--navy)",lineHeight:1.3}}>{ev.title}</div>
            <div style={{display:"flex",alignItems:"center",gap:8,marginTop:4,flexWrap:"wrap"}}>
              <span style={{background:ts.bg,color:ts.fg,border:`1px solid ${ts.border}33`,borderRadius:4,padding:"1px 8px",fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.03em"}}>
                {t(`calendar.eventTypes.${ev.type}`)}
              </span>
              <span style={{fontSize:11,color:"var(--gray-500)",display:"flex",alignItems:"center",gap:3}}>
                <Clock size={10}/>{ev.startDate.split("T")[1]?.slice(0,5)||"—"} – {ev.endDate?.split("T")[1]?.slice(0,5)||"—"}
              </span>
            </div>
          </div>
          <div style={{display:"flex",gap:4,flexShrink:0}}>
            {editable ? <Edit2 size={11} color="var(--gold)"/> : <Eye size={11} color="var(--gray-300)"/>}
          </div>
        </div>

        {/* Details — always visible */}
        <div style={{display:"grid",gap:5,marginTop:6}}>
          {ev.location && (
            <div style={{display:"flex",alignItems:"center",gap:6,fontSize:12,color:"var(--gray-600)"}}>
              <MapPin size={12} color={ts.border} style={{flexShrink:0}}/> <span style={{fontWeight:500}}>{ev.location}</span>
            </div>
          )}
          {client && (
            <div style={{display:"flex",alignItems:"center",gap:6,fontSize:12,color:"var(--navy)"}}>
              <Building2 size={12} color="var(--navy)" style={{flexShrink:0}}/> <span style={{fontWeight:600}}>{client.name}</span>
            </div>
          )}
          {lawyers.length > 0 && (
            <div style={{display:"flex",alignItems:"center",gap:6,fontSize:12}}>
              <Scale size={12} color="var(--gold-dark)" style={{flexShrink:0}}/>
              <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                {lawyers.map((l,i)=>(
                  <span key={i} style={{background:"var(--gold-pale,#fef9eb)",color:"var(--navy)",borderRadius:4,padding:"1px 8px",fontSize:11,fontWeight:600,border:"1px solid var(--gold,#C9A84C)"}}>
                    {l.name}
                  </span>
                ))}
              </div>
            </div>
          )}
          {matter && (
            <div style={{display:"flex",alignItems:"center",gap:6,fontSize:11,color:"var(--gray-500)"}}>
              <Briefcase size={11} style={{flexShrink:0}}/> {matter.matterId} — {matter.title}
            </div>
          )}
        </div>

        {/* Expanded details when selected */}
        {isSelected && (
          <div style={{marginTop:12,paddingTop:12,borderTop:`1px solid ${ts.border}22`}}>
            <div style={{display:"grid",gap:6}}>
              {matter?.court && (
                <div style={{display:"flex",alignItems:"center",gap:6,fontSize:12,color:"var(--gray-600)"}}>
                  <span style={{fontWeight:600,color:"var(--gray-400)",fontSize:10,textTransform:"uppercase",minWidth:80}}>{isFr?"Tribunal":"Court"}</span>
                  {matter.court}
                </div>
              )}
              {matter?.judge && (
                <div style={{display:"flex",alignItems:"center",gap:6,fontSize:12,color:"var(--gray-600)"}}>
                  <span style={{fontWeight:600,color:"var(--gray-400)",fontSize:10,textTransform:"uppercase",minWidth:80}}>{isFr?"Juge":"Judge"}</span>
                  {matter.judge}
                </div>
              )}
              {matter?.opposingCounsel && (
                <div style={{display:"flex",alignItems:"center",gap:6,fontSize:12,color:"var(--gray-600)"}}>
                  <span style={{fontWeight:600,color:"var(--gray-400)",fontSize:10,textTransform:"uppercase",minWidth:80}}>{isFr?"Adverse":"Opposing"}</span>
                  {matter.opposingCounsel}
                </div>
              )}
              {attendeeUsers.length > 0 && (
                <div style={{display:"flex",alignItems:"center",gap:6,fontSize:12}}>
                  <span style={{fontWeight:600,color:"var(--gray-400)",fontSize:10,textTransform:"uppercase",minWidth:80}}>{isFr?"Présents":"Attendees"}</span>
                  <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                    {attendeeUsers.map(u=>(
                      <span key={u.id} style={{background:"var(--navy)",color:"white",borderRadius:4,padding:"1px 8px",fontSize:11,fontWeight:500}}>{u.firstName} {u.lastName}</span>
                    ))}
                  </div>
                </div>
              )}
              {ev.createdBy && (
                <div style={{display:"flex",alignItems:"center",gap:6,fontSize:11,color:"var(--gray-400)"}}>
                  <User size={10}/> {isFr?"Créé par":"Created by"} {getUser(ev.createdBy)}
                </div>
              )}
            </div>
            {/* Action buttons */}
            <div style={{display:"flex",gap:8,marginTop:12,justifyContent:"flex-end"}}>
              {editable ? (
                <>
                  <button onClick={e=>{e.stopPropagation();deleteEvent(ev);}} style={{background:"none",border:"1px solid #ef4444",color:"#ef4444",borderRadius:6,padding:"5px 14px",fontSize:12,fontWeight:500,cursor:"pointer",display:"flex",alignItems:"center",gap:4}}>
                    <Trash2 size={12}/>{isFr?"Supprimer":"Delete"}
                  </button>
                  <button onClick={e=>{e.stopPropagation();setForm({...ev});setEditingEvent(ev);setSelectedEvent(null);setShowModal(true);}} style={{background:"var(--navy)",border:"none",color:"white",borderRadius:6,padding:"5px 14px",fontSize:12,fontWeight:500,cursor:"pointer",display:"flex",alignItems:"center",gap:4}}>
                    <Edit2 size={12}/>{isFr?"Modifier":"Edit"}
                  </button>
                </>
              ) : (
                <span style={{fontSize:11,color:"var(--gray-400)",fontStyle:"italic"}}>{isFr?"Lecture seule — créé par":"View only — created by"} {getUser(ev.createdBy)}</span>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  /* ── RENDER ──────────────────────────────────────────────────────────── */
  return (
    <div>
      {/* Header */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20,flexWrap:"wrap",gap:12}}>
        <div>
          <h1 style={{fontSize:22,fontWeight:700,color:"var(--navy)",margin:0,fontFamily:"Playfair Display,serif"}}>
            {isFr?"Calendrier":"Calendar"}
          </h1>
          <p style={{fontSize:13,color:"var(--gray-500)",margin:"4px 0 0"}}>
            {calendarEvents.length} {isFr?"événement(s)":"event(s)"} · {MONTHS[now.getMonth()]} {now.getFullYear()}
          </p>
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          {/* View toggle */}
          <div style={{display:"flex",border:"1px solid var(--gray-200)",borderRadius:6,overflow:"hidden"}}>
            <button onClick={()=>setView("month")} style={{padding:"6px 12px",fontSize:12,fontWeight:600,border:"none",cursor:"pointer",background:view==="month"?"var(--navy)":"white",color:view==="month"?"white":"var(--gray-500)",display:"flex",alignItems:"center",gap:4}}>
              <LayoutGrid size={13}/>{isFr?"Mois":"Month"}
            </button>
            <button onClick={()=>setView("agenda")} style={{padding:"6px 12px",fontSize:12,fontWeight:600,border:"none",cursor:"pointer",background:view==="agenda"?"var(--navy)":"white",color:view==="agenda"?"white":"var(--gray-500)",display:"flex",alignItems:"center",gap:4,borderLeft:"1px solid var(--gray-200)"}}>
              <List size={13}/>{isFr?"Agenda":"Agenda"}
            </button>
          </div>
          <button onClick={()=>openNewEvent()} style={{background:"var(--gold,#C9A84C)",color:"white",border:"none",borderRadius:6,padding:"8px 16px",fontSize:13,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",gap:5}}>
            <Plus size={15}/>{isFr?"Nouvel Événement":"New Event"}
          </button>
        </div>
      </div>

      {/* Type legend */}
      <div style={{display:"flex",gap:12,marginBottom:16,flexWrap:"wrap"}}>
        {Object.entries(TYPE_COLOR).map(([type,c])=>(
          <div key={type} style={{display:"flex",alignItems:"center",gap:5,fontSize:11,color:c.fg}}>
            <div style={{width:8,height:8,borderRadius:2,background:c.border}}/>{t(`calendar.eventTypes.${type}`)}
          </div>
        ))}
      </div>

      {view === "month" ? (
        /* ════════════════ MONTH VIEW — Calendar + Side Panel ════════════ */
        <div style={{display:"grid",gridTemplateColumns:"1fr 380px",gap:20,alignItems:"start"}}>
          {/* Left: Calendar grid */}
          <div style={{background:"white",borderRadius:10,border:"1px solid var(--gray-150,#e5e7eb)",overflow:"hidden",boxShadow:"0 1px 3px rgba(0,0,0,0.06)"}}>
            {/* Month nav */}
            <div style={{padding:"14px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:"1px solid var(--gray-100)"}}>
              <button onClick={()=>setCurrentDate(new Date(year,month-1,1))} style={{background:"none",border:"1px solid var(--gray-200)",borderRadius:6,padding:"6px 10px",cursor:"pointer",display:"flex"}}><ChevronLeft size={16} color="var(--gray-500)"/></button>
              <span style={{fontWeight:700,fontSize:16,color:"var(--navy)",fontFamily:"Playfair Display,serif"}}>{MONTHS[month]} {year}</span>
              <button onClick={()=>setCurrentDate(new Date(year,month+1,1))} style={{background:"none",border:"1px solid var(--gray-200)",borderRadius:6,padding:"6px 10px",cursor:"pointer",display:"flex"}}><ChevronRight size={16} color="var(--gray-500)"/></button>
            </div>
            {/* Day headers */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",borderBottom:"1px solid var(--gray-100)"}}>
              {DAYS.map(d=><div key={d} style={{padding:"8px 0",textAlign:"center",fontSize:10,fontWeight:700,color:"var(--gray-400)",textTransform:"uppercase",letterSpacing:"0.08em"}}>{d}</div>)}
            </div>
            {/* Day cells */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)"}}>
              {Array.from({length:firstDay}).map((_,i)=><div key={`e${i}`} style={{minHeight:80,borderRight:"1px solid var(--gray-50)",borderBottom:"1px solid var(--gray-50)",background:"#fafafa"}}/>)}
              {Array.from({length:daysInMonth}).map((_,i)=>{
                const day = i+1;
                const dateStr = `${year}-${String(month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
                const dayEvents = getEventsForDay(dateStr);
                const isSel = selectedDay === dateStr;
                const today = isToday(day);
                return (
                  <div key={day}
                    onClick={()=>{setSelectedDay(dateStr);setSelectedEvent(null);}}
                    style={{
                      minHeight:80, borderRight:"1px solid var(--gray-50)", borderBottom:"1px solid var(--gray-50)",
                      padding:"4px 6px", cursor:"pointer", transition:"background 0.1s",
                      background: isSel ? "var(--navy)" : today ? "#f0f7ff" : "white",
                    }}
                  >
                    <div style={{
                      width:24,height:24,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",
                      fontSize:12, fontWeight: today||isSel ? 700 : 400,
                      color: isSel ? "white" : today ? "var(--navy)" : "var(--gray-700)",
                      marginBottom:3,
                    }}>{day}</div>
                    <div style={{display:"flex",flexDirection:"column",gap:2}}>
                      {dayEvents.slice(0,3).map(ev=>{
                        const ts2 = getTypeStyle(ev.type);
                        return (
                          <div key={ev.id}
                            onClick={e=>{e.stopPropagation();setSelectedDay(dateStr);setSelectedEvent(ev);}}
                            style={{
                              background: isSel ? "rgba(255,255,255,0.15)" : ts2.bg,
                              color: isSel ? "white" : ts2.fg,
                              borderLeft: `2px solid ${ts2.border}`,
                              borderRadius:3, padding:"1px 5px", fontSize:10,
                              whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis",
                              fontWeight:500,
                            }}
                          >{ev.title}</div>
                        );
                      })}
                      {dayEvents.length>3&&<div style={{fontSize:9,color:isSel?"rgba(255,255,255,0.7)":"var(--gray-400)",fontWeight:600,paddingLeft:4}}>+{dayEvents.length-3}</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Side panel — day detail */}
          <div style={{position:"sticky",top:20}}>
            <div style={{background:"white",borderRadius:10,border:"1px solid var(--gray-150,#e5e7eb)",overflow:"hidden",boxShadow:"0 1px 3px rgba(0,0,0,0.06)"}}>
              <div style={{padding:"14px 18px",borderBottom:"1px solid var(--gray-100)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div>
                  <div style={{fontSize:14,fontWeight:700,color:"var(--navy)"}}>
                    {selectedDay ? (()=>{const d=new Date(selectedDay+"T12:00:00"); return `${DAYS_FULL[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]}`;})() : isFr?"Sélectionnez un jour":"Select a day"}
                  </div>
                  <div style={{fontSize:11,color:"var(--gray-400)",marginTop:2}}>{selectedDayEvents.length} {isFr?"événement(s)":"event(s)"}</div>
                </div>
                <button onClick={()=>openNewEvent(selectedDay||undefined)} style={{background:"var(--navy)",border:"none",color:"white",borderRadius:6,width:28,height:28,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}>
                  <Plus size={14}/>
                </button>
              </div>
              <div style={{padding:"12px 14px",maxHeight:"calc(100vh - 280px)",overflowY:"auto"}}>
                {selectedDayEvents.length === 0 ? (
                  <div style={{textAlign:"center",padding:"30px 10px",color:"var(--gray-400)"}}>
                    <CalIcon size={32} style={{opacity:0.3,margin:"0 auto 8px",display:"block"}}/>
                    <div style={{fontSize:13,fontWeight:500}}>{isFr?"Aucun événement":"No events"}</div>
                    <div style={{fontSize:11,marginTop:4}}>{isFr?"Cliquez + pour ajouter":"Click + to add"}</div>
                  </div>
                ) : selectedDayEvents.map(ev => <EventCard key={ev.id} ev={ev}/>)}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ════════════════ AGENDA VIEW ══════════════════════════════════ */
        <div style={{maxWidth:800}}>
          {agendaGrouped.length === 0 ? (
            <div style={{background:"white",borderRadius:10,border:"1px solid var(--gray-150,#e5e7eb)",padding:40,textAlign:"center",color:"var(--gray-400)"}}>
              <CalIcon size={40} style={{opacity:0.3,margin:"0 auto 12px",display:"block"}}/>
              <div style={{fontSize:14,fontWeight:500}}>{isFr?"Aucun événement":"No events"}</div>
            </div>
          ) : agendaGrouped.map(([dateStr, events]) => {
            const d = new Date(dateStr+"T12:00:00");
            const isPast = dateStr < todayStr;
            const isToday2 = dateStr === todayStr;
            return (
              <div key={dateStr} style={{marginBottom:24,opacity:isPast?0.6:1}}>
                {/* Date header */}
                <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:10}}>
                  <div style={{
                    background: isToday2 ? "var(--navy)" : "var(--gray-100)",
                    color: isToday2 ? "white" : "var(--navy)",
                    borderRadius:10, padding:"8px 14px", textAlign:"center", minWidth:56,
                  }}>
                    <div style={{fontSize:22,fontWeight:800,lineHeight:1}}>{d.getDate()}</div>
                    <div style={{fontSize:9,textTransform:"uppercase",letterSpacing:"0.05em",marginTop:2}}>{MONTHS[d.getMonth()]?.slice(0,3)}</div>
                  </div>
                  <div>
                    <div style={{fontSize:14,fontWeight:600,color:"var(--navy)"}}>{DAYS_FULL[d.getDay()]}</div>
                    <div style={{fontSize:11,color:"var(--gray-400)"}}>{events.length} {isFr?"événement(s)":"event(s)"}{isPast ? ` · ${isFr?"Passé":"Past"}` : isToday2 ? ` · ${isFr?"Aujourd'hui":"Today"}` : ""}</div>
                  </div>
                </div>
                {/* Events for this day */}
                {events.map(ev => <EventCard key={ev.id} ev={ev}/>)}
              </div>
            );
          })}
        </div>
      )}

      {/* ── New / Edit Modal ───────────────────────────────────────────── */}
      {showModal && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.4)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={()=>{setShowModal(false);setEditingEvent(null);}}>
          <div style={{background:"white",borderRadius:12,width:"100%",maxWidth:560,maxHeight:"90vh",overflow:"auto",boxShadow:"0 20px 60px rgba(0,0,0,0.2)"}} onClick={e=>e.stopPropagation()}>
            <div style={{padding:"18px 24px",borderBottom:"1px solid var(--gray-100)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <span style={{fontSize:16,fontWeight:700,color:"var(--navy)"}}>{editingEvent ? (isFr?"Modifier l'événement":"Edit Event") : (isFr?"Nouvel Événement":"New Event")}</span>
              <button onClick={()=>{setShowModal(false);setEditingEvent(null);}} style={{background:"none",border:"none",cursor:"pointer",padding:4}}><X size={18} color="var(--gray-400)"/></button>
            </div>
            <div style={{padding:"20px 24px",display:"grid",gap:16}}>
              <div>
                <label style={{fontSize:12,fontWeight:600,color:"var(--gray-600)",display:"block",marginBottom:4}}>{isFr?"Titre":"Title"} *</label>
                <input value={form.title||""} onChange={e=>setForm(f=>({...f,title:e.target.value}))} placeholder={isFr?"Ex: Audience TGI Wouri":"e.g. Court Hearing TGI Wouri"} style={{width:"100%",padding:"10px 14px",border:"1.5px solid var(--gray-200)",borderRadius:6,fontSize:14,outline:"none",boxSizing:"border-box"}}/>
                {errors.title&&<div style={{color:"#ef4444",fontSize:11,marginTop:3}}>{errors.title}</div>}
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                <div>
                  <label style={{fontSize:12,fontWeight:600,color:"var(--gray-600)",display:"block",marginBottom:4}}>{isFr?"Type":"Type"}</label>
                  <select value={form.type||"courtDate"} onChange={e=>setForm(f=>({...f,type:e.target.value as any}))} style={{width:"100%",padding:"10px 14px",border:"1.5px solid var(--gray-200)",borderRadius:6,fontSize:13,outline:"none",boxSizing:"border-box"}}>
                    {["courtDate","meeting","deadline","hearing","deposition","reminder"].map(t2=><option key={t2} value={t2}>{t(`calendar.eventTypes.${t2}`)}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{fontSize:12,fontWeight:600,color:"var(--gray-600)",display:"block",marginBottom:4}}>{isFr?"Lieu / Tribunal":"Location / Court"}</label>
                  <input value={form.location||""} onChange={e=>setForm(f=>({...f,location:e.target.value}))} placeholder={isFr?"Ex: TGI Wouri":"e.g. TGI Wouri"} style={{width:"100%",padding:"10px 14px",border:"1.5px solid var(--gray-200)",borderRadius:6,fontSize:13,outline:"none",boxSizing:"border-box"}}/>
                </div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                <div>
                  <label style={{fontSize:12,fontWeight:600,color:"var(--gray-600)",display:"block",marginBottom:4}}>{isFr?"Début":"Start"} *</label>
                  <input type="datetime-local" value={form.startDate?.slice(0,16)||""} onChange={e=>setForm(f=>({...f,startDate:e.target.value+":00"}))} style={{width:"100%",padding:"10px 14px",border:"1.5px solid var(--gray-200)",borderRadius:6,fontSize:13,outline:"none",boxSizing:"border-box"}}/>
                  {errors.startDate&&<div style={{color:"#ef4444",fontSize:11,marginTop:3}}>{errors.startDate}</div>}
                </div>
                <div>
                  <label style={{fontSize:12,fontWeight:600,color:"var(--gray-600)",display:"block",marginBottom:4}}>{isFr?"Fin":"End"}</label>
                  <input type="datetime-local" value={form.endDate?.slice(0,16)||""} onChange={e=>setForm(f=>({...f,endDate:e.target.value+":00"}))} style={{width:"100%",padding:"10px 14px",border:"1.5px solid var(--gray-200)",borderRadius:6,fontSize:13,outline:"none",boxSizing:"border-box"}}/>
                </div>
              </div>
              <div>
                <label style={{fontSize:12,fontWeight:600,color:"var(--gray-600)",display:"block",marginBottom:4}}>{isFr?"Dossier":"Matter"}</label>
                <select value={form.matterId||""} onChange={e=>setForm(f=>({...f,matterId:e.target.value}))} style={{width:"100%",padding:"10px 14px",border:"1.5px solid var(--gray-200)",borderRadius:6,fontSize:13,outline:"none",boxSizing:"border-box"}}>
                  <option value="">— {isFr?"Sélectionner un dossier":"Select a matter"} —</option>
                  {matters.map(m=><option key={m.id} value={m.id}>{m.matterId} – {m.title}</option>)}
                </select>
              </div>
              <div>
                <label style={{fontSize:12,fontWeight:600,color:"var(--gray-600)",display:"flex",alignItems:"center",gap:5,marginBottom:4}}>
                  <Users size={12}/>{isFr?"Participants":"Attendees"}
                </label>
                <AttendeeSelector selected={form.attendees||[]} onChange={ids=>setForm(f=>({...f,attendees:ids}))} users={users.filter(u=>u.active)} label={isFr?"Participants":"Attendees"}/>
              </div>
            </div>
            <div style={{padding:"14px 24px",borderTop:"1px solid var(--gray-100)",display:"flex",justifyContent:"flex-end",gap:8}}>
              <button onClick={()=>{setShowModal(false);setEditingEvent(null);}} style={{background:"none",border:"1px solid var(--gray-200)",borderRadius:6,padding:"8px 20px",fontSize:13,cursor:"pointer",color:"var(--gray-600)"}}>{isFr?"Annuler":"Cancel"}</button>
              <button onClick={handleSubmit} style={{background:"var(--navy)",border:"none",color:"white",borderRadius:6,padding:"8px 20px",fontSize:13,fontWeight:600,cursor:"pointer"}}>{editingEvent?(isFr?"Enregistrer":"Save"):(isFr?"Créer":"Create")}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
