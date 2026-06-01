import React from "react";
import { useTranslation } from "react-i18next";
import { Briefcase, Users, CheckSquare, TrendingUp, Clock, AlertCircle, ArrowUpRight, Plus } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { mockMatters, mockClients, mockTasks, mockInvoices, mockTimeEntries, mockCalendarEvents, mockUsers } from "../data/mockData";

const fmt = (n: number) => new Intl.NumberFormat("fr-CM", { style: "currency", currency: "XAF", maximumFractionDigits: 0 }).format(n);

const revenueData = [
  { month: "Jan", revenue: 18424125, billed: 22000000 },
  { month: "Fév", revenue: 9500000, billed: 15000000 },
  { month: "Mar", revenue: 12000000, billed: 18000000 },
  { month: "Avr", revenue: 8500000, billed: 13000000 },
  { month: "Mai", revenue: 4971638, billed: 9027375 },
  { month: "Jun", revenue: 0, billed: 0 },
];

const matterStatusColors: Record<string, string> = {
  active: "#3182ce", open: "#38a169", pending: "#d69e2e", closed: "#6b7280", archived: "#a0aec0"
};

export default function Dashboard({ onNavigate }: { onNavigate: (page: string) => void }) {
  const { t } = useTranslation();

  const openMatters = mockMatters.filter(m => ["open", "active", "pending"].includes(m.status)).length;
  const activeClients = mockClients.filter(c => c.active).length;
  const pendingTasks = mockTasks.filter(t2 => t2.status !== "done" && t2.status !== "cancelled").length;
  const monthRevenue = mockInvoices.filter(i => i.status === "paid").reduce((s, i) => s + i.amountPaid, 0);
  const billableHours = mockTimeEntries.filter(te => te.billable).reduce((s, te) => s + te.hours, 0);
  const outstanding = mockInvoices.filter(i => i.status !== "paid" && i.status !== "cancelled").reduce((s, i) => s + (i.total - i.amountPaid), 0);

  const mattersByStatus = Object.entries(
    mockMatters.reduce((acc: Record<string, number>, m) => {
      acc[m.status] = (acc[m.status] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value }));

  const overdueInvoices = mockInvoices.filter(i => i.status === "overdue").length;
  const upcomingEvents = mockCalendarEvents.slice(0, 4);
  const recentMatters = mockMatters.slice(0, 5);
  const urgentTasks = mockTasks.filter(t2 => (t2.priority === "urgent" || t2.priority === "high") && t2.status !== "done").slice(0, 4);

  const getUserName = (id: string) => {
    const u = mockUsers.find(u => u.id === id);
    return u ? `${u.firstName} ${u.lastName}` : id;
  };

  const getClientName = (id: string) => mockClients.find(c => c.id === id)?.name || id;

  const matterStatusBadge = (status: string) => {
    const classes: Record<string, string> = {
      active: "badge-blue", open: "badge-green", pending: "badge-yellow", closed: "badge-gray", archived: "badge-gray"
    };
    return <span className={`badge ${classes[status] || "badge-gray"}`}>{t(`matters.statuses.${status}`)}</span>;
  };

  return (
    <div>
      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon blue"><Briefcase size={22} /></div>
          <div>
            <div className="stat-value">{openMatters}</div>
            <div className="stat-label">{t("dashboard.openMatters")}</div>
            <div className="stat-change up"><ArrowUpRight size={12} /> 2 {t("dashboard.thisMonth")}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green"><Users size={22} /></div>
          <div>
            <div className="stat-value">{activeClients}</div>
            <div className="stat-label">{t("dashboard.activeClients")}</div>
            <div className="stat-change up"><ArrowUpRight size={12} /> 1 {t("dashboard.thisMonth")}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon yellow"><CheckSquare size={22} /></div>
          <div>
            <div className="stat-value">{pendingTasks}</div>
            <div className="stat-label">{t("dashboard.pendingTasks")}</div>
            {overdueInvoices > 0 && <div className="stat-change down"><AlertCircle size={12} /> {overdueInvoices} en retard</div>}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon gold"><TrendingUp size={22} /></div>
          <div>
            <div className="stat-value" style={{ fontSize: 18 }}>{fmt(monthRevenue)}</div>
            <div className="stat-label">{t("dashboard.monthlyRevenue")}</div>
            <div className="stat-change up"><ArrowUpRight size={12} /> +12%</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon purple"><Clock size={22} /></div>
          <div>
            <div className="stat-value">{billableHours.toFixed(1)}h</div>
            <div className="stat-label">{t("dashboard.billableHours")}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon red"><AlertCircle size={22} /></div>
          <div>
            <div className="stat-value" style={{ fontSize: 18 }}>{fmt(outstanding)}</div>
            <div className="stat-label">{t("dashboard.outstandingBalance")}</div>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="card mb-4" style={{ marginBottom: 20 }}>
        <div className="card-header">
          <span className="card-title">{t("dashboard.quickActions")}</span>
        </div>
        <div className="card-body" style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <button className="btn btn-primary" onClick={() => onNavigate("matters")}><Plus size={15} />{t("dashboard.newMatter")}</button>
          <button className="btn btn-outline" onClick={() => onNavigate("clients")}><Plus size={15} />{t("dashboard.newClient")}</button>
          <button className="btn btn-outline" onClick={() => onNavigate("time")}><Plus size={15} />{t("dashboard.addTimeEntry")}</button>
          <button className="btn btn-outline" onClick={() => onNavigate("billing")}><Plus size={15} />{t("dashboard.createInvoice")}</button>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* Revenue chart */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">{t("dashboard.revenueChart")}</span>
            <span className="badge badge-blue">{t("dashboard.ytd")}</span>
          </div>
          <div style={{ padding: "16px 20px 20px" }}>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={revenueData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-100)" />
                <XAxis dataKey="month" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis fontSize={11} tickLine={false} axisLine={false} tickFormatter={v => `${(v / 1000000).toFixed(0)}M`} />
                <Tooltip formatter={(val: any) => fmt(val)} />
                <Legend />
                <Bar dataKey="billed" name={t("billing.invoices")} fill="var(--gray-200)" radius={[4,4,0,0]} />
                <Bar dataKey="revenue" name={t("billing.statuses.paid")} fill="var(--primary)" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Matters by status */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">{t("dashboard.mattersByStatus")}</span>
          </div>
          <div style={{ padding: "16px 20px 20px" }}>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={mattersByStatus} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" nameKey="name" paddingAngle={3}>
                  {mattersByStatus.map((entry) => (
                    <Cell key={entry.name} fill={matterStatusColors[entry.name] || "#999"} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: any, name: any) => [v, t(`matters.statuses.${name}`)]} />
                <Legend formatter={(name: any) => t(`matters.statuses.${name}`)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="dashboard-grid" style={{ marginTop: 20 }}>
        {/* Recent matters */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">{t("dashboard.recentMatters")}</span>
            <button className="btn btn-ghost btn-sm" onClick={() => onNavigate("matters")}>{t("common.view")} →</button>
          </div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>{t("matters.matterId")}</th>
                  <th>{t("matters.matterTitle")}</th>
                  <th>{t("matters.status")}</th>
                  <th>{t("matters.practiceArea")}</th>
                </tr>
              </thead>
              <tbody>
                {recentMatters.map(m => (
                  <tr key={m.id} style={{ cursor: "pointer" }}>
                    <td><span style={{ fontFamily: "monospace", fontSize: 12 }}>{m.matterId}</span></td>
                    <td>
                      <div style={{ fontWeight: 500, color: "var(--gray-900)" }}>{m.title}</div>
                      <div style={{ fontSize: 11, color: "var(--gray-400)" }}>{getClientName(m.clientId)}</div>
                    </td>
                    <td>{matterStatusBadge(m.status)}</td>
                    <td><span style={{ fontSize: 12, color: "var(--gray-500)" }}>{t(`matters.practiceAreas.${m.practiceArea}`)}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Upcoming deadlines & tasks */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div className="card">
            <div className="card-header">
              <span className="card-title">{t("dashboard.upcomingDeadlines")}</span>
            </div>
            <div className="card-body" style={{ padding: "12px 20px" }}>
              {upcomingEvents.map(ev => (
                <div key={ev.id} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "10px 0", borderBottom: "1px solid var(--gray-100)" }}>
                  <div style={{ background: "var(--gray-100)", borderRadius: 8, padding: "6px 10px", textAlign: "center", flexShrink: 0, minWidth: 46 }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: "var(--primary)" }}>{new Date(ev.startDate).getDate()}</div>
                    <div style={{ fontSize: 10, color: "var(--gray-500)", textTransform: "uppercase" }}>
                      {new Date(ev.startDate).toLocaleString(undefined, { month: "short" })}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontWeight: 500, fontSize: 13, color: "var(--gray-800)" }}>{ev.title}</div>
                    <div style={{ fontSize: 11, color: "var(--gray-400)", marginTop: 2 }}>
                      {t(`calendar.eventTypes.${ev.type}`)} {ev.location && `· ${ev.location}`}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <span className="card-title">{t("tasks.title")}</span>
              <button className="btn btn-ghost btn-sm" onClick={() => onNavigate("tasks")}>{t("common.view")} →</button>
            </div>
            <div className="card-body" style={{ padding: "12px 20px" }}>
              {urgentTasks.map(task => (
                <div key={task.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid var(--gray-100)" }}>
                  <span className={`priority-dot priority-${task.priority}`} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: "var(--gray-800)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{task.title}</div>
                    <div style={{ fontSize: 11, color: "var(--gray-400)" }}>{getUserName(task.assignedTo)} · {task.dueDate}</div>
                  </div>
                  <span className={`badge badge-${task.priority === "urgent" ? "red" : "yellow"}`}>{t(`tasks.priorities.${task.priority}`)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

