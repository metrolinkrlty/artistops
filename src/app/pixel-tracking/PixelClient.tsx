"use client";
import { Search, Copy, Check, Plus, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createPixel, deletePixel } from "./actions";

const eventColors: Record<string, string> = {
  page_view: "bg-blue-500/20 text-blue-400",
  play_button: "bg-green-500/20 text-green-400",
  email_signup: "bg-purple-500/20 text-purple-400",
  pre_save: "bg-amber-500/20 text-amber-400",
  merch_click: "bg-pink-500/20 text-pink-400",
  link_click: "bg-cyan-500/20 text-cyan-400",
};

function buildSnippet(pixelId: string) {
  return `<!-- ArtistOps Tracking Pixel -->
<script>
(function() {
  var AO_PIXEL_URL = 'https://artistops.net/api/pixel';
  var AO_PIXEL_ID = '${pixelId}';
  var visitorId = localStorage.getItem('ao_vid') ||
    Math.random().toString(36).substr(2, 9);
  localStorage.setItem('ao_vid', visitorId);

  function track(eventType, extra) {
    var params = new URLSearchParams(window.location.search);
    fetch(AO_PIXEL_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pixelId: AO_PIXEL_ID,
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

  track('page_view');

  document.addEventListener('click', function(e) {
    var el = e.target.closest('[data-ao-event]');
    if (el) track(el.getAttribute('data-ao-event'));
  });

  window.aoTrack = track;
})();
</script>`;
}

type Pixel = { id: string; name: string };
type Event = {
  id: string; pixelId: string | null; pixelName: string | null; songTitle: string | null;
  visitorId: string; pageUrl: string; eventType: string;
  utmSource: string | null; utmCampaign: string | null; createdAt: string;
};

export default function PixelClient({ pixels, events }: { pixels: Pixel[]; events: Event[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [selected, setSelected] = useState<string | null>(pixels[0]?.id ?? null);
  const [search, setSearch] = useState("");
  const [copied, setCopied] = useState(false);
  const [newName, setNewName] = useState("");

  const snippet = selected ? buildSnippet(selected) : "";
  const selectedName = pixels.find((p) => p.id === selected)?.name ?? "";

  const handleCopy = () => {
    navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAdd = () => {
    const name = newName.trim();
    if (!name) return;
    startTransition(async () => {
      await createPixel(name);
      setNewName("");
      router.refresh();
    });
  };

  const handleDelete = (id: string) => {
    startTransition(async () => {
      await deletePixel(id);
      if (selected === id) setSelected(null);
      router.refresh();
    });
  };

  const filtered = events.filter((e) =>
    (selected ? e.pixelId === selected : true) &&
    (e.eventType.toLowerCase().includes(search.toLowerCase()) ||
      (e.songTitle || "").toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="p-8 space-y-6">
      {/* Pixels */}
      <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl p-6">
        <h2 className="text-white font-semibold mb-1">Your Pixels</h2>
        <p className="text-[#8b8fa8] text-sm mb-4">Each pixel has its own ID and snippet — use a separate one per website to keep the data separate.</p>
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {pixels.map((p) => (
            <div
              key={p.id}
              onClick={() => setSelected(p.id)}
              className={`group flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-lg text-sm cursor-pointer border transition-colors ${selected === p.id ? "bg-indigo-600/20 border-indigo-500 text-white" : "border-[#2a2d3a] text-[#8b8fa8] hover:text-white"}`}
            >
              <span>{p.name}</span>
              <button
                onClick={(e) => { e.stopPropagation(); handleDelete(p.id); }}
                disabled={pending}
                title="Delete pixel"
                className="opacity-0 group-hover:opacity-100 text-[#8b8fa8] hover:text-red-400"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          {pixels.length === 0 && <span className="text-[#8b8fa8] text-sm">No pixels yet — create one below to get a tracking snippet.</span>}
        </div>
        <div className="flex items-center gap-2">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            placeholder="New pixel name (e.g. artistops.net)"
            className="bg-[#0f1117] border border-[#2a2d3a] text-white px-3 py-2 rounded-lg text-sm placeholder:text-[#8b8fa8] focus:outline-none focus:border-indigo-500 w-72"
          />
          <button
            onClick={handleAdd}
            disabled={pending || !newName.trim()}
            className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />Add Pixel
          </button>
        </div>
      </div>

      {/* Snippet for the selected pixel */}
      {selected && (
        <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-white font-semibold">Tracking Snippet — {selectedName}</h2>
              <p className="text-[#8b8fa8] text-sm mt-1">Paste this before the &lt;/body&gt; tag on {selectedName || "your website"}</p>
            </div>
            <button onClick={handleCopy} className="flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700">
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}{copied ? "Copied!" : "Copy"}
            </button>
          </div>
          <pre className="bg-[#0f1117] border border-[#2a2d3a] rounded-lg p-4 text-xs text-green-300 overflow-x-auto whitespace-pre-wrap">{snippet}</pre>
        </div>
      )}

      {/* Events */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="relative">
            <Search className="w-4 h-4 text-[#8b8fa8] absolute left-3 top-1/2 -translate-y-1/2" />
            <input type="text" placeholder="Search events..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="bg-[#1a1d27] border border-[#2a2d3a] text-white pl-10 pr-4 py-2 rounded-lg text-sm placeholder:text-[#8b8fa8] focus:outline-none focus:border-indigo-500 w-72" />
          </div>
          <div className="flex gap-4 text-sm text-[#8b8fa8]">
            <span>{selected ? `Showing: ${selectedName}` : "Showing: all pixels"}</span>
            <span>Total Events: <strong className="text-white">{filtered.length}</strong></span>
            <span>Unique Visitors: <strong className="text-white">{new Set(filtered.map((e) => e.visitorId)).size}</strong></span>
          </div>
        </div>
        <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl overflow-hidden">
          <table className="w-full">
            <thead><tr className="text-[#8b8fa8] text-sm border-b border-[#2a2d3a] bg-[#161820]"><th className="text-left px-6 py-4">Timestamp</th><th className="text-left px-6 py-4">Pixel</th><th className="text-left px-6 py-4">Event</th><th className="text-left px-6 py-4">Page</th><th className="text-left px-6 py-4">Source</th><th className="text-left px-6 py-4">Campaign</th><th className="text-left px-6 py-4">Visitor</th></tr></thead>
            <tbody>
              {filtered.map((e) => (
                <tr key={e.id} className="border-b border-[#2a2d3a] last:border-0 hover:bg-[#2a2d3a]/40 transition-colors">
                  <td className="px-6 py-4 text-[#8b8fa8] text-xs">{new Date(e.createdAt).toLocaleString()}</td>
                  <td className="px-6 py-4 text-[#8b8fa8] text-sm">{e.pixelName || "—"}</td>
                  <td className="px-6 py-4"><span className={`px-2 py-1 rounded text-xs font-medium ${eventColors[e.eventType] || "bg-gray-500/20 text-gray-400"}`}>{e.eventType.replace(/_/g, " ")}</span></td>
                  <td className="px-6 py-4 text-[#8b8fa8] text-xs font-mono">{e.pageUrl}</td>
                  <td className="px-6 py-4 text-[#8b8fa8] text-sm">{e.utmSource || "—"}</td>
                  <td className="px-6 py-4 text-[#8b8fa8] text-sm">{e.utmCampaign || "—"}</td>
                  <td className="px-6 py-4 text-[#8b8fa8] text-xs font-mono">{e.visitorId}</td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={7} className="px-6 py-10 text-center text-[#8b8fa8] text-sm">No events yet. Install the snippet to start tracking.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
