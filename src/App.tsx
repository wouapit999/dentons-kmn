import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import "./i18n";
import "./index.css";
import { AppProvider, useApp } from "./context/AppContext";
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

const pageTitles: Record<string, string> = {
  dashboard: "nav.dashboard",
  matters: "nav.matters",
  clients: "nav.clients",
  documents: "nav.documents",
  tasks: "nav.tasks",
  calendar: "nav.calendar",
  time: "nav.timeTracking",
  billing: "nav.billing",
  reports: "nav.reports",
  settings: "nav.settings",
  users: "nav.users",
  audit: "nav.auditLog",
  trust: "trust.title",
};

function AppInner({ onLogout }: { onLogout: () => void }) {
  const { t } = useTranslation();
  const { sidebarOpen, setSidebarOpen } = useApp();
  const [activePage, setActivePage] = useState("dashboard");

  const renderPage = () => {
    switch (activePage) {
      case "dashboard": return <Dashboard onNavigate={setActivePage} />;
      case "matters":   return <Matters />;
      case "clients":   return <Clients />;
      case "documents": return <Documents />;
      case "tasks":     return <Tasks />;
      case "calendar":  return <CalendarPage />;
      case "time":      return <TimeTracking />;
      case "billing":   return <Billing />;
      case "reports":   return <Reports />;
      case "settings":  return <Settings />;
      case "users":     return <Users />;
      case "audit":     return <AuditLog />;
      case "trust":     return <Trust />;
      default:          return <Dashboard onNavigate={setActivePage} />;
    }
  };

  return (
    <div className="app-layout">
      <Sidebar activePage={activePage} onNavigate={setActivePage} collapsed={!sidebarOpen} />
      <div className="main-content">
        <Header
          pageTitle={t(pageTitles[activePage] || "nav.dashboard")}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onLogout={onLogout}
        />
        <div className="page-content">
          {renderPage()}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  if (!isAuthenticated) {
    return <Login onLogin={() => setIsAuthenticated(true)} />;
  }

  return (
    <AppProvider>
      <AppInner onLogout={() => setIsAuthenticated(false)} />
    </AppProvider>
  );
}
