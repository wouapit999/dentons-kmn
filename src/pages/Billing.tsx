import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Eye, Send, CheckCircle, X, AlertCircle } from "lucide-react";
import { mockInvoices, mockClients, mockMatters } from "../data/mockData";
import { Invoice, InvoiceStatus } from "../types";

const fmt = (n: number) => new Intl.NumberFormat("fr-CM", { style: "currency", currency: "XAF", maximumFractionDigits: 0 }).format(n);

export default function Billing() {
  const { t } = useTranslation();
  const [invoices, setInvoices] = useState<Invoice[]>(mockInvoices);
  const [selected, setSelected] = useState<Invoice | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");

  const getClient = (id: string) => mockClients.find(c => c.id === id);
  const getMatter = (id: string) => mockMatters.find(m => m.id === id);

  const filtered = invoices.filter(i => statusFilter === "all" || i.status === statusFilter);

  const totalBilled = invoices.reduce((s, i) => s + i.total, 0);
  const totalPaid = invoices.reduce((s, i) => s + i.amountPaid, 0);
  const totalOutstanding = totalBilled - totalPaid;
  const overdueCount = invoices.filter(i => i.status === "overdue").length;

  const statusBadge = (status: string) => {
    const map: Record<string, string> = { draft: "badge-gray", sent: "badge-blue", paid: "badge-green", overdue: "badge-red", cancelled: "badge-gray", partial: "badge-yellow" };
    return <span className={`badge ${map[status]}`}>{t(`billing.statuses.${status}`)}</span>;
  };

  const markPaid = (id: string) => {
    setInvoices(prev => prev.map(i => i.id === id ? { ...i, status: "paid" as InvoiceStatus, amountPaid: i.total } : i));
  };

  const sendInvoice = (id: string) => {
    setInvoices(prev => prev.map(i => i.id === id ? { ...i, status: "sent" as InvoiceStatus } : i));
  };

  return (
    <div>
      {selected ? (
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <button className="btn btn-ghost btn-sm" onClick={() => setSelected(null)}>← {t("common.back")}</button>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <h2 style={{ fontSize: 18, fontWeight: 700 }}>{selected.invoiceNumber}</h2>
                {statusBadge(selected.status)}
              </div>
              <div style={{ fontSize: 12, color: "var(--gray-500)", marginTop: 2 }}>
                {getClient(selected.clientId)?.name} · {getMatter(selected.matterId)?.title}
              </div>
            </div>
            {selected.status === "draft" && (
              <button className="btn btn-outline btn-sm" onClick={() => sendInvoice(selected.id)}><Send size={14} />{t("billing.sendInvoice")}</button>
            )}
            {["sent","partial","overdue"].includes(selected.status) && (
              <button className="btn btn-primary btn-sm" onClick={() => { markPaid(selected.id); setSelected(null); }}><CheckCircle size={14} />{t("billing.markPaid")}</button>
            )}
          </div>

          <div className="form-row">
            {/* Invoice preview */}
            <div className="card" style={{ gridColumn: "span 2" }}>
              <div style={{ padding: 32 }}>
                {/* Header */}
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 32 }}>
                  <div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: "var(--primary)" }}>DENTONS KMN</div>
                    <div style={{ fontSize: 12, color: "var(--gray-500)", marginTop: 4 }}>Kouengoua Minou Nkongho Law Firm</div>
                    <div style={{ fontSize: 12, color: "var(--gray-500)" }}>Douala, Cameroun</div>
                    <div style={{ fontSize: 12, color: "var(--gray-500)" }}>cabinet@dentons-kmn.cm</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 28, fontWeight: 700, color: "var(--primary)" }}>FACTURE</div>
                    <div style={{ fontSize: 16, fontWeight: 600, color: "var(--gray-700)", marginTop: 4 }}>{selected.invoiceNumber}</div>
                    <div style={{ fontSize: 12, color: "var(--gray-500)", marginTop: 8 }}>{t("billing.invoiceDate")}: {selected.invoiceDate}</div>
                    <div style={{ fontSize: 12, color: "var(--gray-500)" }}>{t("billing.dueDate")}: {selected.dueDate}</div>
                  </div>
                </div>

                {/* Client info */}
                <div style={{ background: "var(--gray-50)", borderRadius: 8, padding: 16, marginBottom: 24 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", color: "var(--gray-400)", letterSpacing: "0.05em", marginBottom: 6 }}>FACTURER À</div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{getClient(selected.clientId)?.name}</div>
                  <div style={{ fontSize: 12, color: "var(--gray-500)", marginTop: 2 }}>{getClient(selected.clientId)?.address}</div>
                  {getClient(selected.clientId)?.taxId && <div style={{ fontSize: 12, color: "var(--gray-500)" }}>N° Contribuable: {getClient(selected.clientId)?.taxId}</div>}
                  <div style={{ marginTop: 8, fontSize: 12, color: "var(--gray-600)" }}>
                    <strong>{t("matters.matter")}:</strong> {getMatter(selected.matterId)?.title} ({getMatter(selected.matterId)?.matterId})
                  </div>
                </div>

                {/* Line items */}
                <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 24 }}>
                  <thead>
                    <tr style={{ background: "var(--primary)", color: "white" }}>
                      <th style={{ padding: "10px 14px", textAlign: "left", fontWeight: 600, fontSize: 12, borderRadius: "4px 0 0 4px" }}>Description</th>
                      <th style={{ padding: "10px 14px", textAlign: "right", fontWeight: 600, fontSize: 12 }}>Qté</th>
                      <th style={{ padding: "10px 14px", textAlign: "right", fontWeight: 600, fontSize: 12 }}>Prix unitaire</th>
                      <th style={{ padding: "10px 14px", textAlign: "right", fontWeight: 600, fontSize: 12, borderRadius: "0 4px 4px 0" }}>Montant</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selected.lineItems.map(item => (
                      <tr key={item.id} style={{ borderBottom: "1px solid var(--gray-100)" }}>
                        <td style={{ padding: "12px 14px", fontSize: 13 }}>{item.description}</td>
                        <td style={{ padding: "12px 14px", textAlign: "right", fontSize: 13 }}>{item.quantity}</td>
                        <td style={{ padding: "12px 14px", textAlign: "right", fontSize: 13 }}>{fmt(item.rate)}</td>
                        <td style={{ padding: "12px 14px", textAlign: "right", fontSize: 13, fontWeight: 500 }}>{fmt(item.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Totals */}
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <div style={{ minWidth: 300 }}>
                    {[
                      [t("billing.subtotal"), fmt(selected.subtotal)],
                      [`${t("billing.tax")} (${selected.taxRate}%)`, fmt(selected.taxAmount)],
                      ...(selected.discount ? [[t("billing.discount"), `-${fmt(selected.discount)}`]] : []),
                    ].map(([label, val], i) => (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid var(--gray-100)", fontSize: 13 }}>
                        <span style={{ color: "var(--gray-600)" }}>{label}</span>
                        <span>{val}</span>
                      </div>
                    ))}
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 16px", marginTop: 4, background: "var(--primary)", color: "white", borderRadius: 8 }}>
                      <span style={{ fontWeight: 700 }}>TOTAL TTC</span>
                      <span style={{ fontWeight: 700, fontSize: 16 }}>{fmt(selected.total)}</span>
                    </div>
                    {selected.amountPaid > 0 && selected.amountPaid < selected.total && (
                      <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", fontSize: 13 }}>
                        <span style={{ color: "var(--gray-600)" }}>Déjà payé</span>
                        <span style={{ color: "var(--success)", fontWeight: 500 }}>{fmt(selected.amountPaid)}</span>
                      </div>
                    )}
                    {selected.total - selected.amountPaid > 0 && (
                      <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", fontSize: 14, fontWeight: 700, color: selected.status === "overdue" ? "var(--danger)" : "var(--gray-900)" }}>
                        <span>{t("billing.amountDue")}</span>
                        <span>{fmt(selected.total - selected.amountPaid)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {selected.notes && (
                  <div style={{ marginTop: 24, padding: 16, background: "var(--gray-50)", borderRadius: 8 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "var(--gray-500)", marginBottom: 4 }}>Notes</div>
                    <div style={{ fontSize: 13 }}>{selected.notes}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="page-header">
            <div>
              <div className="page-header-title">{t("billing.title")}</div>
              <div className="page-header-subtitle">{filtered.length} {t("billing.invoices").toLowerCase()}</div>
            </div>
            <button className="btn btn-primary" onClick={() => setShowModal(true)}><Plus size={15} />{t("billing.newInvoice")}</button>
          </div>

          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 20 }}>
            <div className="stat-card">
              <div className="stat-icon blue" style={{ width: 40, height: 40 }}><span style={{ fontSize: 20 }}>📄</span></div>
              <div>
                <div className="stat-value" style={{ fontSize: 18 }}>{fmt(totalBilled)}</div>
                <div className="stat-label">Total Facturé</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon green" style={{ width: 40, height: 40 }}><span style={{ fontSize: 20 }}>✅</span></div>
              <div>
                <div className="stat-value" style={{ fontSize: 18 }}>{fmt(totalPaid)}</div>
                <div className="stat-label">Total Encaissé</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon yellow" style={{ width: 40, height: 40 }}><span style={{ fontSize: 20 }}>💳</span></div>
              <div>
                <div className="stat-value" style={{ fontSize: 18 }}>{fmt(totalOutstanding)}</div>
                <div className="stat-label">{t("billing.receivables")}</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon red" style={{ width: 40, height: 40 }}><AlertCircle size={22} /></div>
              <div>
                <div className="stat-value">{overdueCount}</div>
                <div className="stat-label">{t("billing.statuses.overdue")}</div>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
            {["all","draft","sent","paid","partial","overdue"].map(s => (
              <button key={s} className={`btn ${statusFilter === s ? "btn-primary" : "btn-outline"} btn-sm`} onClick={() => setStatusFilter(s)}>
                {s === "all" ? t("common.all") : t(`billing.statuses.${s}`)}
              </button>
            ))}
          </div>

          <div className="card">
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>{t("billing.invoiceNumber")}</th>
                    <th>{t("billing.client")}</th>
                    <th>{t("billing.matter")}</th>
                    <th>{t("billing.invoiceDate")}</th>
                    <th>{t("billing.dueDate")}</th>
                    <th style={{ textAlign: "right" }}>{t("billing.total")}</th>
                    <th style={{ textAlign: "right" }}>{t("billing.amountDue")}</th>
                    <th>{t("common.status")}</th>
                    <th>{t("common.actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(inv => (
                    <tr key={inv.id}>
                      <td><span style={{ fontFamily: "monospace", fontSize: 12 }}>{inv.invoiceNumber}</span></td>
                      <td style={{ fontWeight: 500 }}>{getClient(inv.clientId)?.name}</td>
                      <td style={{ fontSize: 12, maxWidth: 140 }}>
                        <div className="truncate">{getMatter(inv.matterId)?.matterId}</div>
                      </td>
                      <td style={{ fontSize: 12 }}>{inv.invoiceDate}</td>
                      <td style={{ fontSize: 12, color: inv.status === "overdue" ? "var(--danger)" : "inherit", fontWeight: inv.status === "overdue" ? 600 : 400 }}>{inv.dueDate}</td>
                      <td style={{ textAlign: "right", fontWeight: 500 }}>{fmt(inv.total)}</td>
                      <td style={{ textAlign: "right", fontWeight: 600, color: inv.total - inv.amountPaid === 0 ? "var(--success)" : "var(--gray-900)" }}>
                        {fmt(inv.total - inv.amountPaid)}
                      </td>
                      <td>{statusBadge(inv.status)}</td>
                      <td>
                        <div style={{ display: "flex", gap: 4 }}>
                          <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setSelected(inv)} title={t("common.view")}><Eye size={14} /></button>
                          {inv.status === "draft" && (
                            <button className="btn btn-ghost btn-sm btn-icon" onClick={() => sendInvoice(inv.id)} title={t("billing.sendInvoice")}><Send size={14} /></button>
                          )}
                          {["sent","partial","overdue"].includes(inv.status) && (
                            <button className="btn btn-ghost btn-sm btn-icon" onClick={() => markPaid(inv.id)} title={t("billing.markPaid")}><CheckCircle size={14} /></button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">{t("billing.newInvoice")}</span>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">{t("billing.client")}</label>
                  <select className="form-control">
                    <option>-- {t("billing.client")} --</option>
                    {mockClients.map(c => <option key={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">{t("billing.matter")}</label>
                  <select className="form-control">
                    <option>-- {t("billing.matter")} --</option>
                    {mockMatters.map(m => <option key={m.id}>{m.matterId} – {m.title}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">{t("billing.invoiceDate")}</label>
                  <input className="form-control" type="date" defaultValue={new Date().toISOString().split("T")[0]} />
                </div>
                <div className="form-group">
                  <label className="form-label">{t("billing.dueDate")}</label>
                  <input className="form-control" type="date" />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">{t("billing.paymentTerms")}</label>
                <select className="form-control">
                  <option>30 jours</option>
                  <option>60 jours</option>
                  <option>Immédiat</option>
                </select>
              </div>
              <div style={{ background: "var(--gray-50)", borderRadius: 8, padding: 16, textAlign: "center", color: "var(--gray-400)", fontSize: 13 }}>
                {t("billing.generateFromTime")} ← disponible depuis le module Temps
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowModal(false)}>{t("common.cancel")}</button>
              <button className="btn btn-primary">{t("common.save")}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
