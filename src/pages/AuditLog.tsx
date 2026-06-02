import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Search, Shield } from "lucide-react";
import { useApp } from "../context/AppContext";
import { useData } from "../context/DataContext";

export default function AuditLog() {
  const { t } = useTranslation();
  const { users } = useApp();
  const { auditLogs } = useData();
  const [search, setSearch] = useState("");

  const getUser = (id: string) => { const u=users.find(u=>u.id===id); return u?`${u.firstName} ${u.lastName}`:id; };
  const actionColor: Record<string,string> = { create:"badge-green", update:"badge-blue", delete:"badge-red", view:"badge-gray", login:"badge-purple", logout:"badge-gray", export:"badge-yellow", download:"badge-yellow" };

  const filtered = auditLogs.filter(log => {
    const q = search.toLowerCase();
    return !q || log.action.includes(q) || log.entityType.toLowerCase().includes(q) || getUser(log.userId).toLowerCase().includes(q);
  });

  return (
    <div>
      <div className="page-header">
        <div><div className="page-header-title">{t("audit.title")}</div><div className="page-header-subtitle">{filtered.length} {t("common.total").toLowerCase()}</div></div>
        <div style={{ display:"flex", alignItems:"center", gap:8, color:"var(--success)", fontSize:13, fontWeight:600 }}>
          <Shield size={16}/>{t("common.active")}
        </div>
      </div>
      <div className="filters-row">
        <div className="search-box"><Search size={15} className="search-icon"/><input className="form-control" style={{paddingLeft:38}} placeholder={t("common.search")} value={search} onChange={e=>setSearch(e.target.value)}/></div>
      </div>
      <div className="card">
        <div className="table-container">
          <table>
            <thead><tr><th>{t("audit.timestamp")}</th><th>{t("audit.user")}</th><th>{t("audit.action")}</th><th>{t("audit.entity")}</th><th>{t("audit.ipAddress")}</th><th>{t("audit.details")}</th></tr></thead>
            <tbody>
              {filtered.map(log=>(
                <tr key={log.id}>
                  <td style={{fontSize:12,color:"var(--gray-500)",whiteSpace:"nowrap"}}>{log.timestamp.replace("T"," ").slice(0,19)}</td>
                  <td style={{fontWeight:500,fontSize:13}}>{getUser(log.userId)}</td>
                  <td><span className={`badge ${actionColor[log.action]||"badge-gray"}`}>{t(`audit.actions.${log.action}`)}</span></td>
                  <td><span className="badge badge-blue">{log.entityType}</span></td>
                  <td style={{fontSize:12,fontFamily:"monospace",color:"var(--gray-500)"}}>{log.ipAddress}</td>
                  <td style={{fontSize:12,color:"var(--gray-600)",maxWidth:200}}><div className="truncate">{log.details||"—"}</div></td>
                </tr>
              ))}
              {!filtered.length&&<tr><td colSpan={6}><div className="empty-state"><div className="empty-state-text">{t("common.noData")}</div></div></td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}