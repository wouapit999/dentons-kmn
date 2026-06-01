import React, { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Mail, Shield, ArrowRight, RefreshCw, CheckCircle } from "lucide-react";
import Logo from "../components/ui/Logo";
import EMAILJS_CONFIG from "../config/emailjs";

const ADMIN_EMAIL = "rwouapit@bouquet-innovation.net";

function generateOTP(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

interface LoginProps {
  onLogin: () => void;
}

export default function Login({ onLogin }: LoginProps) {
  const { t, i18n } = useTranslation();
  const [step, setStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [otpSentMsg, setOtpSentMsg] = useState(false);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (resendCooldown > 0) {
      const t = setTimeout(() => setResendCooldown(c => c - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [resendCooldown]);

  const sendOtp = async () => {
    setError("");
    if (email.trim().toLowerCase() !== ADMIN_EMAIL) {
      setError(t("auth.loginError"));
      return;
    }
    setLoading(true);
    const code = generateOTP();
    setGeneratedOtp(code);

    // Send via EmailJS
    try {
      const { send } = await import("emailjs-com");
      await send(
        EMAILJS_CONFIG.serviceId,
        EMAILJS_CONFIG.otpTemplateId,
        {
          to_email: email,
          to_name: "Administrator",
          otp_code: code,
          firm_name: "Dentons KMN",
          website: "dentons.com/en/global-presence/africa/cameroon/douala",
        },
        EMAILJS_CONFIG.publicKey
      );
    } catch (e) {
      // EmailJS not configured — OTP shown below for demo
    }

    setLoading(false);
    setStep("otp");
    setResendCooldown(60);
    setOtpSentMsg(true);
    setTimeout(() => {
      otpRefs.current[0]?.focus();
    }, 100);
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    setError("");
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
    if (e.key === "Enter") verifyOtp();
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    const paste = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (paste.length === 6) {
      setOtp(paste.split(""));
      otpRefs.current[5]?.focus();
    }
  };

  const verifyOtp = () => {
    const entered = otp.join("");
    if (entered.length < 6) { setError("Please enter all 6 digits"); return; }
    if (entered !== generatedOtp) {
      setError("Invalid OTP code. Please try again.");
      setOtp(["","","","","",""]);
      otpRefs.current[0]?.focus();
      return;
    }
    setLoading(true);
    setTimeout(() => { onLogin(); }, 800);
  };

  const resendOtp = () => {
    if (resendCooldown > 0) return;
    setOtp(["","","","","",""]);
    setError("");
    sendOtp();
  };

  return (
    <div className="login-page">
      <div className="login-card">
        {/* Top branding */}
        <div className="login-card-top">
          <div style={{ display: "flex", justifyContent: "center" }}>
            <Logo size="lg" variant="light" showTagline />
          </div>
          <div className="login-title">
            {step === "email" ? "Secure Access Portal" : "Verification Required"}
          </div>
          <div className="login-subtitle">
            {step === "email"
              ? "Legal Practice Management System"
              : `A 6-digit code has been sent to your email`}
          </div>
        </div>

        {/* Body */}
        <div className="login-card-body">
          {/* Language switcher */}
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 20 }}>
            <div className="lang-switcher">
              <button className={`lang-btn ${i18n.language === "en" ? "active" : ""}`} onClick={() => i18n.changeLanguage("en")}>EN</button>
              <button className={`lang-btn ${i18n.language === "fr" ? "active" : ""}`} onClick={() => i18n.changeLanguage("fr")}>FR</button>
            </div>
          </div>

          {step === "email" ? (
            <>
              {/* Security notice */}
              <div className="alert alert-gold" style={{ marginBottom: 24 }}>
                <Shield size={16} style={{ flexShrink: 0, marginTop: 1 }} />
                <span>Access is restricted to authorized personnel only. An OTP will be sent to your registered email.</span>
              </div>

              <div className="form-group">
                <label className="form-label required">{t("auth.email")}</label>
                <div style={{ position: "relative" }}>
                  <Mail size={16} style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: "var(--gray-400)" }} />
                  <input
                    className="form-control"
                    style={{ paddingLeft: 40 }}
                    type="email"
                    value={email}
                    onChange={e => { setEmail(e.target.value); setError(""); }}
                    placeholder="your@email.com"
                    onKeyDown={e => e.key === "Enter" && sendOtp()}
                    autoFocus
                  />
                </div>
                {error && <div className="form-error">{error}</div>}
              </div>

              <button
                className="btn btn-gold btn-block btn-lg"
                onClick={sendOtp}
                disabled={loading || !email}
                style={{ marginTop: 8, width: "100%", justifyContent: "center" }}
              >
                {loading
                  ? <><RefreshCw size={16} style={{ animation: "spin 1s linear infinite" }} /> Sending OTP...</>
                  : <>{t("auth.login")} <ArrowRight size={16} /></>
                }
              </button>
            </>
          ) : (
            <>
              {/* OTP sent confirmation */}
              {otpSentMsg && (
                <div className="alert alert-success" style={{ marginBottom: 20 }}>
                  <CheckCircle size={16} style={{ flexShrink: 0 }} />
                  <div>
                    <div style={{ fontWeight: 700 }}>OTP sent successfully</div>
                    <div style={{ fontSize: 12, marginTop: 2 }}>Check your inbox at <strong>{email}</strong></div>
                  </div>
                </div>
              )}

              {/* Dev mode — show OTP */}
              {generatedOtp && (
                <div className="alert alert-info" style={{ marginBottom: 20 }}>
                  <Shield size={16} style={{ flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Demo Mode — Your OTP</div>
                    <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: "0.2em", marginTop: 4, fontFamily: "monospace" }}>{generatedOtp}</div>
                  </div>
                </div>
              )}

              <div style={{ textAlign: "center", marginBottom: 8 }}>
                <div style={{ fontSize: 13, color: "var(--gray-500)", marginBottom: 6 }}>
                  Enter the 6-digit code
                </div>
              </div>

              <div className="otp-container" onPaste={handleOtpPaste}>
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={el => { otpRefs.current[i] = el; }}
                    className="form-control otp-input"
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleOtpChange(i, e.target.value)}
                    onKeyDown={e => handleOtpKeyDown(i, e)}
                  />
                ))}
              </div>

              {error && (
                <div style={{ textAlign: "center", marginBottom: 12 }}>
                  <div className="form-error" style={{ display: "inline-block" }}>{error}</div>
                </div>
              )}

              <button
                className="btn btn-gold btn-block btn-lg"
                onClick={verifyOtp}
                disabled={loading || otp.join("").length < 6}
                style={{ width: "100%", justifyContent: "center", marginTop: 8 }}
              >
                {loading
                  ? <><RefreshCw size={16} style={{ animation: "spin 1s linear infinite" }} /> Verifying...</>
                  : <><Shield size={16} /> Verify & Sign In</>
                }
              </button>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16 }}>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => { setStep("email"); setOtp(["","","","","",""]); setError(""); }}
                >
                  ← Change email
                </button>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={resendOtp}
                  disabled={resendCooldown > 0}
                  style={{ color: resendCooldown > 0 ? "var(--gray-400)" : "var(--navy)" }}
                >
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend OTP"}
                </button>
              </div>
            </>
          )}

          {/* Footer */}
          <div style={{ marginTop: 28, paddingTop: 20, borderTop: "1px solid var(--gray-200)", textAlign: "center" }}>
            <div style={{ fontSize: 11, color: "var(--gray-400)", lineHeight: 1.8 }}>
              <div style={{ fontWeight: 600, color: "var(--gray-600)", marginBottom: 4 }}>Dentons KMN — Kouengoua Minou Nkongho Law Firm</div>
              <div>Douala, Cameroun</div>
              <a href="https://www.dentons.com/en/global-presence/africa/cameroon/douala" target="_blank" rel="noopener noreferrer" style={{ color: "var(--gold-dark)", textDecoration: "none", fontWeight: 600 }}>
                dentons.com/en/global-presence/africa/cameroon/douala
              </a>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
