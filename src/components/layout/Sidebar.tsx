import React from "react";
import { useTranslation } from "react-i18next";
import {
  LayoutDashboard, Briefcase, Users, FileText, CheckSquare,
  Calendar, Clock, Receipt, BarChart2, Settings, UserCog,
  Shield, Scale
} from "lucide-react";

interface SidebarProps {
  activePage: string;
  onNavigate: (page: string) => void;
  collapsed: boolean;
}

const navItems = [
  { key: "dashboard", icon: LayoutDashboard, label: "nav.dashboard", section: null },
  { key: "matters", icon: Briefcase, label: "nav.matters", section: "core" },
  { key: "clients", icon: Users, label: "nav.clients", section: "core" },
  { key: "documents", icon: FileText, label: "nav.documents", section: "core" },
  { key: "tasks", icon: CheckSquare, label: "nav.tasks", section: "core" },
  { key: "calendar", icon: Calendar, label: "nav.calendar", section: "core" },
  { key: "time", icon: Clock, label: "nav.timeTracking", section: "billing" },
  { key: "billing", icon: Receipt, label: "nav.billing", section: "billing" },
  { key: "trust", icon: Scale, label: "trust.title", section: "billing" },
  { key: "reports", icon: BarChart2, label: "nav.reports", section: "manage" },
  { key: "users", icon: UserCog, label: "nav.users", section: "manage" },
  { key: "audit", icon: Shield, label: "nav.auditLog", section: "manage" },
  { key: "settings", icon: Settings, label: "nav.settings", section: "manage" },
];

const sectionLabels: Record<string, string> = {
  core: "LEGAL WORK",
  billing: "FINANCE",
  manage: "ADMINISTRATION",
};

const sectionLabelsFr: Record<string, string> = {
  core: "PRATIQUE JURIDIQUE",
  billing: "FINANCES",
  manage: "ADMINISTRATION",
};

export default function Sidebar({ activePage, onNavigate, collapsed }: SidebarProps) {
  const { t, i18n } = useTranslation();
  const isFr = i18n.language === "fr";
  const labels = isFr ? sectionLabelsFr : sectionLabels;

  let lastSection: string | null = undefined as any;

  return (
    <div className={`sidebar ${collapsed ? "collapsed" : ""}`}>
      <div className="sidebar-logo">
        <div style={{ width: 36, height: 36, borderRadius: 8, background: "#c9a84c", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Scale size={20} color="white" />
        </div>
        {!collapsed && (
          <div>
            <div className="sidebar-logo-text">Dentons KMN</div>
            <div className="sidebar-logo-sub">Legal Practice</div>
          </div>
        )}
      </div>
      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const showSection = item.section !== lastSection && item.section !== null;
          lastSection = item.section;
          const Icon = item.icon;
          return (
            <React.Fragment key={item.key}>
              {showSection && !collapsed && (
                <div className="nav-section-label">{labels[item.section!]}</div>
              )}
              <div
                className={`nav-item ${activePage === item.key ? "active" : ""}`}
                onClick={() => onNavigate(item.key)}
                title={collapsed ? t(item.label) : undefined}
              >
                <Icon size={17} className="nav-icon" />
                {!collapsed && <span>{t(item.label)}</span>}
              </div>
            </React.Fragment>
          );
        })}
      </nav>
      <div style={{ padding: "12px 8px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
        {!collapsed && (
          <div style={{ padding: "8px 12px", fontSize: 11, color: "rgba(255,255,255,0.3)" }}>
            v1.0 – Dentons KMN © 2026
          </div>
        )}
      </div>
    </div>
  );
}
