import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Eye, Send, CheckCircle, X, AlertCircle } from "lucide-react";
import { useData } from "../context/DataContext";
import { Invoice, InvoiceStatus } from "../types";
import Logo from "../components/ui/Logo";

const fmt = (n: number) => new Intl.NumberFormat("fr-CM", { style:"currency", currency:"XAF", maximumFractionDigits:0 }).format(n);

export default function Billing() {
  const { t } = useTranslation();
  const { invoices, setInvoices, clients, matters } = useData();
  const [selected, setSelected] = useState<Invoice|null>(null);
  const [showModal, setShowModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [form, setForm] = useState<Partial<Invoice>>({});

  const getClient = (id: string) => clients.find(c=>c.id===id);
  const getMatter = (id: string) => matters.find(m=>m.id===id);

  const filtered = invoices.filter(i => statusFilter==="all" || i.status===statusFilter);
  const totalBilled = invoices.reduce((s,i)=>s+i.total,0);
  const totalPaid   = invoices.reduce((s,i)=>s+i.amountPaid,0);
  const overdueCount = invoices.filter(i=>i.status==="overdue").length;

  const statusBadge = (status: string) => {
    const map: Record<string,string> = { draft:"badge-gray", sent:"badge-blue", paid:"badge-green", overdue:"badge-red", cancelled:"badge-gray", partial:"badge-yellow" };
    return <span className={`badge ${map[status]}`}>{t(`billing.statuses.${status}`)}</span>;
  };

  const markPaid    = (id: string) => setInvoices(prev=>prev.map(i=>i.id===id?{...i,status:"paid" as InvoiceStatus,amountPaid:i.total}:i));
  const sendInvoice = (id: string) => setInvoices(prev=>prev.map(i=>i.id===id?{...i,status:"sent" as InvoiceStatus}:i));

  const handleCreate = () => {
    if (!form.clientId || !form.matterId) return;
    const inv: Invoice = {
      id:`i${Date.now()}`,
      invoiceNumber:`DK-INV-${new Date().getFullYear()}-${String(invoices.length+1).padStart(3,"0")}`,
      matterId:form.matterId!, clientId:form.clientId!,
      invoiceDate:new Date().toISOString().split("T")[0],
      dueDate:form.dueDate||new Date(Date.now()+30*86400000).toISOString().split("T")[0],
      lineItems:[], subtotal:0, taxRate:19.25, taxAmount:0, discount:0, total:0, amountPaid:0,
      status:"draft", paymentTerms:form.paymentTerms||"30 "+t("calendar.day"),
      billingModel:form.billingModel||"hourly",
    };
    setInvoices(prev=>[inv,...prev]);
    setShowModal(false);
    setForm({});
  };

  if (selected) {
    return (
      <div>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20}}>
          <button className="btn btn-ghost btn-sm" onClick={()=>setSelected(null)}>← {t("common.back")}</button>
          <div style={{flex:1}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <h2 style={{fontSize:18,fontWeight:700,color:"var(--navy)"}}>{selected.invoiceNumber}</h2>
              {statusBadge(selected.status)}
            </div>
            <div style={{fontSize:12,color:"var(--gray-500)",marginTop:2}}>{getClient(selected.clientId)?.name} · {getMatter(selected.matterId)?.title}</div>
          </div>
          {selected.status==="draft"&&<button className="btn btn-outline btn-sm" onClick={()=>sendInvoice(selected.id)}><Send size={14}/>{t("billing.sendInvoice")}</button>}
          {["sent","partial","overdue"].includes(selected.status)&&<button className="btn btn-gold btn-sm" onClick={()=>{markPaid(selected.id);setSelected(null);}}><CheckCircle size={14}/>{t("billing.markPaid")}</button>}
        </div>
        <div className="card">
          <div style={{padding:36}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:32,paddingBottom:20,borderBottom:"3px solid var(--navy)"}}>
              <div><Logo size="md" variant="dark" showTagline/><div style={{fontSize:12,color:"var(--gray-500)",marginTop:10}}>Douala, Cameroun</div><a href="https://www.dentons.com/en/global-presence/africa/cameroon/douala" target="_blank" rel="noopener noreferrer" style={{fontSize:11,color:"var(--gold-dark)",textDecoration:"none"}}>dentons.com · Africa/Cameroon/Douala</a></div>
              <div style={{textAlign:"right"}}>
                <div style={{fontSize:28,fontWeight:700,color:"var(--navy)",fontFamily:"Playfair Display,serif"}}>INVOICE</div>
                <div style={{fontSize:16,fontWeight:600,color:"var(--gray-700)",marginTop:4}}>{selected.invoiceNumber}</div>
                <div style={{fontSize:12,color:"var(--gray-500)",marginTop:8}}>{t("billing.invoiceDate")}: {selected.invoiceDate}</div>
                <div style={{fontSize:12,color:"var(--gray-500)"}}>{t("billing.dueDate")}: {selected.dueDate}</div>
              </div>
            </div>
            <div style={{background:"var(--gray-50)",borderRadius:8,padding:16,marginBottom:24}}>
              <div style={{fontSize:11,fontWeight:700,textTransform:"uppercase",color:"var(--gray-400)",letterSpacing:"0.05em",marginBottom:6}}>{t("billing.client").toUpperCase()}</div>
              <div style={{fontWeight:600,fontSize:15}}>{getClient(selected.clientId)?.name}</div>
              <div style={{fontSize:12,color:"var(--gray-500)",marginTop:2}}>{getClient(selected.clientId)?.address}</div>
              {getClient(selected.clientId)?.taxId&&<div style={{fontSize:12,color:"var(--gray-500)"}}>{t("clients.taxId")}: {getClient(selected.clientId)?.taxId}</div>}
              <div style={{marginTop:8,fontSize:12}}><strong>{t("matters.matter")}:</strong> {getMatter(selected.matterId)?.title} ({getMatter(selected.matterId)?.matterId})</div>
            </div>
            {selected.lineItems.length>0 ? (
              <table style={{width:"100%",borderCollapse:"collapse",marginBottom:24}}>
                <thead><tr style={{background:"var(--navy)",color:"white"}}>
                  <th style={{padding:"10px 14px",textAlign:"left",fontWeight:600,fontSize:12}}>Description</th>
                  <th style={{padding:"10px 14px",textAlign:"right",fontWeight:600,fontSize:12}}>{t("common.amount")}</th>
                </tr></thead>
                <tbody>{selected.lineItems.map(item=><tr key={item.id} style={{borderBottom:"1px solid var(--gray-100)"}}><td style={{padding:"12px 14px",fontSize:13}}>{item.description}</td><td style={{padding:"12px 14px",textAlign:"right",fontWeight:500}}>{fmt(item.amount)}</td></tr>)}</tbody>
              </table>
            ) : (
              <div style={{border:"2px dashed var(--gray-200)",borderRadius:8,padding:24,textAlign:"center",color:"var(--gray-400)",marginBottom:24}}>
                <div style={{fontSize:13}}>{t("billing.addLineItem")}</div>
              </div>
            )}
            <div style={{display:"flex",justifyContent:"flex-end"}}>
              <div style={{minWidth:280}}>
                {[[t("billing.subtotal"),fmt(selected.subtotal)],[`${t("billing.tax")} (${selected.taxRate}%)`,fmt(selected.taxAmount)]].map(([l,v],i)=>(
                  <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:"1px solid var(--gray-100)",fontSize:13}}>
                    <span style={{color:"var(--gray-600)"}}>{l}</span><span>{v}</span>
                  </div>
                ))}
                <div style={{display:"flex",justifyContent:"space-between",padding:"14px 16px",marginTop:4,background:"var(--navy)",color:"white",borderRadius:8}}>
                  <span style={{fontWeight:700}}>TOTAL</span>
                  <span style={{fontWeight:800,fontSize:16}}>{fmt(selected.total)}</span>
                </div>
                {selected.total-selected.amountPaid>0&&<div style={{display:"flex",justifyContent:"space-between",padding:"8px 0",fontSize:14,fontWeight:700,color:selected.status==="overdue"?"var(--danger)":"var(--gray-900)"}}>
                  <span>{t("billing.amountDue")}</span><span>{fmt(selected.total-selected.amountPaid)}</span>
                </div>}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div><div className="page-header-title">{t("billing.title")}</div><div className="page-header-subtitle">{filtered.length} {t("billing.invoices").toLowerCase()}</div></div>
        <button className="btn btn-gold" onClick={()=>setShowModal(true)}><Plus size={15}/>{t("billing.newInvoice")}</button>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:16,marginBottom:20}}>
        {[
          {label:`${t("billing.invoices")} total`, value:fmt(totalBilled), color:"var(--navy)"},
          {label:t("billing.statuses.paid"), value:fmt(totalPaid), color:"var(--success)"},
          {label:t("billing.receivables"), value:fmt(totalBilled-totalPaid), color:"var(--warning)"},
          {label:t("billing.statuses.overdue"), value:String(overdueCount), color:overdueCount>0?"var(--danger)":"var(--gray-400)"},
        ].map((s,i)=>(
          <div key={i} className="card" style={{padding:"18px 20px"}}>
            <div style={{fontSize:12,color:"var(--gray-500)",fontWeight:600,textTransform:"uppercase",letterSpacing:"0.04em"}}>{s.label}</div>
            <div style={{fontSize:20,fontWeight:800,color:s.color,marginTop:6}}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{display:"flex",gap:10,marginBottom:16,flexWrap:"wrap"}}>
        {["all","draft","sent","paid","partial","overdue"].map(s=>(
          <button key={s} className={`btn ${statusFilter===s?"btn-primary":"btn-outline"} btn-sm`} onClick={()=>setStatusFilter(s)}>
            {s==="all"?t("common.all"):t(`billing.statuses.${s}`)}
          </button>
        ))}
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead><tr><th>{t("billing.invoiceNumber")}</th><th>{t("billing.client")}</th><th>{t("billing.matter")}</th><th>{t("billing.invoiceDate")}</th><th>{t("billing.dueDate")}</th><th style={{textAlign:"right"}}>{t("billing.total")}</th><th style={{textAlign:"right"}}>{t("billing.amountDue")}</th><th>{t("common.status")}</th><th>{t("common.actions")}</th></tr></thead>
            <tbody>
              {filtered.map(inv=>(
                <tr key={inv.id}>
                  <td style={{fontFamily:"monospace",fontSize:12}}>{inv.invoiceNumber}</td>
                  <td style={{fontWeight:500}}>{getClient(inv.clientId)?.name||"—"}</td>
                  <td style={{fontSize:12,maxWidth:130}}><div className="truncate">{getMatter(inv.matterId)?.matterId||"—"}</div></td>
                  <td style={{fontSize:12}}>{inv.invoiceDate}</td>
                  <td style={{fontSize:12,color:inv.status==="overdue"?"var(--danger)":"inherit",fontWeight:inv.status==="overdue"?700:400}}>{inv.dueDate}</td>
                  <td style={{textAlign:"right",fontWeight:500}}>{fmt(inv.total)}</td>
                  <td style={{textAlign:"right",fontWeight:700,color:inv.total-inv.amountPaid===0?"var(--success)":"var(--gray-900)"}}>{fmt(inv.total-inv.amountPaid)}</td>
                  <td>{statusBadge(inv.status)}</td>
                  <td><div style={{display:"flex",gap:4}}>
                    <button className="btn btn-ghost btn-sm btn-icon" onClick={()=>setSelected(inv)} title={t("common.view")}><Eye size={14}/></button>
                    {inv.status==="draft"&&<button className="btn btn-ghost btn-sm btn-icon" onClick={()=>sendInvoice(inv.id)} title={t("billing.sendInvoice")}><Send size={14}/></button>}
                    {["sent","partial","overdue"].includes(inv.status)&&<button className="btn btn-ghost btn-sm btn-icon" onClick={()=>markPaid(inv.id)} title={t("billing.markPaid")}><CheckCircle size={14}/></button>}
                  </div></td>
                </tr>
              ))}
              {!filtered.length&&<tr><td colSpan={9}><div className="empty-state"><div className="empty-state-text">{t("common.noData")}</div></div></td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {showModal&&(
        <div className="modal-overlay" onClick={()=>setShowModal(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">{t("billing.newInvoice")}</span>
              <button className="btn btn-ghost btn-icon" onClick={()=>setShowModal(false)}><X size={18}/></button>
            </div>
            <div className="modal-body">
              {clients.length===0&&<div className="alert alert-info" style={{marginBottom:16}}><AlertCircle size={15}/><span>{t("clients.newClient")} first before creating an invoice.</span></div>}
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label required">{t("billing.client")}</label>
                  <select className="form-control" value={form.clientId||""} onChange={e=>setForm(f=>({...f,clientId:e.target.value}))}>
                    <option value="">— {t("billing.client")} —</option>
                    {clients.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label required">{t("billing.matter")}</label>
                  <select className="form-control" value={form.matterId||""} onChange={e=>setForm(f=>({...f,matterId:e.target.value}))}>
                    <option value="">— {t("billing.matter")} —</option>
                    {matters.map(m=><option key={m.id} value={m.id}>{m.matterId} – {m.title}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">{t("billing.dueDate")}</label>
                  <input className="form-control" type="date" value={form.dueDate||""} onChange={e=>setForm(f=>({...f,dueDate:e.target.value}))}/>
                </div>
                <div className="form-group">
                  <label className="form-label">{t("billing.paymentTerms")}</label>
                  <select className="form-control" value={form.paymentTerms||""} onChange={e=>setForm(f=>({...f,paymentTerms:e.target.value}))}>
                    <option value="30 days">30 days</option><option value="60 days">60 days</option><option value="immediate">Immediate</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={()=>setShowModal(false)}>{t("common.cancel")}</button>
              <button className="btn btn-gold" onClick={handleCreate} disabled={!form.clientId||!form.matterId}><Plus size={15}/>{t("billing.newInvoice")}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}