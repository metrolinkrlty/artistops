"use client";
import Header from "@/components/layout/Header";
import { mockStreamPlays } from "@/lib/mock-data";
import { Plus, Search, Upload, X } from "lucide-react";
import { useState } from "react";

// ISRC-centric view: group by ISRC/song
const isrcData = [
  {
    isrc: "USRC12345678",
    song: "Midnight Drive",
    period: "May 2024",
    platforms: {
      Spotify: 245320,
      "Apple Music": 89430,
      "YouTube Music": 34210,
      TikTok: 892100,
      Amazon: 18200,
    },
    total: 1279260,
  },
  {
    isrc: "USRC12345679",
    song: "Golden Hours",
    period: "May 2024",
    platforms: {
      Spotify: 123450,
      "Apple Music": 45670,
      "YouTube Music": 0,
      TikTok: 234500,
      Amazon: 8100,
    },
    total: 411720,
  },
];

const platformComparison = [
  { platform: "Spotify", plays: 567110, pct: 30.5, yoy: "+18%" },
  { platform: "TikTok", plays: 1126600, pct: 60.5, yoy: "+142%" },
  { platform: "Apple Music", plays: 135100, pct: 7.3, yoy: "+9%" },
  { platform: "YouTube Music", plays: 34210, pct: 1.8, yoy: "-3%" },
  { platform: "Amazon Music", plays: 26300, pct: 1.4, yoy: "+22%" },
];

const csvFormat = `isrc,platform,plays,period
USRC12345678,Spotify,245320,2024-05-01
USRC12345678,Apple Music,89430,2024-05-01`;

