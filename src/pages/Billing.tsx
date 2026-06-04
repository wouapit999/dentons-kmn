import React, { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  Plus, Eye, Send, CheckCircle, X, AlertCircle,
  FileText, CreditCard, Printer, TrendingUp
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from "recharts";
import { useApp } from "../context/AppContext";
import { useData } from "../context/DataContext";
import { Invoice, InvoiceStatus, InvoiceLineItem, Expense, ExpenseCategory } from "../types";
import Logo from "../components/ui/Logo";

const TAX_RATE = 19.25;
const fmt = (n: number) =>
  new Intl.NumberFormat("fr-CM", { style: "currency", currency: "XAF", maximumFractionDigits: 0 }).format(n);
const PAYMENT_METHODS = ["bankTransfer", "mobileMoney", "cash", "check", "card"];
const EXPENSE_CATS: ExpenseCategory[] = [
  "court_fees","travel","printing","postage","filing",
  "expert_fees","translation","meals","accommodation","office","other"
];
const COLORS = ["#0B1F3A","#C9A84C","#1A7F4B","#C0392B","#1D6FA4","#6741D9","#B45309","#718096"];

export default function Billing() {
  const { t } = useTranslation();
  const { currentUser, users } = useApp();
  const {
    invoices, setInvoices, clients, matters, timeEntries,
    payments, setPayments, expenses, setExpenses, retainers, setRetainers
  } = useData();

  const [tab, setTab]                             = useState("dashboard");
  const [statusFilter, setStatusFilter]           = useState("all");
  const [selectedInvoice, setSelectedInvoice]     = useState<Invoice | null>(null);
  const [showInvoiceModal, setShowInvoiceModal]   = useState(false);
  const [showPaymentModal, setShowPaymentModal]   = useState<Invoice | null>(null);
  const [showExpenseModal, setShowExpenseModal]   = useState(false);
  const [showRetainerModal, setShowRetainerModal] = useState(false);

  // Form states
  const [invForm, setInvForm]   = useState<Partial<Invoice>>({ status:"draft", taxRate:TAX_RATE, discount:0, amountPaid:0 });
  const [lineItems, setLineItems] = useState<InvoiceLineItem[]>([]);
  const [invErrors, setInvErrors] = useState<Record<string,string>>({});
  const [payForm, setPayForm] = useState({ amount:0, date:new Date().toISOString().split("T")[0], method:"bankTransfer", reference:"", notes:"" });
  const [expForm, setExpForm] = useState<Partial<Expense>>({ date:new Date().toISOString().split("T")[0], billable:true, approved:false, currency:"XAF", category:"other" });
  const [retForm, setRetForm] = useState({ clientId:"", amount:0, currency:"XAF", startDate:new Date().toISOString().split("T")[0], billingCycle:"monthly", notes:"" });

  const getClient = (id: string) => clients.find(c => c.id === id);
  const getMatter = (id: string) => matters.find(m => m.id === id);
  const getUser   = (id: string) => { const u = users.find(u => u.id === id); return u ? `${u.firstName} ${u.lastName}` : id; };

  // ── KPIs ────────────────────────────────────────────────────────────────
  const totalBilled      = invoices.reduce((s, i) => s + i.total, 0);
  const totalCollected   = invoices.reduce((s, i) => s + i.amountPaid, 0);
  const totalOutstanding = totalBilled - totalCollected;
  const totalExpenses    = expenses.reduce((s, e) => s + e.amount, 0);
  const collectionRate   = totalBilled > 0 ? Math.round((totalCollected / totalBilled) * 100) : 0;
  const overdueAmt       = invoices.filter(i => i.status === "overdue").reduce((s, i) => s + (i.total - i.amountPaid), 0);

  // ── Aging buckets ───────────────────────────────────────────────────────
  const today = new Date();
  const aging = useMemo(() => {
    const b = { current:0, d30:0, d60:0, d90:0, d90p:0 };
    invoices.filter(i => ["sent","partial","overdue"].includes(i.status)).forEach(inv => {
      const days = Math.floor((today.getTime() - new Date(inv.dueDate).getTime()) / 86400000);
      const amt  = inv.total - inv.amountPaid;
      if (days <= 0)       b.current += amt;
      else if (days <= 30) b.d30     += amt;
      else if (days <= 60) b.d60     += amt;
      else if (days <= 90) b.d90     += amt;
      else                 b.d90p    += amt;
    });
    return b;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoices]);

  const revenueByArea = useMemo(() => {
    const map: Record<string,number> = {};
    invoices.filter(i => i.amountPaid > 0).forEach(inv => {
      const area = getMatter(inv.matterId)?.practiceArea || "other";
      map[area] = (map[area] || 0) + inv.amountPaid;
    });
    return Object.entries(map).map(([area, amount]) => ({ area, amount }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoices, matters]);

  const revenueByLawyer = useMemo(() =>
    Object.entries(
      timeEntries.filter(te => te.billable).reduce((acc: Record<string,{hours:number;amount:number}>, te) => {
        if (!acc[te.userId]) acc[te.userId] = { hours:0, amount:0 };
        acc[te.userId].hours  += te.hours;
        acc[te.userId].amount += te.hours * te.billingRate;
        return acc;
      }, {})
    ).map(([uid, d]) => ({ name: getUser(uid), ...d })),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  [timeEntries, users]);

  // ── Invoice helpers ─────────────────────────────────────────────────────
  const calcTotals = (items: InvoiceLineItem[], discount = 0, taxRate = TAX_RATE) => {
    const subtotal  = items.reduce((s, li) => s + li.amount, 0);
    const taxAmount = Math.round((subtotal - discount) * (taxRate / 100));
    return { subtotal, taxAmount, total: subtotal - discount + taxAmount };
  };

  const addLineItem = () =>
    setLineItems(prev => [...prev, { id:`li${Date.now()}`, description:"", quantity:1, rate:0, amount:0, type:"fee" }]);

  const updateLineItem = (id: string, field: string, value: any) =>
    setLineItems(prev => prev.map(li => {
      if (li.id !== id) return li;
      const u = { ...li, [field]: value };
      if (field === "quantity" || field === "rate")
        u.amount = (field === "quantity" ? value : li.quantity) * (field === "rate" ? value : li.rate);
      return u;
    }));

  const handleCreateInvoice = () => {
    const e: Record<string,string> = {};
    if (!invForm.clientId) e.clientId = t("errors.required");
    if (!invForm.matterId)  e.matterId  = t("errors.required");
    if (Object.keys(e).length) { setInvErrors(e); return; }
    const { subtotal, taxAmount, total } = calcTotals(lineItems, invForm.discount||0, invForm.taxRate||TAX_RATE);
    const year = new Date().getFullYear();
    setInvoices(prev => [{
      id: `i${Date.now()}`,
      invoiceNumber: `DK-INV-${year}-${String(prev.length + 1).padStart(3,"0")}`,
      matterId: invForm.matterId!, clientId: invForm.clientId!,
      invoiceDate: invForm.invoiceDate || new Date().toISOString().split("T")[0],
      dueDate: invForm.dueDate || new Date(Date.now()+30*86400000).toISOString().split("T")[0],
      lineItems, subtotal, taxRate: invForm.taxRate||TAX_RATE, taxAmount,
      discount: invForm.discount||0, total, amountPaid: 0,
      status: "draft" as InvoiceStatus,
      paymentTerms: invForm.paymentTerms||"30 days",
      notes: invForm.notes,
      billingModel: invForm.billingModel||"hourly",
    }, ...prev]);
    setShowInvoiceModal(false);
    setInvForm({ status:"draft", taxRate:TAX_RATE, discount:0, amountPaid:0 });
    setLineItems([]); setInvErrors({});
  };

  const handleRecordPayment = (inv: Invoice) => {
    const amt = payForm.amount || (inv.total - inv.amountPaid);
    setPayments(prev => [{
      id: `p${Date.now()}`, invoiceId: inv.id,
      clientId: inv.clientId, matterId: inv.matterId,
      amount: amt, currency: "XAF", date: payForm.date,
      method: payForm.method as any,
      reference: payForm.reference, notes: payForm.notes,
      receiptNumber: `RCT-${Date.now()}`,
    }, ...prev]);
    const newPaid = inv.amountPaid + amt;
    setInvoices(prev => prev.map(i => i.id === inv.id ? {
      ...i, amountPaid: newPaid,
      status: (newPaid >= i.total ? "paid" : "partial") as InvoiceStatus
    } : i));
    setShowPaymentModal(null);
    setPayForm({ amount:0, date:new Date().toISOString().split("T")[0], method:"bankTransfer", reference:"", notes:"" });
  };

  const handleCreateExpense = () => {
    if (!expForm.description || !expForm.amount) return;
    setExpenses(prev => [{
      id: `e${Date.now()}`,
      matterId: expForm.matterId, clientId: expForm.clientId,
      userId: currentUser?.id || "u1",
      date: expForm.date || new Date().toISOString().split("T")[0],
      category: expForm.category as ExpenseCategory || "other",
      description: expForm.description!,
      amount: expForm.amount!, currency: expForm.currency||"XAF",
      billable: expForm.billable !== false, billed: false, approved: false,
    }, ...prev]);
    setShowExpenseModal(false);
    setExpForm({ date:new Date().toISOString().split("T")[0], billable:true, approved:false, currency:"XAF", category:"other" });
  };

  const handleCreateRetainer = () => {
    if (!retForm.clientId || !retForm.amount) return;
    setRetainers(prev => [{
      id: `r${Date.now()}`, clientId: retForm.clientId, amount: retForm.amount,
      currency: retForm.currency, startDate: retForm.startDate,
      billingCycle: retForm.billingCycle as any,
      status: "active" as any, balanceUsed: 0, notes: retForm.notes,
    }, ...prev]);
    setShowRetainerModal(false);
    setRetForm({ clientId:"", amount:0, currency:"XAF", startDate:new Date().toISOString().split("T")[0], billingCycle:"monthly", notes:"" });
  };

  const sendInvoice = (id: string) => setInvoices(prev => prev.map(i => i.id===id ? {...i,status:"sent" as InvoiceStatus} : i));

  const statusBadge = (s: string) => {
    const map: Record<string,string> = { draft:"badge-gray",sent:"badge-blue",paid:"badge-green",overdue:"badge-red",cancelled:"badge-gray",partial:"badge-yellow" };
    return <span className={`badge ${map[s]||"badge-gray"}`}>{t(`billing.statuses.${s}`)}</span>;
  };

  // ─────────────────────────────────────────────────────────────────────────
  // INVOICE DETAIL VIEW
  // ─────────────────────────────────────────────────────────────────────────
  if (selectedInvoice) {
    const inv    = selectedInvoice;
    const client = getClient(inv.clientId);
    const matter = getMatter(inv.matterId);
    const invPays = payments.filter(p => p.invoiceId === inv.id);
    return (
      <div>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20}}>
          <button className="btn btn-ghost btn-sm" onClick={() => setSelectedInvoice(null)}>← {t("common.back")}</button>
          <div style={{flex:1}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <h2 style={{fontSize:18,fontWeight:700,color:"var(--navy)"}}>{inv.invoiceNumber}</h2>
              {statusBadge(inv.status)}
            </div>
            <div style={{fontSize:12,color:"var(--gray-500)",marginTop:2}}>{client?.name} · {matter?.title}</div>
          </div>
          <div style={{display:"flex",gap:8}}>
            {inv.status==="draft" && <button className="btn btn-outline btn-sm" onClick={() => sendInvoice(inv.id)}><Send size={14}/>{t("billing.sendInvoice")}</button>}
            {["sent","partial","overdue"].includes(inv.status) && <button className="btn btn-gold btn-sm" onClick={() => setShowPaymentModal(inv)}><CreditCard size={14}/>{t("billing.recordPayment")}</button>}
            <button className="btn btn-outline btn-sm" onClick={() => window.print()}><Printer size={14}/>{t("common.print")}</button>
          </div>
        </div>

        <div className="card">
          <div style={{padding:36}}>
            {/* Header with logo */}
            <div style={{display:"flex",justifyContent:"space-between",paddingBottom:20,borderBottom:"3px solid var(--navy)",marginBottom:28}}>
              <div>
                <Logo size="md" variant="dark" showTagline/>
                <div style={{fontSize:12,color:"var(--gray-500)",marginTop:8}}>Douala, Cameroun</div>
                <div style={{fontSize:12,color:"var(--gray-500)"}}>cabinet@dentons-kmn.cm</div>
                <a href="https://www.dentons.com/en/global-presence/africa/cameroon/douala" style={{fontSize:11,color:"var(--gold-dark)",textDecoration:"none"}}>dentons.com</a>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{fontSize:30,fontWeight:800,color:"var(--navy)",fontFamily:"Playfair Display,serif"}}>INVOICE</div>
                <div style={{fontSize:18,fontWeight:600,color:"var(--gray-700)",marginTop:4}}>{inv.invoiceNumber}</div>
                <table style={{marginTop:8,marginLeft:"auto",fontSize:12}}>
                  <tbody>
                    {[["Date",inv.invoiceDate],["Due",inv.dueDate],["Terms",inv.paymentTerms]].map(([l,v]) => (
                      <tr key={l}><td style={{color:"var(--gray-500)",paddingRight:12,paddingBottom:2}}>{l}</td><td style={{fontWeight:500}}>{v}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bill To / Matter */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:24,marginBottom:28}}>
              <div style={{background:"var(--gray-50)",borderRadius:8,padding:"14px 16px"}}>
                <div style={{fontSize:10,fontWeight:700,textTransform:"uppercase",color:"var(--gray-400)",letterSpacing:"0.1em",marginBottom:8}}>BILL TO</div>
                <div style={{fontWeight:700,fontSize:14,color:"var(--navy)"}}>{client?.name}</div>
                <div style={{fontSize:12,color:"var(--gray-600)",marginTop:2}}>{client?.address}</div>
                {client?.taxId && <div style={{fontSize:12,color:"var(--gray-600)"}}>Tax ID: {client.taxId}</div>}
                <div style={{fontSize:12,color:"var(--gray-600)"}}>{client?.email}</div>
              </div>
              <div style={{background:"var(--gold-pale)",borderRadius:8,padding:"14px 16px",border:"1px solid rgba(201,168,76,0.3)"}}>
                <div style={{fontSize:10,fontWeight:700,textTransform:"uppercase",color:"var(--gold-dark)",letterSpacing:"0.1em",marginBottom:8}}>MATTER</div>
                <div style={{fontWeight:700,fontSize:13,color:"var(--navy)"}}>{matter?.title}</div>
                <div style={{fontSize:12,color:"var(--gray-600)",marginTop:2}}>Ref: {matter?.matterId}</div>
                {matter && <div style={{fontSize:12,color:"var(--gray-600)"}}>{t(`matters.practiceAreas.${matter.practiceArea}`)}</div>}
                {matter?.jurisdiction && <div style={{fontSize:12,color:"var(--gray-600)"}}>{matter.jurisdiction}</div>}
              </div>
            </div>

            {/* Line items table */}
            <table style={{width:"100%",borderCollapse:"collapse",marginBottom:24}}>
              <thead>
                <tr style={{background:"var(--navy)",color:"white"}}>
                  {["Description","Type","Qty","Rate","Amount"].map((h,i) => (
                    <th key={h} style={{padding:"10px 14px",textAlign:i>1?"right":"left",fontSize:12,fontWeight:600}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {inv.lineItems.length === 0
                  ? <tr><td colSpan={5} style={{padding:"20px",textAlign:"center",color:"var(--gray-400)",fontStyle:"italic"}}>No line items added</td></tr>
                  : inv.lineItems.map(item => (
                    <tr key={item.id} style={{borderBottom:"1px solid var(--gray-100)"}}>
                      <td style={{padding:"12px 14px",fontSize:13}}>{item.description}</td>
                      <td style={{padding:"12px 14px"}}><span className={`badge badge-${item.type==="time"?"blue":item.type==="expense"?"yellow":"purple"}`}>{item.type}</span></td>
                      <td style={{padding:"12px 14px",textAlign:"right",fontSize:13}}>{item.quantity}</td>
                      <td style={{padding:"12px 14px",textAlign:"right",fontSize:13}}>{fmt(item.rate)}</td>
                      <td style={{padding:"12px 14px",textAlign:"right",fontSize:13,fontWeight:500}}>{fmt(item.amount)}</td>
                    </tr>
                  ))}
              </tbody>
            </table>

            {/* Totals */}
            <div style={{display:"flex",justifyContent:"flex-end"}}>
              <div style={{minWidth:300}}>
                {[
                  [t("billing.subtotal"), fmt(inv.subtotal)],
                  ...(inv.discount > 0 ? [[t("billing.discount"), `-${fmt(inv.discount)}`]] : []),
                  [`${t("billing.tax")} (${inv.taxRate}%)`, fmt(inv.taxAmount)],
                ].map(([l,v],i) => (
                  <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:"1px solid var(--gray-100)",fontSize:13}}>
                    <span style={{color:"var(--gray-600)"}}>{l}</span><span>{v}</span>
                  </div>
                ))}
                <div style={{display:"flex",justifyContent:"space-between",padding:"14px 16px",marginTop:4,background:"var(--navy)",color:"white",borderRadius:8}}>
                  <span style={{fontWeight:700,fontSize:15}}>TOTAL TTC</span>
                  <span style={{fontWeight:900,fontSize:18}}>{fmt(inv.total)}</span>
                </div>
                {inv.amountPaid > 0 && (
                  <div style={{display:"flex",justifyContent:"space-between",padding:"8px 0",fontSize:13,color:"var(--success)",fontWeight:600}}>
                    <span>Paid</span><span>{fmt(inv.amountPaid)}</span>
                  </div>
                )}
                {inv.total - inv.amountPaid > 0 && (
                  <div style={{display:"flex",justifyContent:"space-between",padding:"8px 0",fontSize:15,fontWeight:800,color:inv.status==="overdue"?"var(--danger)":"var(--navy)",borderTop:"2px solid var(--navy)",marginTop:4}}>
                    <span>{t("billing.amountDue")}</span><span>{fmt(inv.total - inv.amountPaid)}</span>
                  </div>
                )}
              </div>
            </div>

            {inv.notes && <div style={{marginTop:24,padding:14,background:"var(--gray-50)",borderRadius:8,fontSize:12,color:"var(--gray-600)"}}><strong>Notes:</strong> {inv.notes}</div>}

            {invPays.length > 0 && (
              <div style={{marginTop:24}}>
                <div style={{fontSize:13,fontWeight:700,color:"var(--navy)",marginBottom:12}}>Payment History</div>
                {invPays.map(p => (
                  <div key={p.id} style={{display:"flex",justifyContent:"space-between",padding:"8px 12px",background:"var(--success-bg)",borderRadius:6,marginBottom:4,fontSize:12}}>
                    <span style={{color:"var(--success)",fontWeight:600}}>{p.date} · {p.method} {p.reference ? `(${p.reference})` : ""}</span>
                    <span style={{fontWeight:700,color:"var(--success)"}}>{fmt(p.amount)}</span>
                  </div>
                ))}
              </div>
            )}

            <div style={{marginTop:28,paddingTop:16,borderTop:"1px solid var(--gray-200)",textAlign:"center",fontSize:11,color:"var(--gray-400)"}}>
              Dentons KMN — Kouengoua Minou Nkongho Law Firm · Douala, Cameroun · dentons.com/en/global-presence/africa/cameroon/douala
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // MAIN BILLING VIEW
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-header-title">{t("billing.title")}</div>
          <div className="page-header-subtitle">{invoices.length} invoices · Outstanding: {fmt(totalOutstanding)}</div>
        </div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          <button className="btn btn-outline btn-sm" onClick={() => setShowExpenseModal(true)}><Plus size={14}/> Expense</button>
          <button className="btn btn-outline btn-sm" onClick={() => setShowRetainerModal(true)}><Plus size={14}/> Retainer</button>
          <button className="btn btn-gold" onClick={() => setShowInvoiceModal(true)}><Plus size={15}/>{t("billing.newInvoice")}</button>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        {[
          ["dashboard","📊 Dashboard"],
          ["invoices","🧾 Invoices"],
          ["payments","💳 Payments"],
          ["expenses","💸 Expenses"],
          ["retainers","🔄 Retainers"],
          ["reports","📈 Reports"],
        ].map(([k,l]) => (
          <button key={k} className={`tab-btn ${tab===k?"active":""}`} onClick={() => setTab(k)}>{l}</button>
        ))}
      </div>

      {/* ── DASHBOARD ── */}
      {tab==="dashboard" && (
        <div>
          {/* KPI cards */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:16,marginBottom:24}}>
            {[
              {label:"Total Billed",   value:fmt(totalBilled),     icon:<FileText size={20}/>,   color:"blue",   sub:`${invoices.length} invoices`},
              {label:"Collected",      value:fmt(totalCollected),  icon:<CheckCircle size={20}/>,color:"green",  sub:`${collectionRate}% collection rate`},
              {label:"Outstanding",    value:fmt(totalOutstanding),icon:<TrendingUp size={20}/>, color:"yellow", sub:`${invoices.filter(i=>["sent","partial"].includes(i.status)).length} pending`},
              {label:"Overdue",        value:fmt(overdueAmt),      icon:<AlertCircle size={20}/>,color:"red",    sub:`${invoices.filter(i=>i.status==="overdue").length} invoices`},
            ].map((s,i) => (
              <div key={i} className="stat-card">
                <div className={`stat-icon ${s.color}`}>{s.icon}</div>
                <div>
                  <div style={{fontSize:11,color:"var(--gray-500)",fontWeight:600,textTransform:"uppercase",letterSpacing:"0.04em"}}>{s.label}</div>
                  <div style={{fontSize:18,fontWeight:800,color:"var(--navy)",marginTop:4}}>{s.value}</div>
                  <div style={{fontSize:11,color:"var(--gray-400)",marginTop:4}}>{s.sub}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="dashboard-grid" style={{marginBottom:20}}>
            {/* Revenue by Practice Area */}
            <div className="card">
              <div className="card-header"><span className="card-title">Revenue by Practice Area</span></div>
              {revenueByArea.length === 0
                ? <div className="empty-state"><div className="empty-state-text">No paid invoices yet</div></div>
                : <div style={{padding:20}}>
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={revenueByArea} cx="50%" cy="50%" outerRadius={80} dataKey="amount" nameKey="area" paddingAngle={3}>
                        {revenueByArea.map((_,i) => <Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
                      </Pie>
                      <Tooltip formatter={(v:any,area:any) => [fmt(v), t(`matters.practiceAreas.${area}`)]}/>
                      <Legend formatter={(area:any) => t(`matters.practiceAreas.${area}`)}/>
                    </PieChart>
                  </ResponsiveContainer>
                </div>}
            </div>

            {/* Aging Report */}
            <div className="card">
              <div className="card-header"><span className="card-title">{t("billing.aging")}</span></div>
              <div className="card-body">
                {[
                  ["Current",    aging.current,"badge-green"],
                  ["1–30 days",  aging.d30,    "badge-yellow"],
                  ["31–60 days", aging.d60,    "badge-orange"],
                  ["61–90 days", aging.d90,    "badge-red"],
                  ["90+ days",   aging.d90p,   "badge-red"],
                ].map(([l,a,b]) => (
                  <div key={l as string} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:"1px solid var(--gray-100)"}}>
                    <span className={`badge ${b}`}>{l}</span>
                    <span style={{fontWeight:700,fontSize:14}}>{fmt(a as number)}</span>
                  </div>
                ))}
                <div style={{display:"flex",justifyContent:"space-between",padding:"12px 0",borderTop:"2px solid var(--navy)",marginTop:4,fontWeight:800,color:"var(--navy)"}}>
                  <span>Total Outstanding</span><span>{fmt(totalOutstanding)}</span>
                </div>
              </div>
            </div>
          </div>

          {revenueByLawyer.length > 0 && (
            <div className="card">
              <div className="card-header"><span className="card-title">Revenue by Lawyer</span></div>
              <div style={{padding:20}}>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={revenueByLawyer}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-100)"/>
                    <XAxis dataKey="name" fontSize={11} axisLine={false} tickLine={false}/>
                    <YAxis fontSize={11} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000000).toFixed(1)}M`}/>
                    <Tooltip formatter={(v:any) => fmt(v)}/>
                    <Bar dataKey="amount" name="Billable Amount" fill="var(--navy)" radius={[4,4,0,0]}/>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── INVOICES TAB ── */}
      {tab==="invoices" && (
        <div>
          <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap"}}>
            {["all","draft","sent","partial","paid","overdue","cancelled"].map(s => (
              <button key={s} className={`btn ${statusFilter===s?"btn-primary":"btn-outline"} btn-sm`} onClick={() => setStatusFilter(s)}>
                {s==="all" ? t("common.all") : t(`billing.statuses.${s}`)}
              </button>
            ))}
          </div>
          <div className="card">
            <div className="table-container">
              <table>
                <thead>
                  <tr><th>#</th><th>Client</th><th>Matter</th><th>Date</th><th>Due</th><th style={{textAlign:"right"}}>Total</th><th style={{textAlign:"right"}}>Due</th><th>Status</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {invoices.filter(i => statusFilter==="all"||i.status===statusFilter).map(inv => (
                    <tr key={inv.id}>
                      <td><span style={{fontFamily:"monospace",fontSize:12}}>{inv.invoiceNumber}</span></td>
                      <td style={{fontWeight:500}}>{getClient(inv.clientId)?.name||"—"}</td>
                      <td style={{fontSize:12,maxWidth:120}}><div className="truncate">{getMatter(inv.matterId)?.matterId||"—"}</div></td>
                      <td style={{fontSize:12}}>{inv.invoiceDate}</td>
                      <td style={{fontSize:12,color:inv.status==="overdue"?"var(--danger)":"inherit",fontWeight:inv.status==="overdue"?700:400}}>{inv.dueDate}</td>
                      <td style={{textAlign:"right",fontWeight:500}}>{fmt(inv.total)}</td>
                      <td style={{textAlign:"right",fontWeight:700,color:inv.total-inv.amountPaid===0?"var(--success)":"var(--gray-900)"}}>{fmt(inv.total-inv.amountPaid)}</td>
                      <td>{statusBadge(inv.status)}</td>
                      <td>
                        <div style={{display:"flex",gap:4}}>
                          <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setSelectedInvoice(inv)}><Eye size={14}/></button>
                          {inv.status==="draft" && <button className="btn btn-ghost btn-sm btn-icon" onClick={() => sendInvoice(inv.id)} title="Send"><Send size={14}/></button>}
                          {["sent","partial","overdue"].includes(inv.status) && (
                            <button className="btn btn-gold btn-sm" onClick={() => setShowPaymentModal(inv)}>
                              <CreditCard size={13}/> Pay
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!invoices.filter(i => statusFilter==="all"||i.status===statusFilter).length && (
                    <tr><td colSpan={9}><div className="empty-state"><div className="empty-state-text">{t("common.noData")}</div></div></td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── PAYMENTS TAB ── */}
      {tab==="payments" && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">Payment Register</span>
            <span style={{color:"var(--success)",fontWeight:600,fontSize:14}}>{fmt(payments.reduce((s,p) => s+p.amount, 0))} received</span>
          </div>
          <div className="table-container">
            <table>
              <thead><tr><th>Receipt</th><th>Client</th><th>Invoice</th><th>Date</th><th>Method</th><th style={{textAlign:"right"}}>Amount</th><th>Reference</th></tr></thead>
              <tbody>
                {payments.map(p => (
                  <tr key={p.id}>
                    <td><span style={{fontFamily:"monospace",fontSize:12}}>{p.receiptNumber||p.id.slice(-6)}</span></td>
                    <td>{getClient(p.clientId)?.name||"—"}</td>
                    <td style={{fontSize:12}}>{invoices.find(i => i.id===p.invoiceId)?.invoiceNumber||"—"}</td>
                    <td style={{fontSize:12}}>{p.date}</td>
                    <td><span className="badge badge-blue">{p.method}</span></td>
                    <td style={{textAlign:"right",fontWeight:700,color:"var(--success)"}}>{fmt(p.amount)}</td>
                    <td style={{fontSize:12,color:"var(--gray-500)"}}>{p.reference||"—"}</td>
                  </tr>
                ))}
                {!payments.length && <tr><td colSpan={7}><div className="empty-state"><div className="empty-state-text">No payments recorded yet</div></div></td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── EXPENSES TAB ── */}
      {tab==="expenses" && (
        <div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
            <div style={{display:"flex",gap:20}}>
              <span style={{fontWeight:600,color:"var(--navy)"}}>Total: {fmt(totalExpenses)}</span>
              <span style={{color:"var(--success)",fontWeight:500}}>Billable: {fmt(expenses.filter(e=>e.billable).reduce((s,e)=>s+e.amount,0))}</span>
            </div>
            <button className="btn btn-gold btn-sm" onClick={() => setShowExpenseModal(true)}><Plus size={14}/> Add Expense</button>
          </div>
          <div className="card">
            <div className="table-container">
              <table>
                <thead><tr><th>Date</th><th>Category</th><th>Description</th><th>Matter</th><th>By</th><th style={{textAlign:"right"}}>Amount</th><th>Billable</th><th>Status</th></tr></thead>
                <tbody>
                  {expenses.map(e => (
                    <tr key={e.id}>
                      <td style={{fontSize:12}}>{e.date}</td>
                      <td><span className="badge badge-purple">{(e.category||"").replace("_"," ")}</span></td>
                      <td style={{fontWeight:500}}>{e.description}</td>
                      <td style={{fontSize:12}}>{e.matterId ? getMatter(e.matterId)?.matterId||"—" : "—"}</td>
                      <td style={{fontSize:12}}>{getUser(e.userId)}</td>
                      <td style={{textAlign:"right",fontWeight:600}}>{fmt(e.amount)}</td>
                      <td><span className={`badge ${e.billable?"badge-green":"badge-gray"}`}>{e.billable?"Billable":"Non-bill."}</span></td>
                      <td><span className={`badge ${e.approved?"badge-green":e.billed?"badge-blue":"badge-yellow"}`}>{e.approved?"Approved":e.billed?"Billed":"Pending"}</span></td>
                    </tr>
                  ))}
                  {!expenses.length && <tr><td colSpan={8}><div className="empty-state"><div className="empty-state-text">No expenses recorded</div></div></td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── RETAINERS TAB ── */}
      {tab==="retainers" && (
        <div>
          <div style={{display:"flex",justifyContent:"flex-end",marginBottom:16}}>
            <button className="btn btn-gold btn-sm" onClick={() => setShowRetainerModal(true)}><Plus size={14}/> New Retainer</button>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:16}}>
            {retainers.map(r => {
              const cl  = getClient(r.clientId);
              const pct = r.amount > 0 ? Math.round((r.balanceUsed / r.amount) * 100) : 0;
              return (
                <div key={r.id} className="card" style={{padding:20}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
                    <div>
                      <div style={{fontWeight:700,color:"var(--navy)"}}>{cl?.name}</div>
                      <div style={{fontSize:12,color:"var(--gray-500)",marginTop:2}}>{r.billingCycle} · {r.startDate}</div>
                    </div>
                    <span className={`badge badge-${r.status==="active"?"green":r.status==="depleted"?"red":"gray"}`}>{r.status}</span>
                  </div>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                    <span style={{fontSize:12,color:"var(--gray-500)"}}>Retainer</span>
                    <span style={{fontWeight:700}}>{fmt(r.amount)}</span>
                  </div>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
                    <span style={{fontSize:12,color:"var(--gray-500)"}}>Used</span>
                    <span style={{fontWeight:600,color:"var(--warning)"}}>{fmt(r.balanceUsed)}</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{width:`${pct}%`,background:pct>80?"var(--danger)":"var(--success)"}}/>
                  </div>
                  <div style={{fontSize:11,color:"var(--gray-400)",marginTop:4,textAlign:"right"}}>{fmt(r.amount-r.balanceUsed)} remaining</div>
                </div>
              );
            })}
            {!retainers.length && <div className="card" style={{padding:40,textAlign:"center",color:"var(--gray-400)",gridColumn:"1/-1"}}>No retainers set up yet</div>}
          </div>
        </div>
      )}

      {/* ── REPORTS TAB ── */}
      {tab==="reports" && (
        <div>
          <div className="dashboard-grid" style={{marginBottom:20}}>
            {/* P&L */}
            <div className="card">
              <div className="card-header"><span className="card-title">Profit & Loss</span></div>
              <div className="card-body">
                {[
                  ["Total Revenue",   totalBilled,                  "var(--success)"],
                  ["Total Collected", totalCollected,               "var(--navy)"],
                  ["Total Expenses",  totalExpenses,                "var(--danger)"],
                  ["Net Revenue",     totalCollected-totalExpenses, "var(--navy)"],
                  ["Collection Rate", null,                         "var(--info)"],
                ].map(([l,a,c]) => (
                  <div key={l as string} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 0",borderBottom:"1px solid var(--gray-100)"}}>
                    <span style={{fontWeight:500,fontSize:13}}>{l}</span>
                    <span style={{fontWeight:800,fontSize:15,color:c as string}}>
                      {l==="Collection Rate" ? `${collectionRate}%` : fmt(a as number)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Lawyer Productivity */}
            <div className="card">
              <div className="card-header"><span className="card-title">Lawyer Productivity</span></div>
              <div className="table-container">
                <table>
                  <thead><tr><th>Lawyer</th><th style={{textAlign:"right"}}>Hours</th><th style={{textAlign:"right"}}>Billable Amt</th></tr></thead>
                  <tbody>
                    {revenueByLawyer.map(l => (
                      <tr key={l.name}>
                        <td style={{fontWeight:500}}>{l.name}</td>
                        <td style={{textAlign:"right"}}>{l.hours.toFixed(1)}h</td>
                        <td style={{textAlign:"right",fontWeight:700,color:"var(--success)"}}>{fmt(l.amount)}</td>
                      </tr>
                    ))}
                    {!revenueByLawyer.length && <tr><td colSpan={3} style={{textAlign:"center",padding:20,color:"var(--gray-400)"}}>No time entries yet</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Matter Profitability */}
          <div className="card">
            <div className="card-header"><span className="card-title">Matter Profitability</span></div>
            <div className="table-container">
              <table>
                <thead><tr><th>Matter</th><th>Client</th><th style={{textAlign:"right"}}>Billed</th><th style={{textAlign:"right"}}>Collected</th><th style={{textAlign:"right"}}>Expenses</th><th style={{textAlign:"right"}}>Net</th></tr></thead>
                <tbody>
                  {matters
                    .filter(m => invoices.some(i => i.matterId===m.id) || expenses.some(e => e.matterId===m.id))
                    .map(m => {
                      const mI   = invoices.filter(i => i.matterId===m.id);
                      const mB   = mI.reduce((s,i) => s+i.total, 0);
                      const mC   = mI.reduce((s,i) => s+i.amountPaid, 0);
                      const mE   = expenses.filter(e => e.matterId===m.id).reduce((s,e) => s+e.amount, 0);
                      const net  = mC - mE;
                      return (
                        <tr key={m.id}>
                          <td><div style={{fontWeight:500}}>{m.title}</div><div style={{fontSize:11,color:"var(--gray-400)"}}>{m.matterId}</div></td>
                          <td style={{fontSize:12}}>{getClient(m.clientId)?.name||"—"}</td>
                          <td style={{textAlign:"right"}}>{fmt(mB)}</td>
                          <td style={{textAlign:"right",color:"var(--success)"}}>{fmt(mC)}</td>
                          <td style={{textAlign:"right",color:"var(--danger)"}}>{fmt(mE)}</td>
                          <td style={{textAlign:"right",fontWeight:700,color:net>=0?"var(--success)":"var(--danger)"}}>{fmt(net)}</td>
                        </tr>
                      );
                    })}
                  {!matters.filter(m => invoices.some(i=>i.matterId===m.id)||expenses.some(e=>e.matterId===m.id)).length && (
                    <tr><td colSpan={6}><div className="empty-state"><div className="empty-state-text">No financial data yet</div></div></td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════ MODALS ══════════════════════ */}

      {/* CREATE INVOICE MODAL */}
      {showInvoiceModal && (
        <div className="modal-overlay" onClick={() => setShowInvoiceModal(false)}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">{t("billing.newInvoice")}</span>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowInvoiceModal(false)}><X size={18}/></button>
            </div>
            <div className="modal-body">
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label required">{t("billing.client")}</label>
                  <select className="form-control" value={invForm.clientId||""} onChange={e => setInvForm(f => ({...f,clientId:e.target.value}))}>
                    <option value="">— {t("billing.client")} —</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  {invErrors.clientId && <div className="form-error">{invErrors.clientId}</div>}
                </div>
                <div className="form-group">
                  <label className="form-label required">{t("billing.matter")}</label>
                  <select className="form-control" value={invForm.matterId||""} onChange={e => setInvForm(f => ({...f,matterId:e.target.value}))}>
                    <option value="">— {t("billing.matter")} —</option>
                    {matters.filter(m => !invForm.clientId || m.clientId===invForm.clientId).map(m => (
                      <option key={m.id} value={m.id}>{m.matterId} – {m.title}</option>
                    ))}
                  </select>
                  {invErrors.matterId && <div className="form-error">{invErrors.matterId}</div>}
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">{t("billing.invoiceDate")}</label>
                  <input className="form-control" type="date" value={invForm.invoiceDate||new Date().toISOString().split("T")[0]} onChange={e => setInvForm(f => ({...f,invoiceDate:e.target.value}))}/>
                </div>
                <div className="form-group">
                  <label className="form-label">{t("billing.dueDate")}</label>
                  <input className="form-control" type="date" value={invForm.dueDate||""} onChange={e => setInvForm(f => ({...f,dueDate:e.target.value}))}/>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Billing Model</label>
                  <select className="form-control" value={invForm.billingModel||"hourly"} onChange={e => setInvForm(f => ({...f,billingModel:e.target.value}))}>
                    {["hourly","flatFee","contingency","retainer"].map(b => <option key={b} value={b}>{t(`billing.billingModels.${b}`)}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">{t("billing.paymentTerms")}</label>
                  <select className="form-control" value={invForm.paymentTerms||"30 days"} onChange={e => setInvForm(f => ({...f,paymentTerms:e.target.value}))}>
                    {["Immediate","7 days","15 days","30 days","60 days"].map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>

              {/* Line Items */}
              <div style={{marginBottom:16}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                  <label className="form-label" style={{margin:0}}>{t("billing.lineItems")}</label>
                  <button className="btn btn-outline btn-sm" onClick={addLineItem}><Plus size={13}/>{t("billing.addLineItem")}</button>
                </div>
                {lineItems.length === 0 ? (
                  <div style={{border:"2px dashed var(--gray-200)",borderRadius:8,padding:16,textAlign:"center",color:"var(--gray-400)",fontSize:13}}>
                    Click "+ Add Line Item" to add fees, time charges or disbursements
                  </div>
                ) : (
                  <table style={{width:"100%",borderCollapse:"collapse"}}>
                    <thead>
                      <tr style={{background:"var(--gray-50)"}}>
                        {["Description","Type","Qty","Rate (FCFA)","Amount",""].map((h,i) => (
                          <th key={i} style={{padding:"8px 10px",fontSize:11,textAlign:i>1&&i<5?"right":"left",fontWeight:700,color:"var(--navy)",width:i===5?32:undefined}}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {lineItems.map(li => (
                        <tr key={li.id} style={{borderBottom:"1px solid var(--gray-100)"}}>
                          <td style={{padding:"6px 10px"}}>
                            <input className="form-control" style={{fontSize:12,padding:"4px 8px"}} value={li.description} onChange={e => updateLineItem(li.id,"description",e.target.value)} placeholder="Description"/>
                          </td>
                          <td style={{padding:"6px 10px"}}>
                            <select className="form-control" style={{fontSize:12,padding:"4px 8px"}} value={li.type} onChange={e => updateLineItem(li.id,"type",e.target.value)}>
                              <option value="fee">Fee</option>
                              <option value="time">Time</option>
                              <option value="expense">Expense</option>
                            </select>
                          </td>
                          <td style={{padding:"6px 10px"}}>
                            <input className="form-control" style={{fontSize:12,padding:"4px 8px",textAlign:"right"}} type="number" value={li.quantity} onChange={e => updateLineItem(li.id,"quantity",parseFloat(e.target.value)||0)}/>
                          </td>
                          <td style={{padding:"6px 10px"}}>
                            <input className="form-control" style={{fontSize:12,padding:"4px 8px",textAlign:"right"}} type="number" value={li.rate} onChange={e => updateLineItem(li.id,"rate",parseFloat(e.target.value)||0)}/>
                          </td>
                          <td style={{padding:"6px 10px",textAlign:"right",fontWeight:600,fontSize:13}}>{fmt(li.amount)}</td>
                          <td style={{padding:"6px 4px"}}>
                            <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setLineItems(prev => prev.filter(l => l.id!==li.id))}><X size={14}/></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Totals preview */}
              {lineItems.length > 0 && (() => {
                const { subtotal, taxAmount, total } = calcTotals(lineItems, invForm.discount||0, invForm.taxRate||TAX_RATE);
                return (
                  <div style={{background:"var(--gray-50)",borderRadius:8,padding:"12px 16px"}}>
                    <div className="form-row" style={{marginBottom:8}}>
                      <div className="form-group" style={{marginBottom:0}}>
                        <label className="form-label" style={{marginBottom:4}}>Discount (FCFA)</label>
                        <input className="form-control" type="number" value={invForm.discount||0} onChange={e => setInvForm(f => ({...f,discount:parseFloat(e.target.value)||0}))}/>
                      </div>
                      <div className="form-group" style={{marginBottom:0}}>
                        <label className="form-label" style={{marginBottom:4}}>VAT Rate (%)</label>
                        <input className="form-control" type="number" value={invForm.taxRate||TAX_RATE} onChange={e => setInvForm(f => ({...f,taxRate:parseFloat(e.target.value)||TAX_RATE}))}/>
                      </div>
                    </div>
                    <div style={{display:"flex",justifyContent:"space-between",fontSize:13}}>
                      <span>Subtotal: {fmt(subtotal)}</span>
                      <span>VAT: {fmt(taxAmount)}</span>
                      <span style={{fontWeight:800,fontSize:15,color:"var(--navy)"}}>TOTAL: {fmt(total)}</span>
                    </div>
                  </div>
                );
              })()}

              <div className="form-group" style={{marginTop:12}}>
                <label className="form-label">Notes / Payment Instructions</label>
                <textarea className="form-control" value={invForm.notes||""} onChange={e => setInvForm(f => ({...f,notes:e.target.value}))} placeholder="Bank details, payment instructions..." rows={2}/>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowInvoiceModal(false)}>{t("common.cancel")}</button>
              <button className="btn btn-gold" onClick={handleCreateInvoice}><Plus size={15}/>{t("common.save")}</button>
            </div>
          </div>
        </div>
      )}

      {/* RECORD PAYMENT MODAL */}
      {showPaymentModal && (
        <div className="modal-overlay" onClick={() => setShowPaymentModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">{t("billing.recordPayment")} — {showPaymentModal.invoiceNumber}</span>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowPaymentModal(null)}><X size={18}/></button>
            </div>
            <div className="modal-body">
              <div style={{background:"var(--gold-pale)",borderRadius:8,padding:"12px 16px",marginBottom:20,display:"flex",justifyContent:"space-between"}}>
                <div>
                  <div style={{fontSize:12,color:"var(--gold-dark)",fontWeight:600}}>Outstanding Balance</div>
                  <div style={{fontSize:22,fontWeight:800,color:"var(--navy)"}}>{fmt(showPaymentModal.total-showPaymentModal.amountPaid)}</div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontSize:12,color:"var(--gray-500)"}}>Invoice Total</div>
                  <div style={{fontSize:16,fontWeight:700}}>{fmt(showPaymentModal.total)}</div>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label required">{t("common.amount")} (FCFA)</label>
                  <input className="form-control" type="number" value={payForm.amount||""} placeholder={String(showPaymentModal.total-showPaymentModal.amountPaid)} onChange={e => setPayForm(f => ({...f,amount:parseFloat(e.target.value)||0}))}/>
                </div>
                <div className="form-group">
                  <label className="form-label">{t("common.date")}</label>
                  <input className="form-control" type="date" value={payForm.date} onChange={e => setPayForm(f => ({...f,date:e.target.value}))}/>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">{t("billing.paymentMethod")}</label>
                <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                  {PAYMENT_METHODS.map(m => (
                    <button key={m} className={`btn ${payForm.method===m?"btn-primary":"btn-outline"} btn-sm`} onClick={() => setPayForm(f => ({...f,method:m}))}>
                      {m==="bankTransfer"?"🏦 Bank":m==="mobileMoney"?"📱 MoMo":m==="cash"?"💵 Cash":m==="check"?"📄 Cheque":"💳 Card"}
                    </button>
                  ))}
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Reference / Transaction ID</label>
                  <input className="form-control" value={payForm.reference} onChange={e => setPayForm(f => ({...f,reference:e.target.value}))} placeholder="Bank ref, MoMo number..."/>
                </div>
                <div className="form-group">
                  <label className="form-label">Notes</label>
                  <input className="form-control" value={payForm.notes} onChange={e => setPayForm(f => ({...f,notes:e.target.value}))}/>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowPaymentModal(null)}>{t("common.cancel")}</button>
              <button className="btn btn-gold" onClick={() => handleRecordPayment(showPaymentModal)}>
                <CheckCircle size={15}/> Record Payment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EXPENSE MODAL */}
      {showExpenseModal && (
        <div className="modal-overlay" onClick={() => setShowExpenseModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><span className="modal-title">Add Expense</span><button className="btn btn-ghost btn-icon" onClick={() => setShowExpenseModal(false)}><X size={18}/></button></div>
            <div className="modal-body">
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label required">Description</label>
                  <input className="form-control" value={expForm.description||""} onChange={e => setExpForm(f => ({...f,description:e.target.value}))} placeholder="Expense description"/>
                </div>
                <div className="form-group">
                  <label className="form-label required">Amount (FCFA)</label>
                  <input className="form-control" type="number" value={expForm.amount||""} onChange={e => setExpForm(f => ({...f,amount:parseFloat(e.target.value)||0}))}/>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select className="form-control" value={expForm.category||"other"} onChange={e => setExpForm(f => ({...f,category:e.target.value as ExpenseCategory}))}>
                    {EXPENSE_CATS.map(c => <option key={c} value={c}>{c.replace("_"," ").replace(/\b\w/g, l => l.toUpperCase())}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Date</label>
                  <input className="form-control" type="date" value={expForm.date||""} onChange={e => setExpForm(f => ({...f,date:e.target.value}))}/>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Matter (optional)</label>
                <select className="form-control" value={expForm.matterId||""} onChange={e => setExpForm(f => ({...f,matterId:e.target.value}))}>
                  <option value="">— Optional —</option>
                  {matters.map(m => <option key={m.id} value={m.id}>{m.matterId} – {m.title}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="checkbox-label">
                  <input type="checkbox" checked={expForm.billable!==false} onChange={e => setExpForm(f => ({...f,billable:e.target.checked}))}/>
                  Billable to client
                </label>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowExpenseModal(false)}>{t("common.cancel")}</button>
              <button className="btn btn-gold" onClick={handleCreateExpense}><Plus size={15}/>{t("common.save")}</button>
            </div>
          </div>
        </div>
      )}

      {/* RETAINER MODAL */}
      {showRetainerModal && (
        <div className="modal-overlay" onClick={() => setShowRetainerModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><span className="modal-title">New Retainer</span><button className="btn btn-ghost btn-icon" onClick={() => setShowRetainerModal(false)}><X size={18}/></button></div>
            <div className="modal-body">
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label required">Client</label>
                  <select className="form-control" value={retForm.clientId} onChange={e => setRetForm(f => ({...f,clientId:e.target.value}))}>
                    <option value="">— Client —</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label required">Amount (FCFA)</label>
                  <input className="form-control" type="number" value={retForm.amount||""} onChange={e => setRetForm(f => ({...f,amount:parseFloat(e.target.value)||0}))}/>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Billing Cycle</label>
                  <select className="form-control" value={retForm.billingCycle} onChange={e => setRetForm(f => ({...f,billingCycle:e.target.value}))}>
                    {["monthly","quarterly","annual","onetime"].map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase()+c.slice(1)}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Start Date</label>
                  <input className="form-control" type="date" value={retForm.startDate} onChange={e => setRetForm(f => ({...f,startDate:e.target.value}))}/>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Notes</label>
                <textarea className="form-control" value={retForm.notes} onChange={e => setRetForm(f => ({...f,notes:e.target.value}))} rows={2}/>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowRetainerModal(false)}>{t("common.cancel")}</button>
              <button className="btn btn-gold" onClick={handleCreateRetainer}><Plus size={15}/>{t("common.save")}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
