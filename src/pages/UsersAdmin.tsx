import React, { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  Edit2, UserX, UserCheck, X, Key, CheckCircle, AlertCircle,
  RefreshCw, Eye, EyeOff, Plus, Search, Shield, Mail,
  Clock, Trash2, UserCog, Download
} from "lucide-react";
import { User, UserRole } from "../types";
import { useApp } from "../context/AppContext";
import { doc, updateDoc, setDoc, deleteDoc } from "firebase/firestore";
import { useEffect } from "react";
import { db, COLLECTIONS } from "../config/firebase";
import { changePassword, hashPwd, savePasswordOverride, getLoginActivity, LoginRecord } from "../services/authService";
import { exportToExcel, exportToPDF } from "../utils/exportUtils";

const fmt = (n: number) => n > 0
  ? new Intl.NumberFormat("fr-CM", { style: "currency", currency: "XAF", maximumFractionDigits: 0 }).format(n)
  : "—";

const ROLE_COLORS: Record<string, string> = {
  managingPartner: "badge-gold", partner: "badge-navy", associate: "badge-purple",
  paralegal: "badge-green", finance: "badge-yellow", admin: "badge-red", client: "badge-gray",
};

const ALL_ROLES: UserRole[] = ["managingPartner", "partner", "associate", "paralegal", "finance", "admin"];

const PERMISSIONS: Record<string, string[]> = {
  managingPartner: ["Matters (full)", "Clients (full)", "Documents (full)", "Tasks (full)", "Time (full)", "Billing (full)", "Trust (full)", "Reports (full)", "Users (view)"],
  partner:         ["Matters (full)", "Clients (full)", "Documents (full)", "Tasks (full)", "Time (full)", "Billing (read)", "Reports (view)"],
  associate:       ["Matters (full)", "Clients (full)", "Documents (full)", "Tasks (full)", "Time (full)"],
  paralegal:       ["Matters (view)", "Clients (view)", "Documents (full)", "Tasks (full)", "Time (full)"],
  finance:         ["Time (view)", "Billing (full)", "Trust (full)", "Reports (full)"],
  admin:           ["ALL MODULES", "User Management", "Settings", "Audit Log"],
};

function genPwd(): string {
  const c = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#";
  return Array.from({ length: 10 }, () => c[Math.floor(Math.random() * c.length)]).join("");
}

const Spinner = () => <RefreshCw size={14} style={{ animation: "spin 1s linear infinite" }} />;

