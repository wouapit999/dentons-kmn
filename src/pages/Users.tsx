import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Edit2, UserX, UserCheck, X, Key, CheckCircle, AlertCircle, RefreshCw, Eye, EyeOff } from "lucide-react";
import { User, UserRole } from "../types";
import { useApp } from "../context/AppContext";
import { doc, updateDoc } from "firebase/firestore";
import { db, COLLECTIONS } from "../config/firebase";
import { hashPwd } from "../services/authService";

const fmt = (n: number) => n > 0
  ? new Intl.NumberFormat("fr-CM", { style:"currency", currency:"XAF", maximumFractionDigits:0 }).format(n)
  : "—";

const roleColor: Record<string,string> = {
  managingPartner:"badge-gold", partner:"badge-navy", associate:"badge-purple",
  paralegal:"badge-green", finance:"badge-yellow", admin:"badge-red", client:"badge-gray",
};

export default function Users() {
  const { t } = useTranslation();
  const { users, session } = useApp();
  const isAdmin = session?.role === "admin";

  const [editModal, setEditModal]       = useState<User | null>(null);
  const [pwdModal, setPwdModal]         = useState<User | null>(null);
  const [form, setForm]                 = useState<Partial<User>>({});
  const [newPassword, setNewPassword]   = useState("");
  const [confirmPwd, setConfirmPwd]     = useState("");
  const [showPwd, setShowPwd]           = useState(false);
  const [statusMsg, setStatusMsg]       = useState<{type:"success"|"error"|"info";msg:string}|null>(null);
  const [saving, setSaving]             = useState(false);

  const showStatus = (type: "success"|"error"|"info", msg: string) => {
    setStatusMsg({type,msg});
    setTimeout(()=>setStatusMsg(null), 6000);
  };

  const handleSaveUser = async () => {
    if (!editModal || !form.firstName || !form.email) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, COLLECTIONS.USERS, editModal.id), {
        firstName:   form.firstName,
        lastName:    form.lastName || "",
        email:       form.email.toLowerCase(),
        role:        form.role,
        department:  form.department || "",
        billingRate: form.billingRate || 0,
        active:      form.active !== false,
      });
      showStatus("success", `${form.firstName} ${form.lastName} updated successfully.`);
      setEditModal(null);
    } catch { showStatus("error", "Failed to save. Try again."); }
    setSaving(false);
  };

  const handleChangePassword = async () => {
    if (!pwdModal) return;
    if (!newPassword || newPassword.length < 6) { showStatus("error","Password must be at least 6 characters."); return; }
    if (newPassword !== confirmPwd) { showStatus("error","Passwords do not match."); return; }
    setSaving(true);
    try {
      const hash = await hashPwd(newPassword);
      await updateDoc(doc(db, COLLECTIONS.USERS, pwdModal.id), {
        passwordHash: hash, forcePasswordChange: false,
      });
      showStatus("success", `Password changed for ${pwdModal.firstName} ${pwdModal.lastName}.`);
      setPwdModal(null); setNewPassword(""); setConfirmPwd("");
    } catch { showStatus("error","Failed to change password."); }
    setSaving(false);
  };

  const toggleActive = async (user: User) => {
    if (!isAdmin || user.role === "admin") return;
    try {
      await updateDoc(doc(db, COLLECTIONS.USERS, user.id), { active: !user.active });
      showStatus("success", `${user.firstName} ${user.lastName} ${!user.active?"activated":"deactivated"}.`);
    } catch { showStatus("error","Failed to update user."); }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-header-title">{t("users.title")}</div>
          <div className="page-header-subtitle">{users.filter(u=>u.active).length} active · {users.length} total</div>
        </div>
        {!isAdmin && (
          <div className="alert alert-info" style={{margin:0,padding:"8px 14px"}}>
            <AlertCircle size={14}/><span style={{fontSize:12}}>View only — contact Administrator to make changes</span>
          </div>
        )}
      </div>

      {statusMsg && (
        <div className={`alert alert-${statusMsg.type}`} style={{marginBottom:20}}>
          {statusMsg.type==="success"?<CheckCircle size={16} style={{flexShrink:0}}/>:<AlertCircle size={16} style={{flexShrink:0}}/>}
          <span>{statusMsg.msg}</span>
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
                <th>{t("users.lastLogin")}</th>
                <th>{t("common.status")}</th>
                {isAdmin && <th>{t("common.actions")}</th>}
              </tr>
            </thead>
            <tbody>
              {[...users].sort((a,b)=>a.firstName.localeCompare(b.firstName)).map(u => (
                <tr key={u.id} style={{opacity:u.active?1:0.5}}>
                  <td>
                    <div style={{display:"flex",alignItems:"center",gap:12}}>
                      <div className="user-avatar" style={{width:36,height:36,fontSize:12}}>
                        {u.firstName[0]}{u.lastName?.[0]||""}
                      </div>
                      <div>
                        <div style={{fontWeight:600,color:"var(--navy)"}}>{u.firstName} {u.lastName}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{fontSize:13,color:"var(--gray-600)"}}>{u.email}</td>
                  <td><span className={`badge ${roleColor[u.role]||"badge-gray"}`}>{t(`users.roles.${u.role}`)}</span></td>
                  <td style={{fontSize:13}}>{u.department||"—"}</td>
                  <td style={{fontSize:13,fontWeight:500}}>{fmt(u.billingRate)}{u.billingRate>0?"/h":""}</td>
                  <td style={{fontSize:12,color:"var(--gray-500)"}}>{u.joinDate||"—"}</td>
                  <td style={{fontSize:12,color:"var(--gray-500)"}}>{u.lastLogin ? (typeof u.lastLogin === "string" ? u.lastLogin.split("T")[0] : "—") : "—"}</td>
                  <td><span className={`badge ${u.active?"badge-green":"badge-gray"}`}>{u.active?t("common.active"):t("common.inactive")}</span></td>
                  {isAdmin && (
                    <td>
                      <div style={{display:"flex",gap:6}}>
                        <button className="btn btn-outline btn-sm btn-icon" onClick={()=>{setEditModal(u);setForm(u);}} title={t("common.edit")}><Edit2 size={13}/></button>
                        <button className="btn btn-outline btn-sm btn-icon" onClick={()=>{setPwdModal(u);setNewPassword("");setConfirmPwd("");}} title="Change Password"><Key size={13}/></button>
                        {u.role!=="admin" && (
                          <button className={`btn btn-ghost btn-sm btn-icon`} onClick={()=>toggleActive(u)} title={u.active?t("users.deactivate"):"Activate"}>
                            {u.active?<UserX size={13}/>:<UserCheck size={13}/>}
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Permissions matrix */}
      <div className="card" style={{marginTop:22}}>
        <div className="card-header"><span className="card-title">{t("users.permissions")} — Role Matrix</span></div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Module</th>
                {["managingPartner","partner","associate","paralegal","finance","admin"].map(r=>(
                  <th key={r} style={{textAlign:"center"}}><span className={`badge ${roleColor[r]}`} style={{fontSize:10}}>{t(`users.roles.${r}`).split(" ")[0]}</span></th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                [t("nav.matters"),      ["✓","✓","✓","◐","✗","✓"]],
                [t("nav.clients"),      ["✓","✓","✓","◐","✗","✓"]],
                [t("nav.documents"),    ["✓","✓","✓","✓","✗","✓"]],
                [t("nav.tasks"),        ["✓","✓","✓","✓","✗","✓"]],
                [t("nav.timeTracking"), ["✓","✓","✓","✓","✓","✓"]],
                [t("nav.billing"),      ["✓","✓","✗","✗","✓","✓"]],
                [t("trust.title"),      ["✓","◐","✗","✗","✓","✓"]],
                [t("nav.reports"),      ["✓","✓","◐","✗","✓","✓"]],
                [t("nav.users"),        ["✓","✗","✗","✗","✗","✓"]],
                [t("nav.settings"),     ["✓","✗","✗","✗","✗","✓"]],
              ].map(([module,perms])=>(
                <tr key={module as string}>
                  <td style={{fontWeight:600,fontSize:13,color:"var(--navy)"}}>{module}</td>
                  {(perms as string[]).map((p,i)=>(
                    <td key={i} style={{textAlign:"center",fontSize:16,color:p==="✓"?"var(--success)":p==="◐"?"var(--warning)":"var(--gray-300)"}}>{p}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{padding:"10px 18px",fontSize:11,color:"var(--gray-400)",borderTop:"1px solid var(--gray-100)",display:"flex",gap:20}}>
            <span>✓ Full</span><span>◐ Partial</span><span>✗ None</span>
          </div>
        </div>
      </div>

      {/* Edit user modal */}
      {editModal && (
        <div className="modal-overlay" onClick={()=>setEditModal(null)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">{t("users.editUser")} — {editModal.firstName} {editModal.lastName}</span>
              <button className="btn btn-ghost btn-icon" onClick={()=>setEditModal(null)}><X size={18}/></button>
            </div>
            <div className="modal-body">
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label required">{t("users.firstName")}</label>
                  <input className="form-control" value={form.firstName||""} onChange={e=>setForm(f=>({...f,firstName:e.target.value}))}/>
                </div>
                <div className="form-group">
                  <label className="form-label">{t("users.lastName")}</label>
                  <input className="form-control" value={form.lastName||""} onChange={e=>setForm(f=>({...f,lastName:e.target.value}))}/>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label required">{t("common.email")}</label>
                <input className="form-control" type="email" value={form.email||""} onChange={e=>setForm(f=>({...f,email:e.target.value}))}/>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">{t("users.role")}</label>
                  <select className="form-control" value={form.role||"associate"} onChange={e=>setForm(f=>({...f,role:e.target.value as UserRole}))}>
                    {["managingPartner","partner","associate","paralegal","finance","admin"].map(r=>(
                      <option key={r} value={r}>{t(`users.roles.${r}`)}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">{t("users.department")}</label>
                  <input className="form-control" value={form.department||""} onChange={e=>setForm(f=>({...f,department:e.target.value}))}/>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">{t("users.billingRate")} (FCFA/h)</label>
                <input className="form-control" type="number" value={form.billingRate||""} onChange={e=>setForm(f=>({...f,billingRate:parseInt(e.target.value)||0}))}/>
              </div>
              <div className="form-group">
                <label className="checkbox-label">
                  <input type="checkbox" checked={form.active!==false} onChange={e=>setForm(f=>({...f,active:e.target.checked}))}/>
                  {t("common.active")}
                </label>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={()=>setEditModal(null)}>{t("common.cancel")}</button>
              <button className="btn btn-gold" onClick={handleSaveUser} disabled={saving}>
                {saving?<><RefreshCw size={14} style={{animation:"spin 1s linear infinite"}}/> Saving...</>:<><CheckCircle size={14}/>{t("common.save")}</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change password modal */}
      {pwdModal && (
        <div className="modal-overlay" onClick={()=>setPwdModal(null)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Change Password — {pwdModal.firstName} {pwdModal.lastName}</span>
              <button className="btn btn-ghost btn-icon" onClick={()=>setPwdModal(null)}><X size={18}/></button>
            </div>
            <div className="modal-body">
              <div className="alert alert-gold" style={{marginBottom:20}}>
                <Key size={15} style={{flexShrink:0}}/>
                <span>Only the Administrator can change user passwords. The user will be able to log in immediately with the new password.</span>
              </div>
              <div className="form-group">
                <label className="form-label required">New Password</label>
                <div style={{position:"relative"}}>
                  <input className="form-control" style={{paddingRight:44}} type={showPwd?"text":"password"} value={newPassword} onChange={e=>setNewPassword(e.target.value)} placeholder="Minimum 6 characters"/>
                  <button onClick={()=>setShowPwd(!showPwd)} style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:"var(--gray-400)",padding:0}}>
                    {showPwd?<EyeOff size={15}/>:<Eye size={15}/>}
                  </button>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label required">Confirm New Password</label>
                <input className="form-control" type={showPwd?"text":"password"} value={confirmPwd} onChange={e=>setConfirmPwd(e.target.value)} placeholder="Repeat password"/>
                {confirmPwd && newPassword !== confirmPwd && <div className="form-error">Passwords do not match</div>}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={()=>setPwdModal(null)}>{t("common.cancel")}</button>
              <button className="btn btn-gold" onClick={handleChangePassword} disabled={saving||!newPassword||newPassword!==confirmPwd}>
                {saving?<><RefreshCw size={14} style={{animation:"spin 1s linear infinite"}}/> Saving...</>:<><Key size={14}/>Change Password</>}
              </button>
            </div>
          </div>
        </div>
      )}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}