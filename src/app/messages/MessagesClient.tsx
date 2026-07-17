"use client";

import { useState, useRef, useEffect } from "react";
import { Send, MessageSquare } from "lucide-react";
import { sendMyMessage, type MessageView } from "./actions";

function formatTime(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function MessagesClient({ initialThread }: { initialThread: MessageView[] }) {
  const [thread, setThread] = useState(initialThread);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [thread.length]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const text = body.trim();
    if (!text) return;
    setSending(true);
    setError("");
    // Optimistic append.
    const optimistic: MessageView = {
      id: `tmp-${Date.now()}`,
      fromAdmin: false,
      body: text,
      createdAt: new Date().toISOString(),
    };
    setThread((t) => [...t, optimistic]);
    setBody("");
    const res = await sendMyMessage(text);
    setSending(false);
    if (!res.ok) {
      setThread((t) => t.filter((m) => m.id !== optimistic.id)); // rollback
      setError(res.error || "Couldn't send. Please try again.");
      setBody(text);
    }
  }

  return (
    <div className="p-8 max-w-2xl">
      <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-xl p-4 mb-5 flex items-start gap-3">
        <MessageSquare className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-[#c7cad8] leading-relaxed">
          This is your direct line to the ArtistOps team. Ask a question, report
          something that looks off, or tell us what you need — we&rsquo;ll reply here, and
          you&rsquo;ll get an email when we do.
        </p>
      </div>

      <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl flex flex-col" style={{ minHeight: "24rem" }}>
        <div className="flex-1 p-5 space-y-3 overflow-y-auto" style={{ maxHeight: "60vh" }}>
          {thread.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-12">
              <MessageSquare className="w-8 h-8 text-[#5a5e72] mb-3" />
              <p className="text-[#8b8fa8] text-sm">No messages yet. Say hello — we read every one.</p>
            </div>
          ) : (
            thread.map((m) => (
              <div key={m.id} className={`flex ${m.fromAdmin ? "justify-start" : "justify-end"}`}>
                <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${m.fromAdmin ? "bg-[#2a2d3a] text-white" : "bg-indigo-600 text-white"}`}>
                  <p className="text-[10px] uppercase tracking-wide opacity-60 mb-0.5">
                    {m.fromAdmin ? "ArtistOps team" : "You"}
                  </p>
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{m.body}</p>
                  <p className="text-[10px] opacity-50 mt-1">{formatTime(m.createdAt)}</p>
                </div>
              </div>
            ))
          )}
          <div ref={endRef} />
        </div>

        <form onSubmit={handleSend} className="border-t border-[#2a2d3a] p-3 flex items-end gap-2">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(e); }
            }}
            rows={1}
            placeholder="Write a message…  (Enter to send, Shift+Enter for a new line)"
            className="flex-1 bg-[#0f1117] border border-[#2a2d3a] text-white px-3 py-2.5 rounded-lg text-sm placeholder:text-[#8b8fa8] focus:outline-none focus:border-indigo-500 resize-none"
          />
          <button
            type="submit"
            disabled={sending || !body.trim()}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            <Send className="w-4 h-4" /> Send
          </button>
        </form>
      </div>
      {error && <p className="text-red-400 text-sm mt-3">{error}</p>}
    </div>
  );
}
