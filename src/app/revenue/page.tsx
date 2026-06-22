"use client";
import Header from "@/components/layout/Header";
import { mockRevenue } from "@/lib/mock-data";
import { Plus, Search, Upload } from "lucide-react";
import { useState } from "react";

const typeColors: Record<string, string> = {
  STREAMING: "bg-green-500/20 text-green-400",
  PRO_ROYALTY: "bg-blue-500/20 text-blue-400",
  MECHANICAL: "bg-purple-500/20 text-purple-400",
  SOUND_EXCHANGE: "bg-amber-500/20 text-amber-400",
  SYNC_LICENSE: "bg-indigo-500/20 text-indigo-400",
  YOUTUBE_CONTENT_ID: "bg-red-500/20 text-red-400",
  TIKTOK: "bg-pink-500/20 text-pink-400",
  OTHER: "bg-gray-500/20 text-gray-400",
};

const revenueByTerritory = [
  { country: "United States", flag: "🇺🇸", revenue: 4820.40, pct: 65.8 },
  { country: "United Kingdom", flag: "🇬🇧", revenue: 1102.30, pct: 15.1 },
  { country: "Canada", flag: "🇨🇦", revenue: 512.80, pct: 7.0 },
  { country: "Australia", flag: "🇦🇺", revenue: 312.40, pct: 4.3 },
  { country: "Germany", flag: "🇩🇪", revenue: 198.20, pct: 2.7 },
  { country: "France", flag: "🇫🇷", revenue: 121.50, pct: 1.7 },
  { country: "Japan", flag: "🇯🇵", revenue: 98.40, pct: 1.3 },
  { country: "Brazil", flag: "🇧🇷", revenue: 42.10, pct: 0.6 },
  { country: "India", flag: "🇮🇳", revenue: 24.30, pct: 0.3 },
  { country: "Other", flag: "🌍", revenues: 89.05, pct: 1.2 },
];

const revenueByCampaign = [
  { campaign: "Midnight Drive - Release Push", revenue: 1240.50, streams: 245000 },
  { campaign: "TikTok Boost - Midnight Drive", revenue: 98.75, streams: 892100 },
  { campaign: "Golden Hours - Pre-Save", revenue: 0, streams: 89400 },
];

const revenueByPlaylist = [
  { playlist: "Indie Vibes (Spotify Editorial)", revenue: 1680, streams: 42300 },
  { playlist: "R&B Essentials (Apple Music Editorial)", revenue: 2134, streams: 19800 },
  { playlist: "Late Night Drives (Spotify Editorial)", revenue: 1130, streams: 28400 },
  { playlist: "Discover Weekly (Spotify Algorithmic)", revenue: 725, streams: 18200 },
  { playlist: "Pop Hits (Apple Music Editorial)", revenue: 992, streams: 9200 },
];

const platformComparison = [
  { platform: "Spotify", type: "Freemium + Premium", avgRevPerStream: "$0.0040", listeners: "245.3K", streams: "567,110", revenue: "$1,811" },
  { platform: "Apple Music", type: "Subscription", avgRevPerStream: "$0.0084", listeners: "68.2K", streams: "135,100", revenue: "$1,337" },
  { platform: "TikTok", type: "Social/Ad-supported", avgRevPerStream: "$0.0001", listeners: "N/A", streams: "1,126,600", revenue: "$98" },
  { platform: "YouTube Music", type: "Freemium + Premium", avgRevPerStream: "$0.0018", listeners: "21.4K", streams: "34,210", revenue: "$312" },
  { platform: "Amazon Music", type: "Prime + Unlimited", avgRevPerStream: "$0.0040", listeners: "12.1K", streams: "24,300", revenue: "$97" },
  { platform: "SoundExchange", type: "Digital radio", avgRevPerStream: "$0.0024", listeners: "N/A", streams: "271,792", revenue: "$652" },
];

