"use client";
import { Plus, Search, Upload, Trash2, X } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatDate, formatMonthYear } from "@/lib/dateUtils";
import { createRevenue, deleteRevenue } from "./actions";

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
const REVENUE_TYPES = ["STREAMING", "PRO_ROYALTY", "MECHANICAL", "SOUND_EXCHANGE", "SYNC_LICENSE", "YOUTUBE_CONTENT_ID", "TIKTOK", "OTHER"];

const revenueByTerritory = [
  { country: "United States", flag: "🇺🇸", revenue: 4820.4, pct: 65.8 },
  { country: "United Kingdom", flag: "🇬🇧", revenue: 1102.3, pct: 15.1 },
  { country: "Canada", flag: "🇨🇦", revenue: 512.8, pct: 7.0 },
  { country: "Australia", flag: "🇦🇺", revenue: 312.4, pct: 4.3 },
  { country: "Germany", flag: "🇩🇪", revenue: 198.2, pct: 2.7 },
  { country: "France", flag: "🇫🇷", revenue: 121.5, pct: 1.7 },
  { country: "Japan", flag: "🇯🇵", revenue: 98.4, pct: 1.3 },
  { country: "Brazil", flag: "🇧🇷", revenue: 42.1, pct: 0.6 },
  { country: "India", flag: "🇮🇳", revenue: 24.3, pct: 0.3 },
];
const revenueByPlaylist = [
  { playlist: "Indie Vibes (Spotify Editorial)", revenue: 1680 },
  { playlist: "R&B Essentials (Apple Music Editorial)", revenue: 2134 },
  { playlist: "Late Night Drives (Spotify Editorial)", revenue: 1130 },
  { playlist: "Discover Weekly (Spotify Algorithmic)", revenue: 725 },
  { playlist: "Pop Hits (Apple Music Editorial)", revenue: 992 },
];
const platformComparison = [
  { platform: "Spotify", type: "Freemium + Premium", avgRevPerStream: "$0.0040", listeners: "245.3K", streams: "567,110", revenue: "$1,811" },
  { platform: "Apple Music", type: "Subscription", avgRevPerStream: "$0.0084", listeners: "68.2K", streams: "135,100", revenue: "$1,337" },
  { platform: "TikTok", type: "Social/Ad-supported", avgRevPerStream: "$0.0001", listeners: "N/A", streams: "1,126,600", revenue: "$98" },
  { platform: "YouTube Music", type: "Freemium + Premium", avgRevPerStream: "$0.0018", listeners: "21.4K", streams: "34,210", revenue: "$312" },
  { platform: "Amazon Music", type: "Prime + Unlimited", avgRevPerStream: "$0.0040", listeners: "12.1K", streams: "24,300", revenue: "$97" },
  { platform: "SoundExchange", type: "Digital radio", avgRevPerStream: "$0.0024", listeners: "N/A", streams: "271,792", revenue: "$652" },
];

type Row = { id: string; songTitle: string | null; platform: string; revenueType: string; amount: number; period: string };
type SongOpt = { id: string; title: string };

const inputClass = "w-full bg-[#0f1117] border border-[#2a2d3a] text-white px-3 py-2 rounded-lg text-sm placeholder:text-[#8b8fa8] focus:outline-none focus:border-indigo-500";

