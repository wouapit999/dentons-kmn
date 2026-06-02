import React from "react";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "dark" | "light" | "gold";
  showTagline?: boolean;
}

export default function Logo({ size = "md", variant = "dark", showTagline = false }: LogoProps) {
  const sizes = { sm: 28, md: 38, lg: 52, xl: 72 };
  const h = sizes[size];
  const accentColor = "#C9A84C";

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      {/* Logo mark */}
      <svg width={h} height={h} viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="52" height="52" rx="6" fill="#0B1F3A" />
        {/* Scales of Justice icon */}
        <line x1="26" y1="10" x2="26" y2="42" stroke={accentColor} strokeWidth="2" strokeLinecap="round"/>
        <line x1="14" y1="16" x2="38" y2="16" stroke={accentColor} strokeWidth="2" strokeLinecap="round"/>
        {/* Left scale */}
        <line x1="14" y1="16" x2="10" y2="26" stroke={accentColor} strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="14" y1="16" x2="18" y2="26" stroke={accentColor} strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M10 26 Q14 30 18 26" stroke={accentColor} strokeWidth="1.5" fill="none" strokeLinecap="round"/>
        {/* Right scale */}
        <line x1="38" y1="16" x2="34" y2="26" stroke={accentColor} strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="38" y1="16" x2="42" y2="26" stroke={accentColor} strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M34 26 Q38 30 42 26" stroke={accentColor} strokeWidth="1.5" fill="none" strokeLinecap="round"/>
        {/* Base */}
        <line x1="20" y1="42" x2="32" y2="42" stroke={accentColor} strokeWidth="2" strokeLinecap="round"/>
      </svg>

      {/* Text */}
      <div>
        <div style={{
          display: "flex", alignItems: "center", gap: 0,
          fontFamily: "'Georgia', 'Times New Roman', serif",
          letterSpacing: "0.08em",
        }}>
          <span style={{
            fontSize: size === "sm" ? 14 : size === "md" ? 18 : size === "lg" ? 24 : 32,
            fontWeight: 700,
            color: variant === "light" ? "#FFFFFF" : "#0B1F3A",
            letterSpacing: "0.1em",
          }}>DENTONS</span>
          <span style={{
            background: accentColor,
            color: "#FFFFFF",
            fontSize: size === "sm" ? 11 : size === "md" ? 14 : size === "lg" ? 18 : 24,
            fontWeight: 800,
            padding: size === "sm" ? "1px 6px" : "2px 8px",
            marginLeft: 6,
            borderRadius: 3,
            letterSpacing: "0.12em",
          }}>KMN</span>
        </div>
        {showTagline && (
          <div style={{
            fontSize: size === "sm" ? 8 : 10,
            color: variant === "light" ? "rgba(255,255,255,0.6)" : "#8B9BAE",
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            marginTop: 2,
            fontFamily: "'Inter', sans-serif",
          }}>
            Kouengoua · Minou · Nkongho
          </div>
        )}
      </div>
    </div>
  );
}
