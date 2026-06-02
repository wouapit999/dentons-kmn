import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, AreaChart, Area } from "recharts";
import { mockMatters, mockInvoices, mockTimeEntries, mockUsers, mockClients } from "../data/mockData";
import Logo from "../components/ui/Logo";

const fmt = (n: number) => new Intl.NumberFormat("fr-CM", { style: "currency", currency: "XAF", maximumFractionDigits: 0 }).format(n);
const COLORS = ["#1a3a5c","#c9a84c","#38a169","#e53e3e","#3182ce","#805ad5","#d69e2e"];

const revenueData = [
  { month: "Jan", revenue: 18424125, expenses: 3000000 },
  { month: "Fév", revenue: 9500000, expenses: 2500000 },
  { month: "Mar", revenue: 12000000, expenses: 2800000 },
  { month: "Avr", revenue: 8500000, expenses: 2200000 },
  { month: "Mai", revenue: 4971638, expenses: 1500000 },
];

const utilizationData = mockUsers.filter(u => u.billingRate > 0).map(u => {
  const hours = mockTimeEntries.filter(te => te.userId === u.id).reduce((s, te) => s + te.hours, 0);
  return { name: `${u.firstName[0]}. ${u.lastName}`, hours: Math.round(hours * 10) / 10, target: 120 };
});

