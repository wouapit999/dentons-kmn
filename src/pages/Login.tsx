import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Mail, Lock, LogIn, RefreshCw, AlertCircle, Eye, EyeOff } from "lucide-react";
import Logo from "../components/ui/Logo";
import { login, seedUsersIfNeeded } from "../services/authService";
import type { Session } from "../services/authService";

interface LoginProps {
  onLogin: (session: Session) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const { t, i18n } = useTranslation();
  const [email, setEmail]         = useState("");
  const [password, setPassword]   = useState("");
  const [showPwd, setShowPwd]     = useState(false);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");
  const [seeding, setSeeding]     = useState(true);

  // Seed users on first load
  useEffect(() => {
    seedUsersIfNeeded().finally(() => setSeeding(false));
  }, []);

  const handleSubmit = async () => {
    setError("");
    if (!email.trim()) { setError(t("errors.required") + " — email"); return; }
    if (!password)     { setError(t("errors.required") + " — password"); return; }
    setLoading(true);
    const result = await login(email, password);
    setLoading(false);
    if (result.success && result.session) {
      onLogin(result.session);
    } else {
      setError(result.error || t("auth.loginError"));
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-card-top">
          <div style={{ display:"flex", justifyContent:"center" }}>
            <Logo size="lg" variant="light" showTagline/>
          </div>
          <div className="login-title">Secure Access Portal</div>
          <div className="login-subtitle">Legal Practice Management System</div>
        </div>

        <div className="login-card-body">
          <div style={{ display:"flex", justifyContent:"flex-end", marginBottom:20 }}>
            <div className="lang-switcher">
              <button className={`lang-btn ${i18n.language==="en"?"active":""}`} onClick={()=>i18n.changeLanguage("en")}>EN</button>
              <button className={`lang-btn ${i18n.language==="fr"?"active":""}`} onClick={()=>i18n.changeLanguage("fr")}>FR</button>
            </div>
          </div>

          {seeding && (
            <div className="alert alert-info" style={{marginBottom:16}}>
              <RefreshCw size={15} style={{animation:"spin 1s linear infinite",flexShrink:0}}/>
              <span>Initialising system...</span>
            </div>
          )}

          {error && (
            <div className="alert alert-danger" style={{marginBottom:16}}>
              <AlertCircle size={15} style={{flexShrink:0}}/>
              <span>{error}</span>
            </div>
          )}

          <div className="form-group">
            <label className="form-label required">{t("auth.email")}</label>
            <div style={{position:"relative"}}>
              <Mail size={16} style={{position:"absolute",left:13,top:"50%",transform:"translateY(-50%)",color:"var(--gray-400)"}}/>
              <input
                className="form-control"
                style={{paddingLeft:40}}
                type="email"
                value={email}
                placeholder="firstname.lastname@dentons.com"
                onChange={e=>{setEmail(e.target.value);setError("");}}
                onKeyDown={e=>e.key==="Enter"&&handleSubmit()}
                autoFocus
                disabled={loading||seeding}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label required">{t("auth.password")}</label>
            <div style={{position:"relative"}}>
              <Lock size={16} style={{position:"absolute",left:13,top:"50%",transform:"translateY(-50%)",color:"var(--gray-400)"}}/>
              <input
                className="form-control"
                style={{paddingLeft:40,paddingRight:44}}
                type={showPwd?"text":"password"}
                value={password}
                placeholder="••••••••"
                onChange={e=>{setPassword(e.target.value);setError("");}}
                onKeyDown={e=>e.key==="Enter"&&handleSubmit()}
                disabled={loading||seeding}
              />
              <button
                onClick={()=>setShowPwd(!showPwd)}
                style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:"var(--gray-400)",padding:0}}
              >
                {showPwd?<EyeOff size={16}/>:<Eye size={16}/>}
              </button>
            </div>
          </div>

          <button
            className="btn btn-gold btn-lg"
            onClick={handleSubmit}
            disabled={loading||seeding||!email||!password}
            style={{width:"100%",justifyContent:"center",marginTop:8}}
          >
            {loading
              ? <><RefreshCw size={16} style={{animation:"spin 1s linear infinite"}}/> {t("common.loading")}</>
              : <><LogIn size={16}/>{t("auth.login")}</>}
          </button>

          <div style={{marginTop:24,padding:"16px 0",borderTop:"1px solid var(--gray-200)",textAlign:"center"}}>
            <div style={{fontSize:12,color:"var(--gray-400)",lineHeight:1.8}}>
              <div style={{fontWeight:600,color:"var(--gray-600)"}}>Dentons KMN — Kouengoua Minou Nkongho</div>
              <div>Douala, Cameroun</div>
              <a href="https://www.dentons.com/en/global-presence/africa/cameroon/douala" target="_blank" rel="noopener noreferrer" style={{color:"var(--gold-dark)",textDecoration:"none",fontWeight:600}}>
                dentons.com/en/global-presence/africa/cameroon/douala
              </a>
              <div style={{marginTop:6,fontSize:11}}>
                ⚠ Access restricted to authorised Dentons KMN personnel
              </div>
            </div>
          </div>
        </div>
      </div>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}