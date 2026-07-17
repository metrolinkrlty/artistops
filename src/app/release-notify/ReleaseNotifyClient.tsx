"use client";

import { useState } from "react";
import {
  Bell, Plus, Copy, Check, Trash2, Users, Calendar, ExternalLink, AlertTriangle, Info,
} from "lucide-react";
import {
  createReleaseCampaign,
  deleteReleaseCampaign,
  type CampaignRow,
} from "./actions";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC", // a release date is a calendar day, not a moment
  });
}

function shareUrl(slug: string) {
  const origin =
    typeof window !== "undefined" ? window.location.origin : "https://artistops.net";
  return `${origin}/notify/${slug}`;
}

export default function ReleaseNotifyClient({
  campaigns: initial,
  hasSite,
}: {
  campaigns: CampaignRow[];
  hasSite: boolean;
}) {
  const [campaigns, setCampaigns] = useState(initial);
  const [showForm, setShowForm] = useState(initial.length === 0);
  const [title, setTitle] = useState("");
  const [releaseDate, setReleaseDate] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await createReleaseCampaign(title, releaseDate, linkUrl);
    setSaving(false);
    if (!res.ok || !res.slug) {
      setError(res.error || "Something went wrong.");
      return;
    }
    setCampaigns((c) => [
      ...c,
      {
        id: `tmp-${res.slug}`,
        slug: res.slug!,
        title: title.trim(),
        releaseAt: new Date(`${releaseDate}T00:00:00.000Z`).toISOString(),
        linkUrl: linkUrl.trim() || null,
        status: "scheduled",
        signupCount: 0,
      },
    ].sort((a, b) => a.releaseAt.localeCompare(b.releaseAt)));
    setTitle("");
    setReleaseDate("");
    setLinkUrl("");
    setShowForm(false);
  }

  async function handleCopy(slug: string) {
    try {
      await navigator.clipboard.writeText(shareUrl(slug));
      setCopiedSlug(slug);
      setTimeout(() => setCopiedSlug(null), 2000);
    } catch {
      // Clipboard blocked — the link is visible on screen to copy by hand.
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this release and everyone who signed up for it? This can't be undone.")) return;
    const prev = campaigns;
    setCampaigns((c) => c.filter((x) => x.id !== id));
    const res = await deleteReleaseCampaign(id);
    if (!res.ok) {
      setCampaigns(prev); // rollback
      setError(res.error || "Couldn't delete.");
    }
  }

  return (
    <div className="p-8 max-w-3xl">
      {/* What this is — plain language, up top */}
      <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-xl p-5 mb-6">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-[#c7cad8] leading-relaxed">
            <p className="text-white font-medium mb-1">What a release notify does</p>
            <p>
              You&rsquo;re about to drop a new song. Create it here and you get a link to
              share on your socials. Fans who click it leave their email, and on release
              day <span className="text-white">everyone gets the link at the same time</span> —
              so plays land in the first hours, which is exactly when the streaming
              services decide whether to push your song. Every signup also joins your
              mailing list automatically.
            </p>
          </div>
        </div>
      </div>

      {!hasSite && (
        <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 mb-6 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-[#c7cad8] leading-relaxed">
            Set up your <a href="/website" className="text-indigo-400 hover:underline">Website</a> first.
            The notify page borrows your photo and artist name from there — without it,
            fans see a plain page.
          </p>
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-white font-semibold">Your releases</h2>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700"
          >
            <Plus className="w-4 h-4" /> New release
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl p-5 mb-6 space-y-4">
          <div>
            <label className="block text-[#8b8fa8] text-sm mb-1.5">Release name</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Midnight in Greeley"
              required
              className="w-full bg-[#0f1117] border border-[#2a2d3a] text-white px-3 py-2 rounded-lg text-sm placeholder:text-[#8b8fa8] focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[#8b8fa8] text-sm mb-1.5">Release date</label>
              <input
                type="date"
                value={releaseDate}
                onChange={(e) => setReleaseDate(e.target.value)}
                required
                className="w-full bg-[#0f1117] border border-[#2a2d3a] text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-indigo-500 [color-scheme:dark]"
              />
            </div>
            <div>
              <label className="block text-[#8b8fa8] text-sm mb-1.5">
                Streaming link <span className="text-[#5a5e72]">(optional)</span>
              </label>
              <input
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://open.spotify.com/…"
                className="w-full bg-[#0f1117] border border-[#2a2d3a] text-white px-3 py-2 rounded-lg text-sm placeholder:text-[#8b8fa8] focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
          <p className="text-[#5a5e72] text-xs leading-snug">
            Don&rsquo;t have the streaming link yet? Leave it blank — you can add it once
            your distributor gives it to you, before release day.
          </p>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {saving ? "Creating…" : "Create release"}
            </button>
            {campaigns.length > 0 && (
              <button
                type="button"
                onClick={() => { setShowForm(false); setError(""); }}
                className="px-4 py-2 rounded-lg text-sm font-medium text-[#8b8fa8] hover:text-white"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      )}

      <div className="space-y-3">
        {campaigns.map((c) => (
          <div key={c.id} className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-white font-medium">{c.title}</h3>
                  {c.status === "announced" && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/15 text-green-400">Out now</span>
                  )}
                  {c.status === "canceled" && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-[#2a2d3a] text-[#8b8fa8]">Canceled</span>
                  )}
                </div>
                <div className="flex items-center gap-4 mt-1.5 text-sm text-[#8b8fa8]">
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" /> {formatDate(c.releaseAt)}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" /> {c.signupCount} waiting
                  </span>
                </div>
              </div>
              <button
                onClick={() => handleDelete(c.id)}
                title="Delete release"
                className="text-[#8b8fa8] hover:text-red-400 flex-shrink-0"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {/* The shareable link */}
            <div className="mt-4 flex items-center gap-2">
              <code className="flex-1 min-w-0 truncate bg-[#0f1117] border border-[#2a2d3a] rounded-lg px-3 py-2 text-xs text-[#c7cad8]">
                {shareUrl(c.slug)}
              </code>
              <button
                onClick={() => handleCopy(c.slug)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-[#2a2d3a] text-white hover:bg-[#343849] flex-shrink-0"
              >
                {copiedSlug === c.slug ? (
                  <><Check className="w-3.5 h-3.5" /> Copied</>
                ) : (
                  <><Copy className="w-3.5 h-3.5" /> Copy link</>
                )}
              </button>
              <a
                href={shareUrl(c.slug)}
                target="_blank"
                rel="noreferrer"
                title="Preview the fan page"
                className="inline-flex items-center px-3 py-2 rounded-lg text-xs font-medium bg-[#2a2d3a] text-white hover:bg-[#343849] flex-shrink-0"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
            <p className="text-[#5a5e72] text-xs mt-2">
              Share this link on Instagram, in your bio, anywhere. That&rsquo;s the page fans sign up on.
            </p>
          </div>
        ))}
      </div>

      {campaigns.length === 0 && !showForm && (
        <div className="text-center py-12">
          <Bell className="w-8 h-8 text-[#5a5e72] mx-auto mb-3" />
          <p className="text-[#8b8fa8] text-sm">No releases yet. Create one to get a shareable signup link.</p>
        </div>
      )}
    </div>
  );
}
