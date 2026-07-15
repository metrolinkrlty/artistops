"use client";

import { useEffect, useRef, useState } from "react";
import { unlockSiteTracks } from "@/app/sites/actions";

type Track = { trackId: string; title: string; previewUrl: string | null };

// Preview player with an email gate. Locked → 30s previews; after the visitor
// enters their email, full tracks stream through the cookie-gated proxy.
export default function SiteMusic({
  slug,
  initiallyUnlocked,
}: {
  slug: string;
  initiallyUnlocked: boolean;
}) {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [playing, setPlaying] = useState<string | null>(null);
  const [unlocked, setUnlocked] = useState(initiallyUnlocked);
  const [gateOpen, setGateOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    let alive = true;
    fetch(`/api/site/${slug}/tracks`)
      .then((r) => r.json())
      .then((d) => {
        if (alive && d.ok) setTracks(d.tracks as Track[]);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [slug]);

  function toggle(t: Track) {
    const a = audioRef.current;
    if (!a) return;
    if (playing === t.trackId) {
      a.pause();
      setPlaying(null);
      return;
    }
    const src = unlocked ? `/api/site/${slug}/track/${t.trackId}/full` : t.previewUrl;
    if (!src) return;
    a.src = src;
    void a.play();
    setPlaying(t.trackId);
  }

  async function onUnlock(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || sending) return;
    setSending(true);
    setError(null);
    const res = await unlockSiteTracks(slug, email.trim(), name.trim() || undefined);
    setSending(false);
    if (res.ok) {
      setUnlocked(true);
      setGateOpen(false);
    } else {
      setError(res.error || "Something went wrong.");
    }
  }

  if (!tracks.length) return null;

  return (
    <div className="space-y-2">
      <audio ref={audioRef} onEnded={() => setPlaying(null)} className="hidden" />
      {tracks.map((t) => {
        const isPlaying = playing === t.trackId;
        return (
          <button
            key={t.trackId}
            type="button"
            onClick={() => toggle(t)}
            className="flex w-full items-center gap-4 rounded-xl border border-white/10 bg-white/[0.03] px-5 py-4 text-left transition hover:border-[var(--accent)]/60 hover:bg-white/[0.06]"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-neutral-950" style={{ backgroundColor: "var(--accent)" }} aria-hidden>
              {isPlaying ? (
                <svg width="14" height="14" viewBox="0 0 12 12" fill="currentColor"><rect x="2" y="1" width="3" height="10" rx="1" /><rect x="7" y="1" width="3" height="10" rx="1" /></svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 12 12" fill="currentColor"><path d="M2 1.5v9l8-4.5-8-4.5Z" /></svg>
              )}
            </span>
            <span className="flex-1 font-medium text-neutral-100">{t.title}</span>
            <span className="text-xs uppercase tracking-widest text-neutral-500">
              {isPlaying ? "Playing" : unlocked ? "Full" : "Preview"}
            </span>
          </button>
        );
      })}

      {unlocked ? (
        <p className="pt-2 text-sm text-neutral-500">Full tracks unlocked — thanks for listening.</p>
      ) : gateOpen ? (
        <form onSubmit={onUnlock} className="mt-3 flex flex-col gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-4 sm:flex-row">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name (optional)"
            className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-neutral-100 outline-none placeholder:text-neutral-500 focus:border-[var(--accent)] sm:w-40"
          />
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@email.com"
            className="flex-1 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-neutral-100 outline-none placeholder:text-neutral-500 focus:border-[var(--accent)]"
          />
          <button type="submit" disabled={sending} className="rounded-lg px-5 py-2 text-sm font-semibold text-neutral-950 transition disabled:opacity-60" style={{ backgroundColor: "var(--accent)" }}>
            {sending ? "Unlocking…" : "Unlock"}
          </button>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setGateOpen(true)}
          className="mt-3 w-full rounded-xl border border-[var(--accent)]/50 bg-white/[0.02] px-5 py-3 text-center text-sm font-semibold uppercase tracking-widest transition hover:bg-white/[0.05]"
          style={{ color: "var(--accent)" }}
        >
          Hear the full songs — free
        </button>
      )}
      {error && <p className="pt-1 text-sm text-red-400">{error}</p>}
      {!unlocked && (
        <p className="pt-1 text-xs text-neutral-500">
          30-second previews. Enter your email once to stream every song in full.
        </p>
      )}
    </div>
  );
}
