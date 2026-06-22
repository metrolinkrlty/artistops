"use client";
import { Plus, Search, Upload, X, Trash2 } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createStreamPlay, deleteStreamPlay } from "./actions";

const csvFormat = `isrc,platform,plays,period
USRC12345678,Spotify,245320,2024-05-01
USRC12345678,Apple Music,89430,2024-05-01`;

type Row = { id: string; songTitle: string; platform: string; period: string; isrc: string | null; plays: number };
type SongOpt = { id: string; title: string; isrc: string | null };
type IsrcRow = { isrc: string; song: string; platforms: Record<string, number>; total: number };
type PlatComp = { platform: string; plays: number; pct: number };

const inputClass = "w-full bg-[#0f1117] border border-[#2a2d3a] text-white px-3 py-2 rounded-lg text-sm placeholder:text-[#8b8fa8] focus:outline-none focus:border-indigo-500";
const PLAT_COLS = ["Spotify", "Apple Music", "TikTok", "YouTube Music", "Amazon Music"];

export default function StreamingClient({ rows, songs, isrcData, platformComparison }: { rows: Row[]; songs: SongOpt[]; isrcData: IsrcRow[]; platformComparison: PlatComp[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"entries" | "isrc">("entries");
  const [showCsvModal, setShowCsvModal] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const filtered = rows.filter((s) => s.songTitle.toLowerCase().includes(search.toLowerCase()) || s.platform.toLowerCase().includes(search.toLowerCase()));
  const totalPlays = filtered.reduce((sum, s) => sum + s.plays, 0);

  async function handleSubmit(formData: FormData) {
    setSaving(true);
    await createStreamPlay(formData);
    setSaving(false); setShowForm(false); router.refresh();
  }
  async function handleDelete(s: Row) {
    if (!confirm("Delete this entry?")) return;
    await deleteStreamPlay(s.id); router.refresh();
  }

  return (
    <div className="p-8 space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl p-4"><p className="text-[#8b8fa8] text-sm">Total Plays</p><p className="text-white text-2xl font-bold mt-1">{totalPlays.toLocaleString()}</p></div>
        <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl p-4"><p className="text-[#8b8fa8] text-sm">Platforms</p><p className="text-white text-2xl font-bold mt-1">{new Set(rows.map((s) => s.platform)).size}</p></div>
        <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl p-4"><p className="text-[#8b8fa8] text-sm">Songs Tracked</p><p className="text-white text-2xl font-bold mt-1">{new Set(rows.map((s) => s.songTitle)).size}</p></div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-[#8b8fa8] absolute left-3 top-1/2 -translate-y-1/2" />
            <input type="text" placeholder="Search plays..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="bg-[#1a1d27] border border-[#2a2d3a] text-white pl-10 pr-4 py-2 rounded-lg text-sm placeholder:text-[#8b8fa8] focus:outline-none focus:border-indigo-500 w-72" />
          </div>
          <div className="flex rounded-lg overflow-hidden border border-[#2a2d3a]">
            <button onClick={() => setView("entries")} className={`px-3 py-2 text-sm ${view === "entries" ? "bg-indigo-600 text-white" : "text-[#8b8fa8] hover:text-white"}`}>Entries</button>
            <button onClick={() => setView("isrc")} className={`px-3 py-2 text-sm ${view === "isrc" ? "bg-indigo-600 text-white" : "text-[#8b8fa8] hover:text-white"}`}>ISRC View</button>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowCsvModal(true)} className="flex items-center gap-2 px-4 py-2 border border-[#2a2d3a] text-[#8b8fa8] rounded-lg text-sm hover:text-white"><Upload className="w-4 h-4" /> Import CSV</button>
          <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700"><Plus className="w-4 h-4" /> Add Entry</button>
        </div>
      </div>

      {view === "entries" ? (
        <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl overflow-hidden">
          <table className="w-full">
            <thead><tr className="text-[#8b8fa8] text-sm border-b border-[#2a2d3a] bg-[#161820]"><th className="text-left px-6 py-4">Song</th><th className="text-left px-6 py-4">Platform</th><th className="text-left px-6 py-4">Period</th><th className="text-left px-6 py-4">ISRC</th><th className="text-right px-6 py-4">Plays</th><th className="px-6 py-4"></th></tr></thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id} className="border-b border-[#2a2d3a] last:border-0 hover:bg-[#2a2d3a]/40 transition-colors group">
                  <td className="px-6 py-4 text-white">{s.songTitle}</td>
                  <td className="px-6 py-4 text-[#8b8fa8] text-sm">{s.platform}</td>
                  <td className="px-6 py-4 text-[#8b8fa8] text-sm">{new Date(s.period).toLocaleDateString("en-US", { month: "short", year: "numeric" })}</td>
                  <td className="px-6 py-4 text-[#8b8fa8] text-xs font-mono">{s.isrc || "—"}</td>
                  <td className="px-6 py-4 text-right text-white font-medium">{s.plays.toLocaleString()}</td>
                  <td className="px-6 py-4"><button onClick={() => handleDelete(s)} className="text-[#8b8fa8] hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-4 h-4" /></button></td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={6} className="px-6 py-10 text-center text-[#8b8fa8] text-sm">No play data yet.</td></tr>}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="text-[#8b8fa8] border-b border-[#2a2d3a] bg-[#161820]"><th className="text-left px-6 py-4">ISRC</th><th className="text-left px-6 py-4">Song</th>{PLAT_COLS.map((p) => <th key={p} className="text-right px-6 py-4">{p}</th>)}<th className="text-right px-6 py-4">Total</th></tr></thead>
            <tbody>
              {isrcData.map((row) => (
                <tr key={row.isrc + row.song} className="border-b border-[#2a2d3a] last:border-0 hover:bg-[#2a2d3a]/40">
                  <td className="px-6 py-4 font-mono text-indigo-400 text-xs">{row.isrc}</td>
                  <td className="px-6 py-4 text-white font-medium">{row.song}</td>
                  {PLAT_COLS.map((p) => <td key={p} className="px-6 py-4 text-right text-[#8b8fa8]">{(row.platforms[p] || 0).toLocaleString()}</td>)}
                  <td className="px-6 py-4 text-right text-white font-bold">{row.total.toLocaleString()}</td>
                </tr>
              ))}
              {isrcData.length === 0 && <tr><td colSpan={8} className="px-6 py-10 text-center text-[#8b8fa8] text-sm">No play data yet.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl p-6">
        <h2 className="text-white font-semibold mb-4">Platform Comparison</h2>
        <div className="space-y-3">
          {platformComparison.map((p) => (
            <div key={p.platform}>
              <div className="flex justify-between text-sm mb-1"><span className="text-white">{p.platform}</span><span className="text-[#8b8fa8]">{p.plays.toLocaleString()} plays ({p.pct}%)</span></div>
              <div className="h-2 bg-[#2a2d3a] rounded-full"><div className="h-2 bg-indigo-600 rounded-full" style={{ width: `${p.pct}%` }} /></div>
            </div>
          ))}
          {platformComparison.length === 0 && <p className="text-[#8b8fa8] text-sm">No data yet.</p>}
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setShowForm(false)}>
          <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#2a2d3a]"><h2 className="text-white font-semibold">Add Play Entry</h2><button onClick={() => setShowForm(false)} className="text-[#8b8fa8] hover:text-white"><X className="w-5 h-5" /></button></div>
            <form action={handleSubmit} className="p-6 grid grid-cols-2 gap-4">
              <div className="col-span-2"><label className="block text-[#8b8fa8] text-xs mb-1.5">Song *</label><select name="songId" required className={inputClass}><option value="">Select…</option>{songs.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}</select></div>
              <div><label className="block text-[#8b8fa8] text-xs mb-1.5">Platform</label><input name="platform" defaultValue="Spotify" className={inputClass} /></div>
              <div><label className="block text-[#8b8fa8] text-xs mb-1.5">Plays</label><input name="plays" type="number" required className={inputClass} /></div>
              <div><label className="block text-[#8b8fa8] text-xs mb-1.5">Period</label><input name="period" type="date" className={inputClass} /></div>
              <div><label className="block text-[#8b8fa8] text-xs mb-1.5">ISRC</label><input name="isrc" className={inputClass} /></div>
              <div className="col-span-2 flex justify-end gap-3 mt-2"><button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-[#8b8fa8] hover:text-white text-sm">Cancel</button><button type="submit" disabled={saving} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-50">{saving ? "Saving..." : "Add Entry"}</button></div>
            </form>
          </div>
        </div>
      )}

      {showCsvModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setShowCsvModal(false)}>
          <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl p-6 w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4"><h2 className="text-white font-semibold">Import Streaming CSV</h2><button onClick={() => setShowCsvModal(false)} className="text-[#8b8fa8] hover:text-white"><X className="w-5 h-5" /></button></div>
            <p className="text-[#8b8fa8] text-sm mb-4">Upload a CSV from DistroKid, Spotify for Artists, Apple Music for Artists, etc. Required columns:</p>
            <div className="bg-[#0f1117] rounded-lg p-4 mb-4 font-mono text-xs text-green-400 whitespace-pre">{csvFormat}</div>
            <div className="border-2 border-dashed border-[#2a2d3a] rounded-xl p-8 text-center mb-4"><Upload className="w-8 h-8 text-[#8b8fa8] mx-auto mb-2" /><p className="text-[#8b8fa8] text-sm">Drop your CSV file here (parser coming soon)</p></div>
            <button onClick={() => setShowCsvModal(false)} className="w-full px-4 py-2 border border-[#2a2d3a] text-[#8b8fa8] rounded-lg text-sm hover:text-white">Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
