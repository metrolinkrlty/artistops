"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { unlockSiteTrackEmail, unlockSiteTrackShareFollow } from "@/app/sites/actions";

type Track = { trackId: string; title: string; gate: string; previewUrl: string | null; streamLinks?: Record<string, string> | null; linksMode?: string };

// Should this song's streaming links show? Per-song linksMode overrides the
// site-wide default ("before"/"after"/"off"); "default" falls back to the site.
function linksVisible(mode: string | undefined, siteShow: boolean, siteAfter: boolean, unlocked: boolean): boolean {
  switch (mode) {
    case "off": return false;
    case "before": return true;
    case "after": return unlocked;
    default: return siteShow && (!siteAfter || unlocked);
  }
}

// Monetizing platforms a song can link out to. Order = display order.
const STREAM_PLATFORMS: { key: string; label: string }[] = [
  { key: "spotify", label: "Spotify" },
  { key: "apple", label: "Apple Music" },
  { key: "amazon", label: "Amazon Music" },
  { key: "bandcamp", label: "Bandcamp" },
  { key: "youtube", label: "YouTube" },
  { key: "soundcloud", label: "SoundCloud" },
];

function StreamLinks({ links }: { links?: Record<string, string> | null }) {
  if (!links) return null;
  const items = STREAM_PLATFORMS.filter((p) => links[p.key]);
  if (!items.length) return null;
  return (
    <div className="relative z-10 flex flex-wrap items-center gap-2 px-5 pb-3 pt-0.5">
      <span className="text-[11px] font-semibold uppercase tracking-widest text-neutral-500">Full song on</span>
      {items.map((p) => (
        <a
          key={p.key}
          href={links[p.key]}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full border border-white/15 px-2.5 py-0.5 text-[11px] text-neutral-300 transition hover:border-[var(--accent)] hover:text-white"
        >
          {p.label}
        </a>
      ))}
    </div>
  );
}

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
      Array.from({ length: 160 }, (_, i) => {
        const v =
          Math.sin(i * 0.45) * 0.5 + Math.sin(i * 0.17 + 1) * 0.3 + Math.sin(i * 0.9) * 0.2;
        return Math.min(100, 60 + Math.abs(v) * 120); // ~60–100% height
      }),
    []
  );
}

function WaveBars({ className, level = 1 }: { className?: string; level?: number }) {
  const bars = useWaveBars();
  // Bars shrink/grow vertically with the volume level.
  const scale = 0.12 + Math.max(0, Math.min(1, level)) * 0.88;
  return (
    <div
      className={`flex h-full w-full items-center gap-[2px] ${className ?? ""}`}
      style={{ transform: `scaleY(${scale})`, transformOrigin: "center", transition: "transform 150ms ease" }}
    >
      {bars.map((h, i) => (
        <div key={i} className="flex-1 rounded-full bg-current" style={{ height: `${h}%` }} />
      ))}
    </div>
  );
}

// --- Vintage volume knob ------------------------------------------------
// A knob that plays/pauses on click and sets volume when you turn it. The
// pointer angle around the knob maps to volume across a 270° sweep.
const KNOB_SWEEP = 270;
function knobAngle(vol: number) { return -135 + vol * KNOB_SWEEP; }
function angleToVol(deg: number) { return (Math.max(-135, Math.min(135, deg)) + 135) / KNOB_SWEEP; }
function pointerAngle(e: { clientX: number; clientY: number }, el: HTMLElement) {
  const r = el.getBoundingClientRect();
  const dx = e.clientX - (r.left + r.width / 2);
  const dy = e.clientY - (r.top + r.height / 2);
  return (Math.atan2(dx, -dy) * 180) / Math.PI; // 0° points up, + is clockwise
}

// Polished chrome: a conic metal sheen with a bright off-center highlight,
// bevelled with inset light/shadow so it reads like a real reflective knob.
const KNOB_WRAP_STYLE: React.CSSProperties = {
  background:
    "radial-gradient(circle at 36% 27%, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.25) 26%, rgba(255,255,255,0) 46%), " +
    "conic-gradient(from 205deg at 50% 50%, #8c8c8c 0deg, #f7f7f7 42deg, #6f6f6f 92deg, #ececec 150deg, #9a9a9a 205deg, #fdfdfd 250deg, #737373 300deg, #e0e0e0 340deg, #8c8c8c 360deg)",
  boxShadow: "0 4px 12px rgba(0,0,0,0.55), inset 0 1px 2px rgba(255,255,255,0.95), inset 0 -3px 6px rgba(0,0,0,0.4)",
  border: "2px solid #5f5f5f",
  touchAction: "none",
  cursor: "ns-resize",
};

