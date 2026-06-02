import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import "./i18n";
import "./index.css";
import { AppProvider, useApp } from "./context/AppContext";
import { DataProvider } from "./context/DataContext";
import Sidebar from "./components/layout/Sidebar";
import Header from "./components/layout/Header";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Matters from "./pages/Matters";
import Clients from "./pages/Clients";
import Documents from "./pages/Documents";
import Tasks from "./pages/Tasks";
import CalendarPage from "./pages/Calendar";
import TimeTracking from "./pages/TimeTracking";
import Billing from "./pages/Billing";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import Users from "./pages/Users";
import AuditLog from "./pages/AuditLog";
import Trust from "./pages/Trust";
import { getSession } from "./services/authService";
import type { Session } from "./services/authService";
import { getNavItems } from "./services/permissionsService";
import Logo from "./components/ui/Logo";

const pageTitles: Record<string, string> = {
  dashboard:"nav.dashboard", matters:"nav.matters", clients:"nav.clients",
  documents:"nav.documents", tasks:"nav.tasks", calendar:"nav.calendar",
  time:"nav.timeTracking", billing:"nav.billing", reports:"nav.reports",
  settings:"nav.settings", users:"nav.users", audit:"nav.auditLog", trust:"trust.title",
};

// ── Offline / loading screen ──────────────────────────────────────────────
function LoadingScreen({ message }: { message: string }) {
  return (
    <div style={{ minHeight:"100vh", background:"var(--navy)", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:24 }}>
      <Logo size="lg" variant="light" showTagline/>
      <div style={{ color:"rgba(255,255,255,0.6)", fontSize:14 }}>{message}</div>
      <div style={{ width:40, height:40, border:"3px solid rgba(201,168,76,0.3)", borderTopColor:"var(--gold)", borderRadius:"50%", animation:"spin 0.8s linear infinite" }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

// ── Access denied screen ──────────────────────────────────────────────────
function AccessDenied() {
  const { t } = useTranslation();
  return (
    <div style={{ padding:60, textAlign:"center" }}>
      <div style={{ fontSize:48, marginBottom:16 }}>🔒</div>
      <div style={{ fontSize:20, fontWeight:700, color:"var(--navy)" }}>{t("errors.unauthorized")}</div>
      <div style={{ fontSize:13, color:"var(--gray-500)", marginTop:8 }}>Your role does not have permission to access this page.</div>
    </div>
  );
}

// ── Main app inner ────────────────────────────────────────────────────────
function AppInner() {
  const { t } = useTranslation();
  const { sidebarOpen, setSidebarOpen, session, logout } = useApp();
  const [activePage, setActivePage] = useState("dashboard");

  const role = session!.role;
  const allowedPages = getNavItems(role);

  const navigate = (page: string) => {
    if (allowedPages.includes(page)) setActivePage(page);
  };

  const renderPage = () => {
    if (!allowedPages.includes(activePage)) return <AccessDenied/>;
    switch (activePage) {
      case "dashboard": return <Dashboard onNavigate={navigate}/>;
      case "matters":   return <Matters/>;
      case "clients":   return <Clients/>;
      case "documents": return <Documents/>;
      case "tasks":     return <Tasks/>;
      case "calendar":  return <CalendarPage/>;
      case "time":      return <TimeTracking/>;
      case "billing":   return <Billing/>;
      case "reports":   return <Reports/>;
      case "settings":  return <Settings/>;
      case "users":     return role==="admin"||role==="managingPartner" ? <Users/> : <AccessDenied/>;
      case "audit":     return <AuditLog/>;
      case "trust":     return <Trust/>;
      default:          return <Dashboard onNavigate={navigate}/>;
    }
  };

  return (
    <div className="app-layout">
      <Sidebar activePage={activePage} onNavigate={navigate} collapsed={!sidebarOpen} allowedPages={allowedPages}/>
      <div className="main-content">
        <Header
          pageTitle={t(pageTitles[activePage]||"nav.dashboard")}
          onToggleSidebar={()=>setSidebarOpen(!sidebarOpen)}
          onLogout={logout}
        />
        <div className="page-content">{renderPage()}</div>
      </div>
    </div>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────
export default function App() {
  const [session, setSession] = useState<Session | null>(() => getSession());
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Brief check on mount
    const s = getSession();
    setSession(s);
    setChecking(false);
  }, []);

  if (checking) return <LoadingScreen message="Loading Dentons KMN..."/>;

  if (!session) {
    return <Login onLogin={(s) => setSession(s)}/>;
  }

  return (
    <AppProvider session={session}>
      <DataProvider>
        <AppInner/>
      </DataProvider>
    </AppProvider>
  );
}