export default function Reports() {
  const { t } = useTranslation();
  const [activeReport, setActiveReport] = useState("financial");
  const [dateFrom, setDateFrom] = useState("2026-01-01");
  const [dateTo, setDateTo] = useState("2026-12-31");

  const totalRevenue = revenueData.reduce((s, d) => s + d.revenue, 0);
  const totalExpenses = revenueData.reduce((s, d) => s + d.expenses, 0);
  const collectionRate = Math.round((mockInvoices.reduce((s, i) => s + i.amountPaid, 0) / mockInvoices.reduce((s, i) => s + i.total, 0)) * 100);

  const practiceAreaData = Object.entries(
    mockMatters.reduce((acc: Record<string, number>, m) => {
      acc[m.practiceArea] = (acc[m.practiceArea] || 0) + 1;
      return acc;
    }, {})
  ).map(([area, count]) => ({ name: area, count }));

  const invoiceStatusData = Object.entries(
    mockInvoices.reduce((acc: Record<string, number>, inv) => {
      acc[inv.status] = (acc[inv.status] || 0) + inv.total;
      return acc;
    }, {})
  ).map(([status, amount]) => ({ name: status, amount }));

  return (
    <div>
      {/* Report logo header — appears on all reports */}
      <div className="report-logo-header">
        <Logo size="md" variant="dark" showTagline />
        <div className="report-firm-info">
          <div className="report-firm-name">Dentons KMN</div>
          <div>Kouengoua · Minou · Nkongho Law Firm</div>
          <div>Douala, Cameroun</div>
          <a href="https://www.dentons.com/en/global-presence/africa/cameroon/douala" target="_blank" rel="noopener noreferrer" style={{ color: "var(--gold-dark)", textDecoration: "none", fontWeight: 600 }}>
            dentons.com/en/global-presence/africa/cameroon/douala
          </a>
        </div>
      </div>

      <div className="page-header">
        <div className="page-header-title">{t("reports.title")}</div>
        <div style={{ display: "flex", gap: 10 }}>
          <input className="form-control" type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ width: 160 }} />
          <input className="form-control" type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={{ width: 160 }} />
          <button className="btn btn-outline">{t("reports.exportPdf")}</button>
          <button className="btn btn-outline">{t("reports.exportExcel")}</button>
        </div>
      </div>

      {/* Report tabs */}
      <div className="tabs">
        {[
          ["financial", t("reports.financialReports")],
          ["matters", t("reports.matterReports")],
          ["time", t("reports.timeReports")],
          ["clients", t("reports.clientReports")],
        ].map(([key, label]) => (
          <button key={key} className={`tab-btn ${activeReport === key ? "active" : ""}`} onClick={() => setActiveReport(key)}>{label}</button>
        ))}
      </div>

      {activeReport === "financial" && (
        <div>
          {/* KPIs */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
            {[
              { label: "Revenus YTD", value: fmt(totalRevenue), change: "+12%", up: true },
              { label: "Dépenses YTD", value: fmt(totalExpenses), change: "+5%", up: false },
              { label: "Bénéfice net", value: fmt(totalRevenue - totalExpenses), change: "+18%", up: true },
              { label: t("dashboard.collectionRate"), value: `${collectionRate}%`, change: "+3%", up: true },
            ].map((kpi, i) => (
              <div key={i} className="card" style={{ padding: 16 }}>
                <div style={{ fontSize: 12, color: "var(--gray-500)", fontWeight: 500 }}>{kpi.label}</div>
                <div style={{ fontSize: 20, fontWeight: 700, marginTop: 6 }}>{kpi.value}</div>
                <div style={{ fontSize: 12, marginTop: 4, color: kpi.up ? "var(--success)" : "var(--danger)", display: "flex", alignItems: "center", gap: 3 }}>
                  {kpi.up ? "↑" : "↓"} {kpi.change}
                </div>
              </div>
            ))}
          </div>

          <div className="dashboard-grid">
            <div className="card">
              <div className="card-header"><span className="card-title">{t("reports.profitLoss")}</span></div>
              <div style={{ padding: 20 }}>
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-100)" />
                    <XAxis dataKey="month" fontSize={12} axisLine={false} tickLine={false} />
                    <YAxis fontSize={11} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000000).toFixed(0)}M`} />
                    <Tooltip formatter={(v: any) => fmt(v)} />
                    <Legend />
                    <Area type="monotone" dataKey="revenue" name="Revenus" stroke="var(--primary)" fill="#e8f0f8" strokeWidth={2} />
                    <Area type="monotone" dataKey="expenses" name="Dépenses" stroke="var(--danger)" fill="#fff5f5" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="card">
              <div className="card-header"><span className="card-title">{t("billing.statuses.paid")}/{t("billing.statuses.overdue")}</span></div>
              <div style={{ padding: 20 }}>
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={invoiceStatusData} cx="50%" cy="50%" outerRadius={90} dataKey="amount" nameKey="name" paddingAngle={3}>
                      {invoiceStatusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v: any, name: any) => [fmt(v), t(`billing.statuses.${name}`)]} />
                    <Legend formatter={(name: any) => t(`billing.statuses.${name}`)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Invoice table */}
          <div className="card" style={{ marginTop: 20 }}>
            <div className="card-header"><span className="card-title">{t("billing.aging")}</span></div>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>{t("billing.invoiceNumber")}</th>
                    <th>{t("billing.client")}</th>
                    <th style={{ textAlign: "right" }}>{t("billing.total")}</th>
                    <th style={{ textAlign: "right" }}>Payé</th>
                    <th style={{ textAlign: "right" }}>{t("billing.amountDue")}</th>
                    <th>{t("common.status")}</th>
                    <th>{t("billing.dueDate")}</th>
                  </tr>
                </thead>
                <tbody>
                  {mockInvoices.map(inv => {
                    const client = mockClients.find(c => c.id === inv.clientId);
                    return (
                      <tr key={inv.id}>
                        <td><span style={{ fontFamily: "monospace", fontSize: 12 }}>{inv.invoiceNumber}</span></td>
                        <td>{client?.name}</td>
                        <td style={{ textAlign: "right" }}>{fmt(inv.total)}</td>
                        <td style={{ textAlign: "right", color: "var(--success)" }}>{fmt(inv.amountPaid)}</td>
                        <td style={{ textAlign: "right", fontWeight: 600 }}>{fmt(inv.total - inv.amountPaid)}</td>
                        <td><span className={`badge badge-${inv.status === "paid" ? "green" : inv.status === "overdue" ? "red" : "yellow"}`}>{t(`billing.statuses.${inv.status}`)}</span></td>
                        <td style={{ fontSize: 12 }}>{inv.dueDate}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeReport === "matters" && (
        <div>
          <div className="dashboard-grid">
            <div className="card">
              <div className="card-header"><span className="card-title">{t("matters.practiceArea")}</span></div>
              <div style={{ padding: 20 }}>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={practiceAreaData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-100)" horizontal={false} />
                    <XAxis type="number" fontSize={11} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="name" fontSize={11} axisLine={false} tickLine={false} width={110} tickFormatter={(name: any) => t(`matters.practiceAreas.${name}`).slice(0,18)} />
                    <Tooltip formatter={(v: any, name: any) => [v, t("matters.title")]} labelFormatter={(name: any) => t(`matters.practiceAreas.${name}`)} />
                    <Bar dataKey="count" name={t("matters.title")} fill="var(--primary)" radius={[0,4,4,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="card">
              <div className="card-header"><span className="card-title">{t("dashboard.mattersByStatus")}</span></div>
              <div style={{ padding: 20 }}>
                <table style={{ width: "100%" }}>
                  <thead><tr><th style={{ padding: "8px 0", fontSize: 12, color: "var(--gray-500)", fontWeight: 600, borderBottom: "1px solid var(--gray-200)" }}>{t("matters.status")}</th><th style={{ padding: "8px 0", fontSize: 12, color: "var(--gray-500)", fontWeight: 600, textAlign: "right", borderBottom: "1px solid var(--gray-200)" }}>{t("matters.title")}</th></tr></thead>
                  <tbody>
                    {["open","active","pending","closed","archived"].map(status => {
                      const count = mockMatters.filter(m => m.status === status).length;
                      return (
                        <tr key={status}>
                          <td style={{ padding: "10px 0", borderBottom: "1px solid var(--gray-100)" }}>
                            <span className={`badge badge-${status === "active" ? "blue" : status === "open" ? "green" : status === "pending" ? "yellow" : "gray"}`}>{t(`matters.statuses.${status}`)}</span>
                          </td>
                          <td style={{ padding: "10px 0", textAlign: "right", fontWeight: 700, fontSize: 15, borderBottom: "1px solid var(--gray-100)" }}>{count}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeReport === "time" && (
        <div>
          <div className="card">
            <div className="card-header"><span className="card-title">{t("reports.utilization")}</span></div>
            <div style={{ padding: 20 }}>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={utilizationData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-100)" />
                  <XAxis dataKey="name" fontSize={11} axisLine={false} tickLine={false} />
                  <YAxis fontSize={11} axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Bar dataKey="hours" name={t("time.billableHours")} fill="var(--primary)" radius={[4,4,0,0]} />
                  <Bar dataKey="target" name="Objectif" fill="var(--gray-200)" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card" style={{ marginTop: 20 }}>
            <div className="card-header"><span className="card-title">{t("time.billableHours")} par collaborateur</span></div>
            <div className="table-container">
              <table>
                <thead><tr><th>{t("common.name")}</th><th>{t("users.role")}</th><th style={{ textAlign: "right" }}>Heures saisies</th><th style={{ textAlign: "right" }}>{t("time.billableHours")}</th><th style={{ textAlign: "right" }}>Taux</th><th style={{ textAlign: "right" }}>Montant</th></tr></thead>
                <tbody>
                  {mockUsers.filter(u => u.billingRate > 0).map(u => {
                    const userEntries = mockTimeEntries.filter(te => te.userId === u.id);
                    const total = userEntries.reduce((s, te) => s + te.hours, 0);
                    const billable = userEntries.filter(te => te.billable).reduce((s, te) => s + te.hours, 0);
                    const amount = userEntries.filter(te => te.billable).reduce((s, te) => s + te.hours * te.billingRate, 0);
                    return (
                      <tr key={u.id}>
                        <td style={{ fontWeight: 500 }}>{u.firstName} {u.lastName}</td>
                        <td><span className="badge badge-blue">{t(`users.roles.${u.role}`)}</span></td>
                        <td style={{ textAlign: "right" }}>{total.toFixed(1)}h</td>
                        <td style={{ textAlign: "right" }}>{billable.toFixed(1)}h</td>
                        <td style={{ textAlign: "right" }}>{fmt(u.billingRate)}/h</td>
                        <td style={{ textAlign: "right", fontWeight: 600, color: "var(--success)" }}>{fmt(amount)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeReport === "clients" && (
        <div>
          <div className="card">
            <div className="card-header"><span className="card-title">{t("clients.title")}</span></div>
            <div className="table-container">
              <table>
                <thead><tr><th>{t("clients.clientName")}</th><th>{t("clients.clientType")}</th><th>{t("matters.title")}</th><th style={{ textAlign: "right" }}>Facturé</th><th style={{ textAlign: "right" }}>Encaissé</th><th style={{ textAlign: "right" }}>Solde</th></tr></thead>
                <tbody>
                  {mockClients.map(c => {
                    const invs = mockInvoices.filter(i => i.clientId === c.id);
                    const billed = invs.reduce((s, i) => s + i.total, 0);
                    const paid = invs.reduce((s, i) => s + i.amountPaid, 0);
                    const matters = mockMatters.filter(m => m.clientId === c.id).length;
                    return (
                      <tr key={c.id}>
                        <td style={{ fontWeight: 500 }}>{c.name}</td>
                        <td><span className="badge badge-blue">{t(`clients.clientTypes.${c.type}`)}</span></td>
                        <td style={{ textAlign: "center" }}>{matters}</td>
                        <td style={{ textAlign: "right" }}>{fmt(billed)}</td>
                        <td style={{ textAlign: "right", color: "var(--success)" }}>{fmt(paid)}</td>
                        <td style={{ textAlign: "right", fontWeight: 600, color: billed - paid > 0 ? "var(--warning)" : "var(--success)" }}>{fmt(billed - paid)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