export default function RevenuePage() {
  const [search, setSearch] = useState("");
  const filtered = mockRevenue.filter(r =>
    (r.songTitle || "").toLowerCase().includes(search.toLowerCase()) ||
    r.platform.toLowerCase().includes(search.toLowerCase())
  );
  const total = mockRevenue.reduce((sum, r) => sum + r.amount, 0);
  const totalStreams = 1862320;
  const revPer1k = (total / (totalStreams / 1000));

  return (
    <div className="flex-1">
      <Header title="Revenue" subtitle="Track all income streams" />
      <div className="p-8 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl p-4">
            <p className="text-[#8b8fa8] text-sm">Total Revenue</p>
            <p className="text-white text-2xl font-bold mt-1">${total.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
          </div>
          <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl p-4">
            <p className="text-[#8b8fa8] text-sm">Entries</p>
            <p className="text-white text-2xl font-bold mt-1">{filtered.length}</p>
          </div>
          <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl p-4">
            <p className="text-[#8b8fa8] text-sm">Avg Per Entry</p>
            <p className="text-white text-2xl font-bold mt-1">${filtered.length ? (total / filtered.length).toFixed(2) : '0.00'}</p>
          </div>
          <div className="bg-[#1a1d27] border border-green-500/30 rounded-xl p-4">
            <p className="text-[#8b8fa8] text-sm">Rev / 1K Streams</p>
            <p className="text-white text-2xl font-bold mt-1">${revPer1k.toFixed(2)}</p>
          </div>
          <div className="bg-[#1a1d27] border border-green-500/30 rounded-xl p-4">
            <p className="text-[#8b8fa8] text-sm">Avg Rev / Stream</p>
            <p className="text-white text-2xl font-bold mt-1">${(total / totalStreams).toFixed(5)}</p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="relative">
            <Search className="w-4 h-4 text-[#8b8fa8] absolute left-3 top-1/2 -translate-y-1/2" />
            <input type="text" placeholder="Search revenue..." value={search} onChange={e => setSearch(e.target.value)}
              className="bg-[#1a1d27] border border-[#2a2d3a] text-white pl-10 pr-4 py-2 rounded-lg text-sm placeholder:text-[#8b8fa8] focus:outline-none focus:border-indigo-500 w-72" />
          </div>
          <div className="flex gap-2">
            <button className="flex items-center gap-2 px-4 py-2 border border-[#2a2d3a] text-[#8b8fa8] rounded-lg text-sm hover:text-white hover:border-white">
              <Upload className="w-4 h-4" /> Import CSV
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700">
              <Plus className="w-4 h-4" /> Add Entry
            </button>
          </div>
        </div>

        <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="text-[#8b8fa8] text-sm border-b border-[#2a2d3a] bg-[#161820]">
                <th className="text-left px-6 py-4">Song</th>
                <th className="text-left px-6 py-4">Platform</th>
                <th className="text-left px-6 py-4">Type</th>
                <th className="text-left px-6 py-4">Period</th>
                <th className="text-right px-6 py-4">Amount</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="border-b border-[#2a2d3a] last:border-0 hover:bg-[#2a2d3a]/40 transition-colors">
                  <td className="px-6 py-4 text-white">{r.songTitle}</td>
                  <td className="px-6 py-4 text-[#8b8fa8] text-sm">{r.platform}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${typeColors[r.revenueType] || typeColors.OTHER}`}>
                      {r.revenueType.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-[#8b8fa8] text-sm">{new Date(r.period).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</td>
                  <td className="px-6 py-4 text-right text-green-400 font-medium">${r.amount.toLocaleString('en-US', {minimumFractionDigits: 2})}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Revenue by Territory */}
        <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl p-6">
          <h2 className="text-white font-semibold mb-4">Revenue by Territory (Top 10)</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[#8b8fa8] border-b border-[#2a2d3a]">
                <th className="text-left pb-3">Country</th>
                <th className="text-right pb-3">Revenue</th>
                <th className="text-right pb-3">% of Total</th>
                <th className="pb-3 w-32"></th>
              </tr>
            </thead>
            <tbody>
              {revenueByTerritory.map(t => (
                <tr key={t.country} className="border-b border-[#2a2d3a] last:border-0">
                  <td className="py-2 text-white">{t.flag} {t.country}</td>
                  <td className="py-2 text-right text-green-400">${(t.revenue || 89.05).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                  <td className="py-2 text-right text-[#8b8fa8]">{t.pct}%</td>
                  <td className="py-2 pl-4">
                    <div className="h-1.5 bg-[#2a2d3a] rounded-full">
                      <div className="h-1.5 bg-indigo-500 rounded-full" style={{ width: `${t.pct}%` }} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* Revenue by Campaign */}
          <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl p-6">
            <h2 className="text-white font-semibold mb-4">Revenue by Campaign</h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[#8b8fa8] border-b border-[#2a2d3a]">
                  <th className="text-left pb-2">Campaign</th>
                  <th className="text-right pb-2">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {revenueByCampaign.map(c => (
                  <tr key={c.campaign} className="border-b border-[#2a2d3a] last:border-0">
                    <td className="py-2 text-white text-xs">{c.campaign}</td>
                    <td className="py-2 text-right text-green-400">${c.revenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Revenue by Playlist */}
          <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl p-6">
            <h2 className="text-white font-semibold mb-4">Revenue by Playlist</h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[#8b8fa8] border-b border-[#2a2d3a]">
                  <th className="text-left pb-2">Playlist</th>
                  <th className="text-right pb-2">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {revenueByPlaylist.map(p => (
                  <tr key={p.playlist} className="border-b border-[#2a2d3a] last:border-0">
                    <td className="py-2 text-white text-xs">{p.playlist}</td>
                    <td className="py-2 text-right text-green-400">${p.revenue.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Platform comparison */}
        <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl p-6">
          <h2 className="text-white font-semibold mb-4">Platform Comparison</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[#8b8fa8] border-b border-[#2a2d3a]">
                  <th className="text-left pb-3">Platform</th>
                  <th className="text-left pb-3">Type</th>
                  <th className="text-right pb-3">Avg Rev/Stream</th>
                  <th className="text-right pb-3">Listeners</th>
                  <th className="text-right pb-3">Streams</th>
                  <th className="text-right pb-3">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {platformComparison.map(p => (
                  <tr key={p.platform} className="border-b border-[#2a2d3a] last:border-0 hover:bg-[#2a2d3a]/40">
                    <td className="py-3 text-white font-medium">{p.platform}</td>
                    <td className="py-3 text-[#8b8fa8]">{p.type}</td>
                    <td className="py-3 text-right text-indigo-400 font-mono">{p.avgRevPerStream}</td>
                    <td className="py-3 text-right text-[#8b8fa8]">{p.listeners}</td>
                    <td className="py-3 text-right text-[#8b8fa8]">{p.streams}</td>
                    <td className="py-3 text-right text-green-400">{p.revenue}</td>
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
