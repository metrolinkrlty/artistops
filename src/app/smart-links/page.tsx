"use client";
import Header from "@/components/layout/Header";
import { useState } from "react";
import { Plus, Search, Link2, X, ExternalLink } from "lucide-react";

const mockSmartLinks = [
  {
    id: "1",
    slug: "midnight-drive",
    title: "Midnight Drive",
    song: "Midnight Drive",
    platforms: [
      { name: "Spotify", url: "https://open.spotify.com/track/abc123", priority: 1 },
      { name: "Apple Music", url: "https://music.apple.com/us/album/abc", priority: 2 },
      { name: "YouTube Music", url: "https://music.youtube.com/watch?v=abc", priority: 3 },
      { name: "Amazon Music", url: "https://music.amazon.com/albums/abc", priority: 4 },
      { name: "Tidal", url: "https://tidal.com/browse/track/abc", priority: 5 },
    ],
    totalClicks: 4821,
    ctr: 68.4,
    topPlatform: "Spotify",
    isActive: true,
  },
  {
    id: "2",
    slug: "golden-hours",
    title: "Golden Hours",
    song: "Golden Hours",
    platforms: [
      { name: "Spotify", url: "https://open.spotify.com/track/def456", priority: 1 },
      { name: "Apple Music", url: "https://music.apple.com/us/album/def", priority: 2 },
      { name: "YouTube Music", url: "https://music.youtube.com/watch?v=def", priority: 3 },
      { name: "Amazon Music", url: "https://music.amazon.com/albums/def", priority: 4 },
    ],
    totalClicks: 2340,
    ctr: 61.2,
    topPlatform: "Apple Music",
    isActive: true,
  },
  {
    id: "3",
    slug: "electric-soul-preview",
    title: "Electric Soul (Preview)",
    song: "Electric Soul",
    platforms: [
      { name: "Spotify", url: "https://open.spotify.com/track/ghi789", priority: 1 },
      { name: "SoundCloud", url: "https://soundcloud.com/alexrivera/electric-soul", priority: 2 },
    ],
    totalClicks: 892,
    ctr: 54.1,
    topPlatform: "SoundCloud",
    isActive: false,
  },
];

const clicksByDay = [
  { day: "Jun 15", clicks: 312 },
  { day: "Jun 16", clicks: 489 },
  { day: "Jun 17", clicks: 421 },
  { day: "Jun 18", clicks: 634 },
  { day: "Jun 19", clicks: 578 },
  { day: "Jun 20", clicks: 712 },
  { day: "Jun 21", clicks: 541 },
];

const platformBreakdown = [
  { platform: "Spotify", clicks: 2891, pct: 36.2 },
  { platform: "Apple Music", clicks: 1923, pct: 24.1 },
  { platform: "YouTube Music", clicks: 1234, pct: 15.5 },
  { platform: "Amazon Music", clicks: 987, pct: 12.4 },
  { platform: "Tidal", clicks: 421, pct: 5.3 },
  { platform: "SoundCloud", clicks: 340, pct: 4.3 },
  { platform: "Other", clicks: 200, pct: 2.5 },
];

const countryBreakdown = [
  { country: "United States", flag: "🇺🇸", clicks: 3421, pct: 42.9 },
  { country: "United Kingdom", flag: "🇬🇧", clicks: 1203, pct: 15.1 },
  { country: "Canada", flag: "🇨🇦", clicks: 892, pct: 11.2 },
  { country: "Australia", flag: "🇦🇺", clicks: 567, pct: 7.1 },
  { country: "Germany", flag: "🇩🇪", clicks: 423, pct: 5.3 },
  { country: "Brazil", flag: "🇧🇷", clicks: 312, pct: 3.9 },
  { country: "Other", flag: "🌍", clicks: 1178, pct: 14.8 },
];

const songOptions = ["Midnight Drive", "Golden Hours", "Electric Soul", "Sunrise Boulevard", "Neon Nights"];
const platformOptions = ["Spotify", "Apple Music", "YouTube Music", "Amazon Music", "Tidal", "SoundCloud", "Audiomack", "Deezer", "TikTok"];

