import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Edit2, UserX, X, Mail, CheckCircle, AlertCircle } from "lucide-react";
import { User, UserRole } from "../types";
import { useApp } from "../context/AppContext";
import EMAILJS_CONFIG from "../config/emailjs";

const fmt = (n: number) => n > 0 ? new Intl.NumberFormat("fr-CM", { style: "currency", currency: "XAF", maximumFractionDigits: 0 }).format(n) : "—";

const roleColor: Record<string, string> = {
  managingPartner: "badge-gold",
  partner: "badge-navy",
  associate: "badge-purple",
  paralegal: "badge-green",
  finance: "badge-yellow",
  admin: "badge-red",
  client: "badge-gray",
};

async function sendInvitationEmail(user: Partial<User>, tempPassword: string): Promise<boolean> {
  try {
    const { send } = await import("emailjs-com");
    await send(
      EMAILJS_CONFIG.serviceId,
      EMAILJS_CONFIG.inviteTemplateId,
      {
        to_email: user.email,
        to_name: `${user.firstName} ${user.lastName}`,
        role: user.role,
        firm_name: "Dentons KMN",
        temp_password: tempPassword,
        login_url: window.location.origin,
        website: "dentons.com/en/global-presence/africa/cameroon/douala",
        invited_by: "Administrator",
      },
      EMAILJS_CONFIG.publicKey
    );
    return true;
  } catch {
    return false;
  }
}

