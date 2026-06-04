import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { FileDown, FileSpreadsheet } from "lucide-react";
import { useApp } from "../context/AppContext";
import { useData } from "../context/DataContext";
import Logo from "../components/ui/Logo";
import {
  exportToExcel, exportToPDF,
  exportInvoices, exportMatterProfitability
} from "../utils/exportUtils";

const fmt = (n: number) => new Intl.NumberFormat("fr-CM", { style:"currency", currency:"XAF", maximumFractionDigits:0 }).format(n);
const COLORS = ["#0B1F3A","#C9A84C","#1A7F4B","#C0392B","#1D6FA4","#6741D9","#B45309"];

export default function Reports() {
  const { t } = useTranslation();
  const { users } = useApp();
  const { matters, invoices, timeEntries, clients, expenses } = useData();
  const [activeReport, setActiveReport] = useState("financial");
  const [dateFrom, setDateFrom] = useState(new Date().getFullYear()+"-01-01");
  const [dateTo, setDateTo] = useState(new Date().getFullYear()+"-12-31");

  const totalBilled    = invoices.reduce((s,i)=>s+i.total,0);
  const totalPaid      = invoices.reduce((s,i)=>s+i.amountPaid,0);
  const totalOutstanding = totalBilled-totalPaid;
  const collectionRate = totalBilled>0 ? Math.round((totalPaid/totalBilled)*100) : 0;

  const practiceAreaData = Object.entries(
    matters.reduce((acc: Record<string,number>, m)=>{acc[m.practiceArea]=(acc[m.practiceArea]||0)+1;return acc;},{})
  ).map(([area,count])=>({name:area,count}));

  const invoiceStatusData = Object.entries(
    invoices.reduce((acc: Record<string,number>, inv)=>{acc[inv.status]=(acc[inv.status]||0)+inv.total;return acc;},{})
  ).map(([status,amount])=>({name:status,amount}));

  const utilizationData = users.filter(u=>u.billingRate>0).map(u=>{
    const hours = timeEntries.filter(te=>te.userId===u.id).reduce((s,te)=>s+te.hours,0);
    return {name:`${u.firstName[0]}. ${u.lastName}`, hours:Math.round(hours*10)/10, target:120};
  });

  return (
    <div>
      <div className="report-logo-header">
        <Logo size="md" variant="dark" showTagline/>
        <div className="report-firm-info">
          <div className="report-firm-name">Dentons KMN</div>
          <div>Kouengoua · Minou · Nkongho Law Firm</div>
          <div>Douala, Cameroun</div>
          <a href="https://www.dentons.com/en/global-presence/africa/cameroon/douala" target="_blank" rel="noopener noreferrer" style={{color:"var(--gold-dark)",textDecoration:"none",fontWeight:600}}>
            dentons.com/en/global-presence/africa/cameroon/douala
          </a>
        </div>
      </div>

      <div className="page-header">
        <div className="page-header-title">{t("reports.title")}</div>
        <div style={{display:"flex",gap:10}}>
          <input className="form-control" type="date" value={dateFrom} onChange={e=>setDateFrom(e.target.value)} style={{width:160}}/>
          <input className="form-control" type="date" value={dateTo} onChange={e=>setDateTo(e.target.value)} style={{width:160}}/>
          {/* Dynamic export based on active tab */}
          <button className="btn btn-outline" onClick={() => {
            if (activeReport === "financial") {
              const { data, cols } = exportInvoices(invoices, clients, matters);
              exportToPDF(data, cols, "Financial Report — Invoices", `DK_Invoices_${dateFrom}_${dateTo}`);
            } else if (activeReport === "matters") {
              const { data, cols } = exportMatterProfitability(matters, invoices, expenses, clients);
              exportToPDF(data, cols, "Matter Profitability Report", `DK_Matters_${dateFrom}`);
            } else if (activeReport === "time") {
              const data = users.filter(u => u.billingRate > 0).map(u => {
                const hrs = timeEntries.filter(te => te.userId === u.id);
                return { name:`${u.firstName} ${u.lastName}`, role:u.role, total:hrs.reduce((s,te)=>s+te.hours,0).toFixed(1)+"h", billable:hrs.filter(te=>te.billable).reduce((s,te)=>s+te.hours,0).toFixed(1)+"h", amount:fmt(hrs.filter(te=>te.billable).reduce((s,te)=>s+te.hours*te.billingRate,0)) };
              });
              exportToPDF(data,[{key:"name",label:"Name"},{key:"role",label:"Role"},{key:"total",label:"Total Hours"},{key:"billable",label:"Billable Hours"},{key:"amount",label:"Billable Amount"}],"Lawyer Productivity",`DK_Productivity_${dateFrom}`);
            } else {
              const { data, cols } = exportInvoices(invoices, clients, matters);
              exportToPDF(data, cols, "Client Report", `DK_Clients_${dateFrom}`);
            }
          }}><FileDown size={15}/>{t("reports.exportPdf")}</button>
          <button className="btn btn-outline" onClick={() => {
            if (activeReport === "financial") {
              const { data, cols } = exportInvoices(invoices, clients, matters);
              exportToExcel(data, cols, `DK_Invoices_${dateFrom}_${dateTo}`, "Invoices");
            } else if (activeReport === "matters") {
              const { data, cols } = exportMatterProfitability(matters, invoices, expenses, clients);
              exportToExcel(data, cols, `DK_Matters_${dateFrom}`, "Matter Profitability");
            } else if (activeReport === "time") {
              const data = users.filter(u => u.billingRate > 0).map(u => {
                const hrs = timeEntries.filter(te => te.userId === u.id);
                return { Name:`${u.firstName} ${u.lastName}`, Role:u.role, "Total Hours":hrs.reduce((s,te)=>s+te.hours,0).toFixed(1), "Billable Hours":hrs.filter(te=>te.billable).reduce((s,te)=>s+te.hours,0).toFixed(1), "Billable Amount":hrs.filter(te=>te.billable).reduce((s,te)=>s+te.hours*te.billingRate,0) };
              });
              exportToExcel(data as any,[{key:"Name",label:"Name"},{key:"Role",label:"Role"},{key:"Total Hours",label:"Total Hours"},{key:"Billable Hours",label:"Billable Hours"},{key:"Billable Amount",label:"Billable Amount"}],`DK_Productivity_${dateFrom}`,"Productivity");
            } else {
              const { data, cols } = exportInvoices(invoices, clients, matters);
              exportToExcel(data, cols, `DK_Clients_${dateFrom}`, "Clients");
            }
          }}><FileSpreadsheet size={15}/>{t("reports.exportExcel")}</button>
        </div>
      </div>

      <div className="tabs">
        {[["financial",t("reports.financialReports")],["matters",t("reports.matterReports")],["time",t("reports.timeReports")],["clients",t("reports.clientReports")]].map(([key,label])=>(
          <button key={key} className={`tab-btn ${activeReport===key?"active":""}`} onClick={()=>setActiveReport(key)}>{label}</button>
        ))}
      </div>

      {activeReport==="financial" && (
        <div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:16,marginBottom:24}}>
            {[
              {label:t("reports.revenue"),       value:fmt(totalBilled),         up:true},
              {label:t("billing.statuses.paid"), value:fmt(totalPaid),           up:true},
              {label:t("billing.receivables"),   value:fmt(totalOutstanding),    up:false},
              {label:t("dashboard.collectionRate"), value:`${collectionRate}%`,  up:collectionRate>=80},
            ].map((kpi,i)=>(
              <div key={i} className="card" style={{padding:16}}>
                <div style={{fontSize:12,color:"var(--gray-500)",fontWeight:600,textTransform:"uppercase",letterSpacing:"0.04em"}}>{kpi.label}</div>
                <div style={{fontSize:20,fontWeight:800,marginTop:6,color:"var(--navy)"}}>{kpi.value}</div>
              </div>
            ))}
          </div>

          {invoices.length > 0 && invoiceStatusData.length > 0 && (
            <div className="dashboard-grid" style={{marginBottom:20}}>
              <div className="card">
                <div className="card-header"><span className="card-title">{t("billing.invoices")}</span></div>
                <div style={{padding:20}}>
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={invoiceStatusData} cx="50%" cy="50%" outerRadius={80} dataKey="amount" nameKey="name" paddingAngle={3}>
                        {invoiceStatusData.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
                      </Pie>
                      <Tooltip formatter={(v: any, name: any)=>[fmt(v), t(`billing.statuses.${name}`)]}/>
                      <Legend formatter={(name: any)=>t(`billing.statuses.${name}`)}/>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="card">
                <div className="card-header"><span className="card-title">{t("billing.aging")}</span></div>
                <div className="table-container">
                  <table>
                    <thead><tr><th>{t("billing.invoiceNumber")}</th><th>{t("billing.client")}</th><th style={{textAlign:"right"}}>{t("billing.total")}</th><th style={{textAlign:"right"}}>{t("billing.amountDue")}</th><th>{t("common.status")}</th></tr></thead>
                    <tbody>
                      {invoices.map(inv=>{
                        const client=clients.find(c=>c.id===inv.clientId);
                        return <tr key={inv.id}>
                          <td style={{fontFamily:"monospace",fontSize:12}}>{inv.invoiceNumber}</td>
                          <td>{client?.name||"—"}</td>
                          <td style={{textAlign:"right"}}>{fmt(inv.total)}</td>
                          <td style={{textAlign:"right",fontWeight:600}}>{fmt(inv.total-inv.amountPaid)}</td>
                          <td><span className={`badge badge-${inv.status==="paid"?"green":inv.status==="overdue"?"red":"yellow"}`}>{t(`billing.statuses.${inv.status}`)}</span></td>
                        </tr>;
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
          {invoices.length===0&&<div className="card"><div className="empty-state"><div className="empty-state-text">{t("common.noData")}</div></div></div>}
        </div>
      )}

      {activeReport==="matters" && (
        <div className="dashboard-grid">
          <div className="card">
            <div className="card-header"><span className="card-title">{t("matters.practiceArea")}</span></div>
            {practiceAreaData.length===0
              ? <div className="empty-state"><div className="empty-state-text">{t("common.noData")}</div></div>
              : <div style={{padding:20}}>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={practiceAreaData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-100)" horizontal={false}/>
                    <XAxis type="number" fontSize={11} axisLine={false} tickLine={false}/>
                    <YAxis type="category" dataKey="name" fontSize={11} axisLine={false} tickLine={false} width={120} tickFormatter={(name: any)=>t(`matters.practiceAreas.${name}`).slice(0,18)}/>
                    <Tooltip labelFormatter={(name: any)=>t(`matters.practiceAreas.${name}`)}/>
                    <Bar dataKey="count" name={t("matters.title")} fill="var(--navy)" radius={[0,4,4,0]}/>
                  </BarChart>
                </ResponsiveContainer>
              </div>}
          </div>
          <div className="card">
            <div className="card-header"><span className="card-title">{t("dashboard.mattersByStatus")}</span></div>
            <div className="card-body">
              {["open","active","pending","closed","archived"].map(status=>{
                const count=matters.filter(m=>m.status===status).length;
                return <div key={status} style={{display:"flex",justifyContent:"space-between",padding:"10px 0",borderBottom:"1px solid var(--gray-100)"}}>
                  <span className={`badge badge-${status==="active"?"blue":status==="open"?"green":status==="pending"?"yellow":"gray"}`}>{t(`matters.statuses.${status}`)}</span>
                  <span style={{fontWeight:700,fontSize:16,color:"var(--navy)"}}>{count}</span>
                </div>;
              })}
            </div>
          </div>
        </div>
      )}

      {activeReport==="time" && (
        <div>
          {utilizationData.length===0
            ? <div className="card"><div className="empty-state"><div className="empty-state-text">{t("common.noData")}</div></div></div>
            : <div className="card">
              <div className="card-header"><span className="card-title">{t("reports.utilization")}</span></div>
              <div style={{padding:20}}>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={utilizationData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-100)"/>
                    <XAxis dataKey="name" fontSize={11} axisLine={false} tickLine={false}/>
                    <YAxis fontSize={11} axisLine={false} tickLine={false}/>
                    <Tooltip/>
                    <Bar dataKey="hours" name={t("time.billableHours")} fill="var(--navy)" radius={[4,4,0,0]}/>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>}
        </div>
      )}

      {activeReport==="clients" && (
        <div className="card">
          <div className="card-header"><span className="card-title">{t("clients.title")}</span></div>
          {clients.length===0
            ? <div className="empty-state"><div className="empty-state-text">{t("common.noData")}</div></div>
            : <div className="table-container"><table>
              <thead><tr><th>{t("clients.clientName")}</th><th>{t("clients.clientType")}</th><th>{t("matters.title")}</th><th style={{textAlign:"right"}}>{t("billing.title")}</th><th style={{textAlign:"right"}}>{t("billing.statuses.paid")}</th><th style={{textAlign:"right"}}>{t("billing.amountDue")}</th></tr></thead>
              <tbody>
                {clients.map(c=>{
                  const invs=invoices.filter(i=>i.clientId===c.id);
                  const billed=invs.reduce((s,i)=>s+i.total,0);
                  const paid=invs.reduce((s,i)=>s+i.amountPaid,0);
                  return <tr key={c.id}>
                    <td style={{fontWeight:500}}>{c.name}</td>
                    <td><span className="badge badge-blue">{t(`clients.clientTypes.${c.type}`)}</span></td>
                    <td style={{textAlign:"center"}}>{matters.filter(m=>m.clientId===c.id).length}</td>
                    <td style={{textAlign:"right"}}>{fmt(billed)}</td>
                    <td style={{textAlign:"right",color:"var(--success)"}}>{fmt(paid)}</td>
                    <td style={{textAlign:"right",fontWeight:600,color:billed-paid>0?"var(--warning)":"var(--success)"}}>{fmt(billed-paid)}</td>
                  </tr>;
                })}
              </tbody>
            </table></div>}
        </div>
      )}
    </div>
  );
}