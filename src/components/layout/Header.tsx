import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Menu, Bell, LogOut, ChevronDown } from "lucide-react";
import { useApp } from "../../context/AppContext";

interface HeaderProps {
  pageTitle: string;
  onToggleSidebar: () => void;
  onLogout: () => void;
}

export default function Header({ pageTitle, onToggleSidebar, onLogout }: HeaderProps) {
  const { t, i18n } = useTranslation();
  const { currentUser, notifications, markAllNotificationsRead } = useApp();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const unread = notifications.filter(n => !n.read).length;
  const initials = currentUser.firstName[0] + (currentUser.lastName?.[0] || "A");

  return (
    <header className="header">
      <div className="header-left">
        <button className="header-icon-btn" onClick={onToggleSidebar}>
          <Menu size={18} />
        </button>
        <h1 className="page-title">{pageTitle}</h1>
      </div>

      <div className="header-right">
        {/* Language */}
        <div className="lang-switcher">
          <button className={`lang-btn ${i18n.language === "en" ? "active" : ""}`} onClick={() => i18n.changeLanguage("en")}>EN</button>
          <button className={`lang-btn ${i18n.language === "fr" ? "active" : ""}`} onClick={() => i18n.changeLanguage("fr")}>FR</button>
        </div>

        {/* Notifications */}
        <div className="dropdown">
          <button className="header-icon-btn" onClick={() => { setShowNotifications(!showNotifications); setShowUserMenu(false); }}>
            <Bell size={17} />
            {unread > 0 && <span className="notification-badge">{unread}</span>}
          </button>
          {showNotifications && (
            <div className="dropdown-menu" style={{ width: 320, right: 0 }}>
              <div style={{ padding: "13px 16px", borderBottom: "1px solid var(--gray-200)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontWeight: 700, fontSize: 14, color: "var(--navy)" }}>{t("notifications.title")}</span>
                {unread > 0 && (
                  <button className="btn btn-ghost btn-sm" onClick={markAllNotificationsRead} style={{ fontSize: 11, color: "var(--gold-dark)" }}>
                    {t("notifications.markAllRead")}
                  </button>
                )}
              </div>
              <div style={{ padding: "20px 16px", textAlign: "center", color: "var(--gray-400)", fontSize: 13 }}>
                {t("notifications.noNotifications")}
              </div>
            </div>
          )}
        </div>

        {/* User */}
        <div className="dropdown">
          <div style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", padding: "4px 8px", borderRadius: "var(--radius)", transition: "background 0.15s" }}
            onClick={() => { setShowUserMenu(!showUserMenu); setShowNotifications(false); }}
            onMouseEnter={e => (e.currentTarget.style.background = "var(--gray-100)")}
            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
          >
            <div className="user-avatar">{initials}</div>
            <div className="user-info">
              <div className="user-name">{currentUser.firstName} {currentUser.lastName}</div>
              <div className="user-role">{t(`users.roles.${currentUser.role}`)}</div>
            </div>
            <ChevronDown size={13} color="var(--gray-400)" />
          </div>
          {showUserMenu && (
            <div className="dropdown-menu">
              <div style={{ padding: "10px 16px", borderBottom: "1px solid var(--gray-100)" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--navy)" }}>{currentUser.email}</div>
                <div style={{ fontSize: 11, color: "var(--gray-400)", marginTop: 2 }}>{t(`users.roles.${currentUser.role}`)}</div>
              </div>
              <div className="dropdown-divider" />
              <div className="dropdown-item danger" onClick={onLogout}>
                <LogOut size={15} />
                <span>{t("auth.logout")}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
