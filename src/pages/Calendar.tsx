import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronLeft, ChevronRight, Plus, X } from "lucide-react";
import { mockCalendarEvents, mockMatters, mockUsers } from "../data/mockData";
import { CalendarEvent } from "../types";

const MONTHS_EN = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const MONTHS_FR = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];
const DAYS_EN = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const DAYS_FR = ["Dim","Lun","Mar","Mer","Jeu","Ven","Sam"];

export default function CalendarPage() {
  const { t, i18n } = useTranslation();
  const isFr = i18n.language === "fr";
  const MONTHS = isFr ? MONTHS_FR : MONTHS_EN;
  const DAYS = isFr ? DAYS_FR : DAYS_EN;

  const [events, setEvents] = useState<CalendarEvent[]>(mockCalendarEvents);
  const [currentDate, setCurrentDate] = useState(new Date(2026, 5, 1)); // June 2026
  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [form, setForm] = useState<Partial<CalendarEvent>>({ type: "meeting", attendees: [] });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const getEventsForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
    return events.filter(ev => ev.startDate.startsWith(dateStr));
  };

  const eventTypeColor: Record<string, string> = {
    courtDate: "#e53e3e", meeting: "#3182ce", deadline: "#d69e2e",
    hearing: "#805ad5", deposition: "#38a169", reminder: "#718096"
  };

  const handleDayClick = (day: number) => {
    const d = new Date(year, month, day);
    setSelectedDate(d);
    const dateStr = `${year}-${String(month + 1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
    setForm(f => ({ ...f, startDate: `${dateStr}T09:00:00`, endDate: `${dateStr}T10:00:00` }));
    setShowModal(true);
  };

  const handleSubmit = () => {
    if (!form.title || !form.startDate) return;
    const newEv: CalendarEvent = {
      id: `ev${Date.now()}`, title: form.title!, type: form.type as any || "meeting",
      startDate: form.startDate!, endDate: form.endDate || form.startDate!,
      matterId: form.matterId, location: form.location, attendees: form.attendees || [],
    };
    setEvents(prev => [...prev, newEv]);
    setShowModal(false);
    setForm({ type: "meeting", attendees: [] });
  };

  const today = new Date();
  const isToday = (day: number) => today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-header-title">{t("calendar.title")}</div>
        </div>
        <button className="btn btn-primary" onClick={() => { setSelectedDate(new Date()); setShowModal(true); }}>
          <Plus size={15} />{t("calendar.newEvent")}
        </button>
      </div>

      {/* Legend */}
      <div style={{ display: "flex", gap: 16, marginBottom: 16, flexWrap: "wrap" }}>
        {Object.entries(eventTypeColor).map(([type, color]) => (
          <div key={type} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--gray-600)" }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: color }} />
            {t(`calendar.eventTypes.${type}`)}
          </div>
        ))}
      </div>

      <div className="card">
        {/* Calendar header */}
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--gray-100)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <button className="btn btn-ghost btn-icon" onClick={prevMonth}><ChevronLeft size={18} /></button>
          <div style={{ fontWeight: 700, fontSize: 17 }}>{MONTHS[month]} {year}</div>
          <button className="btn btn-ghost btn-icon" onClick={nextMonth}><ChevronRight size={18} /></button>
        </div>

        {/* Day headers */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", borderBottom: "1px solid var(--gray-100)" }}>
          {DAYS.map(d => (
            <div key={d} style={{ padding: "10px 0", textAlign: "center", fontSize: 11, fontWeight: 600, color: "var(--gray-400)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{d}</div>
          ))}
        </div>

        {/* Calendar grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)" }}>
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`empty-${i}`} style={{ minHeight: 100, borderRight: "1px solid var(--gray-100)", borderBottom: "1px solid var(--gray-100)", background: "var(--gray-50)" }} />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dayEvents = getEventsForDay(day);
            return (
              <div key={day} style={{ minHeight: 100, borderRight: "1px solid var(--gray-100)", borderBottom: "1px solid var(--gray-100)", padding: "6px 8px", cursor: "pointer", transition: "background 0.1s" }}
                onClick={() => handleDayClick(day)}
                onMouseEnter={e => (e.currentTarget.style.background = "var(--gray-50)")}
                onMouseLeave={e => (e.currentTarget.style.background = "white")}
              >
                <div style={{
                  width: 26, height: 26, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 13, fontWeight: isToday(day) ? 700 : 400,
                  background: isToday(day) ? "var(--primary)" : "transparent",
                  color: isToday(day) ? "white" : "var(--gray-800)",
                  marginBottom: 4
                }}>{day}</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {dayEvents.slice(0,3).map(ev => (
                    <div key={ev.id} style={{
                      background: eventTypeColor[ev.type] || "var(--gray-500)", color: "white",
                      borderRadius: 3, padding: "1px 5px", fontSize: 11, whiteSpace: "nowrap",
                      overflow: "hidden", textOverflow: "ellipsis"
                    }} title={ev.title}>{ev.title}</div>
                  ))}
                  {dayEvents.length > 3 && <div style={{ fontSize: 10, color: "var(--gray-400)" }}>+{dayEvents.length - 3}</div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Upcoming events list */}
      <div className="card" style={{ marginTop: 20 }}>
        <div className="card-header"><span className="card-title">Événements à venir</span></div>
        <div className="card-body" style={{ padding: "0 0 8px" }}>
          {events.sort((a, b) => a.startDate.localeCompare(b.startDate)).map(ev => (
            <div key={ev.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 20px", borderBottom: "1px solid var(--gray-100)" }}>
              <div style={{ width: 4, height: 40, borderRadius: 2, background: eventTypeColor[ev.type], flexShrink: 0 }} />
              <div style={{ flexShrink: 0, minWidth: 50, textAlign: "center" }}>
                <div style={{ fontSize: 20, fontWeight: 700, lineHeight: 1, color: "var(--primary)" }}>{new Date(ev.startDate).getDate()}</div>
                <div style={{ fontSize: 10, textTransform: "uppercase", color: "var(--gray-400)" }}>{MONTHS[new Date(ev.startDate).getMonth()].slice(0,3)}</div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{ev.title}</div>
                <div style={{ fontSize: 11, color: "var(--gray-400)", marginTop: 2 }}>
                  {t(`calendar.eventTypes.${ev.type}`)}
                  {ev.location && ` · ${ev.location}`}
                  {` · ${ev.startDate.split("T")[1]?.slice(0,5)}`}
                </div>
              </div>
              <span className="badge" style={{ background: eventTypeColor[ev.type] + "22", color: eventTypeColor[ev.type] }}>{t(`calendar.eventTypes.${ev.type}`)}</span>
            </div>
          ))}
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">{t("calendar.newEvent")}</span>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label required">{t("calendar.event")}</label>
                <input className="form-control" value={form.title || ""} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">{t("common.type")}</label>
                  <select className="form-control" value={form.type || "meeting"} onChange={e => setForm(f => ({ ...f, type: e.target.value as any }))}>
                    {["courtDate","meeting","deadline","hearing","deposition","reminder"].map(t2 => (
                      <option key={t2} value={t2}>{t(`calendar.eventTypes.${t2}`)}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">{t("calendar.startTime")}</label>
                  <input className="form-control" type="datetime-local" value={form.startDate?.slice(0,16) || ""} onChange={e => setForm(f => ({ ...f, startDate: e.target.value + ":00" }))} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">{t("calendar.location")}</label>
                  <input className="form-control" value={form.location || ""} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">{t("matters.matter")}</label>
                  <select className="form-control" value={form.matterId || ""} onChange={e => setForm(f => ({ ...f, matterId: e.target.value }))}>
                    <option value="">-- {t("matters.matter")} --</option>
                    {mockMatters.map(m => <option key={m.id} value={m.id}>{m.matterId}</option>)}
                  </select>
                </div>
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
