"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { unlockSiteTrackEmail, unlockSiteTrackShareFollow } from "@/app/sites/actions";

type Track = { trackId: string; title: string; gate: string; previewUrl: string | null };

// Notify the artist's ad pixels of a conversion (no-op if none installed).
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

function fmt(s: number) {
  if (!isFinite(s) || s < 0) return "0:00";
  const m = Math.floor(s / 60);
  const ss = Math.floor(s % 60);
  return `${m}:${String(ss).padStart(2, "0")}`;
}

// A decorative waveform (not real audio) — a fixed, pleasant bar pattern.
function useWaveBars() {
  return useMemo(
    () =>
      Array.from({ length: 56 }, (_, i) => {
        const v =
          Math.sin(i * 0.45) * 0.5 + Math.sin(i * 0.17 + 1) * 0.3 + Math.sin(i * 0.9) * 0.2;
        return 22 + Math.abs(v) * 64; // ~22–86% height
      }),
    []
  );
}

function WaveBars({ className }: { className?: string }) {
  const bars = useWaveBars();
  return (
    <div className={`flex h-full w-full items-center gap-[2px] ${className ?? ""}`}>
      {bars.map((h, i) => (
        <div key={i} className="flex-1 rounded-full bg-current" style={{ height: `${h}%` }} />
      ))}
    </div>
  );
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
  const previewCap = previewSeconds || 30;

  // Refs the rAF loop writes to directly (bypassing React re-render for smoothness).
  const shadeRef = useRef<HTMLDivElement | null>(null);
  const waveClipRef = useRef<HTMLDivElement | null>(null);
  const handleRef = useRef<HTMLDivElement | null>(null);
  const timeRef = useRef<HTMLSpanElement | null>(null);
  const seekAreaRef = useRef<HTMLDivElement | null>(null);
  const draggingRef = useRef(false);
  const totalRef = useRef(previewCap);
  const unlockedRef = useRef(false);

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

  // One frame of visual work: write the shade width, waveform reveal, handle
  // position, and time directly to the DOM (no React re-render → no jerk). Also
  // enforces the preview cap. Called both by the audio's timeupdate event (fires
  // even when the tab is hidden) and by rAF (for 60fps smoothing when visible).
  const writeFrameRef = useRef<() => void>(() => {});
  writeFrameRef.current = () => {
    const a = audioRef.current;
    if (!a) return;
    const total = unlockedRef.current && isFinite(a.duration) ? a.duration : previewCap;
    totalRef.current = total;
    const prog = total > 0 ? Math.min(1, a.currentTime / total) : 0;
    const pct = `${prog * 100}%`;
    if (shadeRef.current) shadeRef.current.style.width = pct;
    if (waveClipRef.current) waveClipRef.current.style.clipPath = `inset(0 ${(1 - prog) * 100}% 0 0)`;
    if (handleRef.current) handleRef.current.style.left = pct;
    if (timeRef.current) timeRef.current.textContent = `${fmt(a.currentTime)} / ${fmt(total)}${unlockedRef.current ? "" : " · preview"}`;
    if (!unlockedRef.current && a.currentTime >= previewCap) { a.pause(); setPlaying(null); }
  };

  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    const loop = () => { writeFrameRef.current(); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [playing]);

  function play(t: Track) {
    const a = audioRef.current;
    if (!a) return;
    if (playing === t.trackId) { a.pause(); setPlaying(null); return; }
    const full = isUnlocked(t);
    const src = full ? `/api/site/${slug}/track/${t.trackId}/full` : t.previewUrl;
    if (!src) return;
    unlockedRef.current = full;
    totalRef.current = previewCap;
    a.src = src;
    void a.play();
    setPlaying(t.trackId);
  }

  function seekFromClientX(clientX: number) {
    const a = audioRef.current;
    const area = seekAreaRef.current;
    if (!a || !area) return;
    const rect = area.getBoundingClientRect();
    const frac = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    a.currentTime = frac * totalRef.current;
  }

  async function submitEmail(t: Track, e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || busy) return;
    setBusy(true); setError(null);
    const res = await unlockSiteTrackEmail(slug, t.trackId, email.trim());
    setBusy(false);
    if (res.ok) {
      setUnlockedIds((s) => new Set(s).add(t.trackId));
      setOpenGate(null); setEmail("");
      firePixelLead();
    } else {
      setError(res.error || "Something went wrong.");
    }
  }

  async function shareOrFollow(t: Track) {
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

  const anyLocked = tracks.some((t) => !isUnlocked(t));
  const inputClass = "rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-neutral-100 outline-none placeholder:text-neutral-500 focus:border-[var(--accent)]";

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
      <audio ref={audioRef} onTimeUpdate={() => writeFrameRef.current()} onEnded={() => setPlaying(null)} className="hidden" />

      <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
        <span className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--accent)" }}>
          {previewCap}-second previews
        </span>
        {anyLocked && (
          <span className="text-xs uppercase tracking-widest text-neutral-400">Unlock to hear the full song →</span>
        )}
      </div>

      <div className="divide-y divide-white/10">
        {tracks.map((t) => {
          const active = playing === t.trackId;
          const unlocked = isUnlocked(t);
          const gateOpen = openGate === t.trackId;
          return (
            <div key={t.trackId} className="relative select-none">
              {/* Animated shade + waveform (only for the playing row). rAF writes width/clip/left. */}
              {active && (
                <div ref={seekAreaRef} className="pointer-events-none absolute inset-0 z-0">
                  {/* faint full waveform (the unplayed hint) */}
                  <div className="absolute inset-y-0 left-0 right-0 px-5 py-3 opacity-[0.12] text-neutral-300">
                    <WaveBars />
                  </div>
                  {/* shaded (played) area — a soft accent wash that grows */}
                  <div ref={shadeRef} className="absolute inset-y-0 left-0 will-change-[width]" style={{ width: "0%", backgroundColor: "var(--accent)", opacity: 0.14 }} />
                  {/* accent waveform, revealed by clip-path as the shade grows */}
                  <div ref={waveClipRef} className="absolute inset-y-0 left-0 right-0 px-5 py-3 will-change-[clip-path]" style={{ color: "var(--accent)", clipPath: "inset(0 100% 0 0)" }}>
                    <WaveBars />
                  </div>
                </div>
              )}

              {/* Leading-edge scrubber — grab and drag to seek */}
              {active && (
                <div
                  ref={handleRef}
                  className="absolute inset-y-0 z-20 -ml-2 flex w-4 cursor-ew-resize touch-none items-center justify-center will-change-[left]"
                  style={{ left: "0%" }}
                  onPointerDown={(e) => { draggingRef.current = true; seekFromClientX(e.clientX); try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* best-effort */ } }}
                  onPointerMove={(e) => { if (draggingRef.current) seekFromClientX(e.clientX); }}
                  onPointerUp={(e) => { draggingRef.current = false; try { e.currentTarget.releasePointerCapture(e.pointerId); } catch { /* best-effort */ } }}
                  aria-label="Scrub"
                >
                  <div className="h-full w-[3px] rounded-full" style={{ backgroundColor: "var(--accent)" }} />
                  <div className="absolute h-3.5 w-3.5 rounded-full border-2 border-neutral-950 shadow" style={{ backgroundColor: "var(--accent)" }} />
                </div>
              )}

              <div className="relative z-10 flex items-center gap-4 px-5 py-4">
                <button
                  type="button"
                  onClick={() => play(t)}
                  className="relative z-20 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-neutral-950 transition"
                  style={{ backgroundColor: "var(--accent)" }}
                  aria-label={active ? "Pause" : unlocked ? "Play" : "Play preview"}
                >
                  {active ? (
                    <svg width="14" height="14" viewBox="0 0 12 12" fill="currentColor"><rect x="2" y="1" width="3" height="10" rx="1" /><rect x="7" y="1" width="3" height="10" rx="1" /></svg>
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 12 12" fill="currentColor"><path d="M2 1.5v9l8-4.5-8-4.5Z" /></svg>
                  )}
                </button>

                <span className="flex-1 truncate font-semibold uppercase tracking-wide" style={{ color: active ? "var(--accent)" : undefined }}>
                  {t.title}
                </span>

                {active ? (
                  <span ref={timeRef} className="shrink-0 font-mono text-xs text-neutral-300">0:00 / {fmt(previewCap)}{!unlocked && " · preview"}</span>
                ) : unlocked ? (
                  <span className="shrink-0 text-xs uppercase tracking-widest text-neutral-500">Full</span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setOpenGate(gateOpen ? null : t.trackId)}
                    className="shrink-0 rounded-lg border border-[var(--accent)]/50 px-3 py-1.5 text-xs font-semibold uppercase tracking-widest transition hover:bg-white/[0.06]"
                    style={{ color: "var(--accent)" }}
                  >
                    Unlock
                  </button>
                )}
              </div>

              {/* Per-song gate */}
              {!unlocked && gateOpen && (
                <div className="relative z-10 border-t border-white/10 px-5 py-4">
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
                    {t.gate === "email" ? `${previewCap}s preview. Enter your email to hear the whole thing.` : "One tap unlocks the full song."}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
      {error && <p className="px-5 py-3 text-sm text-red-400">{error}</p>}
    </div>
  );
}
