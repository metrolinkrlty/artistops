"use client";

import { useEffect, useRef, useState } from "react";

type Track = { trackId: string; title: string; previewUrl: string | null };

// Reuses the existing public per-slug tracks endpoint (signed 30s preview URLs).
export default function SiteMusic({ slug }: { slug: string }) {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [playing, setPlaying] = useState<string | null>(null);
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
    if (!a || !t.previewUrl) return;
    if (playing === t.trackId) {
      a.pause();
      setPlaying(null);
      return;
    }
    a.src = t.previewUrl;
    void a.play();
    setPlaying(t.trackId);
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
            <span
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-neutral-950"
              style={{ backgroundColor: "var(--accent)" }}
              aria-hidden
            >
              {isPlaying ? (
                <svg width="14" height="14" viewBox="0 0 12 12" fill="currentColor"><rect x="2" y="1" width="3" height="10" rx="1" /><rect x="7" y="1" width="3" height="10" rx="1" /></svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 12 12" fill="currentColor"><path d="M2 1.5v9l8-4.5-8-4.5Z" /></svg>
              )}
            </span>
            <span className="flex-1 font-medium text-neutral-100">{t.title}</span>
            <span className="text-xs uppercase tracking-widest text-neutral-500">
              {isPlaying ? "Playing" : "Preview"}
            </span>
          </button>
        );
      })}
      <p className="pt-2 text-sm text-neutral-500">
        30-second previews. Join the mailing list for first word on new releases.
      </p>
    </div>
  );
}