export default function SmartLinksPage() {
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [selectedLink, setSelectedLink] = useState(mockSmartLinks[0]);
  const [newLink, setNewLink] = useState({ song: "", slug: "", platforms: [{ name: "Spotify", url: "" }] });

  const filtered = mockSmartLinks.filter(l =>
    l.title.toLowerCase().includes(search.toLowerCase()) ||
    l.slug.toLowerCase().includes(search.toLowerCase())
  );

  const maxClicks = Math.max(...clicksByDay.map(d => d.clicks));

  return (
    <div className="flex-1">
      <Header title="Smart Links" subtitle="One link for all platforms" />
      <div className="p-8 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl p-4">
            <p className="text-[#8b8fa8] text-sm">Total Smart Links</p>
            <p className="text-white text-2xl font-bold mt-1">{mockSmartLinks.length}</p>
          </div>
          <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl p-4">
            <p className="text-[#8b8fa8] text-sm">Total Clicks (All Time)</p>
            <p className="text-white text-2xl font-bold mt-1">8,053</p>
          </div>
          <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl p-4">
            <p className="text-[#8b8fa8] text-sm">Clicks This Month</p>
            <p className="text-white text-2xl font-bold mt-1">3,687</p>
          </div>
          <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl p-4">
            <p className="text-[#8b8fa8] text-sm">Avg CTR</p>
            <p className="text-white text-2xl font-bold mt-1">61.2%</p>
          </div>
        </div>

        {/* Table */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="relative">
              <Search className="w-4 h-4 text-[#8b8fa8] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search smart links..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="bg-[#1a1d27] border border-[#2a2d3a] text-white pl-10 pr-4 py-2 rounded-lg text-sm placeholder:text-[#8b8fa8] focus:outline-none focus:border-indigo-500 w-72"
              />
            </div>
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700"
            >
              <Plus className="w-4 h-4" /> Create Smart Link
            </button>
          </div>
          <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="text-[#8b8fa8] text-sm border-b border-[#2a2d3a] bg-[#161820]">
                  <th className="text-left px-6 py-4">Title / Slug</th>
                  <th className="text-left px-6 py-4">Platforms</th>
                  <th className="text-right px-6 py-4">Total Clicks</th>
                  <th className="text-right px-6 py-4">CTR</th>
                  <th className="text-left px-6 py-4">Top Platform</th>
                  <th className="text-left px-6 py-4">Status</th>
                  <th className="text-left px-6 py-4">Link</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(link => (
                  <tr
                    key={link.id}
                    onClick={() => setSelectedLink(link)}
                    className="border-b border-[#2a2d3a] last:border-0 hover:bg-[#2a2d3a]/40 transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-4">
                      <div className="text-white font-medium">{link.title}</div>
                      <div className="text-[#8b8fa8] text-xs font-mono">/{link.slug}</div>
                    </td>
                    <td className="px-6 py-4 text-[#8b8fa8] text-sm">{link.platforms.length} platforms</td>
                    <td className="px-6 py-4 text-right text-white font-medium">{link.totalClicks.toLocaleString()}</td>
                    <td className="px-6 py-4 text-right text-indigo-400 font-medium">{link.ctr}%</td>
                    <td className="px-6 py-4 text-[#8b8fa8] text-sm">{link.topPlatform}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${link.isActive ? "bg-green-500/20 text-green-400" : "bg-gray-500/20 text-gray-400"}`}>
                        {link.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-indigo-400 text-xs font-mono">
                        <Link2 className="w-3 h-3" />
                        artistops.com/listen/{link.slug}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Analytics for selected link */}
        <div>
          <h2 className="text-white font-semibold mb-4">
            Click Analytics — <span className="text-indigo-400">{selectedLink.title}</span>
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Clicks over time */}
            <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl p-6">
              <h3 className="text-white font-medium mb-4">Clicks Over Time (Last 7 Days)</h3>
              <div className="flex items-end gap-2 h-32">
                {clicksByDay.map(d => (
                  <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-[#8b8fa8] text-xs">{d.clicks}</span>
                    <div
                      className="w-full bg-indigo-600 rounded-t"
                      style={{ height: `${(d.clicks / maxClicks) * 100}%` }}
                    />
                    <span className="text-[#8b8fa8] text-xs">{d.day.replace("Jun ", "")}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Platform breakdown */}
            <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl p-6">
              <h3 className="text-white font-medium mb-4">Platform Selection</h3>
              <div className="space-y-3">
                {platformBreakdown.map(p => (
                  <div key={p.platform}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-white">{p.platform}</span>
                      <span className="text-[#8b8fa8]">{p.pct}% ({p.clicks.toLocaleString()})</span>
                    </div>
                    <div className="h-2 bg-[#2a2d3a] rounded-full">
                      <div className="h-2 bg-indigo-600 rounded-full" style={{ width: `${p.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Country breakdown */}
            <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl p-6">
              <h3 className="text-white font-medium mb-4">Top Countries</h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[#8b8fa8] border-b border-[#2a2d3a]">
                    <th className="text-left pb-2">Country</th>
                    <th className="text-right pb-2">Clicks</th>
                    <th className="text-right pb-2">%</th>
                  </tr>
                </thead>
                <tbody>
                  {countryBreakdown.map(c => (
                    <tr key={c.country} className="border-b border-[#2a2d3a] last:border-0">
                      <td className="py-2 text-white">{c.flag} {c.country}</td>
                      <td className="py-2 text-right text-[#8b8fa8]">{c.clicks.toLocaleString()}</td>
                      <td className="py-2 text-right text-indigo-400">{c.pct}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Device/OS */}
            <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl p-6">
              <h3 className="text-white font-medium mb-4">Device & OS Breakdown</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-[#8b8fa8] text-xs mb-2 uppercase tracking-wide">Device</p>
                  {[{ label: "Mobile", pct: 72 }, { label: "Desktop", pct: 21 }, { label: "Tablet", pct: 7 }].map(d => (
                    <div key={d.label} className="mb-2">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-white">{d.label}</span>
                        <span className="text-[#8b8fa8]">{d.pct}%</span>
                      </div>
                      <div className="h-2 bg-[#2a2d3a] rounded-full">
                        <div className="h-2 bg-indigo-500 rounded-full" style={{ width: `${d.pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
                <div>
                  <p className="text-[#8b8fa8] text-xs mb-2 uppercase tracking-wide">OS</p>
                  {[{ label: "iOS", pct: 48 }, { label: "Android", pct: 31 }, { label: "Windows", pct: 14 }, { label: "macOS", pct: 7 }].map(o => (
                    <div key={o.label} className="mb-2">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-white">{o.label}</span>
                        <span className="text-[#8b8fa8]">{o.pct}%</span>
                      </div>
                      <div className="h-2 bg-[#2a2d3a] rounded-full">
                        <div className="h-2 bg-purple-500 rounded-full" style={{ width: `${o.pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-white font-semibold text-lg">Create Smart Link</h2>
              <button onClick={() => setShowCreate(false)} className="text-[#8b8fa8] hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-[#8b8fa8] text-sm block mb-1">Song</label>
                <select
                  value={newLink.song}
                  onChange={e => setNewLink({ ...newLink, song: e.target.value })}
                  className="w-full bg-[#0f1117] border border-[#2a2d3a] text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                >
                  <option value="">Select a song...</option>
                  {songOptions.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[#8b8fa8] text-sm block mb-1">Slug</label>
                <div className="flex items-center gap-2">
                  <span className="text-[#8b8fa8] text-sm">artistops.com/listen/</span>
                  <input
                    type="text"
                    placeholder="my-song-name"
                    value={newLink.slug}
                    onChange={e => setNewLink({ ...newLink, slug: e.target.value })}
                    className="flex-1 bg-[#0f1117] border border-[#2a2d3a] text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
              <div>
                <label className="text-[#8b8fa8] text-sm block mb-2">Platform URLs</label>
                <div className="space-y-2">
                  {newLink.platforms.map((p, i) => (
                    <div key={i} className="flex gap-2">
                      <select
                        value={p.name}
                        onChange={e => {
                          const updated = [...newLink.platforms];
                          updated[i] = { ...updated[i], name: e.target.value };
                          setNewLink({ ...newLink, platforms: updated });
                        }}
                        className="bg-[#0f1117] border border-[#2a2d3a] text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 w-36"
                      >
                        {platformOptions.map(pl => <option key={pl} value={pl}>{pl}</option>)}
                      </select>
                      <input
                        type="text"
                        placeholder="https://..."
                        value={p.url}
                        onChange={e => {
                          const updated = [...newLink.platforms];
                          updated[i] = { ...updated[i], url: e.target.value };
                          setNewLink({ ...newLink, platforms: updated });
                        }}
                        className="flex-1 bg-[#0f1117] border border-[#2a2d3a] text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  ))}
                  <button
                    onClick={() => setNewLink({ ...newLink, platforms: [...newLink.platforms, { name: "Apple Music", url: "" }] })}
                    className="text-indigo-400 text-sm hover:text-indigo-300"
                  >
                    + Add Platform
                  </button>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowCreate(false)}
                  className="flex-1 px-4 py-2 border border-[#2a2d3a] text-[#8b8fa8] rounded-lg text-sm hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setShowCreate(false)}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700"
                >
                  Create Smart Link
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
