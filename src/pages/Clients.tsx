import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Search, Eye, Edit2, X, CheckCircle } from "lucide-react";
import { useData } from "../context/DataContext";
import { Client, ClientType } from "../types";

const fmt = (n: number) => new Intl.NumberFormat("fr-CM", { style:"currency", currency:"XAF", maximumFractionDigits:0 }).format(n);

export default function Clients() {
  const { t } = useTranslation();
  const { clients, setClients, matters, invoices } = useData();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState<Client|null>(null);
  const [detailView, setDetailView] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [form, setForm] = useState<Partial<Client>>({ type:"company", active:true, portalEnabled:false });
  const [errors, setErrors] = useState<Record<string,string>>({});

  const filtered = clients.filter(c => {
    const q = search.toLowerCase();
    return (!q || c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q)) && (typeFilter==="all" || c.type===typeFilter);
  });

  const typeBadge = (type: string) => {
    const map: Record<string,string> = { individual:"badge-purple", company:"badge-blue", government:"badge-yellow", ngo:"badge-green" };
    return <span className={`badge ${map[type]||"badge-gray"}`}>{t(`clients.clientTypes.${type}`)}</span>;
  };

  const validate = () => {
    const e: Record<string,string> = {};
    if (!form.name?.trim()) e.name = t("errors.required");
    if (!form.email?.trim()) e.email = t("errors.required");
    setErrors(e);
    return Object.keys(e).length===0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    if (selected) {
      setClients(prev => prev.map(c => c.id===selected.id ? {...c,...form} as Client : c));
    } else {
      setClients(prev => [{
        id:`c${Date.now()}`, name:form.name!, type:(form.type||"company") as ClientType,
        email:form.email||"", phone:form.phone||"", address:form.address||"",
        taxId:form.taxId, website:form.website, contactPerson:form.contactPerson,
        portalEnabled:form.portalEnabled||false, createdAt:new Date().toISOString().split("T")[0], active:true,
      }, ...prev]);
    }
    setShowModal(false); setSelected(null); setForm({ type:"company", active:true, portalEnabled:false }); setErrors({});
  };

  if (detailView && selected) {
    const cMatters  = matters.filter(m => m.clientId===selected.id);
    const cInvoices = invoices.filter(i => i.clientId===selected.id);
    const revenue   = cInvoices.reduce((s,i) => s+i.amountPaid, 0);
    return (
      <div>
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:20 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => setDetailView(false)}>← {t("common.back")}</button>
          <div style={{ flex:1 }}>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <h2 style={{ fontSize:18, fontWeight:700, color:"var(--navy)" }}>{selected.name}</h2>
              {typeBadge(selected.type)}
            </div>
            <div style={{ fontSize:12, color:"var(--gray-500)", marginTop:2 }}>{selected.email} · {selected.phone}</div>
          </div>
          <button className="btn btn-outline btn-sm" onClick={() => { setSelected(selected); setForm(selected); setDetailView(false); setShowModal(true); }}><Edit2 size={14}/>{t("common.edit")}</button>
        </div>
        <div className="tabs">
          {["overview","matters","invoices"].map(tab => (
            <button key={tab} className={`tab-btn ${activeTab===tab?"active":""}`} onClick={() => setActiveTab(tab)}>
              {tab==="overview"?t("clients.client"):tab==="matters"?`${t("matters.title")} (${cMatters.length})`:`${t("billing.invoices")} (${cInvoices.length})`}
            </button>
          ))}
        </div>
        {activeTab==="overview" && (
          <div className="form-row">
            <div className="card">
              <div className="card-header"><span className="card-title">{t("clients.client")}</span></div>
              <div className="card-body">
                {([
                  [t("clients.clientType"), typeBadge(selected.type)],
                  [t("common.email"), selected.email],
                  [t("common.phone"), selected.phone],
                  [t("common.address"), selected.address],
                  [t("clients.taxId"), selected.taxId],
                  [t("clients.contactPerson"), selected.contactPerson],
                  [t("common.createdAt"), selected.createdAt],
                ] as [string,any][]).filter(([,v])=>v).map(([l,v],i)=>(
                  <div key={i} style={{ display:"flex", gap:12, padding:"8px 0", borderBottom:"1px solid var(--gray-100)" }}>
                    <div style={{ width:160, fontSize:12, color:"var(--gray-500)", fontWeight:600, flexShrink:0 }}>{l}</div>
                    <div style={{ fontSize:13 }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="card">
              <div className="card-header"><span className="card-title">{t("common.total")}</span></div>
              <div className="card-body">
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:16 }}>
                  <div style={{ textAlign:"center", padding:12, background:"var(--gray-50)", borderRadius:8 }}>
                    <div style={{ fontSize:24, fontWeight:800, color:"var(--navy)" }}>{cMatters.length}</div>
                    <div style={{ fontSize:12, color:"var(--gray-500)" }}>{t("matters.title")}</div>
                  </div>
                  <div style={{ textAlign:"center", padding:12, background:"var(--gray-50)", borderRadius:8 }}>
                    <div style={{ fontSize:24, fontWeight:800, color:"var(--success)" }}>{cInvoices.length}</div>
                    <div style={{ fontSize:12, color:"var(--gray-500)" }}>{t("billing.invoices")}</div>
                  </div>
                </div>
                <div style={{ padding:12, background:"var(--gold-pale)", borderRadius:8, border:"1px solid rgba(201,168,76,0.3)" }}>
                  <div style={{ fontSize:12, color:"var(--gold-dark)", marginBottom:4, fontWeight:600 }}>{t("reports.revenue")}</div>
                  <div style={{ fontSize:20, fontWeight:800, color:"var(--navy)" }}>{fmt(revenue)}</div>
                </div>
                <div style={{ marginTop:12, display:"flex", alignItems:"center", gap:8 }}>
                  <CheckCircle size={16} color={selected.portalEnabled?"var(--success)":"var(--gray-300)"}/>
                  <span style={{ fontSize:13 }}>{t("clients.portalAccess")}</span>
                </div>
              </div>
            </div>
          </div>
        )}
        {activeTab==="matters" && (
          <div className="card">
            <div className="card-header"><span className="card-title">{t("matters.title")}</span></div>
            {cMatters.length===0 ? <div className="empty-state"><div className="empty-state-text">{t("common.noData")}</div></div>
            : <div className="table-container"><table><thead><tr><th>ID</th><th>{t("matters.matterTitle")}</th><th>{t("matters.practiceArea")}</th><th>{t("matters.status")}</th></tr></thead><tbody>
              {cMatters.map(m=><tr key={m.id}><td style={{fontFamily:"monospace",fontSize:12}}>{m.matterId}</td><td style={{fontWeight:500}}>{m.title}</td><td>{t(`matters.practiceAreas.${m.practiceArea}`)}</td><td><span className={`badge badge-${m.status==="active"?"blue":m.status==="closed"?"gray":"yellow"}`}>{t(`matters.statuses.${m.status}`)}</span></td></tr>)}
            </tbody></table></div>}
          </div>
        )}
        {activeTab==="invoices" && (
          <div className="card">
            <div className="card-header"><span className="card-title">{t("billing.invoices")}</span></div>
            {cInvoices.length===0 ? <div className="empty-state"><div className="empty-state-text">{t("common.noData")}</div></div>
            : <div className="table-container"><table><thead><tr><th>{t("billing.invoiceNumber")}</th><th>{t("billing.total")}</th><th>{t("billing.amountDue")}</th><th>{t("common.status")}</th></tr></thead><tbody>
              {cInvoices.map(inv=><tr key={inv.id}><td style={{fontFamily:"monospace",fontSize:12}}>{inv.invoiceNumber}</td><td>{fmt(inv.total)}</td><td style={{fontWeight:600}}>{fmt(inv.total-inv.amountPaid)}</td><td><span className={`badge badge-${inv.status==="paid"?"green":inv.status==="overdue"?"red":"yellow"}`}>{t(`billing.statuses.${inv.status}`)}</span></td></tr>)}
            </tbody></table></div>}
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div><div className="page-header-title">{t("clients.title")}</div><div className="page-header-subtitle">{filtered.length} {t("clients.clientList").toLowerCase()}</div></div>
        <button className="btn btn-gold" onClick={() => { setSelected(null); setDetailView(false); setForm({ type:"company", active:true, portalEnabled:false }); setErrors({}); setShowModal(true); }}>
          <Plus size={15}/>{t("clients.newClient")}
        </button>
      </div>
      <div className="filters-row">
        <div className="search-box"><Search size={15} className="search-icon"/><input className="form-control" style={{paddingLeft:38}} placeholder={t("common.search")} value={search} onChange={e=>setSearch(e.target.value)}/></div>
        <select className="filter-select" value={typeFilter} onChange={e=>setTypeFilter(e.target.value)}>
          <option value="all">{t("common.all")}</option>
          {["individual","company","government","ngo"].map(t2=><option key={t2} value={t2}>{t(`clients.clientTypes.${t2}`)}</option>)}
        </select>
      </div>
      <div className="card">
        <div className="table-container">
          <table>
            <thead><tr><th>{t("clients.clientName")}</th><th>{t("clients.clientType")}</th><th>{t("common.email")}</th><th>{t("common.phone")}</th><th>{t("matters.title")}</th><th>{t("common.status")}</th><th>{t("common.actions")}</th></tr></thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id}>
                  <td><div style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <div style={{ width:34, height:34, borderRadius:"50%", background:"var(--navy)", color:"white", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:700, flexShrink:0 }}>{c.name[0]}</div>
                    <div><div style={{fontWeight:500,cursor:"pointer",color:"var(--navy)"}} onClick={()=>{setSelected(c);setDetailView(true);setActiveTab("overview");}}>{c.name}</div>{c.contactPerson&&<div style={{fontSize:11,color:"var(--gray-400)"}}>{c.contactPerson}</div>}</div>
                  </div></td>
                  <td>{typeBadge(c.type)}</td>
                  <td style={{fontSize:13}}>{c.email}</td>
                  <td style={{fontSize:13}}>{c.phone}</td>
                  <td style={{textAlign:"center"}}>{matters.filter(m=>m.clientId===c.id).length}</td>
                  <td><span className={`badge ${c.active?"badge-green":"badge-gray"}`}>{c.active?t("common.active"):t("common.inactive")}</span></td>
                  <td><div style={{display:"flex",gap:4}}>
                    <button className="btn btn-ghost btn-sm btn-icon" onClick={()=>{setSelected(c);setDetailView(true);setActiveTab("overview");}}><Eye size={14}/></button>
                    <button className="btn btn-ghost btn-sm btn-icon" onClick={()=>{setSelected(c);setForm(c);setDetailView(false);setShowModal(true);}}><Edit2 size={14}/></button>
                  </div></td>
                </tr>
              ))}
              {!filtered.length && <tr><td colSpan={7}><div className="empty-state"><div className="empty-state-text">{t("common.noData")}</div></div></td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={()=>setShowModal(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">{selected?t("clients.editClient"):t("clients.newClient")}</span>
              <button className="btn btn-ghost btn-icon" onClick={()=>setShowModal(false)}><X size={18}/></button>
            </div>
            <div className="modal-body">
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label required">{t("clients.clientName")}</label>
                  <input className="form-control" value={form.name||""} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder={t("clients.clientName")}/>
                  {errors.name&&<div className="form-error">{errors.name}</div>}
                </div>
                <div className="form-group">
                  <label className="form-label required">{t("clients.clientType")}</label>
                  <select className="form-control" value={form.type||"company"} onChange={e=>setForm(f=>({...f,type:e.target.value as ClientType}))}>
                    {["individual","company","government","ngo"].map(t2=><option key={t2} value={t2}>{t(`clients.clientTypes.${t2}`)}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label required">{t("common.email")}</label>
                  <input className="form-control" type="email" value={form.email||""} onChange={e=>setForm(f=>({...f,email:e.target.value}))} placeholder="email@example.com"/>
                  {errors.email&&<div className="form-error">{errors.email}</div>}
                </div>
                <div className="form-group">
                  <label className="form-label">{t("common.phone")}</label>
                  <input className="form-control" value={form.phone||""} onChange={e=>setForm(f=>({...f,phone:e.target.value}))} placeholder="+237 6XX XXX XXX"/>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">{t("common.address")}</label>
                <input className="form-control" value={form.address||""} onChange={e=>setForm(f=>({...f,address:e.target.value}))} placeholder={t("common.address")}/>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">{t("clients.taxId")}</label>
                  <input className="form-control" value={form.taxId||""} onChange={e=>setForm(f=>({...f,taxId:e.target.value}))}/>
                </div>
                <div className="form-group">
                  <label className="form-label">{t("clients.contactPerson")}</label>
                  <input className="form-control" value={form.contactPerson||""} onChange={e=>setForm(f=>({...f,contactPerson:e.target.value}))}/>
                </div>
              </div>
              <div className="form-group">
                <label className="checkbox-label">
                  <input type="checkbox" checked={form.portalEnabled||false} onChange={e=>setForm(f=>({...f,portalEnabled:e.target.checked}))}/>
                  {t("clients.enablePortal")}
                </label>
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