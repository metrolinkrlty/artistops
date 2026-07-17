"use client";

import { useState, useRef, useEffect } from "react";
import { Send, MessageSquare, ArrowLeft } from "lucide-react";
import { getUserThread, adminSendMessage, type AdminMessageView } from "../admin/actions";
import type { ConversationSummary } from "./actions";

function formatTime(iso: string) {
  return new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export default function AdminInbox({ conversations }: { conversations: ConversationSummary[] }) {
  const [convos, setConvos] = useState(conversations);
  const [active, setActive] = useState<ConversationSummary | null>(null);
  const [thread, setThread] = useState<AdminMessageView[]>([]);
  const [loading, setLoading] = useState(false);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [thread.length]);

  async function open(c: ConversationSummary) {
    setActive(c);
    setError("");
    setLoading(true);
    const msgs = await getUserThread(c.userId);
    setThread(msgs);
    setLoading(false);
    // Opening marks their messages read — clear the unread badge locally.
    setConvos((list) => list.map((x) => (x.userId === c.userId ? { ...x, unread: 0 } : x)));
  }

  async function send() {
    if (!active) return;
    const text = body.trim();
    if (!text) return;
    setSending(true); setError("");
    const res = await adminSendMessage(active.userId, text);
    setSending(false);
    if (!res.ok) { setError(res.error || "Couldn't send."); return; }
    setThread((m) => [...m, { id: `tmp-${Date.now()}`, fromAdmin: true, body: text, createdAt: new Date().toISOString() }]);
    setBody("");
  }

  if (active) {
    return (
      <div className="p-8 max-w-2xl">
        <button onClick={() => setActive(null)} className="mb-4 inline-flex items-center gap-1.5 text-sm text-[#8b8fa8] hover:text-white">
          <ArrowLeft className="w-4 h-4" /> All conversations
        </button>
        <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl flex flex-col" style={{ minHeight: "24rem" }}>
          <div className="px-5 py-3 border-b border-[#2a2d3a]">
            <p className="text-white font-medium">{active.artistName}</p>
            <p className="text-[#8b8fa8] text-xs">{active.email}</p>
          </div>
          <div className="flex-1 p-5 space-y-3 overflow-y-auto" style={{ maxHeight: "55vh" }}>
            {loading ? (
              <p className="text-[#8b8fa8] text-sm text-center py-8">Loading…</p>
            ) : thread.length === 0 ? (
              <p className="text-[#8b8fa8] text-sm text-center py-8">No messages yet.</p>
            ) : (
              thread.map((m) => (
                <div key={m.id} className={`flex ${m.fromAdmin ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${m.fromAdmin ? "bg-indigo-600 text-white" : "bg-[#2a2d3a] text-white"}`}>
                    <p className="text-[10px] uppercase tracking-wide opacity-60 mb-0.5">{m.fromAdmin ? "You (team)" : active.artistName}</p>
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{m.body}</p>
                    <p className="text-[10px] opacity-50 mt-1">{formatTime(m.createdAt)}</p>
                  </div>
                </div>
              ))
            )}
            <div ref={endRef} />
          </div>
          <form onSubmit={(e) => { e.preventDefault(); send(); }} className="border-t border-[#2a2d3a] p-3 flex items-end gap-2">
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
              rows={1}
              placeholder={`Reply to ${active.artistName}…`}
              className="flex-1 bg-[#0f1117] border border-[#2a2d3a] text-white px-3 py-2.5 rounded-lg text-sm placeholder:text-[#8b8fa8] focus:outline-none focus:border-indigo-500 resize-none"
            />
            <button type="submit" disabled={sending || !body.trim()} className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50">
              <Send className="w-4 h-4" /> Send
            </button>
          </form>
        </div>
        {error && <p className="text-red-400 text-sm mt-3">{error}</p>}
      </div>
    );
  }

  return (
    <div className="p-8 max-w-2xl">
      {convos.length === 0 ? (
        <div className="text-center py-16">
          <MessageSquare className="w-8 h-8 text-[#5a5e72] mx-auto mb-3" />
          <p className="text-[#8b8fa8] text-sm">No conversations yet. When an artist messages you, it&rsquo;ll appear here.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {convos.map((c) => (
            <button
              key={c.userId}
              onClick={() => open(c)}
              className="w-full text-left bg-[#1a1d27] border border-[#2a2d3a] rounded-xl px-5 py-4 hover:border-indigo-500/50 transition-colors flex items-center gap-3"
            >
              <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                {c.artistName.trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-white font-medium truncate">{c.artistName}</span>
                  {c.unread > 0 && (
                    <span className="min-w-[18px] h-[18px] px-1.5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">{c.unread}</span>
                  )}
                </div>
                <p className={`text-sm truncate ${c.unread > 0 ? "text-white" : "text-[#8b8fa8]"}`}>
                  {c.lastFromAdmin ? "You: " : ""}{c.lastBody}
                </p>
              </div>
              <span className="text-[#5a5e72] text-xs flex-shrink-0">{formatTime(c.lastAt)}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
