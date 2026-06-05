import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Menu, Bell, LogOut, ChevronDown, Clock, AlertTriangle, X } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { AppNotification } from "../../hooks/useNotifications";

interface HeaderProps {
  pageTitle:        string;
  onToggleSidebar:  () => void;
  onLogout:         () => void;
  appNotifications: AppNotification[];
  onMarkNotifRead:  (id: string) => void;
  onClearNotifs:    () => void;
}

export default function Header({
  pageTitle, onToggleSidebar, onLogout,
  appNotifications, onMarkNotifRead, onClearNotifs,
}: HeaderProps) {
  const { t, i18n } = useTranslation();
  const { currentUser: _cu, session } = useApp();
  const currentUser = _cu || {
    firstName: session?.name?.split(" ")[0]||"U",
    lastName:  session?.name?.split(" ").slice(1).join(" ")||"",
    email:     session?.email||"",
    role:      session?.role||"associate",
  };
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu,      setShowUserMenu]       = useState(false);

  const unread   = appNotifications.filter(n => !n.read).length;
  const initials = currentUser.firstName[0] + (currentUser.lastName?.[0] || "A");

  const notifIcon = (type: string) => {
    if (type === "reminder") return <Clock size={14} color="var(--info)"/>;
    if (type === "overdue")  return <AlertTriangle size={14} color="var(--danger)"/>;
    if (type === "missed")   return <AlertTriangle size={14} color="var(--warning)"/>;
    return <Bell size={14} color="var(--gray-500)"/>;
  };

  return (
    <header className="header">
      <div className="header-left">
        <button className="header-icon-btn" onClick={onToggleSidebar}>
          <Menu size={18}/>
        </button>
        <h1 className="page-title">{pageTitle}</h1>
      </div>

      <div className="header-right">
        {/* Language */}
        <div className="lang-switcher">
          <button className={`lang-btn ${i18n.language==="en"?"active":""}`} onClick={()=>i18n.changeLanguage("en")}>EN</button>
          <button className={`lang-btn ${i18n.language==="fr"?"active":""}`} onClick={()=>i18n.changeLanguage("fr")}>FR</button>
        </div>

        {/* Notifications bell */}
        <div className="dropdown">
          <button className="header-icon-btn" onClick={()=>{setShowNotifications(!showNotifications);setShowUserMenu(false);}}>
            <Bell size={17}/>
            {unread > 0 && <span className="notification-badge">{unread > 9 ? "9+" : unread}</span>}
          </button>

          {showNotifications && (
            <div className="dropdown-menu" style={{width:360, right:0, maxHeight:480, display:"flex", flexDirection:"column"}}>
              {/* Header */}
              <div style={{padding:"13px 16px", borderBottom:"1px solid var(--gray-200)", display:"flex", justifyContent:"space-between", alignItems:"center", flexShrink:0}}>
                <div>
                  <span style={{fontWeight:700, fontSize:14, color:"var(--navy)"}}>{t("notifications.title")}</span>
                  {unread > 0 && <span className="badge badge-red" style={{marginLeft:8, fontSize:10}}>{unread} {i18n.language==="fr"?"non lue(s)":"unread"}</span>}
                </div>
                <div style={{display:"flex", gap:6}}>
                  {appNotifications.length > 0 && (
                    <button className="btn btn-ghost btn-sm" onClick={onClearNotifs} style={{fontSize:11}}>
                      <X size={11}/> {i18n.language==="fr"?"Tout effacer":"Clear all"}
                    </button>
                  )}
                </div>
              </div>

              {/* Notification list */}
              <div style={{overflowY:"auto", flex:1}}>
                {appNotifications.length === 0 ? (
                  <div style={{padding:"28px 16px", textAlign:"center", color:"var(--gray-400)", fontSize:13}}>
                    <Bell size={28} style={{margin:"0 auto 10px", display:"block", opacity:0.3}}/>
                    {t("notifications.noNotifications")}
                  </div>
                ) : (
                  [...appNotifications].reverse().map(n => (
                    <div key={n.id}
                      onClick={() => onMarkNotifRead(n.id)}
                      style={{
                        display:"flex", alignItems:"flex-start", gap:10,
                        padding:"11px 16px",
                        background: n.read ? "white" : "var(--info-bg)",
                        borderBottom:"1px solid var(--gray-100)",
                        cursor:"pointer",
                        transition:"background 0.15s",
                      }}
                    >
                      <div style={{
                        width:30, height:30, borderRadius:"50%", flexShrink:0,
                        background: n.type==="reminder" ? "var(--info-bg)" : n.type==="overdue" ? "var(--danger-bg)" : "var(--warning-bg)",
                        display:"flex", alignItems:"center", justifyContent:"center",
                      }}>
                        {notifIcon(n.type)}
                      </div>
                      <div style={{flex:1, minWidth:0}}>
                        <div style={{fontWeight:600, fontSize:13, color:"var(--navy)"}}>{n.title}</div>
                        <div style={{fontSize:12, color:"var(--gray-600)", marginTop:2, lineHeight:1.4}}>{n.body}</div>
                        <div style={{fontSize:10, color:"var(--gray-400)", marginTop:4}}>
                          {n.at.toLocaleTimeString([], {hour:"2-digit", minute:"2-digit"})} · {n.at.toLocaleDateString()}
                        </div>
                      </div>
                      {!n.read && <div style={{width:8, height:8, borderRadius:"50%", background:"var(--info)", flexShrink:0, marginTop:4}}/>}
                    </div>
                  ))
                )}
              </div>

              {/* Permission prompt */}
              {typeof window !== "undefined" && "Notification" in window && Notification.permission === "default" && (
                <div style={{padding:"10px 16px", borderTop:"1px solid var(--gray-200)", background:"var(--gold-pale)", flexShrink:0}}>
                  <div style={{fontSize:12, color:"var(--gold-dark)", fontWeight:500, marginBottom:6}}>
                    {i18n.language==="fr" ? "Activez les notifications pour recevoir des rappels" : "Enable notifications to receive reminders"}
                  </div>
                  <button className="btn btn-gold btn-sm" style={{fontSize:11}} onClick={()=>{
                    Notification.requestPermission();
                    setShowNotifications(false);
                  }}>
                    <Bell size={12}/>
                    {i18n.language==="fr" ? "Activer les notifications" : "Enable notifications"}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* User menu */}
        <div className="dropdown">
          <div style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer",padding:"4px 8px",borderRadius:"var(--radius)",transition:"background 0.15s"}}
            onClick={()=>{setShowUserMenu(!showUserMenu);setShowNotifications(false);}}
            onMouseEnter={e=>(e.currentTarget.style.background="var(--gray-100)")}
            onMouseLeave={e=>(e.currentTarget.style.background="transparent")}
          >
            <div className="user-avatar">{initials}</div>
            <div className="user-info">
              <div className="user-name">{currentUser.firstName} {currentUser.lastName}</div>
              <div className="user-role">{t(`users.roles.${currentUser.role}`)}</div>
            </div>
            <ChevronDown size={13} color="var(--gray-400)"/>
          </div>
          {showUserMenu && (
            <div className="dropdown-menu">
              <div style={{padding:"10px 16px",borderBottom:"1px solid var(--gray-100)"}}>
                <div style={{fontSize:12,fontWeight:700,color:"var(--navy)"}}>{currentUser.email}</div>
                <div style={{fontSize:11,color:"var(--gray-400)",marginTop:2}}>{t(`users.roles.${currentUser.role}`)}</div>
              </div>
              <div className="dropdown-divider"/>
              <div className="dropdown-item danger" onClick={onLogout}>
                <LogOut size={15}/><span>{t("auth.logout")}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
