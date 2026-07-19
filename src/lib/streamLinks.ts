// Maps Smart Link platform entries → the website player's streamLinks shape.
// Smart Links (/smart-links) hold the artist's real per-platform URLs; the
// website "Full song on …" chips reuse them so nothing is hand-typed twice.

export type SmartLinkPlatform = { name?: string; url?: string; priority?: number };

// Smart Link platform names → our five chip keys. Platforms we don't render as
// chips (Amazon, Tidal, Deezer, TikTok, …) are intentionally dropped.
const NAME_TO_KEY: Record<string, string> = {
  spotify: "spotify",
  apple: "apple",
  "apple music": "apple",
  youtube: "youtube",
  "youtube music": "youtube",
  soundcloud: "soundcloud",
  bandcamp: "bandcamp",
};

export function mapSmartLinkToStreamLinks(platforms: unknown): Record<string, string> {
  const out: Record<string, string> = {};
  if (!Array.isArray(platforms)) return out;
  for (const p of platforms as SmartLinkPlatform[]) {
    const key = NAME_TO_KEY[String(p?.name || "").trim().toLowerCase()];
    const url = String(p?.url || "").trim();
    if (key && /^https?:\/\/\S+$/i.test(url)) out[key] = url.slice(0, 500);
  }
  return out;
}

// Merge: Smart Link values win for the platforms they provide; any other
// platform the artist set by hand (e.g. Bandcamp not in the smart link) is kept.
export function mergeStreamLinks(
  existing: unknown,
  derived: Record<string, string>
): Record<string, string> {
  const base = existing && typeof existing === "object" ? (existing as Record<string, string>) : {};
  const merged: Record<string, string> = { ...base, ...derived };
  for (const k of Object.keys(merged)) if (!merged[k]) delete merged[k];
  return merged;
}
