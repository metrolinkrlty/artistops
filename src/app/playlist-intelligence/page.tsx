"use client";
import Header from "@/components/layout/Header";
import { useState } from "react";
import { Search, Bell, BellOff } from "lucide-react";

const mockPlaylists = [
  { id: "1", name: "Indie Vibes", platform: "Spotify", type: "EDITORIAL", followers: 284000, songs: 2, streams: 42300, revenue: 1680, notified: true, addedAt: "2024-03-20", song: "Midnight Drive" },
  { id: "2", name: "Late Night Drives", platform: "Spotify", type: "EDITORIAL", followers: 156000, songs: 1, streams: 28400, revenue: 1130, notified: true, addedAt: "2024-04-02", song: "Midnight Drive" },
  { id: "3", name: "Discover Weekly", platform: "Spotify", type: "ALGORITHMIC", followers: 0, songs: 1, streams: 18200, revenue: 725, notified: false, addedAt: "2024-05-06", song: "Golden Hours" },
  { id: "4", name: "Release Radar", platform: "Spotify", type: "ALGORITHMIC", followers: 0, songs: 2, streams: 12100, revenue: 484, notified: false, addedAt: "2024-05-21", song: "Golden Hours" },
  { id: "5", name: "R&B Essentials", platform: "Apple Music", type: "EDITORIAL", followers: 198000, songs: 1, streams: 19800, revenue: 2134, notified: true, addedAt: "2024-05-18", song: "Golden Hours" },
  { id: "6", name: "Pop Hits", platform: "Apple Music", type: "EDITORIAL", followers: 412000, songs: 1, streams: 9200, revenue: 992, notified: false, addedAt: "2024-04-10", song: "Midnight Drive" },
  { id: "7", name: "Chill Mix", platform: "Amazon Music", type: "ALGORITHMIC", followers: 0, songs: 1, streams: 7400, revenue: 296, notified: false, addedAt: "2024-05-01", song: "Midnight Drive" },
  { id: "8", name: "Fan Faves Mix", platform: "Spotify", type: "USER", followers: 2300, songs: 1, streams: 4100, revenue: 164, notified: false, addedAt: "2024-03-28", song: "Midnight Drive" },
];

const typeColors: Record<string, string> = {
  EDITORIAL: "bg-indigo-500/20 text-indigo-400",
  ALGORITHMIC: "bg-green-500/20 text-green-400",
  USER: "bg-gray-500/20 text-gray-400",
};

const platformColors: Record<string, string> = {
  Spotify: "bg-[#1DB954]/20 text-[#1DB954]",
  "Apple Music": "bg-red-500/20 text-red-400",
  "Amazon Music": "bg-blue-500/20 text-blue-400",
};

export default function PlaylistIntelligencePage() {
  const [search, setSearch] = useState("");
  const [notifications, setNotifications] = useState<Record<string, boolean>>(
    Object.fromEntries(mockPlaylists.map(p => [p.id, p.notified]))
  );

  const filtered = mockPlaylists.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.platform.toLowerCase().includes(search.toLowerCase()) ||
    p.song.toLowerCase().includes(search.toLowerCase())
  );

  const totalStreams = mockPlaylists.reduce((s, p) => s + p.streams, 0);
  const totalRevenue = mockPlaylists.reduce((s, p) => s + p.revenue, 0);
  const editorialCount = mockPlaylists.filter(p => p.type === "EDITORIAL").length;

  const topByRevenue = [...mockPlaylists].sort((a, b) => b.revenue - a.revenue).slice(0, 5);

  return (
    <div className="flex-1">
      <Header title="Playlist Intelligence" subtitle="Track playlist placements and performance" />
      <div className="p-8 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl p-4">
            <p className="text-[#8b8fa8] text-sm">Active Playlists</p>
            <p className="text-white text-2xl font-bold mt-1">{mockPlaylists.length}</p>
          </div>
          <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl p-4">
            <p className="text-[#8b8fa8] text-sm">Editorial Placements</p>
            <p className="text-white text-2xl font-bold mt-1">{editorialCount}</p>
          </div>
          <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl p-4">
            <p className="text-[#8b8fa8] text-sm">Playlist Streams</p>
            <p className="text-white text-2xl font-bold mt-1">{totalStreams.toLocaleString()}</p>
          </div>
          <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl p-4">
            <p className="text-[#8b8fa8] text-sm">Playlist Revenue</p>
            <p className="text-white text-2xl font-bold mt-1">${totalRevenue.toLocaleString()}</p>
          </div>
        </div>

        {/* Main table */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="relative">
              <Search className="w-4 h-4 text-[#8b8fa8] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search playlists..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="bg-[#1a1d27] border border-[#2a2d3a] text-white pl-10 pr-4 py-2 rounded-lg text-sm placeholder:text-[#8b8fa8] focus:outline-none focus:border-indigo-500 w-72"
              />
            </div>
          </div>
          <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="text-[#8b8fa8] text-sm border-b border-[#2a2d3a] bg-[#161820]">
                  <th className="text-left px-6 py-4">Playlist</th>
                  <th className="text-left px-6 py-4">Platform</th>
                  <th className="text-left px-6 py-4">Type</th>
                  <th className="text-right px-6 py-4">Followers</th>
                  <th className="text-left px-6 py-4">Song</th>
                  <th className="text-right px-6 py-4">Streams</th>
                  <th className="text-right px-6 py-4">Est. Revenue</th>
                  <th className="text-left px-6 py-4">Added</th>
                  <th className="text-center px-6 py-4">Notify</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(pl => (
                  <tr key={pl.id} className="border-b border-[#2a2d3a] last:border-0 hover:bg-[#2a2d3a]/40 transition-colors">
                    <td className="px-6 py-4 text-white font-medium">{pl.name}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${platformColors[pl.platform] || "bg-gray-500/20 text-gray-400"}`}>
                        {pl.platform}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${typeColors[pl.type]}`}>
                        {pl.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-[#8b8fa8] text-sm">
                      {pl.followers > 0 ? pl.followers.toLocaleString() : "—"}
                    </td>
                    <td className="px-6 py-4 text-[#8b8fa8] text-sm">{pl.song}</td>
                    <td className="px-6 py-4 text-right text-white">{pl.streams.toLocaleString()}</td>
                    <td className="px-6 py-4 text-right text-green-400">${pl.revenue.toLocaleString()}</td>
                    <td className="px-6 py-4 text-[#8b8fa8] text-sm">{pl.addedAt}</td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => setNotifications(n => ({ ...n, [pl.id]: !n[pl.id] }))}
                        className={`p-1.5 rounded-lg transition-colors ${notifications[pl.id] ? "bg-indigo-500/20 text-indigo-400" : "text-[#8b8fa8] hover:text-white"}`}
                      >
                        {notifications[pl.id] ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top by revenue */}
        <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl p-6">
          <h2 className="text-white font-semibold mb-4">Top Playlists by Revenue</h2>
          <div className="space-y-3">
            {topByRevenue.map((pl, i) => {
              const pct = (pl.revenue / topByRevenue[0].revenue) * 100;
              return (
                <div key={pl.id}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-white">#{i + 1} {pl.name} <span className="text-[#8b8fa8]">({pl.platform})</span></span>
                    <span className="text-green-400">${pl.revenue.toLocaleString()}</span>
                  </div>
                  <div className="h-2 bg-[#2a2d3a] rounded-full">
                    <div className="h-2 bg-indigo-600 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
