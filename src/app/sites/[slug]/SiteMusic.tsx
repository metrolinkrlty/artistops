"use client";

import { useEffect, useRef, useState } from "react";
import { unlockSiteTrackEmail, unlockSiteTrackShareFollow } from "@/app/sites/actions";

type Track = { trackId: string; title: string; gate: string; previewUrl: string | null };

// Notify the artist's ad pixels of a conversion. No-ops safely if no pixel is
// installed on this page (pixel install on /sites comes in a later phase).
function firePixelLead() {
  const w = window as unknown as Record<string, ((...a: unknown[]) => void) | undefined>;
  try {
    if (typeof w.fbq === "function") w.fbq("track", "Lead");
    const ttq = (window as unknown as { ttq?: { track?: (e: string) => void } }).ttq;
    if (ttq && typeof ttq.track === "function") ttq.track("SubmitForm");
    if (typeof w.gtag === "function") w.gtag("event", "generate_lead");
  } catch {
    /* a blocked pixel must never break unlocking */
  }
}

export default function SiteMusic({
  slug,
  initiallyUnlockedIds,
  previewSeconds,
  followUrl,
  fbPageUrl,
}: {
  slug: string;
  initiallyUnlockedIds: string[] | "all";
  previewSeconds: number;
  followUrl: string | null;
  fbPageUrl: string | null;
}) {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [playing, setPlaying] = useState<string | null>(null);
  const [allUnlocked] = useState(initiallyUnlockedIds === "all");
  const [unlockedIds, setUnlockedIds] = useState<Set<string>>(
    new Set(initiallyUnlockedIds === "all" ? [] : initiallyUnlockedIds)
  );
  const [openGate, setOpenGate] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const previewCap = useRef<number>(previewSeconds || 30);

  useEffect(() => {
    let alive = true;
    fetch(`/api/site/${slug}/tracks`)
      .then((r) => r.json())
      .then((d) => { if (alive && d.ok) setTracks(d.tracks as Track[]); })
      .catch(() => {});
    return () => { alive = false; };
  }, [slug]);

  function isUnlocked(t: Track) {
    return allUnlocked || t.gate === "free" || unlockedIds.has(t.trackId);
  }

  function toggle(t: Track) {
    const a = audioRef.current;
    if (!a) return;
    if (playing === t.trackId) { a.pause(); setPlaying(null); return; }
    const full = isUnlocked(t);
    const src = full ? `/api/site/${slug}/track/${t.trackId}/full` : t.previewUrl;
    if (!src) return;
    a.src = src;
    // Preview mode stops at the artist's preview length; full plays through.
    a.ontimeupdate = full ? null : () => {
      if (a.currentTime >= previewCap.current) { a.pause(); setPlaying(null); }
    };
    void a.play();
    setPlaying(t.trackId);
  }

  async function submitEmail(t: Track, e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || busy) return;
    setBusy(true); setError(null);
    const res = await unlockSiteTrackEmail(slug, t.trackId, email.trim());
    setBusy(false);
    if (res.ok) {
      setUnlockedIds((s) => new Set(s).add(t.trackId));
      setOpenGate(null);
      setEmail("");
      firePixelLead();
    } else {
      setError(res.error || "Something went wrong.");
    }
  }

  async function shareOrFollow(t: Track) {
    // Open the share/follow destination, then optimistically unlock this song.
    const siteUrl = typeof window !== "undefined" ? window.location.href : "";
    if (t.gate === "share") {
      const shareTarget = fbPageUrl || siteUrl;
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareTarget)}`, "_blank", "noopener,width=600,height=500");
    } else if (t.gate === "follow" && followUrl) {
      window.open(followUrl, "_blank", "noopener");
    }
    setBusy(true); setError(null);
    const res = await unlockSiteTrackShareFollow(slug, t.trackId);
    setBusy(false);
    if (res.ok) {
      setUnlockedIds((s) => new Set(s).add(t.trackId));
      setOpenGate(null);
      firePixelLead();
    } else {
      setError("Couldn't unlock. Please try again.");
    }
  }

  if (!tracks.length) return null;

  const inputClass = "rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-neutral-100 outline-none placeholder:text-neutral-500 focus:border-[var(--accent)]";

  return (
    <div className="space-y-2">
      <audio ref={audioRef} onEnded={() => setPlaying(null)} className="hidden" />
      {tracks.map((t) => {
        const isPlaying = playing === t.trackId;
        const unlocked = isUnlocked(t);
        const gateOpen = openGate === t.trackId;
        return (
          <div key={t.trackId} className="rounded-xl border border-white/10 bg-white/[0.03]">
            <div className="flex items-center gap-4 px-5 py-4">
              <button
                type="button"
                onClick={() => toggle(t)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-neutral-950"
                style={{ backgroundColor: "var(--accent)" }}
                aria-label={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? (
                  <svg width="14" height="14" viewBox="0 0 12 12" fill="currentColor"><rect x="2" y="1" width="3" height="10" rx="1" /><rect x="7" y="1" width="3" height="10" rx="1" /></svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 12 12" fill="currentColor"><path d="M2 1.5v9l8-4.5-8-4.5Z" /></svg>
                )}
              </button>
              <span className="flex-1 font-medium text-neutral-100">{t.title}</span>
              {unlocked ? (
                <span className="text-xs uppercase tracking-widest text-neutral-500">{isPlaying ? "Playing" : "Full"}</span>
              ) : (
                <button
                  type="button"
                  onClick={() => setOpenGate(gateOpen ? null : t.trackId)}
                  className="rounded-lg border border-[var(--accent)]/50 px-3 py-1.5 text-xs font-semibold uppercase tracking-widest transition hover:bg-white/[0.06]"
                  style={{ color: "var(--accent)" }}
                >
                  Unlock
                </button>
              )}
            </div>

            {/* Per-song gate */}
            {!unlocked && gateOpen && (
              <div className="border-t border-white/10 px-5 py-4">
                {t.gate === "email" && (
                  <form onSubmit={(e) => submitEmail(t, e)} className="flex flex-col gap-2 sm:flex-row">
                    <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" className={`flex-1 ${inputClass}`} />
                    <button type="submit" disabled={busy} className="rounded-lg px-5 py-2 text-sm font-semibold text-neutral-950 transition disabled:opacity-60" style={{ backgroundColor: "var(--accent)" }}>
                      {busy ? "Unlocking…" : "Email me the full song"}
                    </button>
                  </form>
                )}
                {t.gate === "share" && (
                  <button type="button" disabled={busy} onClick={() => shareOrFollow(t)} className="w-full rounded-lg px-5 py-2.5 text-sm font-semibold text-neutral-950 transition disabled:opacity-60" style={{ backgroundColor: "var(--accent)" }}>
                    {busy ? "Unlocking…" : "Share on Facebook to unlock"}
                  </button>
                )}
                {t.gate === "follow" && (
                  <button type="button" disabled={busy || !followUrl} onClick={() => shareOrFollow(t)} className="w-full rounded-lg px-5 py-2.5 text-sm font-semibold text-neutral-950 transition disabled:opacity-60" style={{ backgroundColor: "var(--accent)" }}>
                    {busy ? "Unlocking…" : followUrl ? "Follow to unlock" : "Follow link not set"}
                  </button>
                )}
                <p className="pt-2 text-xs text-neutral-500">
                  {t.gate === "email" ? `${previewCap.current}s preview. Enter your email to hear the whole thing.` : "One tap unlocks the full song."}
                </p>
              </div>
            )}
          </div>
        );
      })}
      {error && <p className="pt-1 text-sm text-red-400">{error}</p>}
    </div>
  );
}
