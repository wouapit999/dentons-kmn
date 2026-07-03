import React, { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  Plus, X, CheckCircle, XCircle, Clock, AlertCircle, Search,
  Receipt, DollarSign, Send, RefreshCw, FileText, Download
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { useData } from "../context/DataContext";
import { Expense, ExpenseCategory, ExpenseStatus } from "../types";
import { exportToExcel, exportToPDF, exportExpenses } from "../utils/exportUtils";

const fmt = (n: number) =>
  new Intl.NumberFormat("fr-CM", { style: "currency", currency: "XAF", maximumFractionDigits: 0 }).format(n);

const CATEGORIES: ExpenseCategory[] = [
  "court_fees","travel","printing","postage","filing",
  "expert_fees","translation","meals","accommodation","office","other"
];

const STATUS_COLORS: Record<ExpenseStatus, string> = {
  pending:  "badge-yellow",
  approved: "badge-green",
  rejected: "badge-red",
  billed:   "badge-blue",
};

const STATUS_ICONS: Record<ExpenseStatus, React.ReactNode> = {
  pending:  <Clock size={11}/>,
  approved: <CheckCircle size={11}/>,
  rejected: <XCircle size={11}/>,
  billed:   <Receipt size={11}/>,
};

export default function Expenses() {
  const { t, i18n } = useTranslation();
  const { currentUser, users, session } = useApp();
  const { expenses, setExpenses, matters, clients } = useData();
  const isFr = i18n.language === "fr";

  const role         = currentUser?.role || session?.role || "";
  const canApprove   = ["admin","finance","managingPartner"].includes(role);
  const myUserId     = currentUser?.id || session?.userId || "";

  const [activeTab, setActiveTab]   = useState(canApprove ? "queue" : "mine");
  const [statusFilter, setStatusFilter] = useState<ExpenseStatus|"all">("all");
  const [search, setSearch]         = useState("");
  const [showRequest, setShowRequest] = useState(false);
  const [showReject, setShowReject]   = useState<Expense|null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [form, setForm] = useState<Partial<Expense>>({
    date:        new Date().toISOString().split("T")[0],
    category:    "other",
    currency:    "XAF",
    billable:    true,
  });
  const [errors,  setErrors]  = useState<Record<string,string>>({});
  const [status,  setStatus]  = useState<{type:"success"|"error"|"info";msg:string}|null>(null);
  const [saving,  setSaving]  = useState(false);

  const toast = (type:"success"|"error"|"info", msg:string) => {
    setStatus({type,msg});
    setTimeout(() => setStatus(null), 5000);
  };

  const getUser   = (id: string) => { const u = users.find(u=>u.id===id); return u?`${u.firstName} ${u.lastName}`:id; };
  const getMatter = (id?: string) => matters.find(m=>m.id===id);
  const getClient = (id?: string) => clients.find(c=>c.id===id);

  // ── Submit a new expense request ──────────────────────────────────────────
  const submitRequest = () => {
    const e: Record<string,string> = {};
    if (!form.description?.trim()) e.description = t("errors.required");
    if (!form.amount || form.amount <= 0) e.amount = t("errors.required");
    if (!form.justification?.trim()) e.justification = isFr ? "Justification requise" : "Justification required";
    setErrors(e);
    if (Object.keys(e).length) return;

    setSaving(true);
    const newExpense: Expense = {
      id:           `e${Date.now()}`,
      matterId:     form.matterId,
      clientId:     form.clientId,
      userId:       myUserId,
      date:         form.date || new Date().toISOString().split("T")[0],
      submittedAt:  new Date().toISOString(),
      category:     (form.category as ExpenseCategory) || "other",
      description:  form.description!,
      justification: form.justification,
      amount:       form.amount!,
      currency:     form.currency || "XAF",
      billable:     form.billable !== false,
      billed:       false,
      approved:     false,
      status:       "pending",
    };
    setExpenses(prev => [newExpense, ...prev]);

    toast("success", isFr
      ? `✅ Demande de dépense soumise à la Finance pour validation. Montant : ${fmt(newExpense.amount)}`
      : `✅ Expense request submitted to Finance. Amount: ${fmt(newExpense.amount)}`);

    setShowRequest(false);
    setForm({ date:new Date().toISOString().split("T")[0], category:"other", currency:"XAF", billable:true });
    setErrors({});
    setSaving(false);
  };

  // ── Finance approves ──────────────────────────────────────────────────────
  const approveExpense = (exp: Expense) => {
    if (!canApprove) return;
    setExpenses(prev => prev.map(e => e.id===exp.id ? {
      ...e,
      status:      "approved" as ExpenseStatus,
      approved:    true,
      approvedBy:  myUserId,
      approvedAt:  new Date().toISOString(),
    } : e));
    toast("success", isFr
      ? `✅ Dépense de ${getUser(exp.userId)} approuvée (${fmt(exp.amount)})`
      : `✅ Expense from ${getUser(exp.userId)} approved (${fmt(exp.amount)})`);
  };

  // ── Finance rejects with reason ───────────────────────────────────────────
  const rejectExpense = () => {
    if (!showReject || !rejectReason.trim()) return;
    const exp = showReject;
    setExpenses(prev => prev.map(e => e.id===exp.id ? {
      ...e,
      status:          "rejected" as ExpenseStatus,
      approved:        false,
      approvedBy:      myUserId,
      approvedAt:      new Date().toISOString(),
      rejectionReason: rejectReason.trim(),
    } : e));
    toast("info", isFr
      ? `❌ Dépense de ${getUser(exp.userId)} rejetée`
      : `❌ Expense from ${getUser(exp.userId)} rejected`);
    setShowReject(null);
    setRejectReason("");
  };

  // ── Reset rejected request to pending (re-submit) ─────────────────────────
  const resubmit = (exp: Expense) => {
    setExpenses(prev => prev.map(e => e.id===exp.id ? {
      ...e,
      status: "pending" as ExpenseStatus,
      rejectionReason: undefined,
      submittedAt: new Date().toISOString(),
    } : e));
    toast("success", isFr ? "Demande renvoyée pour validation." : "Request resubmitted.");
  };

  // ── Filtered list per tab ─────────────────────────────────────────────────
  const visibleExpenses = useMemo(() => {
    let list = expenses;
    if (activeTab === "mine") {
      list = list.filter(e => e.userId === myUserId);
    } else if (activeTab === "queue") {
      list = list.filter(e => e.status === "pending");
    } else if (activeTab === "history") {
      list = list.filter(e => e.status !== "pending");
    }
    const q = search.toLowerCase();
    return list.filter(e =>
      (statusFilter === "all" || e.status === statusFilter) &&
      (!q || e.description.toLowerCase().includes(q) || getUser(e.userId).toLowerCase().includes(q))
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expenses, activeTab, statusFilter, search, myUserId, users]);

  // ── KPIs ──────────────────────────────────────────────────────────────────
  const myPending  = expenses.filter(e => e.userId === myUserId && e.status === "pending").length;
  const myApproved = expenses.filter(e => e.userId === myUserId && e.status === "approved").length;
  const queueTotal = expenses.filter(e => e.status === "pending").length;
  const queueAmt   = expenses.filter(e => e.status === "pending").reduce((s,e) => s+e.amount, 0);

  const statusLabel = (s: ExpenseStatus) =>
    isFr
      ? ({ pending:"En attente", approved:"Approuvée", rejected:"Rejetée", billed:"Facturée" } as Record<ExpenseStatus,string>)[s]
      : ({ pending:"Pending",    approved:"Approved", rejected:"Rejected", billed:"Billed"  } as Record<ExpenseStatus,string>)[s];

  const handleExport = (type:"pdf"|"excel") => {
    const { data, cols } = exportExpenses(visibleExpenses, matters, users);
    if (type === "pdf") exportToPDF(data, cols, "Expense Requests — Dentons KMN", "DK_Expenses");
    else                exportToExcel(data, cols, "DK_Expenses", "Expenses");
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-header-title">
            {isFr ? "Demandes de Dépenses" : "Expense Requests"}
          </div>
          <div className="page-header-subtitle">
            {canApprove
              ? (isFr ? `${queueTotal} en attente de validation · ${fmt(queueAmt)}` : `${queueTotal} pending approval · ${fmt(queueAmt)}`)
              : (isFr ? `${myPending} en attente · ${myApproved} approuvées` : `${myPending} pending · ${myApproved} approved`)}
          </div>
        </div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          <button className="btn btn-outline btn-sm" onClick={()=>handleExport("pdf")}><Download size={14}/> PDF</button>
          <button className="btn btn-outline btn-sm" onClick={()=>handleExport("excel")}><Download size={14}/> Excel</button>
          <button className="btn btn-gold" onClick={()=>{setForm({date:new Date().toISOString().split("T")[0],category:"other",currency:"XAF",billable:true});setErrors({});setShowRequest(true);}}>
            <Plus size={15}/>{isFr?"Demander une Dépense":"Request Expense"}
          </button>
        </div>
      </div>

      {status && (
        <div className={`alert alert-${status.type}`} style={{marginBottom:20}}>
          {status.type==="success"?<CheckCircle size={16} style={{flexShrink:0}}/>:<AlertCircle size={16} style={{flexShrink:0}}/>}
          <span>{status.msg}</span>
        </div>
      )}

      {/* Info banner */}
      <div className="alert alert-info" style={{marginBottom:20}}>
        <Receipt size={15} style={{flexShrink:0}}/>
        <div>
          <strong>{isFr?"Comment ça marche":"How it works"} :</strong>{" "}
          {canApprove
            ? (isFr?"Validez ou rejetez les demandes de dépenses ci-dessous. Les utilisateurs reçoivent une notification.":"Approve or reject expense requests below. Submitters get notified of your decision.")
            : (isFr?"Soumettez votre demande, la Finance la validera ou la rejettera.":"Submit your request, Finance will approve or reject it.")}
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        {[
          ["mine",    isFr?"📝 Mes Demandes":"📝 My Requests"],
          ...(canApprove ? [
            ["queue",   isFr?`📋 File d'attente (${queueTotal})`:`📋 Approval Queue (${queueTotal})`],
            ["history", isFr?"🗂 Historique":"🗂 History"],
          ] : []),
          ["all",     isFr?"📊 Toutes":"📊 All"],
        ].map(([k,l])=>(
          <button key={k} className={`tab-btn ${activeTab===k?"active":""}`} onClick={()=>setActiveTab(k)}>{l}</button>
        ))}
      </div>

      {/* Filters */}
      <div className="filters-row">
        <div className="search-box">
          <Search size={15} className="search-icon"/>
          <input className="form-control" style={{paddingLeft:38}} placeholder={t("common.search")} value={search} onChange={e=>setSearch(e.target.value)}/>
        </div>
        <select className="filter-select" value={statusFilter} onChange={e=>setStatusFilter(e.target.value as any)}>
          <option value="all">{t("common.all")}</option>
          <option value="pending">{statusLabel("pending")}</option>
          <option value="approved">{statusLabel("approved")}</option>
          <option value="rejected">{statusLabel("rejected")}</option>
          <option value="billed">{statusLabel("billed")}</option>
        </select>
      </div>

      {/* List */}
      <div style={{display:"grid",gap:12}}>
        {visibleExpenses.length === 0 ? (
          <div className="card" style={{padding:40,textAlign:"center",color:"var(--gray-400)"}}>
            <Receipt size={40} style={{margin:"0 auto 12px",opacity:0.4,display:"block"}}/>
            <div style={{fontSize:14,fontWeight:500}}>
              {isFr?"Aucune demande pour le moment":"No requests yet"}
            </div>
            <div style={{fontSize:12,marginTop:4}}>
              {isFr?"Cliquez sur 'Demander une Dépense' pour commencer.":"Click 'Request Expense' to get started."}
            </div>
          </div>
        ) : visibleExpenses.map(exp => {
          const isMine     = exp.userId === myUserId;
          const status     = (exp.status || (exp.approved?"approved":"pending")) as ExpenseStatus;
          return (
            <div key={exp.id} className="card" style={{padding:18}}>
              <div style={{display:"flex",alignItems:"flex-start",gap:14,flexWrap:"wrap"}}>
                {/* Status indicator */}
                <div style={{
                  width:50,height:50,borderRadius:"50%",flexShrink:0,
                  background: status==="approved"?"var(--success-bg)":status==="rejected"?"var(--danger-bg)":status==="billed"?"var(--info-bg)":"var(--warning-bg)",
                  display:"flex",alignItems:"center",justifyContent:"center",
                  border: status==="approved"?"2px solid var(--success)":status==="rejected"?"2px solid var(--danger)":status==="billed"?"2px solid var(--info)":"2px solid var(--warning)",
                }}>
                  {status==="approved"?<CheckCircle size={22} color="var(--success)"/>:
                   status==="rejected"?<XCircle size={22} color="var(--danger)"/>:
                   status==="billed"?<Receipt size={22} color="var(--info)"/>:
                   <Clock size={22} color="var(--warning)"/>}
                </div>

                <div style={{flex:1,minWidth:200}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap",marginBottom:4}}>
                    <span style={{fontWeight:700,fontSize:15,color:"var(--navy)"}}>{exp.description}</span>
                    <span className={`badge ${STATUS_COLORS[status]}`} style={{display:"inline-flex",alignItems:"center",gap:3}}>
                      {STATUS_ICONS[status]} {statusLabel(status)}
                    </span>
                    <span className="badge badge-purple" style={{fontSize:10}}>{(exp.category||"").replace("_"," ")}</span>
                    {exp.billable && <span className="badge badge-blue" style={{fontSize:10}}>{isFr?"Facturable":"Billable"}</span>}
                  </div>

                  <div style={{fontSize:12,color:"var(--gray-500)",marginBottom:6,display:"flex",gap:12,flexWrap:"wrap"}}>
                    <span>👤 {getUser(exp.userId)}</span>
                    <span>📅 {exp.date}</span>
                    {exp.matterId && <span>📁 {getMatter(exp.matterId)?.matterId}</span>}
                    {exp.clientId && <span>🏢 {getClient(exp.clientId)?.name}</span>}
                  </div>

                  {exp.justification && (
                    <div style={{fontSize:12,color:"var(--gray-700)",background:"var(--gray-50)",padding:"6px 10px",borderRadius:6,marginBottom:6}}>
                      <strong>{isFr?"Justification":"Justification"} :</strong> {exp.justification}
                    </div>
                  )}

                  {exp.rejectionReason && (
                    <div style={{fontSize:12,color:"var(--danger)",background:"var(--danger-bg)",padding:"6px 10px",borderRadius:6,marginBottom:6}}>
                      <strong>❌ {isFr?"Motif du rejet":"Rejection reason"} :</strong> {exp.rejectionReason}
                    </div>
                  )}

                  {exp.approvedBy && (
                    <div style={{fontSize:11,color:"var(--gray-400)"}}>
                      {status==="approved"?(isFr?"Approuvée par ":"Approved by "):
                       status==="rejected"?(isFr?"Rejetée par ":"Rejected by "):""}
                      <strong>{getUser(exp.approvedBy)}</strong>
                      {exp.approvedAt && ` · ${exp.approvedAt.split("T")[0]}`}
                    </div>
                  )}
                </div>

                {/* Amount + Actions */}
                <div style={{textAlign:"right",flexShrink:0}}>
                  <div style={{fontSize:22,fontWeight:800,color:"var(--navy)",fontFamily:"Playfair Display,serif"}}>{fmt(exp.amount)}</div>
                  <div style={{fontSize:11,color:"var(--gray-400)"}}>{exp.currency||"XAF"}</div>

                  {/* Actions */}
                  <div style={{display:"flex",gap:6,marginTop:10,justifyContent:"flex-end",flexWrap:"wrap"}}>
                    {canApprove && status === "pending" && (
                      <>
                        <button className="btn btn-success btn-sm" onClick={()=>approveExpense(exp)}>
                          <CheckCircle size={13}/> {isFr?"Approuver":"Approve"}
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={()=>{setShowReject(exp);setRejectReason("");}}>
                          <XCircle size={13}/> {isFr?"Rejeter":"Reject"}
                        </button>
                      </>
                    )}
                    {isMine && status === "rejected" && (
                      <button className="btn btn-outline btn-sm" onClick={()=>resubmit(exp)}>
                        <Send size={13}/> {isFr?"Renvoyer":"Resubmit"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── REQUEST EXPENSE MODAL ── */}
      {showRequest && (
        <div className="modal-overlay" onClick={()=>setShowRequest(false)}>
          <div className="modal modal-lg" onClick={e=>e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title"><DollarSign size={18} style={{marginRight:8}}/>{isFr?"Demande de Dépense":"Expense Request"}</span>
              <button className="btn btn-ghost btn-icon" onClick={()=>setShowRequest(false)}><X size={18}/></button>
            </div>
            <div className="modal-body">
              <div className="alert alert-gold" style={{marginBottom:16}}>
                <FileText size={15} style={{flexShrink:0}}/>
                <span>{isFr?"Cette demande sera transmise à la Finance pour validation ou rejet.":"This request will be sent to Finance for approval or rejection."}</span>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label required">{t("common.description")}</label>
                  <input className="form-control" value={form.description||""} onChange={e=>setForm(f=>({...f,description:e.target.value}))} placeholder={isFr?"Ex: Taxi pour audience TGI Wouri":"e.g. Taxi to court hearing"}/>
                  {errors.description && <div className="form-error">{errors.description}</div>}
                </div>
                <div className="form-group">
                  <label className="form-label required">{t("common.amount")} (FCFA)</label>
                  <input className="form-control" type="number" value={form.amount||""} onChange={e=>setForm(f=>({...f,amount:parseFloat(e.target.value)||0}))} placeholder="15000"/>
                  {errors.amount && <div className="form-error">{errors.amount}</div>}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">{isFr?"Catégorie":"Category"}</label>
                  <select className="form-control" value={form.category||"other"} onChange={e=>setForm(f=>({...f,category:e.target.value as ExpenseCategory}))}>
                    {CATEGORIES.map(c=><option key={c} value={c}>{c.replace("_"," ").replace(/\b\w/g,l=>l.toUpperCase())}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">{t("common.date")}</label>
                  <input className="form-control" type="date" value={form.date||""} onChange={e=>setForm(f=>({...f,date:e.target.value}))}/>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">{t("matters.matter")} ({t("common.optional")})</label>
                  <select className="form-control" value={form.matterId||""} onChange={e=>setForm(f=>({...f,matterId:e.target.value}))}>
                    <option value="">— {t("matters.matter")} —</option>
                    {matters.map(m=><option key={m.id} value={m.id}>{m.matterId} – {m.title}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">{isFr?"Devise":"Currency"}</label>
                  <select className="form-control" value={form.currency||"XAF"} onChange={e=>setForm(f=>({...f,currency:e.target.value}))}>
                    {["XAF","USD","EUR","ZAR"].map(c=><option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label required">{isFr?"Justification (raison de la dépense)":"Justification (reason for expense)"}</label>
                <textarea
                  className="form-control"
                  value={form.justification||""}
                  onChange={e=>setForm(f=>({...f,justification:e.target.value}))}
                  placeholder={isFr?"Expliquez pourquoi cette dépense est nécessaire...":"Explain why this expense is necessary..."}
                  rows={3}
                />
                {errors.justification && <div className="form-error">{errors.justification}</div>}
              </div>

              <div className="form-group">
                <label className="checkbox-label">
                  <input type="checkbox" checked={form.billable!==false} onChange={e=>setForm(f=>({...f,billable:e.target.checked}))}/>
                  {isFr?"Refacturable au client":"Billable to client"}
                </label>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={()=>setShowRequest(false)}>{t("common.cancel")}</button>
              <button className="btn btn-gold" onClick={submitRequest} disabled={saving}>
                {saving?<><RefreshCw size={14} style={{animation:"spin 1s linear infinite"}}/> {isFr?"Envoi...":"Submitting..."}</>:<><Send size={15}/>{isFr?"Soumettre à la Finance":"Submit to Finance"}</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── REJECT MODAL ── */}
      {showReject && (
        <div className="modal-overlay" onClick={()=>setShowReject(null)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title" style={{color:"var(--danger)"}}><XCircle size={18} style={{marginRight:8}}/>{isFr?"Rejeter la Demande":"Reject Request"}</span>
              <button className="btn btn-ghost btn-icon" onClick={()=>setShowReject(null)}><X size={18}/></button>
            </div>
            <div className="modal-body">
              <div style={{padding:"12px 16px",background:"var(--gray-50)",borderRadius:8,marginBottom:16}}>
                <div style={{fontSize:13,fontWeight:600,color:"var(--navy)"}}>{showReject.description}</div>
                <div style={{fontSize:12,color:"var(--gray-500)",marginTop:3}}>{getUser(showReject.userId)} · {fmt(showReject.amount)}</div>
              </div>
              <div className="form-group">
                <label className="form-label required">{isFr?"Motif du rejet (sera communiqué au demandeur)":"Rejection reason (sent to submitter)"}</label>
                <textarea className="form-control" value={rejectReason} onChange={e=>setRejectReason(e.target.value)} placeholder={isFr?"Expliquez pourquoi cette dépense est rejetée...":"Explain why this expense is rejected..."} rows={4}/>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={()=>setShowReject(null)}>{t("common.cancel")}</button>
              <button className="btn btn-danger" onClick={rejectExpense} disabled={!rejectReason.trim()}>
                <XCircle size={14}/> {isFr?"Rejeter la Demande":"Reject Request"}
              </button>
            </div>
          </div>
        </div>
      )}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
