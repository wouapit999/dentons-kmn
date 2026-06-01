import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Edit2, UserX, X, Mail } from "lucide-react";
import { mockUsers } from "../data/mockData";
import { User, UserRole } from "../types";

const fmt = (n: number) => n > 0 ? new Intl.NumberFormat("fr-CM", { style: "currency", currency: "XAF", maximumFractionDigits: 0 }).format(n) : "—";

const roleColor: Record<string, string> = {
  managingPartner: "badge-gold", partner: "badge-blue", associate: "badge-purple",
  paralegal: "badge-green", finance: "badge-yellow", admin: "badge-red", client: "badge-gray"
};

export default function Users() {
  const { t } = useTranslation();
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [form, setForm] = useState<Partial<User>>({ role: "associate", active: true, billingRate: 0 });

  const handleSubmit = () => {
    if (!form.firstName || !form.email) return;
    if (editing) {
      setUsers(prev => prev.map(u => u.id === editing.id ? { ...u, ...form } as User : u));
    } else {
      setUsers(prev => [...prev, {
        id: `u${Date.now()}`, firstName: form.firstName!, lastName: form.lastName || "",
        email: form.email!, role: form.role as UserRole || "associate",
        billingRate: form.billingRate || 0, joinDate: new Date().toISOString().split("T")[0],
        active: true, department: form.department,
      }]);
    }
    setShowModal(false);
    setEditing(null);
    setForm({ role: "associate", active: true, billingRate: 0 });
  };

  const toggleActive = (id: string) => setUsers(prev => prev.map(u => u.id === id ? { ...u, active: !u.active } : u));
  const openEdit = (u: User) => { setEditing(u); setForm(u); setShowModal(true); };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-header-title">{t("users.title")}</div>
          <div className="page-header-subtitle">{users.filter(u => u.active).length} {t("common.active").toLowerCase()}</div>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditing(null); setForm({ role: "associate", active: true, billingRate: 0 }); setShowModal(true); }}>
          <Plus size={15} />{t("users.invite")}
        </button>
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>{t("common.name")}</th>
                <th>{t("common.email")}</th>
                <th>{t("users.role")}</th>
                <th>{t("users.department")}</th>
                <th>{t("users.billingRate")}</th>
                <th>{t("users.joinDate")}</th>
                <th>{t("users.lastLogin")}</th>
                <th>{t("common.status")}</th>
                <th>{t("common.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} style={{ opacity: u.active ? 1 : 0.5 }}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div className="user-avatar" style={{ width: 34, height: 34, fontSize: 12 }}>{u.firstName[0]}{u.lastName[0]}</div>
                      <div>
                        <div style={{ fontWeight: 500 }}>{u.firstName} {u.lastName}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ fontSize: 13 }}>{u.email}</td>
                  <td><span className={`badge ${roleColor[u.role]}`}>{t(`users.roles.${u.role}`)}</span></td>
                  <td style={{ fontSize: 13 }}>{u.department || "—"}</td>
                  <td style={{ fontSize: 13 }}>{fmt(u.billingRate)}</td>
                  <td style={{ fontSize: 12, color: "var(--gray-500)" }}>{u.joinDate}</td>
                  <td style={{ fontSize: 12, color: "var(--gray-500)" }}>{u.lastLogin?.split("T")[0] || "—"}</td>
                  <td><span className={`badge ${u.active ? "badge-green" : "badge-gray"}`}>{u.active ? t("common.active") : t("common.inactive")}</span></td>
                  <td>
                    <div style={{ display: "flex", gap: 4 }}>
                      <button className="btn btn-ghost btn-sm btn-icon" onClick={() => openEdit(u)}><Edit2 size={14} /></button>
                      <button className="btn btn-ghost btn-sm btn-icon" title={t("users.deactivate")} onClick={() => toggleActive(u.id)}>
                        <UserX size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Role permissions matrix */}
      <div className="card" style={{ marginTop: 20 }}>
        <div className="card-header"><span className="card-title">{t("users.permissions")}</span></div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Module</th>
                {["managingPartner","partner","associate","paralegal","finance","admin"].map(r => (
                  <th key={r} style={{ textAlign: "center" }}><span className={`badge ${roleColor[r]}`} style={{ fontSize: 10 }}>{t(`users.roles.${r}`).split(" ")[0]}</span></th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ["Dossiers", ["✓","✓","✓","◐","✗","✓"]],
                ["Clients", ["✓","✓","✓","◐","✗","✓"]],
                ["Documents", ["✓","✓","✓","✓","✗","✓"]],
                ["Tâches", ["✓","✓","✓","✓","✗","✓"]],
                ["Temps", ["✓","✓","✓","✓","✓","✓"]],
                ["Facturation", ["✓","✓","✗","✗","✓","✓"]],
                ["Comptes séquestres", ["✓","◐","✗","✗","✓","✓"]],
                ["Rapports", ["✓","✓","◐","✗","✓","✓"]],
                ["Utilisateurs", ["✓","✗","✗","✗","✗","✓"]],
                ["Paramètres", ["✓","✗","✗","✗","✗","✓"]],
              ].map(([module, perms]) => (
                <tr key={module as string}>
                  <td style={{ fontWeight: 500, fontSize: 13 }}>{module}</td>
                  {(perms as string[]).map((p, i) => (
                    <td key={i} style={{ textAlign: "center", fontSize: 15, color: p === "✓" ? "var(--success)" : p === "◐" ? "var(--warning)" : "var(--gray-300)" }}>{p}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ padding: "12px 16px", fontSize: 11, color: "var(--gray-400)", borderTop: "1px solid var(--gray-100)" }}>
            ✓ Accès complet &nbsp;·&nbsp; ◐ Accès partiel &nbsp;·&nbsp; ✗ Pas d'accès
          </div>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">{editing ? t("users.editUser") : t("users.invite")}</span>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label required">{t("users.firstName")}</label>
                  <input className="form-control" value={form.firstName || ""} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">{t("users.lastName")}</label>
                  <input className="form-control" value={form.lastName || ""} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label required">{t("common.email")}</label>
                <input className="form-control" type="email" value={form.email || ""} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">{t("users.role")}</label>
                  <select className="form-control" value={form.role || "associate"} onChange={e => setForm(f => ({ ...f, role: e.target.value as UserRole }))}>
                    {["managingPartner","partner","associate","paralegal","finance","admin"].map(r => (
                      <option key={r} value={r}>{t(`users.roles.${r}`)}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">{t("users.department")}</label>
                  <input className="form-control" value={form.department || ""} onChange={e => setForm(f => ({ ...f, department: e.target.value }))} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">{t("users.billingRate")} (FCFA/h)</label>
                <input className="form-control" type="number" value={form.billingRate || ""} onChange={e => setForm(f => ({ ...f, billingRate: parseInt(e.target.value) || 0 }))} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowModal(false)}>{t("common.cancel")}</button>
              <button className="btn btn-primary" onClick={handleSubmit}>
                {editing ? t("common.save") : <><Mail size={15} />{t("users.invite")}</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
