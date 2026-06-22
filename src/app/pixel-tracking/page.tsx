"use client";
import Header from "@/components/layout/Header";
import { mockPixelEvents } from "@/lib/mock-data";
import { Search, Copy, Check } from "lucide-react";
import { useState } from "react";

const eventColors: Record<string, string> = {
  page_view: "bg-blue-500/20 text-blue-400",
  play_button: "bg-green-500/20 text-green-400",
  email_signup: "bg-purple-500/20 text-purple-400",
  pre_save: "bg-amber-500/20 text-amber-400",
  merch_click: "bg-pink-500/20 text-pink-400",
  link_click: "bg-cyan-500/20 text-cyan-400",
};

const SNIPPET = `<!-- ArtistOps Tracking Pixel -->
<script>
(function() {
  var AO_PIXEL_URL = 'https://yourdomain.com/api/pixel';
  var visitorId = localStorage.getItem('ao_vid') ||
    Math.random().toString(36).substr(2, 9);
  localStorage.setItem('ao_vid', visitorId);

  function track(eventType, extra) {
    var params = new URLSearchParams(window.location.search);
    fetch(AO_PIXEL_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        visitorId: visitorId,
        pageUrl: window.location.pathname,
        referrer: document.referrer,
        eventType: eventType,
        utmSource: params.get('utm_source'),
        utmMedium: params.get('utm_medium'),
        utmCampaign: params.get('utm_campaign'),
        utmContent: params.get('utm_content'),
        utmTerm: params.get('utm_term'),
        ...extra
      })
    });
  }

  // Auto-track page views
  track('page_view');

  // Track clicks on links with data-ao-event attribute
  document.addEventListener('click', function(e) {
    var el = e.target.closest('[data-ao-event]');
    if (el) track(el.getAttribute('data-ao-event'));
  });

  // Expose for manual tracking
  window.aoTrack = track;
})();
</script>`;

export default function PixelTrackingPage() {
  const [search, setSearch] = useState("");
  const [copied, setCopied] = useState(false);
  const filtered = mockPixelEvents.filter(e =>
    e.eventType.toLowerCase().includes(search.toLowerCase()) ||
    (e.songTitle || "").toLowerCase().includes(search.toLowerCase())
  );

  const handleCopy = () => {
    navigator.clipboard.writeText(SNIPPET);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex-1">
      <Header title="Pixel Tracking" subtitle="Website visitor and conversion tracking" />
      <div className="p-8 space-y-6">
        <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-white font-semibold">Tracking Snippet</h2>
              <p className="text-[#8b8fa8] text-sm mt-1">Paste this before the &lt;/body&gt; tag on your artist website</p>
            </div>
            <button onClick={handleCopy} className="flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700">
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
          <pre className="bg-[#0f1117] border border-[#2a2d3a] rounded-lg p-4 text-xs text-green-300 overflow-x-auto whitespace-pre-wrap">{SNIPPET}</pre>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="relative">
              <Search className="w-4 h-4 text-[#8b8fa8] absolute left-3 top-1/2 -translate-y-1/2" />
              <input type="text" placeholder="Search events..." value={search} onChange={e => setSearch(e.target.value)}
                className="bg-[#1a1d27] border border-[#2a2d3a] text-white pl-10 pr-4 py-2 rounded-lg text-sm placeholder:text-[#8b8fa8] focus:outline-none focus:border-indigo-500 w-72" />
            </div>
            <div className="flex gap-4 text-sm text-[#8b8fa8]">
              <span>Total Events: <strong className="text-white">{filtered.length}</strong></span>
              <span>Unique Visitors: <strong className="text-white">{new Set(filtered.map(e => e.visitorId)).size}</strong></span>
            </div>
          </div>
          <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="text-[#8b8fa8] text-sm border-b border-[#2a2d3a] bg-[#161820]">
                  <th className="text-left px-6 py-4">Timestamp</th>
                  <th className="text-left px-6 py-4">Event</th>
                  <th className="text-left px-6 py-4">Page</th>
                  <th className="text-left px-6 py-4">Source</th>
                  <th className="text-left px-6 py-4">Campaign</th>
                  <th className="text-left px-6 py-4">Visitor</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((e) => (
                  <tr key={e.id} className="border-b border-[#2a2d3a] last:border-0 hover:bg-[#2a2d3a]/40 transition-colors">
                    <td className="px-6 py-4 text-[#8b8fa8] text-xs">{new Date(e.createdAt).toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${eventColors[e.eventType] || "bg-gray-500/20 text-gray-400"}`}>
                        {e.eventType.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-[#8b8fa8] text-xs font-mono">{e.pageUrl}</td>
                    <td className="px-6 py-4 text-[#8b8fa8] text-sm">{e.utmSource || "—"}</td>
                    <td className="px-6 py-4 text-[#8b8fa8] text-sm">{e.utmCampaign || "—"}</td>
                    <td className="px-6 py-4 text-[#8b8fa8] text-xs font-mono">{e.visitorId}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
