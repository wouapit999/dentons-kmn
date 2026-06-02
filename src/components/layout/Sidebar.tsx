import React from "react";
import { useTranslation } from "react-i18next";
import {
  LayoutDashboard, Briefcase, Users, FileText, CheckSquare,
  Calendar, Clock, Receipt, BarChart2, Settings, UserCog,
  Shield, Scale
} from "lucide-react";
import Logo from "../ui/Logo";

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

const sectionLabelsEn: Record<string, string> = { core: "Legal Practice", billing: "Finance", manage: "Administration" };
const sectionLabelsFr: Record<string, string> = { core: "Pratique Juridique", billing: "Finances", manage: "Administration" };

export default function Sidebar({ activePage, onNavigate, collapsed }: SidebarProps) {
  const { t, i18n } = useTranslation();
  const labels = i18n.language === "fr" ? sectionLabelsFr : sectionLabelsEn;
  let lastSection: string | null = undefined as any;

  return (
    <div className={`sidebar ${collapsed ? "collapsed" : ""}`}>
      {/* Logo */}
      <div className="sidebar-logo">
        {collapsed
          ? <Scale size={24} color="var(--gold)" style={{ margin: "0 auto", display: "block" }} />
          : <Logo size="sm" variant="light" showTagline />
        }
      </div>

      {/* Nav */}
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

      {/* Footer */}
      <div className="sidebar-footer">
        {!collapsed && (
          <a
            href="https://www.dentons.com/en/global-presence/africa/cameroon/douala"
            target="_blank" rel="noopener noreferrer"
            style={{ display: "block", textAlign: "center", fontSize: 10, color: "rgba(201,168,76,0.5)", textDecoration: "none", letterSpacing: "0.05em", lineHeight: 1.6 }}
          >
            dentons.com<br />Douala, Cameroun
          </a>
        )}
      </div>
    </div>
  );
}
