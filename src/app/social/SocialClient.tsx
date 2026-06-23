"use client";
import { Plus, Search, Pencil, Trash2, X } from "lucide-react";
import { useState } from "react";
import { formatDate } from "@/lib/dateUtils";
import { useRouter } from "next/navigation";
import { createSocialPost, updateSocialPost, deleteSocialPost } from "./actions";

const statusColors: Record<string, string> = {
  IDEA: "bg-gray-500/20 text-gray-400",
  DRAFTED: "bg-blue-500/20 text-blue-400",
  SCHEDULED: "bg-amber-500/20 text-amber-400",
  POSTED: "bg-green-500/20 text-green-400",
  BOOSTED: "bg-indigo-500/20 text-indigo-400",
  COMPLETED: "bg-purple-500/20 text-purple-400",
};
const platformColors: Record<string, string> = {
  Instagram: "text-pink-400", TikTok: "text-cyan-400", Facebook: "text-blue-400", YouTube: "text-red-400", X: "text-white",
};
const STATUSES = ["IDEA", "DRAFTED", "SCHEDULED", "POSTED", "BOOSTED", "COMPLETED"];
const PLATFORMS = ["Instagram", "TikTok", "Facebook", "YouTube", "X"];

type Post = {
  id: string; songId: string | null; song: { id: string; title: string } | null;
  platform: string; status: string; caption: string | null; campaign: string | null;
  hashtags: string[]; scheduledAt: string | null; postedAt: string | null;
};
type SongOpt = { id: string; title: string };

const inputClass = "w-full bg-[#0f1117] border border-[#2a2d3a] text-white px-3 py-2 rounded-lg text-sm placeholder:text-[#8b8fa8] focus:outline-none focus:border-indigo-500";

export default function SocialClient({ posts, songs }: { posts: Post[]; songs: SongOpt[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Post | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const filtered = posts.filter((p) =>
    (p.song?.title || "").toLowerCase().includes(search.toLowerCase()) ||
    p.platform.toLowerCase().includes(search.toLowerCase())
  );

  async function handleSubmit(formData: FormData) {
    setSaving(true);
    if (editing) await updateSocialPost(editing.id, formData);
    else await createSocialPost(formData);
    setSaving(false); setShowForm(false); setEditing(null); router.refresh();
  }
  async function handleDelete(p: Post) {
    if (!confirm("Delete this post?")) return;
    await deleteSocialPost(p.id); router.refresh();
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="relative">
          <Search className="w-4 h-4 text-[#8b8fa8] absolute left-3 top-1/2 -translate-y-1/2" />
          <input type="text" placeholder="Search posts..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="bg-[#1a1d27] border border-[#2a2d3a] text-white pl-10 pr-4 py-2 rounded-lg text-sm placeholder:text-[#8b8fa8] focus:outline-none focus:border-indigo-500 w-72" />
        </div>
        <button onClick={() => { setEditing(null); setShowForm(true); }} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700">
          <Plus className="w-4 h-4" /> Create Post
        </button>
      </div>
      <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="text-[#8b8fa8] text-sm border-b border-[#2a2d3a] bg-[#161820]">
              <th className="text-left px-6 py-4">Song</th>
              <th className="text-left px-6 py-4">Platform</th>
              <th className="text-left px-6 py-4">Caption</th>
              <th className="text-left px-6 py-4">Campaign</th>
              <th className="text-left px-6 py-4">Scheduled / Posted</th>
              <th className="text-left px-6 py-4">Status</th>
              <th className="px-6 py-4"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id} className="border-b border-[#2a2d3a] last:border-0 hover:bg-[#2a2d3a]/40 transition-colors group">
                <td className="px-6 py-4 text-white">{p.song?.title || "—"}</td>
                <td className={`px-6 py-4 text-sm font-medium ${platformColors[p.platform] || "text-white"}`}>{p.platform}</td>
                <td className="px-6 py-4 text-[#8b8fa8] text-sm max-w-xs truncate">{p.caption}</td>
                <td className="px-6 py-4 text-[#8b8fa8] text-sm">{p.campaign || "—"}</td>
                <td className="px-6 py-4 text-[#8b8fa8] text-sm">{p.postedAt ? formatDate(p.postedAt) : p.scheduledAt ? formatDate(p.scheduledAt) : "—"}</td>
                <td className="px-6 py-4"><span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[p.status]}`}>{p.status}</span></td>
                <td className="px-6 py-4">
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => { setEditing(p); setShowForm(true); }} className="text-[#8b8fa8] hover:text-indigo-400"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(p)} className="text-[#8b8fa8] hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={7} className="px-6 py-10 text-center text-[#8b8fa8] text-sm">No posts yet.</td></tr>}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setShowForm(false)}>
          <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#2a2d3a]">
              <h2 className="text-white font-semibold">{editing ? "Edit Post" : "Create Post"}</h2>
              <button onClick={() => setShowForm(false)} className="text-[#8b8fa8] hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <form action={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-[#8b8fa8] text-xs mb-1.5">Song</label>
                  <select name="songId" defaultValue={editing?.songId || ""} className={inputClass}><option value="">— none —</option>{songs.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}</select>
                </div>
                <div><label className="block text-[#8b8fa8] text-xs mb-1.5">Platform</label>
                  <select name="platform" defaultValue={editing?.platform || "Instagram"} className={inputClass}>{PLATFORMS.map((p) => <option key={p}>{p}</option>)}</select>
                </div>
                <div><label className="block text-[#8b8fa8] text-xs mb-1.5">Status</label>
                  <select name="status" defaultValue={editing?.status || "IDEA"} className={inputClass}>{STATUSES.map((s) => <option key={s}>{s}</option>)}</select>
                </div>
                <div><label className="block text-[#8b8fa8] text-xs mb-1.5">Campaign</label><input name="campaign" defaultValue={editing?.campaign || ""} className={inputClass} /></div>
                <div><label className="block text-[#8b8fa8] text-xs mb-1.5">Scheduled</label><input name="scheduledAt" type="date" defaultValue={editing?.scheduledAt ? editing.scheduledAt.slice(0, 10) : ""} className={inputClass} /></div>
                <div><label className="block text-[#8b8fa8] text-xs mb-1.5">Posted</label><input name="postedAt" type="date" defaultValue={editing?.postedAt ? editing.postedAt.slice(0, 10) : ""} className={inputClass} /></div>
              </div>
              <div><label className="block text-[#8b8fa8] text-xs mb-1.5">Caption</label><textarea name="caption" defaultValue={editing?.caption || ""} className={inputClass} rows={2} /></div>
              <div><label className="block text-[#8b8fa8] text-xs mb-1.5">Hashtags (comma-separated)</label><input name="hashtags" defaultValue={editing?.hashtags.join(", ") || ""} className={inputClass} /></div>
              <div className="flex justify-end gap-3">
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
