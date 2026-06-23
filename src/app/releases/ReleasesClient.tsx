"use client";
import { Plus, Search, Pencil, Trash2, X } from "lucide-react";
import { useState } from "react";
import { formatDate } from "@/lib/dateUtils";
import { useRouter } from "next/navigation";
import { createRelease, updateRelease, deleteRelease } from "./actions";

const statusColors: Record<string, string> = {
  PENDING: "bg-amber-500/20 text-amber-400",
  ACTIVE: "bg-green-500/20 text-green-400",
  TAKEN_DOWN: "bg-red-500/20 text-red-400",
};
const STATUSES = ["PENDING", "ACTIVE", "TAKEN_DOWN"];

type Release = {
  id: string; songId: string; distributorId: string;
  song: { id: string; title: string } | null;
  distributor: { id: string; name: string } | null;
  isrc: string | null; upc: string | null; stores: string[]; status: string; releaseDate: string | null;
};
type SongOpt = { id: string; title: string; isrc: string | null; upc: string | null };
type DistOpt = { id: string; name: string };

const inputClass = "w-full bg-[#0f1117] border border-[#2a2d3a] text-white px-3 py-2 rounded-lg text-sm placeholder:text-[#8b8fa8] focus:outline-none focus:border-indigo-500";

export default function ReleasesClient({ releases, songs, distributors }: { releases: Release[]; songs: SongOpt[]; distributors: DistOpt[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Release | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const filtered = releases.filter((d) =>
    (d.song?.title || "").toLowerCase().includes(search.toLowerCase()) ||
    (d.distributor?.name || "").toLowerCase().includes(search.toLowerCase())
  );

  async function handleSubmit(formData: FormData) {
    setSaving(true);
    if (editing) await updateRelease(editing.id, formData);
    else await createRelease(formData);
    setSaving(false); setShowForm(false); setEditing(null); router.refresh();
  }
  async function handleDelete(d: Release) {
    if (!confirm("Delete this release?")) return;
    await deleteRelease(d.id); router.refresh();
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="relative">
          <Search className="w-4 h-4 text-[#8b8fa8] absolute left-3 top-1/2 -translate-y-1/2" />
          <input type="text" placeholder="Search releases..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="bg-[#1a1d27] border border-[#2a2d3a] text-white pl-10 pr-4 py-2 rounded-lg text-sm placeholder:text-[#8b8fa8] focus:outline-none focus:border-indigo-500 w-72" />
        </div>
        <button onClick={() => { setEditing(null); setShowForm(true); }} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700">
          <Plus className="w-4 h-4" /> New Release
        </button>
      </div>
      <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="text-[#8b8fa8] text-sm border-b border-[#2a2d3a] bg-[#161820]">
              <th className="text-left px-6 py-4">Song</th>
              <th className="text-left px-6 py-4">Distributor</th>
              <th className="text-left px-6 py-4">ISRC / UPC</th>
              <th className="text-left px-6 py-4">Stores</th>
              <th className="text-left px-6 py-4">Release Date</th>
              <th className="text-left px-6 py-4">Status</th>
              <th className="px-6 py-4"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((d) => (
              <tr key={d.id} className="border-b border-[#2a2d3a] last:border-0 hover:bg-[#2a2d3a]/40 transition-colors group">
                <td className="px-6 py-4 text-white font-medium">{d.song?.title || "—"}</td>
                <td className="px-6 py-4 text-[#8b8fa8] text-sm">{d.distributor?.name || "—"}</td>
                <td className="px-6 py-4"><div className="text-[#8b8fa8] text-xs font-mono">{d.isrc}</div><div className="text-[#8b8fa8] text-xs font-mono">{d.upc}</div></td>
                <td className="px-6 py-4"><div className="flex flex-wrap gap-1">{d.stores.slice(0, 3).map((s) => <span key={s} className="text-xs bg-[#2a2d3a] text-[#8b8fa8] px-2 py-0.5 rounded">{s}</span>)}{d.stores.length > 3 && <span className="text-xs text-[#8b8fa8]">+{d.stores.length - 3}</span>}</div></td>
                <td className="px-6 py-4 text-[#8b8fa8] text-sm">{d.releaseDate ? formatDate(d.releaseDate) : "—"}</td>
                <td className="px-6 py-4"><span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[d.status]}`}>{d.status.replace("_", " ")}</span></td>
                <td className="px-6 py-4">
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => { setEditing(d); setShowForm(true); }} className="text-[#8b8fa8] hover:text-indigo-400"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(d)} className="text-[#8b8fa8] hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={7} className="px-6 py-10 text-center text-[#8b8fa8] text-sm">No releases yet.</td></tr>}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setShowForm(false)}>
          <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#2a2d3a]">
              <h2 className="text-white font-semibold">{editing ? "Edit Release" : "New Release"}</h2>
              <button onClick={() => setShowForm(false)} className="text-[#8b8fa8] hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <form action={handleSubmit} className="p-6 grid grid-cols-2 gap-4">
              <div><label className="block text-[#8b8fa8] text-xs mb-1.5">Song *</label><select name="songId" required defaultValue={editing?.songId || ""} className={inputClass}><option value="">Select…</option>{songs.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}</select></div>
              <div><label className="block text-[#8b8fa8] text-xs mb-1.5">Distributor *</label><select name="distributorId" required defaultValue={editing?.distributorId || ""} className={inputClass}><option value="">Select…</option>{distributors.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select></div>
              <div><label className="block text-[#8b8fa8] text-xs mb-1.5">ISRC</label><input name="isrc" defaultValue={editing?.isrc || ""} className={inputClass} /></div>
              <div><label className="block text-[#8b8fa8] text-xs mb-1.5">UPC</label><input name="upc" defaultValue={editing?.upc || ""} className={inputClass} /></div>
              <div><label className="block text-[#8b8fa8] text-xs mb-1.5">Status</label><select name="status" defaultValue={editing?.status || "ACTIVE"} className={inputClass}>{STATUSES.map((s) => <option key={s}>{s}</option>)}</select></div>
              <div><label className="block text-[#8b8fa8] text-xs mb-1.5">Release Date</label><input name="releaseDate" type="date" defaultValue={editing?.releaseDate ? editing.releaseDate.slice(0, 10) : ""} className={inputClass} /></div>
              <div className="col-span-2"><label className="block text-[#8b8fa8] text-xs mb-1.5">Stores (comma-separated)</label><input name="stores" defaultValue={editing?.stores.join(", ") || ""} className={inputClass} placeholder="Spotify, Apple Music, Amazon Music" /></div>
              <div className="col-span-2 flex justify-end gap-3 mt-2">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-[#8b8fa8] hover:text-white text-sm">Cancel</button>
                <button type="submit" disabled={saving} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-50">{saving ? "Saving..." : "Save"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
