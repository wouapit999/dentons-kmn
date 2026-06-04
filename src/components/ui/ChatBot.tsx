import React, { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, RefreshCw, Bot, User, ExternalLink, ChevronDown } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const QUICK_PROMPTS = [
  { label: "How to create a matter?", text: "How do I create a new matter in the system?" },
  { label: "How to generate an invoice?", text: "How do I create an invoice and add line items?" },
  { label: "OHADA company types", text: "What are the different types of companies under OHADA law?" },
  { label: "Cameroon VAT rate", text: "What is the VAT rate in Cameroon and how is it calculated?" },
  { label: "Approve time entries", text: "How do I approve time entries in the billing module?" },
  { label: "Labour law Cameroon", text: "What are the key provisions of the Cameroon Labour Code?" },
];

function formatMessage(text: string) {
  // Convert markdown-style links, bold, and line breaks
  const parts = text.split(/(\[.*?\]\(.*?\)|https?:\/\/[^\s)]+|\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    // [text](url) links
    const linkMatch = part.match(/\[(.+?)\]\((https?:\/\/.+?)\)/);
    if (linkMatch) {
      return <a key={i} href={linkMatch[2]} target="_blank" rel="noopener noreferrer" style={{ color:"var(--gold-light)", textDecoration:"underline", display:"inline-flex", alignItems:"center", gap:3 }}>{linkMatch[1]}<ExternalLink size={11}/></a>;
    }
    // bare URLs
    if (part.match(/^https?:\/\//)) {
      return <a key={i} href={part} target="_blank" rel="noopener noreferrer" style={{ color:"var(--gold-light)", textDecoration:"underline", display:"inline-flex", alignItems:"center", gap:3 }}>{part}<ExternalLink size={11}/></a>;
    }
    // **bold**
    const boldMatch = part.match(/^\*\*(.+)\*\*$/);
    if (boldMatch) {
      return <strong key={i}>{boldMatch[1]}</strong>;
    }
    // Regular text — preserve newlines
    return <span key={i}>{part.split("\n").map((line, j) => (
      <React.Fragment key={j}>{line}{j < part.split("\n").length - 1 && <br/>}</React.Fragment>
    ))}</span>;
  });
}