export default function StreamingPage() {
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"entries" | "isrc">("entries");
  const [showCsvModal, setShowCsvModal] = useState(false);

  const filtered = mockStreamPlays.filter(s =>
    s.songTitle.toLowerCase().includes(search.toLowerCase()) ||
    s.platform.toLowerCase().includes(search.toLowerCase())
  );
  const totalPlays = filtered.reduce((sum, s) => sum + s.plays, 0);

  return (
    <div className="flex-1">
      <Header title="Streaming Plays" subtitle="Track plays across all platforms" />
      <div className="p-8 space-y-6">
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl p-4">
            <p className="text-[#8b8fa8] text-sm">Total Plays</p>
            <p className="text-white text-2xl font-bold mt-1">{totalPlays.toLocaleString()}</p>
          </div>
          <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl p-4">
            <p className="text-[#8b8fa8] text-sm">Platforms</p>
            <p className="text-white text-2xl font-bold mt-1">{new Set(mockStreamPlays.map(s => s.platform)).size}</p>
          </div>
          <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl p-4">
            <p className="text-[#8b8fa8] text-sm">Songs Tracked</p>
            <p className="text-white text-2xl font-bold mt-1">{new Set(mockStreamPlays.map(s => s.songTitle)).size}</p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-[#8b8fa8] absolute left-3 top-1/2 -translate-y-1/2" />
              <input type="text" placeholder="Search plays..." value={search} onChange={e => setSearch(e.target.value)}
                className="bg-[#1a1d27] border border-[#2a2d3a] text-white pl-10 pr-4 py-2 rounded-lg text-sm placeholder:text-[#8b8fa8] focus:outline-none focus:border-indigo-500 w-72" />
            </div>
            <div className="flex rounded-lg overflow-hidden border border-[#2a2d3a]">
              <button onClick={() => setView("entries")} className={`px-3 py-2 text-sm ${view === "entries" ? "bg-indigo-600 text-white" : "text-[#8b8fa8] hover:text-white"}`}>
                Entries
              </button>
              <button onClick={() => setView("isrc")} className={`px-3 py-2 text-sm ${view === "isrc" ? "bg-indigo-600 text-white" : "text-[#8b8fa8] hover:text-white"}`}>
                ISRC View
              </button>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowCsvModal(true)} className="flex items-center gap-2 px-4 py-2 border border-[#2a2d3a] text-[#8b8fa8] rounded-lg text-sm hover:text-white">
              <Upload className="w-4 h-4" /> Import CSV
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700">
              <Plus className="w-4 h-4" /> Add Entry
            </button>
          </div>
        </div>

        {view === "entries" ? (
          <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="text-[#8b8fa8] text-sm border-b border-[#2a2d3a] bg-[#161820]">
                  <th className="text-left px-6 py-4">Song</th>
                  <th className="text-left px-6 py-4">Platform</th>
                  <th className="text-left px-6 py-4">Period</th>
                  <th className="text-left px-6 py-4">ISRC</th>
                  <th className="text-right px-6 py-4">Plays</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr key={s.id} className="border-b border-[#2a2d3a] last:border-0 hover:bg-[#2a2d3a]/40 transition-colors">
                    <td className="px-6 py-4 text-white">{s.songTitle}</td>
                    <td className="px-6 py-4 text-[#8b8fa8] text-sm">{s.platform}</td>
                    <td className="px-6 py-4 text-[#8b8fa8] text-sm">{new Date(s.period).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</td>
                    <td className="px-6 py-4 text-[#8b8fa8] text-xs font-mono">{s.isrc || "—"}</td>
                    <td className="px-6 py-4 text-right text-white font-medium">{s.plays.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[#8b8fa8] border-b border-[#2a2d3a] bg-[#161820]">
                  <th className="text-left px-6 py-4">ISRC</th>
                  <th className="text-left px-6 py-4">Song</th>
                  <th className="text-right px-6 py-4">Spotify</th>
                  <th className="text-right px-6 py-4">Apple Music</th>
                  <th className="text-right px-6 py-4">TikTok</th>
                  <th className="text-right px-6 py-4">YouTube Music</th>
                  <th className="text-right px-6 py-4">Amazon</th>
                  <th className="text-right px-6 py-4">Total</th>
                </tr>
              </thead>
              <tbody>
                {isrcData.map(row => (
                  <tr key={row.isrc} className="border-b border-[#2a2d3a] last:border-0 hover:bg-[#2a2d3a]/40">
                    <td className="px-6 py-4 font-mono text-indigo-400 text-xs">{row.isrc}</td>
                    <td className="px-6 py-4 text-white font-medium">{row.song}</td>
                    <td className="px-6 py-4 text-right text-[#8b8fa8]">{row.platforms.Spotify.toLocaleString()}</td>
                    <td className="px-6 py-4 text-right text-[#8b8fa8]">{row.platforms["Apple Music"].toLocaleString()}</td>
                    <td className="px-6 py-4 text-right text-[#8b8fa8]">{row.platforms.TikTok.toLocaleString()}</td>
                    <td className="px-6 py-4 text-right text-[#8b8fa8]">{row.platforms["YouTube Music"].toLocaleString()}</td>
                    <td className="px-6 py-4 text-right text-[#8b8fa8]">{row.platforms.Amazon.toLocaleString()}</td>
                    <td className="px-6 py-4 text-right text-white font-bold">{row.total.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Platform comparison */}
        <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl p-6">
          <h2 className="text-white font-semibold mb-4">Platform Comparison</h2>
          <div className="space-y-3">
            {platformComparison.map(p => (
              <div key={p.platform}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-white">{p.platform}</span>
                  <div className="flex gap-4 items-center">
                    <span className={`text-xs ${p.yoy.startsWith("+") ? "text-green-400" : "text-red-400"}`}>{p.yoy} YoY</span>
                    <span className="text-[#8b8fa8]">{p.plays.toLocaleString()} plays ({p.pct}%)</span>
                  </div>
                </div>
                <div className="h-2 bg-[#2a2d3a] rounded-full">
                  <div className="h-2 bg-indigo-600 rounded-full" style={{ width: `${p.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CSV Import Modal */}
      {showCsvModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-semibold">Import Streaming CSV</h2>
              <button onClick={() => setShowCsvModal(false)} className="text-[#8b8fa8] hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-[#8b8fa8] text-sm mb-4">Upload a CSV file from DistroKid, Spotify for Artists, Apple Music for Artists, or any platform. Required columns:</p>
            <div className="bg-[#0f1117] rounded-lg p-4 mb-4 font-mono text-xs text-green-400 whitespace-pre">{csvFormat}</div>
            <p className="text-[#8b8fa8] text-xs mb-4">Accepted columns: <code className="text-indigo-400">isrc</code>, <code className="text-indigo-400">platform</code>, <code className="text-indigo-400">plays</code>, <code className="text-indigo-400">period</code>. Optional: <code className="text-indigo-400">song_title</code>, <code className="text-indigo-400">upc</code>.</p>
            <div className="border-2 border-dashed border-[#2a2d3a] rounded-xl p-8 text-center mb-4 hover:border-indigo-500/50 transition-colors cursor-pointer">
              <Upload className="w-8 h-8 text-[#8b8fa8] mx-auto mb-2" />
              <p className="text-[#8b8fa8] text-sm">Drop your CSV file here or click to browse</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowCsvModal(false)} className="flex-1 px-4 py-2 border border-[#2a2d3a] text-[#8b8fa8] rounded-lg text-sm hover:text-white">Cancel</button>
              <button onClick={() => setShowCsvModal(false)} className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700">Import</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
