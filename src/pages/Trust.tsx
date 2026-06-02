import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, X, CheckCircle } from "lucide-react";
import { useData } from "../context/DataContext";
import { TrustAccount } from "../types";

const fmt = (n: number) => new Intl.NumberFormat("fr-CM", { style:"currency", currency:"XAF", maximumFractionDigits:0 }).format(n);

export default function Trust() {
  const { t } = useTranslation();
  const { trustAccounts, setTrustAccounts, trustTransactions, setTrustTransactions, clients } = useData();
  const [selectedAccount, setSelectedAccount] = useState<TrustAccount|null>(null);
  const [showModal, setShowModal] = useState(false);
  const [transType, setTransType] = useState<"deposit"|"withdrawal"|"transfer">("deposit");
  const [form, setForm] = useState<{clientId:string,amount:number,description:string,date:string}>({ clientId:"", amount:0, description:"", date:new Date().toISOString().split("T")[0] });

  const getClient = (id: string) => clients.find(c=>c.id===id);
  const getAccountTransactions = (id: string) => trustTransactions.filter(t2=>t2.trustAccountId===id);
  const totalBalance = trustAccounts.reduce((s,a)=>s+a.balance,0);

  const typeColor: Record<string,string> = { deposit:"badge-green", withdrawal:"badge-red", transfer:"badge-blue" };
  const typeLabel = (type: string) => type==="deposit"?t("trust.deposit"):type==="withdrawal"?t("trust.withdrawal"):t("trust.transfer");

  const handleSubmit = () => {
    if (!form.clientId || !form.amount) return;
    let account = trustAccounts.find(a=>a.clientId===form.clientId);
    if (!account && transType==="deposit") {
      account = { id:`ta${Date.now()}`, clientId:form.clientId, accountNumber:`SEQ-${new Date().getFullYear()}-${String(trustAccounts.length+1).padStart(3,"0")}`, balance:0, currency:"XAF" };
      setTrustAccounts(prev=>[...prev, account!]);
    }
    if (!account) return;
    const newBalance = transType==="deposit" ? account.balance+form.amount : account.balance-form.amount;
    setTrustAccounts(prev=>prev.map(a=>a.id===account!.id?{...a,balance:newBalance}:a));
    setTrustTransactions(prev=>[{
      id:`tt${Date.now()}`, trustAccountId:account!.id, type:transType,
      amount:form.amount, date:form.date, description:form.description, balanceAfter:newBalance,
    }, ...prev]);
    setShowModal(false);
    setForm({ clientId:"", amount:0, description:"", date:new Date().toISOString().split("T")[0] });
  };

  return (
    <div>
      <div className="page-header">
        <div><div className="page-header-title">{t("trust.title")}</div><div className="page-header-subtitle">{trustAccounts.length} {t("common.active").toLowerCase()}</div></div>
        <button className="btn btn-gold" onClick={()=>setShowModal(true)}><Plus size={15}/>{t("common.add")} {t("trust.deposit").toLowerCase()}</button>
      </div>

      <div style={{background:"var(--navy)",color:"white",borderRadius:12,padding:"20px 24px",marginBottom:20,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div>
          <div style={{fontSize:13,opacity:0.7,marginBottom:4}}>{t("trust.title")} — {t("trust.balance")}</div>
          <div className="trust-balance">{fmt(totalBalance)}</div>
        </div>
        <div style={{textAlign:"right"}}>
          <div style={{fontSize:12,opacity:0.6,marginBottom:4}}>{trustAccounts.length} {t("common.active").toLowerCase()}</div>
          <div style={{display:"flex",alignItems:"center",gap:6,justifyContent:"flex-end"}}><CheckCircle size={14}/><span style={{fontSize:12}}>{t("trust.reconcile")}</span></div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="card">
          <div className="card-header"><span className="card-title">{t("trust.title")}</span></div>
          {trustAccounts.length===0
            ? <div className="empty-state"><div className="empty-state-text">{t("common.noData")}</div><div className="empty-state-sub">{t("trust.deposit")} to create an account</div></div>
            : <div className="card-body" style={{padding:0}}>
              {trustAccounts.map(acc=>{
                const client=getClient(acc.clientId);
                return (
                  <div key={acc.id} onClick={()=>setSelectedAccount(acc)}
                    style={{padding:"16px 20px",cursor:"pointer",borderBottom:"1px solid var(--gray-100)",background:selectedAccount?.id===acc.id?"var(--gray-50)":"white",transition:"background 0.1s"}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                      <div><div style={{fontWeight:600,fontSize:14,color:"var(--navy)"}}>{client?.name||acc.clientId}</div><div style={{fontSize:11,color:"var(--gray-400)",marginTop:2,fontFamily:"monospace"}}>{acc.accountNumber}</div></div>
                      <div style={{textAlign:"right"}}><div style={{fontWeight:700,fontSize:16,color:"var(--navy)"}}>{fmt(acc.balance)}</div><div style={{fontSize:11,color:"var(--gray-400)",marginTop:2}}>{getAccountTransactions(acc.id).length} tx</div></div>
                    </div>
                    <div className="progress-bar" style={{marginTop:10}}><div className="progress-fill" style={{width:totalBalance>0?`${Math.min(100,(acc.balance/totalBalance)*100)}%`:"0%"}}/></div>
                  </div>
                );
              })}
            </div>}
        </div>

        <div>
          {selectedAccount ? (
            <div className="card">
              <div className="card-header">
                <span className="card-title">{t("trust.transactionHistory")}</span>
                <span style={{fontSize:12,color:"var(--gray-500)"}}>{getClient(selectedAccount.clientId)?.name}</span>
              </div>
              <div className="card-body" style={{padding:0}}>
                {getAccountTransactions(selectedAccount.id).length===0
                  ? <div className="empty-state"><div className="empty-state-text">{t("common.noData")}</div></div>
                  : getAccountTransactions(selectedAccount.id).map(tx=>(
                    <div key={tx.id} style={{padding:"14px 20px",borderBottom:"1px solid var(--gray-100)"}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                        <div><span className={`badge ${typeColor[tx.type]}`}>{typeLabel(tx.type)}</span><div style={{fontSize:13,color:"var(--gray-700)",marginTop:6}}>{tx.description}</div><div style={{fontSize:11,color:"var(--gray-400)",marginTop:2}}>{tx.date}</div></div>
                        <div style={{textAlign:"right"}}><div style={{fontWeight:700,fontSize:15,color:tx.type==="deposit"?"var(--success)":"var(--danger)"}}>{tx.type==="deposit"?"+":"−"}{fmt(tx.amount)}</div><div style={{fontSize:11,color:"var(--gray-400)",marginTop:2}}>{t("trust.balance")}: {fmt(tx.balanceAfter)}</div></div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ) : (
            <div className="card" style={{padding:40,textAlign:"center",color:"var(--gray-400)"}}>
              <div style={{fontSize:36,marginBottom:12}}>🏦</div>
              <div style={{fontWeight:500}}>{t("trust.account")}</div>
            </div>
          )}
        </div>
      </div>

      {showModal&&(
        <div className="modal-overlay" onClick={()=>setShowModal(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">{t("trust.deposit")} / {t("trust.withdrawal")}</span>
              <button className="btn btn-ghost btn-icon" onClick={()=>setShowModal(false)}><X size={18}/></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">{t("common.type")}</label>
                <div style={{display:"flex",gap:8}}>
                  {(["deposit","withdrawal","transfer"] as const).map(type=>(
                    <button key={type} className={`btn ${transType===type?"btn-primary":"btn-outline"} btn-sm`} onClick={()=>setTransType(type)}>{typeLabel(type)}</button>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label required">{t("clients.client")}</label>
                <select className="form-control" value={form.clientId} onChange={e=>setForm(f=>({...f,clientId:e.target.value}))}>
                  <option value="">— {t("clients.client")} —</option>
                  {clients.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label required">{t("common.amount")} (FCFA)</label>
                  <input className="form-control" type="number" value={form.amount||""} onChange={e=>setForm(f=>({...f,amount:parseInt(e.target.value)||0}))} placeholder="0"/>
                </div>
                <div className="form-group">
                  <label className="form-label">{t("common.date")}</label>
                  <input className="form-control" type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))}/>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">{t("common.description")}</label>
                <textarea className="form-control" value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} placeholder={t("common.description")}/>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={()=>setShowModal(false)}>{t("common.cancel")}</button>
              <button className="btn btn-gold" onClick={handleSubmit} disabled={!form.clientId||!form.amount}><Plus size={15}/>{t("common.save")}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}