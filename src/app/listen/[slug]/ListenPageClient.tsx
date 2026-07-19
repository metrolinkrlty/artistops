"use client";
import { useState, useEffect } from "react";
import { Music, ExternalLink } from "lucide-react";

const platformColors: Record<string, string> = {
  Spotify: "bg-[#1DB954] hover:bg-[#1ed760] text-black",
  "Apple Music": "bg-[#fc3c44] hover:bg-[#ff4a52] text-white",
  "YouTube Music": "bg-[#FF0000] hover:bg-[#cc0000] text-white",
  "Amazon Music": "bg-[#00A8E1] hover:bg-[#0090c0] text-white",
  Tidal: "bg-[#00FFFF] hover:bg-[#33ffff] text-black",
  SoundCloud: "bg-[#FF5500] hover:bg-[#ff6a1f] text-white",
  Deezer: "bg-[#A238FF] hover:bg-[#b455ff] text-white",
};

interface Platform {
  name: string;
  url: string;
  free: boolean;
  priority: number;
}

interface SmartLinkData {
  slug: string;
  title: string;
  artistName: string;
  coverColor: string;
  gateEmail: boolean;
  platforms: Platform[];
}

export default function ListenPageClient({ link }: { link: SmartLinkData }) {
  const [preferredPlatform, setPreferredPlatform] = useState<string | null>(null);
  const [clicked, setClicked] = useState<string | null>(null);
  const [unlocked, setUnlocked] = useState(false);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("ao_preferred_platform");
    if (stored) setPreferredPlatform(stored);
    if (localStorage.getItem(`ao_listen_unlock_${link.slug}`)) setUnlocked(true);
  }, [link.slug]);

  const submitEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { setErr("Please enter a valid email."); return; }
    setBusy(true); setErr("");
    try {
      const res = await fetch(`/api/smartlink/${link.slug}/unlock`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error();
      localStorage.setItem(`ao_listen_unlock_${link.slug}`, "1");
      setUnlocked(true);
    } catch { setErr("Something went wrong. Try again."); } finally { setBusy(false); }
  };

  const gated = link.gateEmail && !unlocked;

  const handleClick = async (platform: Platform) => {
    localStorage.setItem("ao_preferred_platform", platform.name);
    setPreferredPlatform(platform.name);
    setClicked(platform.name);

    // Record click
    try {
      await fetch("/api/smart-link-click", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: link.slug,
          platform: platform.name,
          device: /Mobile|Android|iPhone/i.test(navigator.userAgent) ? "mobile" : "desktop",
        }),
      });
    } catch (_) {}

    window.open(platform.url, "_blank");
  };

  const freePlatforms = link.platforms.filter(p => p.free).map(p => p.name);
  const sorted = [...link.platforms].sort((a, b) => {
    if (a.name === preferredPlatform) return -1;
    if (b.name === preferredPlatform) return 1;
    return a.priority - b.priority;
  });

  return (
    <div className="min-h-screen bg-[#0f1117] flex flex-col items-center justify-center p-6">
      {/* Cover Art */}
      <div
        className="w-56 h-56 rounded-2xl mb-6 flex items-center justify-center shadow-2xl"
        style={{ background: `linear-gradient(135deg, ${link.coverColor}, #1a1d27)` }}
      >
        <Music className="w-20 h-20 text-white/30" />
      </div>

      {/* Title */}
      <h1 className="text-white text-3xl font-bold text-center mb-1">{link.title}</h1>
      <p className="text-[#8b8fa8] text-lg mb-2">{link.artistName}</p>

      {/* Free badge */}
      {!gated && freePlatforms.length > 0 && (
        <div className="mb-6 px-3 py-1 bg-green-500/20 text-green-400 text-xs rounded-full border border-green-500/30">
          Free listening on: {freePlatforms.join(", ")}
        </div>
      )}

      {/* Email gate */}
      {gated ? (
        <form onSubmit={submitEmail} className="w-full max-w-sm text-center" noValidate>
          <p className="mb-4 text-sm text-[#8b8fa8]">Enter your email to unlock the links.</p>
          <input
            type="email" required value={email} onChange={(e) => { setEmail(e.target.value); setErr(""); }}
            placeholder="you@email.com" autoFocus
            className="w-full rounded-lg border border-[#2a2d3a] bg-[#1a1d27] px-4 py-3 text-white placeholder:text-[#8b8fa8] focus:border-indigo-500 focus:outline-none"
          />
          <button type="submit" disabled={busy} className="mt-3 w-full rounded-lg bg-indigo-600 px-4 py-3 font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60">
            {busy ? "Unlocking…" : "Unlock the links"}
          </button>
          {err && <p className="mt-2 text-sm text-red-400">{err}</p>}
        </form>
      ) : (
      /* Platform buttons */
      <div className="w-full max-w-sm space-y-3">
        {sorted.map(platform => (
          <button
            key={platform.name}
            onClick={() => handleClick(platform)}
            className={`w-full flex items-center justify-between px-5 py-4 rounded-xl font-semibold transition-all ${platformColors[platform.name] || "bg-[#2a2d3a] hover:bg-[#3a3d4a] text-white"} ${clicked === platform.name ? "ring-2 ring-white/50" : ""}`}
          >
            <span className="flex items-center gap-3">
              {platform.name === preferredPlatform && (
                <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">Preferred</span>
              )}
              {platform.name}
              {platform.free && <span className="text-xs opacity-70">Free</span>}
            </span>
            <ExternalLink className="w-4 h-4 opacity-70" />
          </button>
        ))}
      </div>
      )}

      {/* Footer */}
      <div className="mt-8 text-center">
        <p className="text-[#8b8fa8] text-xs">Powered by</p>
        <div className="flex items-center gap-1 justify-center mt-1">
          <div className="w-4 h-4 rounded bg-indigo-600 flex items-center justify-center">
            <Music className="w-2.5 h-2.5 text-white" />
          </div>
          <span className="text-white text-sm font-semibold">ArtistOps</span>
        </div>
      </div>
    </div>
  );
}