export default function UsersAdmin() {
  const { t, i18n } = useTranslation();
  const { users, setUsers, session } = useApp();
  const isAdmin = session?.role === "admin";
  const isFr    = i18n.language === "fr";

  const [search,     setSearch]     = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [activeTab,  setActiveTab]  = useState("list");
  const [editModal,   setEditModal]   = useState<User | null>(null);
  const [pwdModal,    setPwdModal]    = useState<User | null>(null);
  const [deleteModal, setDeleteModal] = useState<User | null>(null);
  const [viewModal,   setViewModal]   = useState<User | null>(null);
  const [addModal,    setAddModal]    = useState(false);
  const [editForm,    setEditForm]    = useState<Partial<User>>({});
  const [newPwd,      setNewPwd]      = useState("");
  const [confirmPwd,  setConfirmPwd]  = useState("");
  const [showPwd,     setShowPwd]     = useState(false);
  const [addForm,     setAddForm]     = useState<Partial<User & { password: string }>>({ role: "associate", active: true, billingRate: 0 });
  const [addErrors,   setAddErrors]   = useState<Record<string, string>>({});
  const [statusMsg,   setStatusMsg]   = useState<{ type: "success" | "error" | "info"; msg: string } | null>(null);
  const [saving,      setSaving]      = useState(false);
  const [loginActivity, setLoginActivity] = useState<LoginRecord[]>([]);

  useEffect(() => {
    if (activeTab === "logins") setLoginActivity(getLoginActivity());
  }, [activeTab]);

  const toast = (type: "success" | "error" | "info", msg: string) => {
    setStatusMsg({ type, msg });
    setTimeout(() => setStatusMsg(null), 6000);
  };

  const filtered = useMemo(() => users.filter(u => {
    const q = search.toLowerCase();
    return (!q || `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(q))
      && (roleFilter === "all" || u.role === roleFilter);
  }), [users, search, roleFilter]);

  const saveEdit = async () => {
    if (!editModal || !editForm.firstName || !editForm.email) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, COLLECTIONS.USERS, editModal.id), {
        firstName: editForm.firstName, lastName: editForm.lastName || "",
        email: editForm.email!.toLowerCase(), role: editForm.role,
        department: editForm.department || "", billingRate: editForm.billingRate || 0,
        active: editForm.active !== false,
      });
      setUsers(prev => prev.map(u => u.id === editModal.id ? { ...u, ...editForm } as User : u));
      toast("success", isFr ? `${editForm.firstName} mis à jour.` : `${editForm.firstName} updated.`);
      setEditModal(null);
    } catch { toast("error", isFr ? "Échec." : "Failed."); }
    setSaving(false);
  };

  const changePwd = async () => {
    if (!pwdModal || !newPwd || newPwd.length < 6) { toast("error", isFr ? "Min. 6 caractères." : "Min. 6 characters."); return; }
    if (newPwd !== confirmPwd) { toast("error", isFr ? "Mots de passe différents." : "Passwords don't match."); return; }
    setSaving(true);
    // changePassword updates BOTH Firestore and localStorage override
    const ok = await changePassword(pwdModal.id, pwdModal.email, newPwd.trim());
    if (ok) {
      toast("success", isFr
        ? `✅ Mot de passe changé pour ${pwdModal.firstName}. Il peut se connecter immédiatement.`
        : `✅ Password changed for ${pwdModal.firstName}. They can log in immediately.`);
      setPwdModal(null); setNewPwd(""); setConfirmPwd("");
    } else {
      toast("error", isFr ? "Échec — vérifiez la connexion Firebase." : "Failed — check Firebase connection.");
    }
    setSaving(false);
  };

  const toggleActive = async (u: User) => {
    if (!isAdmin || u.role === "admin") return;
    const newActive = !u.active;
    try {
      await updateDoc(doc(db, COLLECTIONS.USERS, u.id), { active: newActive });
      setUsers(prev => prev.map(x => x.id === u.id ? { ...x, active: newActive } : x));
      toast("success", `${u.firstName} ${newActive ? (isFr ? "activé(e)" : "activated") : (isFr ? "désactivé(e)" : "deactivated")}.`);
    } catch { toast("error", isFr ? "Échec." : "Failed."); }
  };

  const deleteUser = async () => {
    if (!deleteModal || deleteModal.role === "admin") return;
    setSaving(true);
    try {
      await deleteDoc(doc(db, COLLECTIONS.USERS, deleteModal.id));
      setUsers(prev => prev.filter(u => u.id !== deleteModal.id));
      toast("success", isFr ? `${deleteModal.firstName} supprimé(e).` : `${deleteModal.firstName} deleted.`);
      setDeleteModal(null);
    } catch { toast("error", isFr ? "Échec." : "Failed."); }
    setSaving(false);
  };

  const addUser = async () => {
    const e: Record<string, string> = {};
    if (!addForm.firstName?.trim()) e.firstName = t("errors.required");
    if (!addForm.email?.trim())     e.email      = t("errors.required");
    setAddErrors(e);
    if (Object.keys(e).length) return;
    const pwd   = addForm.password || genPwd();
    const hash  = await hashPwd(pwd);
    const newId = `u${Date.now()}`;
    const nu: User = {
      id: newId, firstName: addForm.firstName!, lastName: addForm.lastName || "",
      email: addForm.email!.toLowerCase(), role: (addForm.role as UserRole) || "associate",
      billingRate: addForm.billingRate || 0, joinDate: new Date().toISOString().split("T")[0],
      active: true, department: addForm.department,
    };
    setSaving(true);
    try {
      await setDoc(doc(db, COLLECTIONS.USERS, newId), { ...nu, passwordHash: hash, forcePasswordChange: true });
      // Save override so new user can log in immediately even before Firestore sync
      savePasswordOverride(nu.email, hash);
      setUsers(prev => [...prev, nu]);
      toast("success", isFr ? `✅ ${nu.firstName} ajouté(e). Mot de passe : ${pwd}` : `✅ ${nu.firstName} added. Password: ${pwd}`);
      setAddModal(false); setAddForm({ role: "associate", active: true, billingRate: 0 });
    } catch { toast("error", isFr ? "Ajout échoué." : "Failed."); }
    setSaving(false);
  };

  const doExport = (type: "pdf" | "excel") => {
    const data = users.map(u => ({
      name: `${u.firstName} ${u.lastName}`, email: u.email,
      role: t(`users.roles.${u.role}`), dept: u.department || "—",
      rate: fmt(u.billingRate), joined: u.joinDate || "—",
      status: u.active ? (isFr ? "Actif" : "Active") : (isFr ? "Inactif" : "Inactive"),
    }));
    const cols = [
      { key: "name",   label: isFr ? "Nom"        : "Name"         },
      { key: "email",  label: "Email"                               },
      { key: "role",   label: isFr ? "Rôle"       : "Role"         },
      { key: "dept",   label: isFr ? "Département": "Department"   },
      { key: "rate",   label: isFr ? "Taux"       : "Billing Rate" },
      { key: "joined", label: isFr ? "Entrée"     : "Joined"       },
      { key: "status", label: isFr ? "Statut"     : "Status"       },
    ];
    if (type === "pdf") exportToPDF(data, cols, "User Directory — Dentons KMN", "DK_Users");
    else exportToExcel(data, cols, "DK_Users", "Users");
  };

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <div className="page-header-title">{t("users.title")}</div>
          <div className="page-header-subtitle">
            {users.filter(u => u.active).length} {isFr ? "actifs" : "active"} · {users.length} total
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {isAdmin && <>
            <button className="btn btn-outline btn-sm" onClick={() => doExport("pdf")}><Download size={14} /> PDF</button>
            <button className="btn btn-outline btn-sm" onClick={() => doExport("excel")}><Download size={14} /> Excel</button>
            <button className="btn btn-gold" onClick={() => { setAddForm({ role: "associate", active: true, billingRate: 0 }); setAddErrors({}); setAddModal(true); }}>
              <Plus size={15} />{t("users.invite")}
            </button>
          </>}
        </div>
      </div>

      {statusMsg && (
        <div className={`alert alert-${statusMsg.type}`} style={{ marginBottom: 20 }}>
          {statusMsg.type === "success" ? <CheckCircle size={16} style={{ flexShrink: 0 }} /> : <AlertCircle size={16} style={{ flexShrink: 0 }} />}
          <span>{statusMsg.msg}</span>
        </div>
      )}

      {!isAdmin && (
        <div className="alert alert-info" style={{ marginBottom: 20 }}>
          <Shield size={15} style={{ flexShrink: 0 }} />
          <span>{isFr ? "Vue lecture seule — contactez l'Administrateur pour modifier." : "Read-only view — contact the Administrator to make changes."}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="tabs">
        {[
          ["list",   isFr ? "👥 Utilisateurs" : "👥 Users"],
          ["roles",  isFr ? "🔐 Rôles & Permissions" : "🔐 Roles & Permissions"],
          ...(isAdmin ? [["logins", isFr ? "📋 Connexions" : "📋 Login Activity"]] : []),
        ].map(([k, l]) => (
          <button key={k} className={`tab-btn ${activeTab === k ? "active" : ""}`} onClick={() => setActiveTab(k)}>{l}</button>
        ))}
      </div>

      {/* ── USER LIST ── */}
      {activeTab === "list" && (
        <div>
          <div className="filters-row">
            <div className="search-box">
              <Search size={15} className="search-icon" />
              <input className="form-control" style={{ paddingLeft: 38 }} placeholder={t("common.search")} value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select className="filter-select" value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
              <option value="all">{t("common.all")}</option>
              {ALL_ROLES.map(r => <option key={r} value={r}>{t(`users.roles.${r}`)}</option>)}
            </select>
          </div>

          {/* Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(340px,1fr))", gap: 16, marginBottom: 20 }}>
            {filtered.map(u => (
              <div key={u.id} className="card" style={{ padding: 20, opacity: u.active ? 1 : 0.6 }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                  <div style={{ width: 50, height: 50, borderRadius: "50%", flexShrink: 0, background: u.active ? "var(--navy)" : "var(--gray-400)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 700, border: u.active ? "3px solid var(--gold)" : "3px solid var(--gray-300)" }}>
                    {u.firstName[0]}{u.lastName?.[0] || ""}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span style={{ fontWeight: 700, fontSize: 14, color: "var(--navy)" }}>{u.firstName} {u.lastName}</span>
                      <span className={`badge ${ROLE_COLORS[u.role] || "badge-gray"}`} style={{ fontSize: 10 }}>{t(`users.roles.${u.role}`)}</span>
                      {!u.active && <span className="badge badge-red" style={{ fontSize: 10 }}>{isFr ? "Inactif" : "Inactive"}</span>}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--gray-500)", marginTop: 3 }}>{u.email}</div>
                    <div style={{ display: "flex", gap: 10, marginTop: 5, fontSize: 11, color: "var(--gray-400)", flexWrap: "wrap" }}>
                      {u.department && <span>🏢 {u.department}</span>}
                      {u.billingRate > 0 && <span>⏱ {fmt(u.billingRate)}/h</span>}
                      {u.joinDate && <span>📅 {u.joinDate}</span>}
                    </div>
                  </div>
                </div>
                {isAdmin && (
                  <div style={{ display: "flex", gap: 6, marginTop: 14, paddingTop: 12, borderTop: "1px solid var(--gray-100)", flexWrap: "wrap" }}>
                    <button className="btn btn-outline btn-sm" onClick={() => setViewModal(u)}><Eye size={13} />{isFr ? "Profil" : "Profile"}</button>
                    <button className="btn btn-outline btn-sm" onClick={() => { setEditModal(u); setEditForm({ ...u }); }}><Edit2 size={13} />{isFr ? "Modifier" : "Edit"}</button>
                    <button className="btn btn-outline btn-sm" onClick={() => { setPwdModal(u); setNewPwd(""); setConfirmPwd(""); }}><Key size={13} />{isFr ? "MDP" : "Password"}</button>
                    {u.role !== "admin" && <>
                      <button className={`btn btn-sm ${u.active ? "btn-outline" : "btn-success"}`} onClick={() => toggleActive(u)}>
                        {u.active ? <UserX size={13} /> : <UserCheck size={13} />}
                        {u.active ? (isFr ? "Désactiver" : "Deactivate") : (isFr ? "Activer" : "Activate")}
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => setDeleteModal(u)}><Trash2 size={13} />{isFr ? "Supprimer" : "Delete"}</button>
                    </>}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Table */}
          <div className="card">
            <div className="card-header"><span className="card-title">{isFr ? "Tableau récapitulatif" : "Summary Table"}</span></div>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>{t("common.name")}</th><th>{t("common.email")}</th><th>{t("users.role")}</th>
                    <th>{t("users.department")}</th><th style={{ textAlign: "right" }}>{t("users.billingRate")}</th>
                    <th>{t("users.joinDate")}</th><th>{t("users.lastLogin")}</th><th>{t("common.status")}</th>
                    {isAdmin && <th>{t("common.actions")}</th>}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(u => (
                    <tr key={u.id} style={{ opacity: u.active ? 1 : 0.55 }}>
                      <td><div style={{ display: "flex", alignItems: "center", gap: 10 }}><div className="user-avatar" style={{ width: 32, height: 32, fontSize: 12 }}>{u.firstName[0]}{u.lastName?.[0] || ""}</div><div style={{ fontWeight: 600, color: "var(--navy)" }}>{u.firstName} {u.lastName}</div></div></td>
                      <td style={{ fontSize: 12, color: "var(--gray-600)" }}>{u.email}</td>
                      <td><span className={`badge ${ROLE_COLORS[u.role] || "badge-gray"}`}>{t(`users.roles.${u.role}`)}</span></td>
                      <td style={{ fontSize: 12 }}>{u.department || "—"}</td>
                      <td style={{ textAlign: "right", fontSize: 12, fontWeight: 500 }}>{fmt(u.billingRate)}{u.billingRate > 0 ? "/h" : ""}</td>
                      <td style={{ fontSize: 12, color: "var(--gray-500)" }}>{u.joinDate || "—"}</td>
                      <td style={{ fontSize: 12, color: "var(--gray-500)" }}>{typeof u.lastLogin === "string" ? u.lastLogin.split("T")[0] : "—"}</td>
                      <td><span className={`badge ${u.active ? "badge-green" : "badge-gray"}`}>{u.active ? t("common.active") : t("common.inactive")}</span></td>
                      {isAdmin && <td><div style={{ display: "flex", gap: 4 }}>
                        <button className="btn btn-ghost btn-sm btn-icon" onClick={() => { setEditModal(u); setEditForm({ ...u }); }}><Edit2 size={13} /></button>
                        <button className="btn btn-ghost btn-sm btn-icon" onClick={() => { setPwdModal(u); setNewPwd(""); setConfirmPwd(""); }}><Key size={13} /></button>
                        {u.role !== "admin" && <>
                          <button className="btn btn-ghost btn-sm btn-icon" onClick={() => toggleActive(u)}>{u.active ? <UserX size={13} /> : <UserCheck size={13} />}</button>
                          <button className="btn btn-ghost btn-sm btn-icon" style={{ color: "var(--danger)" }} onClick={() => setDeleteModal(u)}><Trash2 size={13} /></button>
                        </>}
                      </div></td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── ROLES & PERMISSIONS ── */}
      {activeTab === "roles" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(320px,1fr))", gap: 16 }}>
          {ALL_ROLES.map(role => {
            const members = users.filter(u => u.role === role && u.active);
            return (
              <div key={role} className="card" style={{ padding: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                  <span className={`badge ${ROLE_COLORS[role]}`} style={{ fontSize: 13, padding: "4px 14px" }}>{t(`users.roles.${role}`)}</span>
                  <span style={{ marginLeft: "auto", fontSize: 12, color: "var(--gray-500)", fontWeight: 500 }}>{members.length} {isFr ? "membre(s)" : "member(s)"}</span>
                </div>
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "var(--gray-400)", letterSpacing: "0.06em", marginBottom: 6 }}>{isFr ? "Accès" : "Access"}</div>
                  {(PERMISSIONS[role] || []).map(p => (
                    <div key={p} style={{ display: "flex", alignItems: "center", gap: 6, padding: "3px 0", fontSize: 12, color: "var(--gray-700)" }}>
                      <CheckCircle size={12} color="var(--success)" /> {p}
                    </div>
                  ))}
                </div>
                {members.length > 0 && (
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "var(--gray-400)", letterSpacing: "0.06em", marginBottom: 6 }}>{isFr ? "Membres" : "Members"}</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                      {members.map(u => (
                        <div key={u.id} style={{ display: "flex", alignItems: "center", gap: 5, background: "var(--gray-50)", border: "1px solid var(--gray-200)", borderRadius: 20, padding: "3px 10px", fontSize: 12 }}>
                          <div style={{ width: 18, height: 18, borderRadius: "50%", background: "var(--navy)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, fontWeight: 700 }}>{u.firstName[0]}{u.lastName?.[0] || ""}</div>
                          {u.firstName}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── LOGIN ACTIVITY ── */}
      {activeTab === "logins" && isAdmin && (
        <div>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-header">
              <span className="card-title">{isFr ? "Historique des Connexions (temps réel)" : "Live Login History"}</span>
              <span style={{ fontSize: 12, color: "var(--gray-500)" }}>{loginActivity.length} {isFr ? "connexions enregistrées" : "recorded logins"}</span>
            </div>
            <div className="table-container">
              <table>
                <thead><tr><th>{t("common.name")}</th><th>{t("common.email")}</th><th>{isFr?"Date":"Date"}</th><th>{isFr?"Heure":"Time"}</th></tr></thead>
                <tbody>
                  {loginActivity.length === 0
                    ? <tr><td colSpan={4}><div className="empty-state"><div className="empty-state-text">{isFr?"Aucune connexion enregistrée encore":"No logins recorded yet — logins are tracked after this fix is deployed"}</div></div></td></tr>
                    : loginActivity.map((rec, i) => (
                      <tr key={i}>
                        <td style={{ fontWeight: 500 }}>{rec.name}</td>
                        <td style={{ fontSize: 12, color: "var(--gray-600)" }}>{rec.email}</td>
                        <td style={{ fontSize: 12 }}><div style={{ display:"flex", alignItems:"center", gap:5 }}><Clock size={12} color="var(--success)"/>{rec.at.split("T")[0]}</div></td>
                        <td style={{ fontSize: 12, color: "var(--gray-500)" }}>{rec.at.split("T")[1]?.slice(0,5)}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Also show last known login per user */}
          <div className="card">
            <div className="card-header"><span className="card-title">{isFr?"Dernière connexion par utilisateur":"Last Login per User"}</span></div>
            <div className="table-container">
              <table>
                <thead><tr><th>{t("common.name")}</th><th>{t("common.email")}</th><th>{t("users.role")}</th><th>{t("users.lastLogin")}</th><th>{t("common.status")}</th></tr></thead>
                <tbody>
                  {[...users].sort((a,b)=>{const al=typeof a.lastLogin==="string"?a.lastLogin:"";const bl=typeof b.lastLogin==="string"?b.lastLogin:"";return bl.localeCompare(al);}).map(u=>(
                    <tr key={u.id}>
                      <td style={{fontWeight:500}}>{u.firstName} {u.lastName}</td>
                      <td style={{fontSize:12,color:"var(--gray-600)"}}>{u.email}</td>
                      <td><span className={`badge ${ROLE_COLORS[u.role]||"badge-gray"}`}>{t(`users.roles.${u.role}`)}</span></td>
                      <td style={{fontSize:12}}>
                        {typeof u.lastLogin==="string"
                          ?<div style={{display:"flex",alignItems:"center",gap:5}}><Clock size={12} color="var(--success)"/>{u.lastLogin.split("T")[0]}</div>
                          :<span style={{color:"var(--gray-400)",fontStyle:"italic"}}>{isFr?"Jamais":"Never"}</span>}
                      </td>
                      <td><span className={`badge ${u.active?"badge-green":"badge-gray"}`}>{u.active?t("common.active"):t("common.inactive")}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ══ MODALS ══ */}

      {/* VIEW */}
      {viewModal && (
        <div className="modal-overlay" onClick={() => setViewModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">{isFr ? "Profil" : "Profile"} — {viewModal.firstName} {viewModal.lastName}</span>
              <button className="btn btn-ghost btn-icon" onClick={() => setViewModal(null)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 24, padding: 20, background: "var(--gray-50)", borderRadius: 12 }}>
                <div style={{ width: 64, height: 64, borderRadius: "50%", background: "var(--navy)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 700, border: "3px solid var(--gold)", flexShrink: 0 }}>
                  {viewModal.firstName[0]}{viewModal.lastName?.[0] || ""}
                </div>
                <div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: "var(--navy)", fontFamily: "Playfair Display,serif" }}>{viewModal.firstName} {viewModal.lastName}</div>
                  <div style={{ marginTop: 4, display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <span className={`badge ${ROLE_COLORS[viewModal.role] || "badge-gray"}`}>{t(`users.roles.${viewModal.role}`)}</span>
                    <span className={`badge ${viewModal.active ? "badge-green" : "badge-gray"}`}>{viewModal.active ? t("common.active") : t("common.inactive")}</span>
                  </div>
                </div>
              </div>
              {[["Email", viewModal.email], [isFr ? "Département" : "Department", viewModal.department || "—"], [isFr ? "Taux horaire" : "Billing Rate", viewModal.billingRate > 0 ? `${fmt(viewModal.billingRate)}/h` : "—"], [isFr ? "Date d'entrée" : "Join Date", viewModal.joinDate || "—"], [isFr ? "Dernière connexion" : "Last Login", typeof viewModal.lastLogin === "string" ? viewModal.lastLogin.split("T")[0] : "—"]].map(([l, v]) => (
                <div key={l} style={{ display: "flex", gap: 12, padding: "8px 0", borderBottom: "1px solid var(--gray-100)" }}>
                  <div style={{ width: 150, fontSize: 12, color: "var(--gray-500)", fontWeight: 600 }}>{l}</div>
                  <div style={{ fontSize: 13 }}>{v}</div>
                </div>
              ))}
              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: 12, color: "var(--gray-500)", fontWeight: 600, marginBottom: 8 }}>{isFr ? "Permissions" : "Access"}</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {(PERMISSIONS[viewModal.role] || []).map(p => (
                    <span key={p} style={{ background: "var(--success-bg)", color: "var(--success)", borderRadius: 4, padding: "3px 8px", fontSize: 11, fontWeight: 600 }}>✓ {p}</span>
                  ))}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              {isAdmin && <button className="btn btn-outline" onClick={() => { setViewModal(null); setEditModal(viewModal); setEditForm({ ...viewModal }); }}><Edit2 size={14} />{t("common.edit")}</button>}
              <button className="btn btn-gold" onClick={() => setViewModal(null)}>{t("common.close")}</button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT */}
      {editModal && (
        <div className="modal-overlay" onClick={() => setEditModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title"><UserCog size={18} style={{ marginRight: 8 }} />{t("users.editUser")} — {editModal.firstName}</span>
              <button className="btn btn-ghost btn-icon" onClick={() => setEditModal(null)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label required">{t("users.firstName")}</label>
                  <input className="form-control" value={editForm.firstName || ""} onChange={e => setEditForm(f => ({ ...f, firstName: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">{t("users.lastName")}</label>
                  <input className="form-control" value={editForm.lastName || ""} onChange={e => setEditForm(f => ({ ...f, lastName: e.target.value }))} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label required">{t("common.email")}</label>
                <input className="form-control" type="email" value={editForm.email || ""} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">{t("users.role")}</label>
                  <select className="form-control" value={editForm.role || "associate"} onChange={e => setEditForm(f => ({ ...f, role: e.target.value as UserRole }))}>
                    {ALL_ROLES.map(r => <option key={r} value={r}>{t(`users.roles.${r}`)}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">{t("users.department")}</label>
                  <input className="form-control" value={editForm.department || ""} onChange={e => setEditForm(f => ({ ...f, department: e.target.value }))} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">{t("users.billingRate")} (FCFA/h)</label>
                  <input className="form-control" type="number" value={editForm.billingRate || 0} onChange={e => setEditForm(f => ({ ...f, billingRate: parseInt(e.target.value) || 0 }))} />
                </div>
                <div className="form-group" style={{ display: "flex", alignItems: "flex-end", paddingBottom: 4 }}>
                  <label className="checkbox-label">
                    <input type="checkbox" checked={editForm.active !== false} onChange={e => setEditForm(f => ({ ...f, active: e.target.checked }))} />
                    {isFr ? "Compte actif" : "Active account"}
                  </label>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setEditModal(null)}>{t("common.cancel")}</button>
              <button className="btn btn-gold" onClick={saveEdit} disabled={saving}>
                {saving ? <><Spinner /> {isFr ? "Enregistrement..." : "Saving..."}</> : <><CheckCircle size={14} />{t("common.save")}</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CHANGE PASSWORD */}
      {pwdModal && (
        <div className="modal-overlay" onClick={() => setPwdModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title"><Key size={18} style={{ marginRight: 8 }} />{isFr ? "Changer le Mot de Passe" : "Change Password"} — {pwdModal.firstName}</span>
              <button className="btn btn-ghost btn-icon" onClick={() => setPwdModal(null)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <div className="alert alert-gold" style={{ marginBottom: 20 }}>
                <Shield size={15} style={{ flexShrink: 0 }} />
                <span>{isFr ? "Seul l'Administrateur peut modifier les mots de passe." : "Only the Administrator can change user passwords."}</span>
              </div>
              <div style={{ marginBottom: 16 }}>
                <button className="btn btn-outline btn-sm" onClick={() => { const p = genPwd(); setNewPwd(p); setConfirmPwd(p); }}>
                  🎲 {isFr ? "Générer un mot de passe aléatoire" : "Generate random password"}
                </button>
              </div>
              <div className="form-group">
                <label className="form-label required">{isFr ? "Nouveau Mot de Passe" : "New Password"}</label>
                <div style={{ position: "relative" }}>
                  <input className="form-control" style={{ paddingRight: 44 }} type={showPwd ? "text" : "password"} value={newPwd} onChange={e => setNewPwd(e.target.value)} />
                  <button onClick={() => setShowPwd(!showPwd)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--gray-400)", padding: 0 }}>
                    {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label required">{isFr ? "Confirmer" : "Confirm"}</label>
                <input className="form-control" type={showPwd ? "text" : "password"} value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)} />
                {confirmPwd && newPwd !== confirmPwd && <div className="form-error">{isFr ? "Mots de passe différents" : "Passwords don't match"}</div>}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setPwdModal(null)}>{t("common.cancel")}</button>
              <button className="btn btn-gold" onClick={changePwd} disabled={saving || !newPwd || newPwd !== confirmPwd}>
                {saving ? <><Spinner /> {isFr ? "Enregistrement..." : "Saving..."}</> : <><Key size={14} />{isFr ? "Changer" : "Change Password"}</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE */}
      {deleteModal && (
        <div className="modal-overlay" onClick={() => setDeleteModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title" style={{ color: "var(--danger)" }}><Trash2 size={18} style={{ marginRight: 8 }} />{isFr ? "Supprimer l'Utilisateur" : "Delete User"}</span>
              <button className="btn btn-ghost btn-icon" onClick={() => setDeleteModal(null)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <div className="alert alert-danger" style={{ marginBottom: 20 }}>
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <span>{isFr ? "Action irréversible. L'utilisateur perdra tout accès immédiatement." : "Irreversible action. The user loses all access immediately."}</span>
              </div>
              <div style={{ textAlign: "center", padding: "16px 0" }}>
                <div className="user-avatar" style={{ width: 60, height: 60, fontSize: 22, margin: "0 auto 12px" }}>{deleteModal.firstName[0]}{deleteModal.lastName?.[0] || ""}</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "var(--navy)" }}>{deleteModal.firstName} {deleteModal.lastName}</div>
                <div style={{ fontSize: 13, color: "var(--gray-500)", marginTop: 4 }}>{deleteModal.email}</div>
                <span className={`badge ${ROLE_COLORS[deleteModal.role] || "badge-gray"}`} style={{ marginTop: 8, display: "inline-block" }}>{t(`users.roles.${deleteModal.role}`)}</span>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setDeleteModal(null)}>{t("common.cancel")}</button>
              <button className="btn btn-danger" onClick={deleteUser} disabled={saving}>
                {saving ? <><Spinner /> {isFr ? "Suppression..." : "Deleting..."}</> : <><Trash2 size={14} />{isFr ? "Supprimer définitivement" : "Delete Permanently"}</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD USER */}
      {addModal && (
        <div className="modal-overlay" onClick={() => setAddModal(false)}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title"><Plus size={18} style={{ marginRight: 8 }} />{isFr ? "Ajouter un Utilisateur" : "Add New User"}</span>
              <button className="btn btn-ghost btn-icon" onClick={() => setAddModal(false)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <div className="alert alert-info" style={{ marginBottom: 20 }}>
                <Mail size={15} style={{ flexShrink: 0 }} />
                <span>{isFr ? "Un mot de passe temporaire sera généré. Notez-le et transmettez-le à l'utilisateur." : "A temporary password will be generated. Note it and share with the user."}</span>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label required">{t("users.firstName")}</label>
                  <input className="form-control" value={addForm.firstName || ""} onChange={e => setAddForm(f => ({ ...f, firstName: e.target.value }))} placeholder="Jean" />
                  {addErrors.firstName && <div className="form-error">{addErrors.firstName}</div>}
                </div>
                <div className="form-group">
                  <label className="form-label">{t("users.lastName")}</label>
                  <input className="form-control" value={addForm.lastName || ""} onChange={e => setAddForm(f => ({ ...f, lastName: e.target.value }))} placeholder="Dupont" />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label required">{t("common.email")}</label>
                <input className="form-control" type="email" value={addForm.email || ""} onChange={e => setAddForm(f => ({ ...f, email: e.target.value }))} placeholder="user@dentons.com" />
                {addErrors.email && <div className="form-error">{addErrors.email}</div>}
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">{t("users.role")}</label>
                  <select className="form-control" value={addForm.role || "associate"} onChange={e => setAddForm(f => ({ ...f, role: e.target.value as UserRole }))}>
                    {ALL_ROLES.map(r => <option key={r} value={r}>{t(`users.roles.${r}`)}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">{t("users.department")}</label>
                  <input className="form-control" value={addForm.department || ""} onChange={e => setAddForm(f => ({ ...f, department: e.target.value }))} placeholder="Corporate, Litigation..." />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">{t("users.billingRate")} (FCFA/h)</label>
                  <input className="form-control" type="number" value={addForm.billingRate || ""} onChange={e => setAddForm(f => ({ ...f, billingRate: parseInt(e.target.value) || 0 }))} placeholder="45000" />
                </div>
                <div className="form-group">
                  <label className="form-label">{isFr ? "Mot de passe (optionnel)" : "Password (optional)"}</label>
                  <input className="form-control" type="text" value={addForm.password || ""} onChange={e => setAddForm(f => ({ ...f, password: e.target.value }))} placeholder={isFr ? "Laisser vide = auto-généré" : "Leave blank = auto-generated"} />
                  <div className="form-hint">{isFr ? "Si vide, un mot de passe aléatoire sera créé et affiché." : "If blank, a random password will be created and shown."}</div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setAddModal(false)}>{t("common.cancel")}</button>
              <button className="btn btn-gold" onClick={addUser} disabled={saving || !addForm.firstName || !addForm.email}>
                {saving ? <><Spinner /> {isFr ? "Ajout..." : "Adding..."}</> : <><Plus size={15} />{isFr ? "Ajouter l'Utilisateur" : "Add User"}</>}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
