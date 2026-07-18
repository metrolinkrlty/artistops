// Plain (non-server) helper so it can be imported by route handlers, server
// components, and the "use server" actions file alike. A "use server" file may
// only export async functions, so this can't live in actions.ts.

export function unlockCookieName(slug: string) {
  return `sites_unlock_${slug}`;
}

export const UNLOCK_MAX_AGE = 60 * 60 * 24 * 180; // 180 days

// The cookie value is either "1" (legacy: everything unlocked) or a
// comma-separated list of unlocked trackIds — per-song, matching the bespoke site.
export function isTrackUnlocked(cookieValue: string | undefined, trackId: string): boolean {
  if (!cookieValue) return false;
  if (cookieValue === "1") return true;
  return cookieValue.split(",").map((s) => s.trim()).includes(trackId);
}

export function addTrackToCookie(cookieValue: string | undefined, trackId: string): string {
  if (cookieValue === "1") return "1"; // already all-unlocked
  const set = new Set((cookieValue || "").split(",").map((s) => s.trim()).filter(Boolean));
  set.add(trackId);
  return Array.from(set).join(",");
}

export function unlockedIdsFromCookie(cookieValue: string | undefined): string[] | "all" {
  if (cookieValue === "1") return "all";
  return (cookieValue || "").split(",").map((s) => s.trim()).filter(Boolean);
}