export default function ChatBot() {
  const [open, setOpen]           = useState(false);
  const [minimised, setMinimised] = useState(false);
  const [messages, setMessages]   = useState<Message[]>([{
    role:      "assistant",
    content:   "👋 Hello! I'm **KMN Assistant**, your AI legal guide.\n\nI can help you:\n• Navigate the Dentons KMN software\n• Answer questions on **Cameroon & OHADA law**\n• Provide legal references and official links\n\nHow can I assist you today?",
    timestamp: new Date(),
  }]);
  const [input, setInput]         = useState("");
  const [loading, setLoading]     = useState(false);
  const [unread, setUnread]       = useState(0);
  const bottomRef                 = useRef<HTMLDivElement>(null);
  const inputRef                  = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setUnread(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  const sendMessage = async (text?: string) => {
    const content = (text || input).trim();
    if (!content || loading) return;
    setInput("");

    const userMsg: Message = { role: "user", content, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const history = [...messages, userMsg].map(m => ({ role: m.role, content: m.content }));
      const res = await fetch("/api/chat", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ messages: history }),
      });

      if (!res.ok) throw new Error("API error");
      const data = await res.json();
      const reply: Message = { role: "assistant", content: data.reply || "Sorry, I could not process that request.", timestamp: new Date() };
      setMessages(prev => [...prev, reply]);
      if (!open) setUnread(u => u + 1);

    } catch {
      setMessages(prev => [...prev, {
        role:      "assistant",
        content:   "⚠️ I'm currently unavailable. Please ensure the AI service is configured. Contact **kmn@dentons.com** for assistance.",
        timestamp: new Date(),
      }]);
    }
    setLoading(false);
  };

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          style={{
            position:    "fixed",
            bottom:      28,
            right:       28,
            width:       58,
            height:      58,
            borderRadius:"50%",
            background:  "linear-gradient(135deg, var(--navy), var(--navy-light))",
            border:      "2px solid var(--gold)",
            color:       "white",
            cursor:      "pointer",
            display:     "flex",
            alignItems:  "center",
            justifyContent:"center",
            boxShadow:   "0 6px 24px rgba(11,31,58,0.35), 0 0 0 4px rgba(201,168,76,0.15)",
            zIndex:      999,
            transition:  "all 0.2s",
          }}
          title="KMN Legal Assistant"
        >
          <MessageCircle size={26} />
          {unread > 0 && (
            <span style={{
              position: "absolute", top: -4, right: -4,
              background: "var(--danger)", color: "white",
              borderRadius: "50%", width: 20, height: 20,
              fontSize: 11, fontWeight: 700,
              display: "flex", alignItems: "center", justifyContent: "center",
              border: "2px solid white",
            }}>{unread}</span>
          )}
        </button>
      )}

      {/* Chat window */}
      {open && (
        <div style={{
          position:     "fixed",
          bottom:       28,
          right:        28,
          width:        400,
          height:       minimised ? 60 : 580,
          borderRadius: 16,
          background:   "white",
          boxShadow:    "0 20px 60px rgba(11,31,58,0.25), 0 4px 16px rgba(0,0,0,0.1)",
          display:      "flex",
          flexDirection:"column",
          overflow:     "hidden",
          zIndex:       999,
          transition:   "height 0.25s cubic-bezier(0.4,0,0.2,1)",
          border:       "1px solid var(--gray-200)",
        }}>
          {/* Header */}
          <div style={{
            background:     "linear-gradient(135deg, var(--navy-dark), var(--navy))",
            padding:        "14px 18px",
            display:        "flex",
            alignItems:     "center",
            gap:            12,
            flexShrink:     0,
            cursor:         "pointer",
          }} onClick={() => setMinimised(!minimised)}>
            <div style={{
              width: 36, height: 36, borderRadius: "50%",
              background: "var(--gold)", display: "flex",
              alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <Bot size={20} color="var(--navy)" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ color: "white", fontWeight: 700, fontSize: 14 }}>KMN Assistant</div>
              <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 11, display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ade80", display: "inline-block" }}/>
                AI Legal Guide · Powered by Claude
              </div>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <button onClick={e => { e.stopPropagation(); setMinimised(!minimised); }}
                style={{ background:"none", border:"none", cursor:"pointer", color:"rgba(255,255,255,0.7)", padding:4 }}>
                <ChevronDown size={16} style={{ transform: minimised ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}/>
              </button>
              <button onClick={e => { e.stopPropagation(); setOpen(false); }}
                style={{ background:"none", border:"none", cursor:"pointer", color:"rgba(255,255,255,0.7)", padding:4 }}>
                <X size={16}/>
              </button>
            </div>
          </div>

          {!minimised && (
            <>
              {/* Messages */}
              <div style={{ flex:1, overflowY:"auto", padding:"16px 16px 8px" }}>
                {messages.map((msg, i) => (
                  <div key={i} style={{
                    display:       "flex",
                    flexDirection: msg.role==="user" ? "row-reverse" : "row",
                    gap:           8,
                    marginBottom:  12,
                    alignItems:    "flex-start",
                  }}>
                    {/* Avatar */}
                    <div style={{
                      width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                      background: msg.role==="assistant" ? "var(--gold)" : "var(--navy)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      {msg.role==="assistant"
                        ? <Bot size={14} color="var(--navy)"/>
                        : <User size={14} color="white"/>}
                    </div>
                    {/* Bubble */}
                    <div style={{
                      maxWidth:     "78%",
                      background:   msg.role==="assistant" ? "var(--gray-50)" : "var(--navy)",
                      color:        msg.role==="assistant" ? "var(--gray-800)" : "white",
                      borderRadius: msg.role==="assistant" ? "4px 14px 14px 14px" : "14px 4px 14px 14px",
                      padding:      "10px 13px",
                      fontSize:     13,
                      lineHeight:   1.6,
                      boxShadow:    "0 1px 3px rgba(0,0,0,0.08)",
                      border:       msg.role==="assistant" ? "1px solid var(--gray-200)" : "none",
                    }}>
                      <div style={{ wordBreak: "break-word" }}>
                        {formatMessage(msg.content)}
                      </div>
                      <div style={{ fontSize: 10, opacity: 0.5, marginTop: 4, textAlign: "right" }}>
                        {msg.timestamp.toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" })}
                      </div>
                    </div>
                  </div>
                ))}

                {loading && (
                  <div style={{ display:"flex", gap:8, alignItems:"flex-start", marginBottom:12 }}>
                    <div style={{ width:28,height:28,borderRadius:"50%",background:"var(--gold)",display:"flex",alignItems:"center",justifyContent:"center" }}>
                      <Bot size={14} color="var(--navy)"/>
                    </div>
                    <div style={{ background:"var(--gray-50)", border:"1px solid var(--gray-200)", borderRadius:"4px 14px 14px 14px", padding:"12px 16px" }}>
                      <div style={{ display:"flex", gap:4, alignItems:"center" }}>
                        {[0,1,2].map(i => (
                          <div key={i} style={{
                            width:7, height:7, borderRadius:"50%", background:"var(--gold)",
                            animation:`bounce 1.2s infinite ${i*0.2}s`,
                          }}/>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                <div ref={bottomRef}/>
              </div>

              {/* Quick prompts */}
              {messages.length <= 1 && (
                <div style={{ padding:"0 16px 10px", display:"flex", flexWrap:"wrap", gap:6 }}>
                  {QUICK_PROMPTS.map(p => (
                    <button key={p.label}
                      onClick={() => sendMessage(p.text)}
                      style={{
                        background: "white", border: "1px solid var(--gray-300)",
                        borderRadius: 20, padding: "5px 11px", fontSize: 11,
                        cursor: "pointer", color: "var(--navy)", fontWeight: 500,
                        transition: "all 0.15s", whiteSpace: "nowrap",
                      }}
                      onMouseEnter={e => { (e.target as HTMLElement).style.background = "var(--gold-pale)"; (e.target as HTMLElement).style.borderColor = "var(--gold)"; }}
                      onMouseLeave={e => { (e.target as HTMLElement).style.background = "white"; (e.target as HTMLElement).style.borderColor = "var(--gray-300)"; }}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Input */}
              <div style={{
                padding:    "12px 16px",
                borderTop:  "1px solid var(--gray-200)",
                display:    "flex",
                gap:        8,
                background: "white",
                flexShrink: 0,
              }}>
                <input
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key==="Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                  placeholder="Ask about the app or Cameroon law..."
                  disabled={loading}
                  style={{
                    flex:         1,
                    border:       "1.5px solid var(--gray-300)",
                    borderRadius: 24,
                    padding:      "9px 16px",
                    fontSize:     13,
                    outline:      "none",
                    fontFamily:   "inherit",
                    background:   loading ? "var(--gray-50)" : "white",
                    color:        "var(--gray-800)",
                    transition:   "border-color 0.15s",
                  }}
                  onFocus={e => { e.target.style.borderColor = "var(--gold)"; }}
                  onBlur={e => { e.target.style.borderColor = "var(--gray-300)"; }}
                />
                <button
                  onClick={() => sendMessage()}
                  disabled={!input.trim() || loading}
                  style={{
                    width:          40,
                    height:         40,
                    borderRadius:   "50%",
                    background:     !input.trim() || loading ? "var(--gray-200)" : "linear-gradient(135deg, var(--navy), var(--navy-light))",
                    border:         "none",
                    cursor:         !input.trim() || loading ? "not-allowed" : "pointer",
                    display:        "flex",
                    alignItems:     "center",
                    justifyContent: "center",
                    flexShrink:     0,
                    transition:     "all 0.15s",
                  }}
                >
                  {loading
                    ? <RefreshCw size={16} color="var(--gray-500)" style={{ animation: "spin 1s linear infinite" }}/>
                    : <Send size={16} color={!input.trim() ? "var(--gray-400)" : "white"}/>}
                </button>
              </div>

              {/* Footer */}
              <div style={{ padding:"6px 16px 10px", textAlign:"center", fontSize:10, color:"var(--gray-400)" }}>
                Powered by Claude AI · <a href="https://www.dentons.com/en/global-presence/africa/cameroon/douala" target="_blank" rel="noopener noreferrer" style={{ color:"var(--gold-dark)", textDecoration:"none" }}>Dentons KMN</a> · Not a substitute for legal advice
              </div>
            </>
          )}
        </div>
      )}

      <style>{`
        @keyframes bounce {
          0%,80%,100% { transform: translateY(0); }
          40%          { transform: translateY(-6px); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </>
  );
}
