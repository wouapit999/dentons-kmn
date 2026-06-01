import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Search, Eye, Edit2, X, CheckCircle, XCircle } from "lucide-react";
import { mockClients, mockMatters, mockInvoices } from "../data/mockData";
import { Client, ClientType } from "../types";

const fmt = (n: number) => new Intl.NumberFormat("fr-CM", { style: "currency", currency: "XAF", maximumFractionDigits: 0 }).format(n);

export default function Clients() {
  const { t } = useTranslation();
  const [clients, setClients] = useState<Client[]>(mockClients);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState<Client | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [form, setForm] = useState<Partial<Client>>({ type: "company", active: true, portalEnabled: false });

  const filtered = clients.filter(c => {
    const q = search.toLowerCase();
    const match = !q || c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || (c.contactPerson || "").toLowerCase().includes(q);
    const matchType = typeFilter === "all" || c.type === typeFilter;
    return match && matchType;
  });

  const clientMatters = (id: string) => mockMatters.filter(m => m.clientId === id);
  const clientInvoices = (id: string) => mockInvoices.filter(i => i.clientId === id);
  const clientRevenue = (id: string) => clientInvoices(id).reduce((s, i) => s + i.amountPaid, 0);
  const typeBadge = (type: string) => {
    const map: Record<string, string> = { individual: "badge-purple", company: "badge-blue", government: "badge-yellow", ngo: "badge-green" };
    return <span className={`badge ${map[type] || "badge-gray"}`}>{t(`clients.clientTypes.${type}`)}</span>;
  };

  const handleSubmit = () => {
    if (!form.name || !form.type) return;
    if (selected) {
      setClients(prev => prev.map(c => c.id === selected.id ? { ...c, ...form } as Client : c));
    } else {
      const newClient: Client = {
        id: `c${Date.now()}`, name: form.name!, type: form.type as ClientType,
        email: form.email || "", phone: form.phone || "", address: form.address || "",
        taxId: form.taxId, website: form.website, contactPerson: form.contactPerson,
        portalEnabled: form.portalEnabled || false, createdAt: new Date().toISOString().split("T")[0], active: true,
      };
      setClients(prev => [newClient, ...prev]);
    }
    setShowModal(false);
    setForm({ type: "company", active: true, portalEnabled: false });
    setSelected(null);
  };

  const openDetail = (c: Client) => { setSelected(c); setActiveTab("overview"); };
  const openEdit = (c: Client) => { setSelected(c); setForm(c); setShowModal(true); };

  return (
    <div>
      {selected && !showModal ? (
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <button className="btn btn-ghost btn-sm" onClick={() => setSelected(null)}>← {t("common.back")}</button>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <h2 style={{ fontSize: 18, fontWeight: 700 }}>{selected.name}</h2>
                {typeBadge(selected.type)}
                {selected.portalEnabled && <span className="badge badge-green">Portal</span>}
              </div>
              <div style={{ fontSize: 12, color: "var(--gray-500)", marginTop: 2 }}>{selected.email} · {selected.phone}</div>
            </div>
            <button className="btn btn-outline btn-sm" onClick={() => openEdit(selected)}><Edit2 size={14} />{t("common.edit")}</button>
          </div>

          <div className="tabs">
            {["overview", "matters", "invoices"].map(tab => (
              <button key={tab} className={`tab-btn ${activeTab === tab ? "active" : ""}`} onClick={() => setActiveTab(tab)}>
                {tab === "overview" ? t("clients.client") : tab === "matters" ? `${t("matters.title")} (${clientMatters(selected.id).length})` : `${t("billing.invoices")} (${clientInvoices(selected.id).length})`}
              </button>
            ))}
          </div>

          {activeTab === "overview" && (
            <div className="form-row">
              <div className="card">
                <div className="card-header"><span className="card-title">{t("clients.client")}</span></div>
                <div className="card-body">
                  {[
                    [t("clients.clientType"), typeBadge(selected.type)],
                    [t("common.email"), selected.email],
                    [t("common.phone"), selected.phone],
                    [t("common.address"), selected.address],
                    [t("clients.taxId"), selected.taxId],
                    [t("clients.website"), selected.website],
                    [t("clients.contactPerson"), selected.contactPerson],
                    [t("common.createdAt"), selected.createdAt],
                  ].filter(([,v]) => v).map(([l, v], i) => (
                    <div key={i} style={{ display: "flex", gap: 12, padding: "8px 0", borderBottom: "1px solid var(--gray-100)" }}>
                      <div style={{ width: 160, fontSize: 12, color: "var(--gray-500)", fontWeight: 500, flexShrink: 0 }}>{l}</div>
                      <div style={{ fontSize: 13 }}>{v}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div className="card">
                  <div className="card-header"><span className="card-title">Résumé</span></div>
                  <div className="card-body">
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                      <div style={{ textAlign: "center", padding: "12px", background: "var(--gray-50)", borderRadius: 8 }}>
                        <div style={{ fontSize: 24, fontWeight: 700, color: "var(--primary)" }}>{clientMatters(selected.id).length}</div>
                        <div style={{ fontSize: 12, color: "var(--gray-500)", marginTop: 2 }}>{t("matters.title")}</div>
                      </div>
                      <div style={{ textAlign: "center", padding: "12px", background: "var(--gray-50)", borderRadius: 8 }}>
                        <div style={{ fontSize: 24, fontWeight: 700, color: "var(--success)" }}>{clientInvoices(selected.id).length}</div>
                        <div style={{ fontSize: 12, color: "var(--gray-500)", marginTop: 2 }}>{t("billing.invoices")}</div>
                      </div>
                    </div>
                    <div style={{ marginTop: 16, padding: 12, background: "var(--gray-50)", borderRadius: 8 }}>
                      <div style={{ fontSize: 13, color: "var(--gray-500)", marginBottom: 4 }}>Revenus totaux</div>
                      <div style={{ fontSize: 20, fontWeight: 700, color: "var(--gray-900)" }}>{fmt(clientRevenue(selected.id))}</div>
                    </div>
                    <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 13, color: "var(--gray-600)" }}>{t("clients.portalAccess")}:</span>
                      {selected.portalEnabled ? <CheckCircle size={16} color="var(--success)" /> : <XCircle size={16} color="var(--gray-400)" />}
                    </div>
                  </div>
                </div>
                <div className="card">
                  <div className="card-header"><span className="card-title">{t("clients.conflictCheck")}</span></div>
                  <div className="card-body">
                    <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--success)" }}>
                      <CheckCircle size={18} />
                      <span style={{ fontSize: 13, fontWeight: 500 }}>{t("clients.conflictCheckPassed")}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "matters" && (
            <div className="card">
              <div className="card-header"><span className="card-title">{t("matters.title")}</span></div>
              <div className="table-container">
                <table>
                  <thead><tr><th>ID</th><th>{t("matters.matterTitle")}</th><th>{t("matters.practiceArea")}</th><th>{t("matters.status")}</th><th>{t("matters.openDate")}</th></tr></thead>
                  <tbody>
                    {clientMatters(selected.id).map(m => (
                      <tr key={m.id}>
                        <td><span style={{ fontFamily: "monospace", fontSize: 12 }}>{m.matterId}</span></td>
                        <td style={{ fontWeight: 500 }}>{m.title}</td>
                        <td>{t(`matters.practiceAreas.${m.practiceArea}`)}</td>
                        <td><span className={`badge badge-${m.status === "active" ? "blue" : m.status === "closed" ? "gray" : "yellow"}`}>{t(`matters.statuses.${m.status}`)}</span></td>
                        <td>{m.openDate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "invoices" && (
            <div className="card">
              <div className="card-header"><span className="card-title">{t("billing.invoices")}</span></div>
              <div className="table-container">
                <table>
                  <thead><tr><th>{t("billing.invoiceNumber")}</th><th>{t("billing.invoiceDate")}</th><th>{t("billing.total")}</th><th>{t("billing.amountDue")}</th><th>{t("common.status")}</th></tr></thead>
                  <tbody>
                    {clientInvoices(selected.id).map(inv => (
                      <tr key={inv.id}>
                        <td><span style={{ fontFamily: "monospace", fontSize: 12 }}>{inv.invoiceNumber}</span></td>
                        <td>{inv.invoiceDate}</td>
                        <td>{fmt(inv.total)}</td>
                        <td style={{ fontWeight: 500 }}>{fmt(inv.total - inv.amountPaid)}</td>
                        <td><span className={`badge badge-${inv.status === "paid" ? "green" : inv.status === "overdue" ? "red" : "yellow"}`}>{t(`billing.statuses.${inv.status}`)}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="page-header">
            <div>
              <div className="page-header-title">{t("clients.title")}</div>
              <div className="page-header-subtitle">{filtered.length} {t("clients.clientList").toLowerCase()}</div>
            </div>
            <button className="btn btn-primary" onClick={() => { setSelected(null); setForm({ type: "company", active: true, portalEnabled: false }); setShowModal(true); }}>
              <Plus size={15} />{t("clients.newClient")}
            </button>
          </div>

          <div className="filters-row">
            <div className="search-box">
              <Search size={15} className="search-icon" />
              <input className="form-control" style={{ paddingLeft: 36 }} placeholder={t("common.search")} value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select className="filter-select" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
              <option value="all">{t("common.all")}</option>
              {["individual","company","government","ngo"].map(t2 => <option key={t2} value={t2}>{t(`clients.clientTypes.${t2}`)}</option>)}
            </select>
          </div>

          <div className="card">
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>{t("clients.clientName")}</th>
                    <th>{t("clients.clientType")}</th>
                    <th>{t("common.email")}</th>
                    <th>{t("common.phone")}</th>
                    <th>{t("matters.title")}</th>
                    <th>{t("common.status")}</th>
                    <th>{t("common.actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(c => (
                    <tr key={c.id}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ width: 34, height: 34, borderRadius: "50%", background: "var(--primary)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 600, flexShrink: 0 }}>
                            {c.name[0]}
                          </div>
                          <div>
                            <div style={{ fontWeight: 500, cursor: "pointer" }} onClick={() => openDetail(c)}>{c.name}</div>
                            {c.contactPerson && <div style={{ fontSize: 11, color: "var(--gray-400)" }}>{c.contactPerson}</div>}
                          </div>
                        </div>
                      </td>
                      <td>{typeBadge(c.type)}</td>
                      <td style={{ fontSize: 13 }}>{c.email}</td>
                      <td style={{ fontSize: 13 }}>{c.phone}</td>
                      <td style={{ textAlign: "center" }}>{clientMatters(c.id).length}</td>
                      <td><span className={`badge ${c.active ? "badge-green" : "badge-gray"}`}>{c.active ? t("common.active") : t("common.inactive")}</span></td>
                      <td>
                        <div style={{ display: "flex", gap: 4 }}>
                          <button className="btn btn-ghost btn-sm btn-icon" onClick={() => openDetail(c)}><Eye size={14} /></button>
                          <button className="btn btn-ghost btn-sm btn-icon" onClick={() => openEdit(c)}><Edit2 size={14} /></button>
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
              <span className="modal-title">{selected ? t("clients.editClient") : t("clients.newClient")}</span>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label required">{t("clients.clientName")}</label>
                  <input className="form-control" value={form.name || ""} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label required">{t("clients.clientType")}</label>
                  <select className="form-control" value={form.type || "company"} onChange={e => setForm(f => ({ ...f, type: e.target.value as ClientType }))}>
                    {["individual","company","government","ngo"].map(t2 => <option key={t2} value={t2}>{t(`clients.clientTypes.${t2}`)}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">{t("common.email")}</label>
                  <input className="form-control" type="email" value={form.email || ""} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">{t("common.phone")}</label>
                  <input className="form-control" value={form.phone || ""} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">{t("common.address")}</label>
                <input className="form-control" value={form.address || ""} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">{t("clients.taxId")}</label>
                  <input className="form-control" value={form.taxId || ""} onChange={e => setForm(f => ({ ...f, taxId: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">{t("clients.contactPerson")}</label>
                  <input className="form-control" value={form.contactPerson || ""} onChange={e => setForm(f => ({ ...f, contactPerson: e.target.value }))} />
                </div>
              </div>
              <div className="form-group">
                <label className="checkbox-label">
                  <input type="checkbox" checked={form.portalEnabled || false} onChange={e => setForm(f => ({ ...f, portalEnabled: e.target.checked }))} />
                  {t("clients.enablePortal")}
                </label>
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
