import React from "react";
import { useTranslation } from "react-i18next";
import { Briefcase, Users, CheckSquare, TrendingUp, Clock, AlertCircle, Plus } from "lucide-react";
import { ResponsiveContainer, PieChart, Pie, Cell, Legend, Tooltip } from "recharts";
import { useApp } from "../context/AppContext";
import { useData } from "../context/DataContext";

const fmt = (n: number) => new Intl.NumberFormat("fr-CM", { style:"currency", currency:"XAF", maximumFractionDigits:0 }).format(n);

const matterStatusColors: Record<string,string> = { active:"#1D6FA4", open:"#1A7F4B", pending:"#B45309", closed:"#868E96", archived:"#ADB5BD" };

export default function Dashboard({ onNavigate }: { onNavigate: (page: string) => void }) {
  const { t } = useTranslation();
  const { users } = useApp();
  const { matters, clients, tasks, invoices, timeEntries, calendarEvents } = useData();

  const openMatters   = matters.filter(m=>["open","active","pending"].includes(m.status)).length;
  const activeClients = clients.filter(c=>c.active).length;
  const pendingTasks  = tasks.filter(tk=>tk.status!=="done"&&tk.status!=="cancelled").length;
  const monthRevenue  = invoices.filter(i=>i.status==="paid").reduce((s,i)=>s+i.amountPaid,0);
  const billableHours = timeEntries.filter(te=>te.billable).reduce((s,te)=>s+te.hours,0);
  const outstanding   = invoices.filter(i=>i.status!=="paid"&&i.status!=="cancelled").reduce((s,i)=>s+(i.total-i.amountPaid),0);
  const overdueInvoices = invoices.filter(i=>i.status==="overdue").length;

  const mattersByStatus = Object.entries(
    matters.reduce((acc: Record<string,number>, m) => { acc[m.status]=(acc[m.status]||0)+1; return acc; }, {})
  ).map(([name,value])=>({ name, value }));

  const getClientName = (id: string) => clients.find(c=>c.id===id)?.name||id;
  const getUser = (id: string) => { const u=users.find(u=>u.id===id); return u?`${u.firstName} ${u.lastName}`:id; };

  const matterStatusBadge = (status: string) => {
    const classes: Record<string,string> = { active:"badge-blue", open:"badge-green", pending:"badge-yellow", closed:"badge-gray", archived:"badge-gray" };
    return <span className={`badge ${classes[status]||"badge-gray"}`}>{t(`matters.statuses.${status}`)}</span>;
  };


  const upcomingEvents = [...calendarEvents].sort((a,b)=>a.startDate.localeCompare(b.startDate)).slice(0,4);
  const recentMatters  = [...matters].sort((a,b)=>b.openDate.localeCompare(a.openDate)).slice(0,5);
  const urgentTasks    = tasks.filter(tk=>(tk.priority==="urgent"||tk.priority==="high")&&tk.status!=="done").slice(0,4);

  return (
    <div>
      <div className="stats-grid">
        {[
          { label:t("dashboard.openMatters"),     value:openMatters,   icon:<Briefcase size={22}/>,  color:"blue",   change:null },
          { label:t("dashboard.activeClients"),   value:activeClients, icon:<Users size={22}/>,      color:"green",  change:null },
          { label:t("dashboard.pendingTasks"),    value:pendingTasks,  icon:<CheckSquare size={22}/>, color:"yellow", change:overdueInvoices>0?`${overdueInvoices} ${t("billing.statuses.overdue")}`:null },
          { label:t("dashboard.monthlyRevenue"),  value:fmt(monthRevenue), icon:<TrendingUp size={22}/>, color:"gold", change:null },
          { label:t("dashboard.billableHours"),   value:`${billableHours.toFixed(1)}h`, icon:<Clock size={22}/>, color:"purple", change:null },
          { label:t("dashboard.outstandingBalance"), value:fmt(outstanding), icon:<AlertCircle size={22}/>, color:"red", change:null },
        ].map((s,i)=>(
          <div key={i} className="stat-card">
            <div className={`stat-icon ${s.color}`}>{s.icon}</div>
            <div>
              <div className="stat-value" style={{fontSize:typeof s.value==="string"&&s.value.length>10?16:26}}>{s.value}</div>
              <div className="stat-label">{s.label}</div>
              {s.change&&<div className="stat-change down"><AlertCircle size={12}/>{s.change}</div>}
            </div>
          </div>
        ))}
      </div>

      <div className="card" style={{marginBottom:20}}>
        <div className="card-header"><span className="card-title">{t("dashboard.quickActions")}</span></div>
        <div className="card-body" style={{display:"flex",gap:12,flexWrap:"wrap"}}>
          <button className="btn btn-primary" onClick={()=>onNavigate("matters")}><Plus size={15}/>{t("dashboard.newMatter")}</button>
          <button className="btn btn-outline" onClick={()=>onNavigate("clients")}><Plus size={15}/>{t("dashboard.newClient")}</button>
          <button className="btn btn-outline" onClick={()=>onNavigate("time")}><Plus size={15}/>{t("dashboard.addTimeEntry")}</button>
          <button className="btn btn-outline" onClick={()=>onNavigate("billing")}><Plus size={15}/>{t("dashboard.createInvoice")}</button>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="card">
          <div className="card-header">
            <span className="card-title">{t("dashboard.recentMatters")}</span>
            <button className="btn btn-ghost btn-sm" onClick={()=>onNavigate("matters")}>{t("common.view")} →</button>
          </div>
          {recentMatters.length===0
            ? <div className="empty-state"><div className="empty-state-text">{t("common.noData")}</div><div className="empty-state-sub">{t("matters.newMatter")}</div></div>
            : <div className="table-container"><table>
              <thead><tr><th>ID</th><th>{t("matters.matterTitle")}</th><th>{t("matters.status")}</th><th>{t("matters.practiceArea")}</th></tr></thead>
              <tbody>
                {recentMatters.map(m=>(
                  <tr key={m.id}>
                    <td><span style={{fontFamily:"monospace",fontSize:12}}>{m.matterId}</span></td>
                    <td><div style={{fontWeight:500,color:"var(--navy)"}}>{m.title}</div><div style={{fontSize:11,color:"var(--gray-400)"}}>{getClientName(m.clientId)}</div></td>
                    <td>{matterStatusBadge(m.status)}</td>
                    <td style={{fontSize:12,color:"var(--gray-500)"}}>{t(`matters.practiceAreas.${m.practiceArea}`)}</td>
                  </tr>
                ))}
              </tbody>
            </table></div>}
        </div>

        <div style={{display:"flex",flexDirection:"column",gap:20}}>
          <div className="card">
            <div className="card-header">
              <span className="card-title">{t("dashboard.upcomingDeadlines")}</span>
              <button className="btn btn-ghost btn-sm" onClick={()=>onNavigate("calendar")}>{t("common.view")} →</button>
            </div>
            <div className="card-body" style={{padding:0}}>
              {upcomingEvents.length===0
                ? <div style={{textAlign:"center",padding:"20px 0",color:"var(--gray-400)",fontSize:13}}>{t("common.noData")}</div>
                : upcomingEvents.map(ev=>{
                  const matter = matters.find(m=>m.id===ev.matterId);
                  const client = matter ? clients.find(c=>c.id===matter.clientId) : null;
                  const lawyers = matter?.team?.length ? matter.team.map(tm=>{const u=users.find(u=>u.id===tm.userId); return u?`${u.firstName} ${u.lastName}`:null;}).filter(Boolean) : [];
                  const typeColors: Record<string,string> = { courtDate:"#C0392B", meeting:"#1D6FA4", deadline:"#B45309", hearing:"#6741D9", deposition:"#1A7F4B", reminder:"#868E96" };
                  const color = typeColors[ev.type]||"var(--gray-500)";
                  return (
                  <div key={ev.id} onClick={()=>onNavigate("calendar")} style={{display:"flex",alignItems:"flex-start",gap:12,padding:"12px 20px",borderBottom:"1px solid var(--gray-100)",cursor:"pointer",transition:"background 0.15s"}}
                    onMouseEnter={e=>{e.currentTarget.style.background="var(--gray-50)";}} onMouseLeave={e=>{e.currentTarget.style.background="transparent";}}>
                    <div style={{width:4,minHeight:50,borderRadius:2,background:color,flexShrink:0}}/>
                    <div style={{background:"var(--gray-100)",borderRadius:8,padding:"6px 10px",textAlign:"center",flexShrink:0,minWidth:46}}>
                      <div style={{fontSize:18,fontWeight:700,color:"var(--navy)",lineHeight:1}}>{new Date(ev.startDate).getDate()}</div>
                      <div style={{fontSize:10,color:"var(--gray-500)",textTransform:"uppercase",marginTop:2}}>{new Date(ev.startDate).toLocaleString(undefined,{month:"short"})}</div>
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontWeight:600,fontSize:13,color:"var(--navy)",marginBottom:2}}>{ev.title}</div>
                      <div style={{fontSize:11,color:"var(--gray-500)",marginBottom:2}}>
                        {t(`calendar.eventTypes.${ev.type}`)} · {ev.startDate.split("T")[1]?.slice(0,5)||"—"}
                        {ev.location&&<span style={{fontWeight:500}}> · 📍 {ev.location}</span>}
                      </div>
                      {client && <div style={{fontSize:11,color:"var(--navy)",fontWeight:600}}>🏢 {client.name}</div>}
                      {lawyers.length > 0 && (
                        <div style={{display:"flex",gap:4,flexWrap:"wrap",marginTop:2}}>
                          <span style={{fontSize:10,color:"var(--gray-400)"}}>⚖️</span>
                          {lawyers.map((name,i)=>(
                            <span key={i} style={{background:"var(--gold-pale)",color:"var(--navy)",borderRadius:10,padding:"0px 8px",fontSize:10,fontWeight:600,border:"1px solid var(--gold)"}}>{name}</span>
                          ))}
                        </div>
                      )}
                      {matter?.court && <div style={{fontSize:10,color:"var(--gray-400)",marginTop:1}}>🏛️ {matter.court}</div>}
                    </div>
                    <span className="badge" style={{background:color+"22",color,flexShrink:0,fontSize:10}}>{t(`calendar.eventTypes.${ev.type}`)}</span>
                  </div>
                  );
                })}
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <span className="card-title">{t("tasks.title")}</span>
              <button className="btn btn-ghost btn-sm" onClick={()=>onNavigate("tasks")}>{t("common.view")} →</button>
            </div>
            <div className="card-body" style={{padding:"8px 20px"}}>
              {urgentTasks.length===0
                ? <div style={{textAlign:"center",padding:"20px 0",color:"var(--gray-400)",fontSize:13}}>{t("common.noData")}</div>
                : urgentTasks.map(tk=>(
                  <div key={tk.id} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderBottom:"1px solid var(--gray-100)"}}>
                    <span className={`priority-dot priority-${tk.priority}`}/>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:13,fontWeight:500,color:"var(--gray-800)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{tk.title}</div>
                      <div style={{fontSize:11,color:"var(--gray-400)"}}>{getUser(tk.assignedTo)} · {tk.dueDate}</div>
                    </div>
                    <span className={`badge badge-${tk.priority==="urgent"?"red":"yellow"}`}>{t(`tasks.priorities.${tk.priority}`)}</span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>

      {mattersByStatus.length > 0 && (
        <div style={{marginTop:20}}>
          <div className="card">
            <div className="card-header"><span className="card-title">{t("dashboard.mattersByStatus")}</span></div>
            <div style={{padding:20}}>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={mattersByStatus} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" nameKey="name" paddingAngle={3}>
                    {mattersByStatus.map((entry)=><Cell key={entry.name} fill={matterStatusColors[entry.name]||"#999"}/>)}
                  </Pie>
                  <Tooltip formatter={(v,name)=>[v, t(`matters.statuses.${name}`)]}/>
                  <Legend formatter={name=>t(`matters.statuses.${name}`)}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}