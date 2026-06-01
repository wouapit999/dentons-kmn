import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Menu, Bell, LogOut, ChevronDown } from "lucide-react";
import { useApp } from "../../context/AppContext";

interface HeaderProps {
  pageTitle: string;
  onToggleSidebar: () => void;
}

export default function Header({ pageTitle, onToggleSidebar }: HeaderProps) {
  const { t, i18n } = useTranslation();
  const { currentUser, notifications, markAllNotificationsRead } = useApp();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const unread = notifications.filter(n => !n.read).length;

  const initials = `${currentUser.firstName[0]}${currentUser.lastName[0]}`;

  const setLang = (lang: string) => {
    i18n.changeLanguage(lang);
  };

  return (
    <header className="header">
      <div className="header-left">
        <button className="header-btn" onClick={onToggleSidebar}>
          <Menu size={18} />
        </button>
        <h1 className="page-title">{pageTitle}</h1>
      </div>

      <div className="header-right">
        <div className="lang-switcher">
          <button className={`lang-btn ${i18n.language === "en" ? "active" : ""}`} onClick={() => setLang("en")}>EN</button>
          <button className={`lang-btn ${i18n.language === "fr" ? "active" : ""}`} onClick={() => setLang("fr")}>FR</button>
        </div>

        {/* Notifications */}
        <div className="dropdown">
          <button className="header-btn" onClick={() => { setShowNotifications(!showNotifications); setShowUserMenu(false); }}>
            <Bell size={18} />
            {unread > 0 && <span className="notification-badge">{unread}</span>}
          </button>
          {showNotifications && (
            <div className="dropdown-menu" style={{ width: 320 }}>
              <div style={{ padding: "12px 14px", borderBottom: "1px solid var(--gray-200)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontWeight: 600, fontSize: 14 }}>{t("notifications.title")}</span>
                <button className="btn btn-ghost btn-sm" onClick={markAllNotificationsRead} style={{ fontSize: 11 }}>
                  {t("notifications.markAllRead")}
                </button>
              </div>
              {notifications.length === 0 ? (
                <div style={{ padding: 20, textAlign: "center", color: "var(--gray-400)", fontSize: 13 }}>
                  {t("notifications.noNotifications")}
                </div>
              ) : (
                notifications.map(n => (
                  <div key={n.id} className="dropdown-item" style={{ alignItems: "flex-start", gap: 10, background: n.read ? "white" : "var(--gray-50)" }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: n.read ? "transparent" : "var(--primary)", marginTop: 6, flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: 13, color: "var(--gray-800)" }}>{n.message}</div>
                      <div style={{ fontSize: 11, color: "var(--gray-400)", marginTop: 2 }}>{n.createdAt.split("T")[0]}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* User menu */}
        <div className="dropdown">
          <div style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }} onClick={() => { setShowUserMenu(!showUserMenu); setShowNotifications(false); }}>
            <div className="user-avatar">{initials}</div>
            <div className="user-info">
              <div className="user-name">{currentUser.firstName} {currentUser.lastName}</div>
              <div className="user-role">{t(`users.roles.${currentUser.role}`)}</div>
            </div>
            <ChevronDown size={14} color="var(--gray-500)" />
          </div>
          {showUserMenu && (
            <div className="dropdown-menu">
              <div className="dropdown-item">
                <span>{currentUser.email}</span>
              </div>
              <div className="dropdown-divider" />
              <div className="dropdown-item danger">
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
