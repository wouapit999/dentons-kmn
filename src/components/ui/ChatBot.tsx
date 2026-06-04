import React, { useState, useRef, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { MessageCircle, X, Send, RefreshCw, Bot, User, ExternalLink, ChevronDown } from "lucide-react";
import { findAnswer, FALLBACK } from "../../utils/botKnowledge";

interface Message {
  role:      "user" | "assistant";
  content:   string;
  timestamp: Date;
  lang:      string; // language the message was written in
}

// ── Bilingual content ────────────────────────────────────────────────────────
const UI_TEXT = {
  en: {
    title:        "KMN Assistant",
    subtitle:     "AI Legal Guide · Powered by Claude",
    greeting:     "👋 Hello! I'm **KMN Assistant**, your AI legal guide.\n\nI can help you:\n• **Navigate** the Dentons KMN software\n• Answer questions on **Cameroon & OHADA law**\n• Provide **legal references** and official links\n\nHow can I assist you today?",
    placeholder:  "Ask about the app or Cameroon law...",
    footer:       "Not a substitute for legal advice",
    offline:      "⚠️ I'm currently unavailable. Please ensure the AI service is configured.\n\nContact **kmn@dentons.com** for assistance.",
    langSwitch:   "I have switched to English. How can I help you?",
    quickPrompts: [
      { label: "Create a matter",    text: "How do I create a new matter in the system?" },
      { label: "Create an invoice",  text: "How do I create an invoice and add line items?" },
      { label: "OHADA company types",text: "What are the different types of companies under OHADA law?" },
      { label: "Cameroon VAT rate",  text: "What is the VAT rate in Cameroon and how is it calculated?" },
      { label: "Approve time entries",text:"How do I approve time entries in the billing module?" },
      { label: "Labour law",         text: "What are the key provisions of the Cameroon Labour Code?" },
    ],
  },
  fr: {
    title:        "Assistant KMN",
    subtitle:     "Guide Juridique IA · Propulsé par Claude",
    greeting:     "👋 Bonjour ! Je suis **l'Assistant KMN**, votre guide juridique IA.\n\nJe peux vous aider à :\n• **Naviguer** dans le logiciel Dentons KMN\n• Répondre à vos questions sur le **droit camerounais & OHADA**\n• Fournir des **références juridiques** et des liens officiels\n\nComment puis-je vous aider aujourd'hui ?",
    placeholder:  "Posez une question sur l'appli ou le droit camerounais...",
    footer:       "Ne remplace pas un conseil juridique",
    offline:      "⚠️ Je suis actuellement indisponible. Assurez-vous que le service IA est configuré.\n\nContactez **kmn@dentons.com** pour de l'aide.",
    langSwitch:   "Je suis passé en français. Comment puis-je vous aider ?",
    quickPrompts: [
      { label: "Créer un dossier",     text: "Comment créer un nouveau dossier dans le système ?" },
      { label: "Créer une facture",    text: "Comment créer une facture et ajouter des lignes ?" },
      { label: "Types de sociétés OHADA", text: "Quels sont les différents types de sociétés selon le droit OHADA ?" },
      { label: "TVA au Cameroun",      text: "Quel est le taux de TVA au Cameroun et comment est-il calculé ?" },
      { label: "Approuver les heures", text: "Comment approuver les entrées de temps dans le module facturation ?" },
      { label: "Code du travail",      text: "Quelles sont les dispositions clés du Code du Travail camerounais ?" },
    ],
  },
};

// ── Render rich text (bold, links, newlines) ──────────────────────────────────
function RichText({ text }: { text: string }) {
  const parts = text.split(/(\[.*?\]\(.*?\)|https?:\/\/[^\s)>]+|\*\*.*?\*\*)/g);
  return (
    <>
      {parts.map((part, i) => {
        const linkMd = part.match(/\[(.+?)\]\((https?:\/\/.+?)\)/);
        if (linkMd)
          return <a key={i} href={linkMd[2]} target="_blank" rel="noopener noreferrer"
            style={{ color:"var(--gold-light)", textDecoration:"underline", display:"inline-flex", alignItems:"center", gap:2 }}>
            {linkMd[1]}<ExternalLink size={10}/>
          </a>;
        if (/^https?:\/\//.test(part))
          return <a key={i} href={part} target="_blank" rel="noopener noreferrer"
            style={{ color:"var(--gold-light)", textDecoration:"underline", display:"inline-flex", alignItems:"center", gap:2 }}>
            {part}<ExternalLink size={10}/>
          </a>;
        const bold = part.match(/^\*\*(.+)\*\*$/);
        if (bold) return <strong key={i}>{bold[1]}</strong>;
        return (
          <span key={i}>
            {part.split("\n").map((line, j, arr) => (
              <React.Fragment key={j}>{line}{j < arr.length - 1 && <br/>}</React.Fragment>
            ))}
          </span>
        );
      })}
    </>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function ChatBot() {
  const { i18n } = useTranslation();
  const lang     = i18n.language === "fr" ? "fr" : "en";
  const ui       = UI_TEXT[lang];

  const [open,      setOpen]      = useState(false);
  const [minimised, setMinimised] = useState(false);
  const [messages,  setMessages]  = useState<Message[]>([{
    role: "assistant", content: UI_TEXT.en.greeting, timestamp: new Date(), lang: "en",
  }]);
  const [input,   setInput]   = useState("");
  const [loading, setLoading] = useState(false);
  const [unread,  setUnread]  = useState(0);
  const prevLang              = useRef<string>("en");
  const bottomRef             = useRef<HTMLDivElement>(null);
  const inputRef              = useRef<HTMLInputElement>(null);

  // ── Update greeting when language changes ────────────────────────────────
  useEffect(() => {
    if (lang === prevLang.current) return;
    prevLang.current = lang;

    // Add a language-switch notice from the bot
    setMessages(prev => [
      ...prev,
      {
        role:      "assistant",
        content:   ui.langSwitch,
        timestamp: new Date(),
        lang,
      },
    ]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  useEffect(() => {
    if (open) { setUnread(0); setTimeout(() => inputRef.current?.focus(), 100); }
  }, [open]);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  // ── Send a message ────────────────────────────────────────────────────────
  const sendMessage = useCallback(async (text?: string) => {
    const content = (text || input).trim();
    if (!content || loading) return;
    setInput("");

    const userMsg: Message = { role:"user", content, timestamp:new Date(), lang };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    // Step 1: Try the built-in knowledge base first (instant, no API needed)
    const localAnswer = findAnswer(content, lang);
    if (localAnswer) {
      setMessages(prev => [...prev, {
        role:"assistant", content:localAnswer, timestamp:new Date(), lang,
      }]);
      setLoading(false);
      if (!open) setUnread(u => u + 1);
      return;
    }

    // Step 2: Try the Claude API for complex questions
    try {
      const langInstruction = lang === "fr"
        ? "[IMPORTANT: Répondez entièrement en français]"
        : "[IMPORTANT: Reply ENTIRELY in English]";

      const history = [...messages, userMsg].map(m => ({ role:m.role, content:m.content }));
      history[history.length - 1].content = `${langInstruction}\n\n${content}`;

      const controller = new AbortController();
      const timeoutId  = setTimeout(() => controller.abort(), 10000); // 10s timeout

      const res = await fetch("/api/chat", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ messages: history, lang }),
        signal:  controller.signal,
      });
      clearTimeout(timeoutId);

      if (!res.ok) throw new Error("API error");
      const data = await res.json();
      setMessages(prev => [...prev, {
        role:"assistant",
        content: data.reply || FALLBACK[lang],
        timestamp: new Date(), lang,
      }]);
      if (!open) setUnread(u => u + 1);

    } catch {
      // Step 3: API unavailable — use generic fallback (never show "contact kmn@dentons.com")
      setMessages(prev => [...prev, {
        role:"assistant",
        content: FALLBACK[lang],
        timestamp: new Date(), lang,
      }]);
    }
    setLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input, loading, messages, open, lang]);

  const showQuickPrompts = messages.filter(m => m.role === "user").length === 0;

  return (
    <>
      {/* ── Floating button ── */}
      {!open && (
        <button onClick={() => setOpen(true)}
          title={lang === "fr" ? "Assistant Juridique KMN" : "KMN Legal Assistant"}
          style={{
            position:"fixed", bottom:28, right:28,
            width:58, height:58, borderRadius:"50%",
            background:"linear-gradient(135deg, var(--navy), var(--navy-light))",
            border:"2px solid var(--gold)", color:"white", cursor:"pointer",
            display:"flex", alignItems:"center", justifyContent:"center",
            boxShadow:"0 6px 24px rgba(11,31,58,0.35), 0 0 0 4px rgba(201,168,76,0.15)",
            zIndex:999, transition:"transform 0.2s",
          }}
          onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.08)")}
          onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
        >
          <MessageCircle size={26}/>
          {unread > 0 && (
            <span style={{
              position:"absolute", top:-4, right:-4,
              background:"var(--danger)", color:"white",
              borderRadius:"50%", width:20, height:20, fontSize:11, fontWeight:700,
              display:"flex", alignItems:"center", justifyContent:"center",
              border:"2px solid white",
            }}>{unread}</span>
          )}
        </button>
      )}

      {/* ── Chat window ── */}
      {open && (
        <div style={{
          position:"fixed", bottom:28, right:28,
          width:400, height: minimised ? 60 : 590,
          borderRadius:16, background:"white",
          boxShadow:"0 20px 60px rgba(11,31,58,0.25), 0 4px 16px rgba(0,0,0,0.1)",
          display:"flex", flexDirection:"column", overflow:"hidden",
          zIndex:999, transition:"height 0.25s cubic-bezier(0.4,0,0.2,1)",
          border:"1px solid var(--gray-200)",
        }}>

          {/* Header */}
          <div
            onClick={() => setMinimised(!minimised)}
            style={{
              background:"linear-gradient(135deg, var(--navy-dark), var(--navy))",
              padding:"14px 18px", display:"flex", alignItems:"center", gap:12,
              flexShrink:0, cursor:"pointer",
            }}
          >
            <div style={{
              width:38, height:38, borderRadius:"50%", flexShrink:0,
              background:"var(--gold)", display:"flex", alignItems:"center", justifyContent:"center",
            }}>
              <Bot size={20} color="var(--navy)"/>
            </div>
            <div style={{flex:1}}>
              <div style={{color:"white", fontWeight:700, fontSize:14, fontFamily:"Playfair Display,serif"}}>
                {ui.title}
              </div>
              <div style={{color:"rgba(255,255,255,0.6)", fontSize:11, display:"flex", alignItems:"center", gap:4}}>
                <span style={{width:6,height:6,borderRadius:"50%",background:"#4ade80",display:"inline-block"}}/>
                {ui.subtitle}
              </div>
            </div>
            {/* Language indicator */}
            <div style={{
              background:"rgba(201,168,76,0.2)", border:"1px solid rgba(201,168,76,0.4)",
              borderRadius:12, padding:"2px 10px", fontSize:11, fontWeight:700,
              color:"var(--gold-light)", letterSpacing:"0.05em",
            }}>
              {lang.toUpperCase()}
            </div>
            <button onClick={e => { e.stopPropagation(); setMinimised(!minimised); }}
              style={{background:"none",border:"none",cursor:"pointer",color:"rgba(255,255,255,0.7)",padding:4}}>
              <ChevronDown size={16} style={{transform:minimised?"rotate(180deg)":"none",transition:"transform 0.2s"}}/>
            </button>
            <button onClick={e => { e.stopPropagation(); setOpen(false); }}
              style={{background:"none",border:"none",cursor:"pointer",color:"rgba(255,255,255,0.7)",padding:4}}>
              <X size={16}/>
            </button>
          </div>

          {!minimised && (
            <>
              {/* Messages */}
              <div style={{flex:1, overflowY:"auto", padding:"16px 16px 8px"}}>
                {messages.map((msg, i) => (
                  <div key={i} style={{
                    display:"flex", flexDirection:msg.role==="user"?"row-reverse":"row",
                    gap:8, marginBottom:12, alignItems:"flex-start",
                  }}>
                    <div style={{
                      width:28, height:28, borderRadius:"50%", flexShrink:0,
                      background:msg.role==="assistant"?"var(--gold)":"var(--navy)",
                      display:"flex", alignItems:"center", justifyContent:"center",
                    }}>
                      {msg.role==="assistant"
                        ? <Bot size={14} color="var(--navy)"/>
                        : <User size={14} color="white"/>}
                    </div>
                    <div style={{
                      maxWidth:"78%",
                      background:   msg.role==="assistant" ? "var(--gray-50)" : "var(--navy)",
                      color:        msg.role==="assistant" ? "var(--gray-800)" : "white",
                      borderRadius: msg.role==="assistant" ? "4px 14px 14px 14px" : "14px 4px 14px 14px",
                      padding:"10px 13px", fontSize:13, lineHeight:1.6,
                      boxShadow:"0 1px 3px rgba(0,0,0,0.08)",
                      border:msg.role==="assistant"?"1px solid var(--gray-200)":"none",
                    }}>
                      <div style={{wordBreak:"break-word"}}>
                        <RichText text={msg.content}/>
                      </div>
                      <div style={{
                        fontSize:10, opacity:0.5, marginTop:4,
                        display:"flex", justifyContent:"space-between", alignItems:"center",
                      }}>
                        <span style={{fontSize:9, opacity:0.7, fontWeight:600, letterSpacing:"0.05em"}}>
                          {msg.lang?.toUpperCase()}
                        </span>
                        <span>
                          {msg.timestamp.toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"})}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}

                {loading && (
                  <div style={{display:"flex",gap:8,alignItems:"flex-start",marginBottom:12}}>
                    <div style={{width:28,height:28,borderRadius:"50%",background:"var(--gold)",display:"flex",alignItems:"center",justifyContent:"center"}}>
                      <Bot size={14} color="var(--navy)"/>
                    </div>
                    <div style={{background:"var(--gray-50)",border:"1px solid var(--gray-200)",borderRadius:"4px 14px 14px 14px",padding:"12px 16px"}}>
                      <div style={{display:"flex",gap:4,alignItems:"center"}}>
                        {[0,1,2].map(i => (
                          <div key={i} style={{
                            width:7,height:7,borderRadius:"50%",background:"var(--gold)",
                            animation:`bounce 1.2s infinite ${i*0.2}s`,
                          }}/>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                <div ref={bottomRef}/>
              </div>

              {/* Quick prompts — shown before first user message */}
              {showQuickPrompts && (
                <div style={{padding:"0 16px 10px", display:"flex", flexWrap:"wrap", gap:6}}>
                  {ui.quickPrompts.map(p => (
                    <button key={p.label}
                      onClick={() => sendMessage(p.text)}
                      style={{
                        background:"white", border:"1px solid var(--gray-300)",
                        borderRadius:20, padding:"5px 11px", fontSize:11,
                        cursor:"pointer", color:"var(--navy)", fontWeight:500,
                        transition:"all 0.15s", whiteSpace:"nowrap",
                      }}
                      onMouseEnter={e => { (e.target as HTMLElement).style.background="var(--gold-pale)"; (e.target as HTMLElement).style.borderColor="var(--gold)"; }}
                      onMouseLeave={e => { (e.target as HTMLElement).style.background="white"; (e.target as HTMLElement).style.borderColor="var(--gray-300)"; }}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Input */}
              <div style={{
                padding:"12px 16px", borderTop:"1px solid var(--gray-200)",
                display:"flex", gap:8, background:"white", flexShrink:0,
              }}>
                <input
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key==="Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                  placeholder={ui.placeholder}
                  disabled={loading}
                  style={{
                    flex:1, border:"1.5px solid var(--gray-300)", borderRadius:24,
                    padding:"9px 16px", fontSize:13, outline:"none",
                    fontFamily:"inherit", background:loading?"var(--gray-50)":"white",
                    color:"var(--gray-800)", transition:"border-color 0.15s",
                  }}
                  onFocus={e => { e.target.style.borderColor = "var(--gold)"; }}
                  onBlur={e  => { e.target.style.borderColor = "var(--gray-300)"; }}
                />
                <button
                  onClick={() => sendMessage()}
                  disabled={!input.trim() || loading}
                  style={{
                    width:40, height:40, borderRadius:"50%",
                    background: !input.trim()||loading ? "var(--gray-200)" : "linear-gradient(135deg,var(--navy),var(--navy-light))",
                    border:"none", cursor: !input.trim()||loading ? "not-allowed" : "pointer",
                    display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0,
                    transition:"all 0.15s",
                  }}
                >
                  {loading
                    ? <RefreshCw size={16} color="var(--gray-500)" style={{animation:"spin 1s linear infinite"}}/>
                    : <Send size={16} color={!input.trim()?"var(--gray-400)":"white"}/>}
                </button>
              </div>

              {/* Footer */}
              <div style={{padding:"5px 16px 10px", textAlign:"center", fontSize:10, color:"var(--gray-400)"}}>
                Claude AI ·{" "}
                <a href="https://www.dentons.com/en/global-presence/africa/cameroon/douala" target="_blank" rel="noopener noreferrer"
                  style={{color:"var(--gold-dark)",textDecoration:"none"}}>
                  Dentons KMN
                </a>{" "}
                · {ui.footer}
              </div>
            </>
          )}
        </div>
      )}

      <style>{`
        @keyframes bounce { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-6px)} }
        @keyframes spin   { to{transform:rotate(360deg)} }
      `}</style>
    </>
  );
}