function KnobFace({ angle, playing, iconSize = 28 }: { angle: number; playing: boolean; iconSize?: number }) {
  return (
    <>
      {/* knurled chrome edge */}
      <span
        className="pointer-events-none absolute inset-0 rounded-full"
        style={{
          background: "repeating-conic-gradient(#8f8f8f 0deg 6deg, #ededed 6deg 12deg)",
          opacity: 0.5,
          WebkitMaskImage: "radial-gradient(circle, transparent 56%, #000 59%, #000 82%, transparent 85%)",
          maskImage: "radial-gradient(circle, transparent 56%, #000 59%, #000 82%, transparent 85%)",
        }}
      />
      {/* short black volume indicator near the rim */}
      <span className="pointer-events-none absolute inset-0" style={{ transform: `rotate(${angle}deg)` }}>
        <span className="absolute left-1/2 top-[1px] h-1.5 w-[3px] -translate-x-1/2 rounded-full" style={{ backgroundColor: "#0a0a0a", boxShadow: "0 0 1px rgba(255,255,255,0.65)" }} />
      </span>
      {/* center play/pause icon (dark, for contrast on chrome) */}
      <span className="pointer-events-none relative" style={{ color: "#161616" }}>
        {playing ? (
          <svg width={iconSize} height={iconSize} viewBox="0 0 12 12" fill="currentColor"><rect x="2" y="1" width="3" height="10" rx="1" /><rect x="7" y="1" width="3" height="10" rx="1" /></svg>
        ) : (
          <svg width={iconSize} height={iconSize} viewBox="0 0 12 12" fill="currentColor"><path d="M2 1.5v9l8-4.5-8-4.5Z" /></svg>
        )}
      </span>
    </>
  );
}

export type PlayerStyle = "waveform" | "shade" | "simple" | "classic";