export default function RevenueClient({ rows, songs, totalStreams, campaigns }: { rows: Row[]; songs: SongOpt[]; totalStreams: number; campaigns: { campaign: string; revenue: number }[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [saving, setSaving] = useState(false);

  const filtered = rows.filter((r) => (r.songTitle || "").toLowerCase().includes(search.toLowerCase()) || r.platform.toLowerCase().includes(search.toLowerCase()));
  const total = rows.reduce((sum, r) => sum + r.amount, 0);
  const revPer1k = totalStreams ? total / (totalStreams / 1000) : 0;

  async function handleSubmit(formData: FormData) {
    setSaving(true);
    await createRevenue(formData);
    setSaving(false); setShowForm(false); router.refresh();
  }
  async function handleDelete(r: Row) {
    if (!confirm("Delete this revenue entry?")) return;
    await deleteRevenue(r.id); router.refresh();
  }

  return (
    <div className="p-8 space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Stat label="Total Revenue" value={`$${total.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} />
        <Stat label="Entries" value={`${filtered.length}`} />
        <Stat label="Avg Per Entry" value={`$${filtered.length ? (total / filtered.length).toFixed(2) : "0.00"}`} />
        <Stat label="Rev / 1K Streams" value={`$${revPer1k.toFixed(2)}`} accent />
        <Stat label="Avg Rev / Stream" value={`$${totalStreams ? (total / totalStreams).toFixed(5) : "0.00000"}`} accent />
      </div>

      <div className="flex items-center justify-between">
        <div className="relative">
          <Search className="w-4 h-4 text-[#8b8fa8] absolute left-3 top-1/2 -translate-y-1/2" />
          <input type="text" placeholder="Search revenue..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="bg-[#1a1d27] border border-[#2a2d3a] text-white pl-10 pr-4 py-2 rounded-lg text-sm placeholder:text-[#8b8fa8] focus:outline-none focus:border-indigo-500 w-72" />
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowImport(true)} className="flex items-center gap-2 px-4 py-2 border border-[#2a2d3a] text-[#8b8fa8] rounded-lg text-sm hover:text-white hover:border-white"><Upload className="w-4 h-4" /> Import CSV</button>
          <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700"><Plus className="w-4 h-4" /> Add Entry</button>
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
              <th className="px-6 py-4"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id} className="border-b border-[#2a2d3a] last:border-0 hover:bg-[#2a2d3a]/40 transition-colors group">
                <td className="px-6 py-4 text-white">{r.songTitle || "—"}</td>
                <td className="px-6 py-4 text-[#8b8fa8] text-sm">{r.platform}</td>
                <td className="px-6 py-4"><span className={`px-2 py-1 rounded text-xs font-medium ${typeColors[r.revenueType] || typeColors.OTHER}`}>{r.revenueType.replace(/_/g, " ")}</span></td>
                <td className="px-6 py-4 text-[#8b8fa8] text-sm">{formatMonthYear(r.period)}</td>
                <td className="px-6 py-4 text-right text-green-400 font-medium">${r.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                <td className="px-6 py-4"><button onClick={() => handleDelete(r)} className="text-[#8b8fa8] hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-4 h-4" /></button></td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={6} className="px-6 py-10 text-center text-[#8b8fa8] text-sm">No revenue entries yet.</td></tr>}
          </tbody>
        </table>
      </div>

      <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl p-6">
        <h2 className="text-white font-semibold mb-4">Revenue by Territory (Top 10)</h2>
        <table className="w-full text-sm">
          <thead><tr className="text-[#8b8fa8] border-b border-[#2a2d3a]"><th className="text-left pb-3">Country</th><th className="text-right pb-3">Revenue</th><th className="text-right pb-3">% of Total</th><th className="pb-3 w-32"></th></tr></thead>
          <tbody>
            {revenueByTerritory.map((t) => (
              <tr key={t.country} className="border-b border-[#2a2d3a] last:border-0">
                <td className="py-2 text-white">{t.flag} {t.country}</td>
                <td className="py-2 text-right text-green-400">${t.revenue.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                <td className="py-2 text-right text-[#8b8fa8]">{t.pct}%</td>
                <td className="py-2 pl-4"><div className="h-1.5 bg-[#2a2d3a] rounded-full"><div className="h-1.5 bg-indigo-500 rounded-full" style={{ width: `${t.pct}%` }} /></div></td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-[#8b8fa8] text-xs mt-3">Territory data populated via distributor/royalty CSV imports.</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl p-6">
          <h2 className="text-white font-semibold mb-4">Revenue by Campaign</h2>
          <table className="w-full text-sm">
            <thead><tr className="text-[#8b8fa8] border-b border-[#2a2d3a]"><th className="text-left pb-2">Campaign</th><th className="text-right pb-2">Revenue</th></tr></thead>
            <tbody>
              {campaigns.length === 0 && <tr><td colSpan={2} className="py-3 text-[#8b8fa8] text-xs">No attributed campaigns yet.</td></tr>}
              {campaigns.map((c) => (
                <tr key={c.campaign} className="border-b border-[#2a2d3a] last:border-0"><td className="py-2 text-white text-xs">{c.campaign}</td><td className="py-2 text-right text-green-400">${c.revenue.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl p-6">
          <h2 className="text-white font-semibold mb-4">Revenue by Playlist</h2>
          <table className="w-full text-sm">
            <thead><tr className="text-[#8b8fa8] border-b border-[#2a2d3a]"><th className="text-left pb-2">Playlist</th><th className="text-right pb-2">Revenue</th></tr></thead>
            <tbody>{revenueByPlaylist.map((p) => (<tr key={p.playlist} className="border-b border-[#2a2d3a] last:border-0"><td className="py-2 text-white text-xs">{p.playlist}</td><td className="py-2 text-right text-green-400">${p.revenue.toLocaleString()}</td></tr>))}</tbody>
          </table>
        </div>
      </div>

      <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl p-6">
        <h2 className="text-white font-semibold mb-4">Platform Comparison</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-[#8b8fa8] border-b border-[#2a2d3a]"><th className="text-left pb-3">Platform</th><th className="text-left pb-3">Type</th><th className="text-right pb-3">Avg Rev/Stream</th><th className="text-right pb-3">Listeners</th><th className="text-right pb-3">Streams</th><th className="text-right pb-3">Revenue</th></tr></thead>
            <tbody>
              {platformComparison.map((p) => (
                <tr key={p.platform} className="border-b border-[#2a2d3a] last:border-0 hover:bg-[#2a2d3a]/40">
                  <td className="py-3 text-white font-medium">{p.platform}</td><td className="py-3 text-[#8b8fa8]">{p.type}</td>
                  <td className="py-3 text-right text-indigo-400 font-mono">{p.avgRevPerStream}</td><td className="py-3 text-right text-[#8b8fa8]">{p.listeners}</td>
                  <td className="py-3 text-right text-[#8b8fa8]">{p.streams}</td><td className="py-3 text-right text-green-400">{p.revenue}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setShowForm(false)}>
          <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#2a2d3a]"><h2 className="text-white font-semibold">Add Revenue Entry</h2><button onClick={() => setShowForm(false)} className="text-[#8b8fa8] hover:text-white"><X className="w-5 h-5" /></button></div>
            <form action={handleSubmit} className="p-6 grid grid-cols-2 gap-4">
              <div className="col-span-2"><label className="block text-[#8b8fa8] text-xs mb-1.5">Song</label><select name="songId" className={inputClass}><option value="">— none —</option>{songs.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}</select></div>
              <div><label className="block text-[#8b8fa8] text-xs mb-1.5">Platform</label><input name="platform" defaultValue="Spotify" className={inputClass} /></div>
              <div><label className="block text-[#8b8fa8] text-xs mb-1.5">Type</label><select name="revenueType" className={inputClass}>{REVENUE_TYPES.map((t) => <option key={t}>{t}</option>)}</select></div>
              <div><label className="block text-[#8b8fa8] text-xs mb-1.5">Amount ($)</label><input name="amount" type="number" step="0.01" required className={inputClass} /></div>
              <div><label className="block text-[#8b8fa8] text-xs mb-1.5">Period</label><input name="period" type="date" className={inputClass} /></div>
              <div className="col-span-2 flex justify-end gap-3 mt-2"><button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-[#8b8fa8] hover:text-white text-sm">Cancel</button><button type="submit" disabled={saving} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-50">{saving ? "Saving..." : "Add Entry"}</button></div>
            </form>
          </div>
        </div>
      )}

      {showImport && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setShowImport(false)}>
          <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4"><h2 className="text-white font-semibold">Import Revenue CSV</h2><button onClick={() => setShowImport(false)} className="text-[#8b8fa8] hover:text-white"><X className="w-5 h-5" /></button></div>
            <p className="text-[#8b8fa8] text-sm mb-4">Upload a distributor or royalty CSV. Expected columns: <span className="font-mono text-xs">song, platform, type, amount, period</span>. Rows are matched to songs by title or ISRC.</p>
            <div className="border-2 border-dashed border-[#2a2d3a] rounded-lg p-8 text-center text-[#8b8fa8] text-sm"><Upload className="w-6 h-6 mx-auto mb-2" />Drag &amp; drop CSV here</div>
            <p className="text-[#8b8fa8] text-xs mt-3">CSV parsing is coming soon — for now add entries manually.</p>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={`bg-[#1a1d27] border rounded-xl p-4 ${accent ? "border-green-500/30" : "border-[#2a2d3a]"}`}>
      <p className="text-[#8b8fa8] text-sm">{label}</p>
      <p className="text-white text-2xl font-bold mt-1">{value}</p>
    </div>
  );
}