function generateTempPassword(): string {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#";
  return Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

export default function Users() {
  const { t } = useTranslation();
  const { users, setUsers } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [form, setForm] = useState<Partial<User>>({ role: "associate", active: true, billingRate: 0 });
  const [inviteStatus, setInviteStatus] = useState<{ type: "success" | "error" | "sending"; msg: string } | null>(null);

  const handleSubmit = async () => {
    if (!form.firstName || !form.email) return;

    if (editing) {
      setUsers(prev => prev.map(u => u.id === editing.id ? { ...u, ...form } as User : u));
      setShowModal(false);
      setEditing(null);
      setForm({ role: "associate", active: true, billingRate: 0 });
      return;
    }

    const tempPassword = generateTempPassword();
    const newUser: User = {
      id: `u${Date.now()}`,
      firstName: form.firstName!,
      lastName: form.lastName || "",
      email: form.email!,
      role: form.role as UserRole || "associate",
      billingRate: form.billingRate || 0,
      joinDate: new Date().toISOString().split("T")[0],
      active: true,
      department: form.department,
    };

    setUsers(prev => [...prev, newUser]);
    setShowModal(false);

    // Send invitation email
    setInviteStatus({ type: "sending", msg: `Sending invitation to ${form.email}...` });
    const sent = await sendInvitationEmail(form, tempPassword);

    if (sent) {
      setInviteStatus({ type: "success", msg: `Invitation sent to ${form.email} with temporary credentials.` });
    } else {
      setInviteStatus({
        type: "error",
        msg: `User created. Email not sent (EmailJS not configured). Share these credentials manually — Temp password: ${tempPassword}`,
      });
    }
    setTimeout(() => setInviteStatus(null), 8000);
    setForm({ role: "associate", active: true, billingRate: 0 });
    setEditing(null);
  };

  const toggleActive = (id: string) => setUsers(prev => prev.map(u => u.id === id ? { ...u, active: !u.active } : u));
  const openEdit = (u: User) => { setEditing(u); setForm(u); setShowModal(true); };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-header-title">{t("users.title")}</div>
          <div className="page-header-subtitle">{users.filter(u => u.active).length} {t("common.active").toLowerCase()} · {users.length} total</div>
        </div>
        <button className="btn btn-gold" onClick={() => { setEditing(null); setForm({ role: "associate", active: true, billingRate: 0 }); setShowModal(true); }}>
          <Mail size={15} />{t("users.invite")}
        </button>
      </div>

      {/* Invite status alert */}
      {inviteStatus && (
        <div className={`alert alert-${inviteStatus.type === "success" ? "success" : inviteStatus.type === "error" ? "danger" : "info"}`} style={{ marginBottom: 20 }}>
          {inviteStatus.type === "success" ? <CheckCircle size={16} style={{ flexShrink: 0 }} /> : <AlertCircle size={16} style={{ flexShrink: 0 }} />}
          <span>{inviteStatus.msg}</span>
        </div>
      )}

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
                <th>{t("common.status")}</th>
                <th>{t("common.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} style={{ opacity: u.active ? 1 : 0.5 }}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div className="user-avatar" style={{ width: 36, height: 36, fontSize: 13 }}>
                        {u.firstName[0]}{u.lastName?.[0] || ""}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: "var(--navy)" }}>{u.firstName} {u.lastName}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ fontSize: 13, color: "var(--gray-600)" }}>{u.email}</td>
                  <td><span className={`badge ${roleColor[u.role]}`}>{t(`users.roles.${u.role}`)}</span></td>
                  <td style={{ fontSize: 13 }}>{u.department || "—"}</td>
                  <td style={{ fontSize: 13, fontWeight: 500 }}>{fmt(u.billingRate)}{u.billingRate > 0 ? "/h" : ""}</td>
                  <td style={{ fontSize: 12, color: "var(--gray-500)" }}>{u.joinDate}</td>
                  <td>
                    <span className={`badge ${u.active ? "badge-green" : "badge-gray"}`}>
                      {u.active ? t("common.active") : t("common.inactive")}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button className="btn btn-outline btn-sm btn-icon" onClick={() => openEdit(u)} title={t("common.edit")}>
                        <Edit2 size={13} />
                      </button>
                      {u.role !== "admin" && (
                        <button className="btn btn-ghost btn-sm btn-icon" onClick={() => toggleActive(u.id)} title={t("users.deactivate")}>
                          <UserX size={13} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Permissions matrix */}
      <div className="card" style={{ marginTop: 22 }}>
        <div className="card-header"><span className="card-title">{t("users.permissions")} — Role Matrix</span></div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Module</th>
                {["managingPartner","partner","associate","paralegal","finance","admin"].map(r => (
                  <th key={r} style={{ textAlign: "center" }}>
                    <span className={`badge ${roleColor[r]}`} style={{ fontSize: 10 }}>
                      {t(`users.roles.${r}`).split(" / ")[0].split(" ")[0]}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                [t("nav.matters"),       ["✓","✓","✓","◐","✗","✓"]],
                [t("nav.clients"),       ["✓","✓","✓","◐","✗","✓"]],
                [t("nav.documents"),     ["✓","✓","✓","✓","✗","✓"]],
                [t("nav.tasks"),         ["✓","✓","✓","✓","✗","✓"]],
                [t("nav.timeTracking"),  ["✓","✓","✓","✓","✓","✓"]],
                [t("nav.billing"),       ["✓","✓","✗","✗","✓","✓"]],
                [t("trust.title"),       ["✓","◐","✗","✗","✓","✓"]],
                [t("nav.reports"),       ["✓","✓","◐","✗","✓","✓"]],
                [t("nav.users"),         ["✓","✗","✗","✗","✗","✓"]],
                [t("nav.settings"),      ["✓","✗","✗","✗","✗","✓"]],
              ].map(([module, perms]) => (
                <tr key={module as string}>
                  <td style={{ fontWeight: 600, fontSize: 13, color: "var(--navy)" }}>{module}</td>
                  {(perms as string[]).map((p, i) => (
                    <td key={i} style={{ textAlign: "center", fontSize: 16, color: p === "✓" ? "var(--success)" : p === "◐" ? "var(--warning)" : "var(--gray-300)" }}>{p}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ padding: "12px 18px", fontSize: 11, color: "var(--gray-400)", borderTop: "1px solid var(--gray-100)", display: "flex", gap: 20 }}>
            <span>✓ Full access</span><span>◐ Partial access</span><span>✗ No access</span>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">{editing ? t("users.editUser") : `${t("users.invite")} — New User`}</span>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              {!editing && (
                <div className="alert alert-gold" style={{ marginBottom: 20 }}>
                  <Mail size={15} style={{ flexShrink: 0 }} />
                  <span>An invitation email with login credentials will be sent automatically to the user's email address.</span>
                </div>
              )}
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label required">{t("users.firstName")}</label>
                  <input className="form-control" value={form.firstName || ""} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} placeholder="Jean" />
                </div>
                <div className="form-group">
                  <label className="form-label">{t("users.lastName")}</label>
                  <input className="form-control" value={form.lastName || ""} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} placeholder="Dupont" />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label required">{t("common.email")}</label>
                <input className="form-control" type="email" value={form.email || ""} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="email@dentons-kmn.cm" />
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
                  <input className="form-control" value={form.department || ""} onChange={e => setForm(f => ({ ...f, department: e.target.value }))} placeholder="Corporate, Litigation..." />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">{t("users.billingRate")} (FCFA/h)</label>
                <input className="form-control" type="number" value={form.billingRate || ""} onChange={e => setForm(f => ({ ...f, billingRate: parseInt(e.target.value) || 0 }))} placeholder="45000" />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowModal(false)}>{t("common.cancel")}</button>
              <button
                className="btn btn-gold"
                onClick={handleSubmit}
                disabled={!form.firstName || !form.email}
              >
                {editing ? <><CheckCircle size={15} />{t("common.save")}</> : <><Mail size={15} />Send Invitation</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