export default function SiteMusic({
  slug,
  initiallyUnlockedIds,
  previewSeconds,
  followUrl,
  fbPageUrl,
  playerStyle = "waveform",
  showStreamLinks = true,
  showMusicNotes = true,
  streamLinksAfterGate = false,
}: {
  slug: string;
  initiallyUnlockedIds: string[] | "all";
  previewSeconds: number;
  followUrl: string | null;
  fbPageUrl: string | null;
  playerStyle?: PlayerStyle;
  showStreamLinks?: boolean;
  showMusicNotes?: boolean;
  streamLinksAfterGate?: boolean;
}) {
  // Which decorative layers this style shows.
  const classic = playerStyle === "classic"; // song list + bottom transport bar
  const showSweep = playerStyle === "waveform" || playerStyle === "shade"; // shade sweep + scrubber + title reveal
  const showBars = playerStyle === "waveform"; // the waveform bars inside the sweep
  const [tracks, setTracks] = useState<Track[]>([]);
  const [playing, setPlaying] = useState<string | null>(null);
  const [allUnlocked] = useState(initiallyUnlockedIds === "all");
  const [unlockedIds, setUnlockedIds] = useState<Set<string>>(
    new Set(initiallyUnlockedIds === "all" ? [] : initiallyUnlockedIds)
  );
  const [openGate, setOpenGate] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null); // last-played track (classic bar persists it)
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const previewCap = previewSeconds || 30;

  // Volume set by turning the knob (0–1). Applied to the shared audio element.
  const [volume, setVolume] = useState(1);
  useEffect(() => { if (audioRef.current) audioRef.current.volume = volume; }, [volume]);
  const knobRef = useRef<{ x: number; y: number; moved: boolean; el: HTMLElement } | null>(null);
  const knobTurnRef = useRef(0); // timestamp of the last volume turn (suppresses the click)

  // Refs the rAF loop writes to directly (bypassing React re-render for smoothness).
  const shadeRef = useRef<HTMLDivElement | null>(null);
  const waveClipRef = useRef<HTMLDivElement | null>(null);
  const titleClipRef = useRef<HTMLDivElement | null>(null);
  const handleRef = useRef<HTMLDivElement | null>(null);
  const notesRef = useRef<HTMLDivElement | null>(null); // layer that music notes fly off from
  const lastNoteRef = useRef(0); // throttle timestamp for note spawning
  const timeRef = useRef<HTMLSpanElement | null>(null);
  const seekAreaRef = useRef<HTMLDivElement | null>(null);
  const bottomSeekRef = useRef<HTMLInputElement | null>(null); // classic bar slider
  const bottomTimeRef = useRef<HTMLSpanElement | null>(null); // classic bar time
  const draggingRef = useRef(false);
  const totalRef = useRef(previewCap);
  const unlockedRef = useRef(false);
  const loadedIdRef = useRef<string | null>(null); // which track's src is currently loaded

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
  // Spawn a single music note at the leading edge (prog = 0..1 across the row),
  // letting it fly up-and-off and fade. Per-note drift/spin/size are randomized.
  const NOTE_GLYPHS = ["♪", "♫", "♩", "♬"]; // ♪ ♫ ♩ ♬
  function spawnNote(prog: number) {
    const layer = notesRef.current;
    if (!layer) return;
    const el = document.createElement("span");
    el.textContent = NOTE_GLYPHS[(Math.random() * NOTE_GLYPHS.length) | 0];
    const driftX = (Math.random() * 2 - 1) * 26;
    const rot = (Math.random() * 2 - 1) * 45;
    const size = 22 + Math.random() * 18; // noticeably bigger: 22–40px
    const dur = 950 + Math.random() * 550;
    const ny = (Math.random() < 0.5 ? -1 : 1) * (46 + Math.random() * 30); // fly above OR below the midline
    el.style.cssText =
      `position:absolute;left:calc(${prog * 100}% + 16px);top:50%;` + // just in front of the leading edge
      `color:var(--accent);font-size:${size}px;line-height:1;` +
      `text-shadow:0 0 9px var(--accent),0 1px 3px rgba(0,0,0,0.6);` +
      `pointer-events:none;will-change:transform,opacity;` +
      `--nx:${driftX.toFixed(1)}px;--ny:${ny.toFixed(1)}px;--nr:${rot.toFixed(1)}deg;` +
      `animation:aoNoteFly ${Math.round(dur)}ms ease-out forwards;`;
    el.addEventListener("animationend", () => el.remove());
    layer.appendChild(el);
  }

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
    if (titleClipRef.current) titleClipRef.current.style.clipPath = `inset(0 ${(1 - prog) * 100}% 0 0)`;
    if (handleRef.current) handleRef.current.style.left = pct;
    // Emit music notes off the leading edge while playing (waveform style only).
    // Skip when the tab is hidden — timeupdate still fires, but the notes' CSS
    // animation is paused, so they'd pile up in the DOM instead of flying off.
    if (playing && showBars && showMusicNotes && !a.paused && document.visibilityState === "visible") {
      const now = performance.now();
      if (now - lastNoteRef.current > 230) { lastNoteRef.current = now; spawnNote(prog); }
    }
    // classic bottom transport bar
    if (bottomSeekRef.current && !draggingRef.current) bottomSeekRef.current.value = String(Math.round(prog * 1000));
    if (bottomTimeRef.current?.firstChild) bottomTimeRef.current.firstChild.nodeValue = `${fmt(a.currentTime)} / ${fmt(total)}`;
    // Mutate the existing text node in place (never replace children — that
    // desyncs React's fiber and crashes with removeChild on the next unmount).
    if (timeRef.current?.firstChild) timeRef.current.firstChild.nodeValue = `${fmt(a.currentTime)} / ${fmt(total)}${unlockedRef.current ? "" : " · preview"}`;
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
    setSelectedId(t.trackId);
    if (playing === t.trackId) { a.pause(); setPlaying(null); return; }
    const full = isUnlocked(t);
    const src = full ? `/api/site/${slug}/track/${t.trackId}/full` : t.previewUrl;
    if (!src) return;
    // Only (re)load when switching tracks or after an unlock — so resuming a
    // paused track from the classic bar continues instead of restarting.
    if (loadedIdRef.current !== t.trackId) {
      unlockedRef.current = full;
      totalRef.current = previewCap;
      a.src = src;
      loadedIdRef.current = t.trackId;
    }
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
    const res = await unlockSiteTrackEmail(slug, t.trackId, email.trim(), name.trim() || undefined);
    setBusy(false);
    if (res.ok) {
      setUnlockedIds((s) => new Set(s).add(t.trackId));
      if (loadedIdRef.current === t.trackId) loadedIdRef.current = null; // reload as full next play
      setOpenGate(null); setEmail(""); setName("");
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
      if (loadedIdRef.current === t.trackId) loadedIdRef.current = null; // reload as full next play
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
            <div key={t.trackId} className="select-none">
              <div className="relative">
              {/* Progress layers begin just to the right of the knob (offset ≈ px-5 + knob w-12 + gap-4). */}
              {active && showSweep && (
                <div className="pointer-events-none absolute inset-y-0 left-[84px] right-0">
                  {/* Animated shade + waveform (only for the playing row). rAF writes width/clip/left. */}
                  <div ref={seekAreaRef} className="pointer-events-none absolute inset-0 z-0">
                    {/* faint full waveform (the unplayed hint) — waveform style only */}
                    {showBars && (
                      <div className="absolute inset-y-0 left-0 right-0 pr-5 py-2 opacity-[0.12] text-neutral-300">
                        <WaveBars level={volume} />
                      </div>
                    )}
                    {/* shaded (played) area — a soft accent wash that grows */}
                    <div ref={shadeRef} className="absolute inset-y-0 left-0 will-change-[width]" style={{ width: "0%", backgroundColor: "var(--accent)", opacity: 0.14 }} />
                    {/* accent waveform, revealed by clip-path as the shade grows — waveform style only */}
                    {showBars && (
                      <div ref={waveClipRef} className="absolute inset-y-0 left-0 right-0 pr-5 py-2 will-change-[clip-path]" style={{ color: "var(--accent)", clipPath: "inset(0 100% 0 0)" }}>
                        <WaveBars level={volume} />
                      </div>
                    )}
                  </div>

                  {/* Leading-edge scrubber — grab and drag to seek */}
                  <div
                    ref={handleRef}
                    className="pointer-events-auto absolute inset-y-0 z-20 -ml-2 flex w-4 cursor-ew-resize touch-none items-center justify-center will-change-[left]"
                    style={{ left: "0%" }}
                    onPointerDown={(e) => { draggingRef.current = true; seekFromClientX(e.clientX); try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* best-effort */ } }}
                    onPointerMove={(e) => { if (draggingRef.current) seekFromClientX(e.clientX); }}
                    onPointerUp={(e) => { draggingRef.current = false; try { e.currentTarget.releasePointerCapture(e.pointerId); } catch { /* best-effort */ } }}
                    aria-label="Scrub"
                  >
                    <div className="h-full w-[3px] rounded-full" style={{ backgroundColor: "var(--accent)" }} />
                    <div className="absolute h-3.5 w-3.5 rounded-full border-2 border-neutral-950 shadow" style={{ backgroundColor: "var(--accent)" }} />
                  </div>

                  {/* Music notes flying off the leading edge while playing (waveform style) */}
                  {showBars && showMusicNotes && (
                    <div ref={notesRef} className="pointer-events-none absolute inset-0 z-30 overflow-visible" aria-hidden />
                  )}
                </div>
              )}

              <div className="relative z-10 flex items-center gap-4 px-5 py-4">
                <button
                  type="button"
                  onClick={() => { if (Date.now() - knobTurnRef.current < 300) return; play(t); }}
                  onPointerDown={(e) => { knobRef.current = { x: e.clientX, y: e.clientY, moved: false, el: e.currentTarget }; try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* best-effort */ } }}
                  onPointerMove={(e) => { const k = knobRef.current; if (!k) return; if (Math.hypot(e.clientX - k.x, e.clientY - k.y) > 3) { k.moved = true; setVolume(angleToVol(pointerAngle(e, k.el))); } }}
                  onPointerUp={(e) => { const k = knobRef.current; knobRef.current = null; if (k?.moved) knobTurnRef.current = Date.now(); try { e.currentTarget.releasePointerCapture(e.pointerId); } catch { /* best-effort */ } }}
                  className="relative z-20 flex h-12 w-12 shrink-0 items-center justify-center rounded-full"
                  style={KNOB_WRAP_STYLE}
                  role="slider"
                  aria-label={`Volume — click to ${active ? "pause" : "play"}, turn to change volume`}
                  aria-valuenow={Math.round(volume * 100)}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <KnobFace angle={knobAngle(volume)} playing={active} />
                </button>

                <span className="flex-1 truncate font-semibold uppercase tracking-wide" style={{ color: active && showSweep ? "rgba(255,255,255,0.4)" : undefined }}>
                  {t.title}
                </span>

                {active ? (
                  <span ref={timeRef} className="shrink-0 font-mono text-xs text-neutral-300">{`0:00 / ${fmt(previewCap)}${!unlocked ? " · preview" : ""}`}</span>
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

              {/* White copy of the title, revealed left-to-right by the scrubber
                  (clip synced to progress) so the title stays white as it passes. */}
              {active && showSweep && (
                <div ref={titleClipRef} className="pointer-events-none absolute inset-0 z-30 flex items-center gap-4 px-5 py-4" style={{ clipPath: "inset(0 100% 0 0)" }}>
                  <div className="h-10 w-10 shrink-0" />
                  <span className="flex-1 truncate font-bold uppercase tracking-wide" style={{ color: "#ffffff", textShadow: "0 1px 4px rgba(0,0,0,0.85), 0 0 1px rgba(0,0,0,0.9)", animation: "aoTitlePulse 1.5s ease-in-out infinite" }}>
                    {t.title}
                  </span>
                </div>
              )}
              </div>

              {/* Links to hear the full song on monetizing platforms. Per-song
                  timing (t.linksMode) overrides the site-wide default. */}
              {linksVisible(t.linksMode, showStreamLinks, streamLinksAfterGate, unlocked) && <StreamLinks links={t.streamLinks} />}

              {/* Per-song gate */}
              {!unlocked && gateOpen && (
                <div className="relative z-10 border-t border-white/10 px-5 py-4">
                  <p className="mb-3 text-2xl font-semibold leading-tight" style={{ color: "var(--accent)" }}>
                    Hear the WHOLE song by playing it forward!
                  </p>
                  {t.gate === "email" && (
                    <form onSubmit={(e) => submitEmail(t, e)} className="flex flex-col gap-2">
                      <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name (optional)" className={inputClass} />
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" className={`flex-1 ${inputClass}`} />
                        <button type="submit" disabled={busy} className="rounded-lg px-5 py-2 text-sm font-semibold text-neutral-950 transition disabled:opacity-60" style={{ backgroundColor: "var(--accent)" }}>
                          {busy ? "Unlocking…" : "Email me the full song"}
                        </button>
                      </div>
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
                    {t.gate === "email" ? `${previewCap}s preview. Enter your email and the full song unlocks right here. We never sell your info.` : "One tap unlocks the full song."}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Classic transport bar: label, big silver knob (play/pause + volume), seek slider */}
      {classic && selectedId && (() => {
        const st = tracks.find((t) => t.trackId === selectedId);
        if (!st) return null;
        const stUnlocked = isUnlocked(st);
        const isPlayingSel = playing === selectedId;
        return (
          <div className="border-t border-white/10 bg-white/[0.03] px-5 py-4">
            <div className="mb-2 flex items-center justify-between text-xs text-neutral-400">
              <span className="font-semibold uppercase tracking-widest" style={{ color: "var(--accent)" }}>
                {stUnlocked ? "Now Playing" : "Preview"} — {st.title}
              </span>
              <span ref={bottomTimeRef} className="font-mono">{`0:00 / ${fmt(previewCap)}`}</span>
            </div>
            <div className="flex items-center gap-4">
              <span
                role="slider"
                aria-label="Volume — click to play or pause, turn to change volume"
                aria-valuenow={Math.round(volume * 100)}
                aria-valuemin={0}
                aria-valuemax={100}
                className="relative flex h-14 w-14 flex-none cursor-pointer items-center justify-center rounded-full"
                style={KNOB_WRAP_STYLE}
                onPointerDown={(e) => { knobRef.current = { x: e.clientX, y: e.clientY, moved: false, el: e.currentTarget }; try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* best-effort */ } }}
                onPointerMove={(e) => { const k = knobRef.current; if (!k) return; if (Math.hypot(e.clientX - k.x, e.clientY - k.y) > 3) { k.moved = true; setVolume(angleToVol(pointerAngle(e, k.el))); } }}
                onPointerUp={(e) => { const k = knobRef.current; knobRef.current = null; if (k?.moved) knobTurnRef.current = Date.now(); try { e.currentTarget.releasePointerCapture(e.pointerId); } catch { /* best-effort */ } }}
                onClick={() => { if (Date.now() - knobTurnRef.current < 300) return; play(st); }}
              >
                <KnobFace angle={knobAngle(volume)} playing={isPlayingSel} iconSize={40} />
              </span>
              <input
                ref={bottomSeekRef}
                type="range"
                min={0}
                max={1000}
                defaultValue={0}
                onChange={(e) => { const a = audioRef.current; if (!a) return; a.currentTime = (Number(e.target.value) / 1000) * totalRef.current; }}
                onPointerDown={() => { draggingRef.current = true; }}
                onPointerUp={() => { draggingRef.current = false; }}
                className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/15"
                style={{ accentColor: "var(--accent)" }}
                aria-label="Seek"
              />
            </div>
          </div>
        );
      })()}

      {error && <p className="px-5 py-3 text-sm text-red-400">{error}</p>}
    </div>
  );
}
