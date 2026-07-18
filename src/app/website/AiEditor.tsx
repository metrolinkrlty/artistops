"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

type ChatMessage = { role: "user" | "assistant"; content: string; changed?: string[] };

const SUGGESTIONS = [
  "Punch up my bio to sound more confident",
  "Add my Spotify: https://open.spotify.com/…",
  "Change my tagline to something with more twang",
  "What does my site say right now?",
];

export default function AiEditor() {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, pending]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || pending) return;
    setError(null);
    const next: ChatMessage[] = [...messages, { role: "user", content: trimmed }];
    setMessages(next);
    setInput("");
    setPending(true);
    try {
      const res = await fetch("/api/website/ai-edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: next.map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong.");
        setMessages(next); // keep the user message visible
      } else {
        setMessages([
          ...next,
          { role: "assistant", content: data.reply, changed: data.changed ?? [] },
        ]);
        // If the site changed, refresh so the form fields above reflect the edits.
        if (Array.isArray(data.changed) && data.changed.length) router.refresh();
      }
    } catch {
      setError("Couldn't reach the editor. Check your connection and try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="rounded-xl border border-border bg-card p-6">
      <div className="mb-1 flex items-center gap-2">
        <Sparkles className="h-4.5 w-4.5 text-primary" />
        <h2 className="text-lg font-semibold">Edit with AI</h2>
      </div>
      <p className="mb-4 text-sm text-muted-foreground">
        Describe what you want in plain English — I&rsquo;ll update your bio, tagline, location,
        and links, and your live site updates to match.
      </p>

      <div
        ref={scrollRef}
        className="mb-3 max-h-80 space-y-3 overflow-y-auto rounded-lg border border-border/60 bg-background/40 p-3"
      >
        {messages.length === 0 ? (
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">Try one of these:</p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => send(s)}
                  className="rounded-full border border-border bg-card px-3 py-1 text-xs text-foreground transition hover:border-primary hover:text-primary"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m, i) => (
            <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
              <div
                className={
                  m.role === "user"
                    ? "max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-3 py-2 text-sm text-primary-foreground"
                    : "max-w-[85%] rounded-2xl rounded-bl-sm bg-muted px-3 py-2 text-sm text-foreground"
                }
              >
                <p className="whitespace-pre-wrap">{m.content}</p>
                {m.changed && m.changed.length > 0 && (
                  <p className="mt-1.5 text-xs text-emerald-500">✓ {m.changed.join(" · ")}</p>
                )}
              </div>
            </div>
          ))
        )}
        {pending && (
          <div className="flex justify-start">
            <div className="rounded-2xl rounded-bl-sm bg-muted px-3 py-2 text-sm text-muted-foreground">
              <span className="inline-flex gap-1">
                <span className="animate-bounce">·</span>
                <span className="animate-bounce [animation-delay:150ms]">·</span>
                <span className="animate-bounce [animation-delay:300ms]">·</span>
              </span>
            </div>
          </div>
        )}
      </div>

      {error && <p className="mb-2 text-sm text-destructive">{error}</p>}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="flex items-center gap-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="e.g. rewrite my bio to mention my hometown"
          disabled={pending}
          className="h-9 flex-1 rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
        />
        <Button type="submit" disabled={pending || !input.trim()}>
          Send
        </Button>
      </form>
    </section>
  );
}
