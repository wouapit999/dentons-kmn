import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Save, RefreshCw, Shield, Bell, Link, Database, Globe } from "lucide-react";

export default function Settings() {
  const { t, i18n } = useTranslation();
  const [activeSection, setActiveSection] = useState("firm");
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const sections = [
    { key: "firm", icon: Globe, label: t("settings.firmProfile") },
    { key: "billing", icon: Database, label: t("settings.billingSettings") },
    { key: "notifications", icon: Bell, label: t("settings.notificationSettings") },
    { key: "security", icon: Shield, label: t("settings.security") },
    { key: "integrations", icon: Link, label: t("settings.integrations") },
  ];

  return (
    <div>
      <div className="page-header">
        <div className="page-header-title">{t("settings.title")}</div>
        <button className="btn btn-primary" onClick={handleSave}>
          {saved ? <><RefreshCw size={15} /> Enregistré!</> : <><Save size={15} />{t("common.save")}</>}
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 20 }}>
        {/* Sidebar nav */}
        <div className="card" style={{ height: "fit-content" }}>
          <div className="card-body" style={{ padding: "8px 0" }}>
            {sections.map(s => {
              const Icon = s.icon;
              return (
                <div key={s.key} className={`nav-item ${activeSection === s.key ? "active" : ""}`} style={{ margin: "1px 8px" }} onClick={() => setActiveSection(s.key)}>
                  <Icon size={16} />
                  <span>{s.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div>
          {activeSection === "firm" && (
            <div className="card">
              <div className="card-header"><span className="card-title">{t("settings.firmProfile")}</span></div>
              <div className="card-body">
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">{t("settings.firmName")}</label>
                    <input className="form-control" defaultValue="Dentons KMN" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{t("common.email")}</label>
                    <input className="form-control" defaultValue="kmn@dentons.com" />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">{t("settings.firmAddress")}</label>
                  <textarea className="form-control" defaultValue="Akwa, Rue du Commerce, Douala, Cameroun" />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">{t("settings.language")}</label>
                    <select className="form-control" value={i18n.language} onChange={e => i18n.changeLanguage(e.target.value)}>
                      <option value="en">English</option>
                      <option value="fr">Français</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">{t("settings.timezone")}</label>
                    <select className="form-control" defaultValue="Africa/Douala">
                      <option value="Africa/Douala">Africa/Douala (WAT, UTC+1)</option>
                      <option value="Europe/Paris">Europe/Paris (CET, UTC+1)</option>
                      <option value="UTC">UTC</option>
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">{t("settings.currency")}</label>
                    <select className="form-control" defaultValue="XAF">
                      <option value="XAF">FCFA (XAF)</option>
                      <option value="EUR">Euro (EUR)</option>
                      <option value="USD">US Dollar (USD)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">{t("settings.dateFormat")}</label>
                    <select className="form-control" defaultValue="DD/MM/YYYY">
                      <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                      <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">{t("settings.firmLogo")}</label>
                  <div style={{ border: "2px dashed var(--gray-300)", borderRadius: 8, padding: 24, textAlign: "center", color: "var(--gray-400)", cursor: "pointer" }}>
                    <div style={{ fontSize: 13 }}>Cliquez pour charger le logo du cabinet</div>
                    <div style={{ fontSize: 11, marginTop: 4 }}>PNG, JPG – max 2 Mo</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === "billing" && (
            <div className="card">
              <div className="card-header"><span className="card-title">{t("settings.billingSettings")}</span></div>
              <div className="card-body">
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">{t("settings.defaultRate")} (FCFA/h)</label>
                    <input className="form-control" type="number" defaultValue="45000" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{t("settings.invoicePrefix")}</label>
                    <input className="form-control" defaultValue="DK-INV" />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">{t("settings.paymentTerms")}</label>
                    <select className="form-control">
                      <option>30 jours</option>
                      <option>60 jours</option>
                      <option>Immédiat</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Taux TVA (%)</label>
                    <input className="form-control" type="number" defaultValue="19.25" />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Mentions légales sur les factures</label>
                  <textarea className="form-control" defaultValue="Paiement par virement bancaire. IBAN: CM21 10003 00230 0123456789 01. Tout retard de paiement entraîne des pénalités." />
                </div>
              </div>
            </div>
          )}

          {activeSection === "security" && (
            <div className="card">
              <div className="card-header"><span className="card-title">{t("settings.security")}</span></div>
              <div className="card-body">
                {[
                  { label: t("settings.mfa"), desc: "Exiger l'authentification à deux facteurs pour tous les utilisateurs", enabled: true },
                  { label: "Expiration de session", desc: "Déconnecter automatiquement après 30 minutes d'inactivité", enabled: true },
                  { label: t("settings.ipRestrictions"), desc: "Limiter l'accès à des adresses IP spécifiques", enabled: false },
                  { label: "Chiffrement des données", desc: "AES-256 au repos, TLS 1.3 en transit", enabled: true },
                  { label: "Journal d'audit complet", desc: "Enregistrer toutes les actions des utilisateurs", enabled: true },
                ].map((item, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 0", borderBottom: "1px solid var(--gray-100)" }}>
                    <div>
                      <div style={{ fontWeight: 500, fontSize: 13 }}>{item.label}</div>
                      <div style={{ fontSize: 12, color: "var(--gray-500)", marginTop: 2 }}>{item.desc}</div>
                    </div>
                    <div style={{
                      width: 44, height: 24, borderRadius: 12, cursor: "pointer",
                      background: item.enabled ? "var(--success)" : "var(--gray-300)",
                      position: "relative", transition: "background 0.2s"
                    }}>
                      <div style={{ width: 18, height: 18, background: "white", borderRadius: "50%", position: "absolute", top: 3, left: item.enabled ? 23 : 3, transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSection === "notifications" && (
            <div className="card">
              <div className="card-header"><span className="card-title">{t("settings.notificationSettings")}</span></div>
              <div className="card-body">
                {[
                  { label: t("notifications.deadlineApproaching"), email: true, sms: true, inApp: true },
                  { label: t("notifications.taskAssigned"), email: true, sms: false, inApp: true },
                  { label: t("notifications.invoicePaid"), email: true, sms: false, inApp: true },
                  { label: t("notifications.documentUploaded"), email: false, sms: false, inApp: true },
                  { label: t("notifications.matterUpdated"), email: false, sms: false, inApp: true },
                ].map((item, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid var(--gray-100)" }}>
                    <div style={{ fontWeight: 500, fontSize: 13, width: 250 }}>{item.label}</div>
                    <div style={{ display: "flex", gap: 20 }}>
                      {[["Email", item.email], ["SMS", item.sms], ["In-App", item.inApp]].map(([label, val]) => (
                        <label key={label as string} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, cursor: "pointer" }}>
                          <input type="checkbox" defaultChecked={val as boolean} style={{ accentColor: "var(--primary)" }} />
                          {label}
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSection === "integrations" && (
            <div className="card">
              <div className="card-header"><span className="card-title">{t("settings.integrations")}</span></div>
              <div className="card-body">
                {[
                  { name: "Microsoft Outlook", desc: "Synchronisation email et calendrier", icon: "📧", connected: false },
                  { name: "Google Calendar", desc: "Synchronisation des événements", icon: "📅", connected: false },
                  { name: "DocuSign", desc: "Signature électronique", icon: "✍️", connected: false },
                  { name: "OneDrive", desc: "Stockage cloud Microsoft", icon: "☁️", connected: false },
                  { name: "Stripe", desc: "Paiements par carte bancaire", icon: "💳", connected: false },
                  { name: "Mobile Money", desc: "MTN MoMo, Orange Money", icon: "📱", connected: false },
                  { name: "QuickBooks", desc: "Comptabilité générale", icon: "📊", connected: false },
                  { name: "Microsoft Teams", desc: "Communication d'équipe", icon: "💬", connected: false },
                ].map((item, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 0", borderBottom: "1px solid var(--gray-100)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                      <div style={{ fontSize: 28, width: 40, textAlign: "center" }}>{item.icon}</div>
                      <div>
                        <div style={{ fontWeight: 500, fontSize: 13 }}>{item.name}</div>
                        <div style={{ fontSize: 12, color: "var(--gray-500)", marginTop: 1 }}>{item.desc}</div>
                      </div>
                    </div>
                    <button className={`btn ${item.connected ? "btn-outline" : "btn-primary"} btn-sm`}>
                      {item.connected ? "Déconnecté" : "Connecter"}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
