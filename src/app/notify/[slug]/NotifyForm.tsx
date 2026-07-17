"use client";

import { useState } from "react";
import { Check, Bell } from "lucide-react";
import { notifyMe } from "./actions";

// Tells the artist's ad pixels that this fan converted, so they can be
// retargeted later. Mirrors the Lead event the song-unlock gate fires.
function firePixelLead(adPixels: Record<string, string>) {
  const w = window as unknown as Record<string, ((...a: unknown[]) => void) | undefined>;
  try {
    if (adPixels.meta && typeof w.fbq === "function") w.fbq("track", "Lead");
    if (adPixels.tiktok && typeof w.ttq === "object") {
      (w.ttq as unknown as { track: (e: string) => void }).track("SubmitForm");
    }
    if (adPixels.google && typeof w.gtag === "function") w.gtag("event", "generate_lead");
  } catch {
    // A blocked pixel must never break the signup.
  }
}

export default function NotifyForm({
  slug,
  title,
  adPixels,
}: {
  slug: string;
  title: string;
  adPixels: Record<string, string>;
}) {
  const [email, setEmail] = useState("");
  const [alsoSubscribe, setAlsoSubscribe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await notifyMe(slug, email, alsoSubscribe);
      if (res.ok) {
        firePixelLead(adPixels);
        setDone(true);
      } else {
        setError(res.error || "Something went wrong.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="mt-6 rounded-xl border border-green-500/30 bg-green-500/10 p-4">
        <p className="flex items-center gap-2 text-green-400 font-medium text-sm">
          <Check className="w-4 h-4" /> You&rsquo;re on the list!
        </p>
        <p className="text-[#8b8fa8] text-sm mt-1.5 leading-snug">
          {`We'll email you the moment ${title} is out — one email, nothing else. You can close this page.`}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        placeholder="you@example.com"
        aria-label="Your email address"
        className="w-full bg-[#0f1117] border border-[#2a2d3a] text-white px-4 py-3 rounded-lg text-sm placeholder:text-[#8b8fa8] focus:outline-none focus:border-indigo-500"
      />

      <label className="flex items-start gap-2.5 mt-3 cursor-pointer">
        <input
          type="checkbox"
          checked={alsoSubscribe}
          onChange={(e) => setAlsoSubscribe(e.target.checked)}
          className="mt-0.5 accent-indigo-500"
        />
        <span className="text-[#8b8fa8] text-xs leading-snug">
          Also keep me posted on future releases and shows.
        </span>
      </label>

      {error && <p className="text-red-400 text-sm mt-3">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="mt-4 w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-full text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition-colors"
      >
        <Bell className="w-4 h-4" />
        {loading ? "Adding you…" : "Email me when it's out"}
      </button>
    </form>
  );
}
