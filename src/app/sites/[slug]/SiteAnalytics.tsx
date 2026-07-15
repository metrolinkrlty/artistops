"use client";

import { useEffect } from "react";

// Fires a pageview to the existing pixel ingest so the artist sees traffic in
// the ArtistOps "Pixel tracking" dashboard. ownerId is the artist's user id,
// which /api/pixel accepts as a pixel id (falls back to the owning user).
export default function SiteAnalytics({ ownerId }: { ownerId: string }) {
  useEffect(() => {
    try {
      const KEY = "ao_vid";
      let vid = localStorage.getItem(KEY);
      if (!vid) {
        vid = crypto.randomUUID();
        localStorage.setItem(KEY, vid);
      }
      const u = new URL(window.location.href);
      fetch("/api/pixel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        keepalive: true,
        body: JSON.stringify({
          pixelId: ownerId,
          visitorId: vid,
          pageUrl: window.location.href,
          referrer: document.referrer || null,
          eventType: "pageview",
          utmSource: u.searchParams.get("utm_source"),
          utmMedium: u.searchParams.get("utm_medium"),
          utmCampaign: u.searchParams.get("utm_campaign"),
          utmContent: u.searchParams.get("utm_content"),
          utmTerm: u.searchParams.get("utm_term"),
        }),
      }).catch(() => {});
    } catch {
      // analytics must never break the page
    }
  }, [ownerId]);

  return null;
}
