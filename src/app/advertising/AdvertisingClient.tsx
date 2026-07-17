"use client";
import { Plus, Search, Pencil, Trash2, X, Upload } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createAdCampaign, updateAdCampaign, deleteAdCampaign, uploadCampaignFlyer } from "./actions";

const statusColors: Record<string, string> = {
  DRAFT: "bg-gray-500/20 text-gray-400",
  ACTIVE: "bg-green-500/20 text-green-400",
  PAUSED: "bg-amber-500/20 text-amber-400",
  COMPLETED: "bg-blue-500/20 text-blue-400",
};
const STATUSES = ["DRAFT", "ACTIVE", "PAUSED", "COMPLETED"];
const PLATFORMS = ["Meta", "TikTok", "Google/YouTube"];

type Campaign = {
  id: string; name: string; platform: string; objective: string | null; songId: string | null;
  budget: number | null; startDate: string | null; endDate: string | null; targetAudience: string | null;
  status: string; impressions: number | null; clicks: number | null; ctr: number | null;
  conversions: number | null; revenueAttributed: number | null; creativeAssets: string[];
};
type SongOpt = { id: string; title: string };

const inputClass = "w-full bg-[#0f1117] border border-[#2a2d3a] text-white px-3 py-2 rounded-lg text-sm placeholder:text-[#8b8fa8] focus:outline-none focus:border-indigo-500";

export default function AdvertisingClient({ campaigns, songs }: { campaigns: Campaign[]; songs: SongOpt[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Campaign | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [flyers, setFlyers] = useState<string[]>([]);
  const [uploadingFlyer, setUploadingFlyer] = useState(false);
  const [flyerError, setFlyerError] = useState("");
  const flyerInput = useRef<HTMLInputElement>(null);

  // Seed the flyer list whenever the form opens (new = empty, edit = existing).
  useEffect(() => {
    if (showForm) { setFlyers(editing?.creativeAssets ?? []); setFlyerError(""); }
  }, [showForm, editing]);

  async function handleFlyerUpload() {
    const file = flyerInput.current?.files?.[0];
    if (!file) return;
    setUploadingFlyer(true);
    setFlyerError("");
    const fd = new FormData();
    fd.set("file", file);
    const res = await uploadCampaignFlyer(fd);
    setUploadingFlyer(false);
    if (flyerInput.current) flyerInput.current.value = "";
    if (!res.ok || !res.url) { setFlyerError(res.error || "Upload failed."); return; }
    setFlyers((f) => [...f, res.url!]);
  }

  const filtered = campaigns.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) || c.platform.toLowerCase().includes(search.toLowerCase())
  );

  async function handleSubmit(formData: FormData) {
    setSaving(true);
    if (editing) await updateAdCampaign(editing.id, formData);
    else await createAdCampaign(formData);
    setSaving(false); setShowForm(false); setEditing(null); router.refresh();
  }
  async function handleDelete(c: Campaign) {
    if (!confirm(`Delete campaign "${c.name}"?`)) return;
    await deleteAdCampaign(c.id); router.refresh();
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="relative">
          <Search className="w-4 h-4 text-[#8b8fa8] absolute left-3 top-1/2 -translate-y-1/2" />
          <input type="text" placeholder="Search campaigns..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="bg-[#1a1d27] border border-[#2a2d3a] text-white pl-10 pr-4 py-2 rounded-lg text-sm placeholder:text-[#8b8fa8] focus:outline-none focus:border-indigo-500 w-72" />
        </div>
        <button onClick={() => { setEditing(null); setShowForm(true); }} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700">
          <Plus className="w-4 h-4" /> New Campaign
        </button>
      </div>
      <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="text-[#8b8fa8] text-sm border-b border-[#2a2d3a] bg-[#161820]">
              <th className="text-left px-6 py-4">Campaign</th>
              <th className="text-left px-6 py-4">Platform</th>
              <th className="text-left px-6 py-4">Budget</th>
              <th className="text-right px-6 py-4">Impressions</th>
              <th className="text-right px-6 py-4">CTR</th>
              <th className="text-right px-6 py-4">Conversions</th>
              <th className="text-right px-6 py-4">Revenue</th>
              <th className="text-left px-6 py-4">Status</th>
              <th className="px-6 py-4"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.id} className="border-b border-[#2a2d3a] last:border-0 hover:bg-[#2a2d3a]/40 transition-colors group">
                <td className="px-6 py-4"><div className="text-white font-medium">{c.name}</div><div className="text-[#8b8fa8] text-xs">{c.objective}</div></td>
                <td className="px-6 py-4 text-[#8b8fa8] text-sm">{c.platform}</td>
                <td className="px-6 py-4 text-[#8b8fa8] text-sm">{c.budget ? `$${c.budget}` : "—"}</td>
                <td className="px-6 py-4 text-right text-[#8b8fa8] text-sm">{c.impressions?.toLocaleString() || "—"}</td>
                <td className="px-6 py-4 text-right text-[#8b8fa8] text-sm">{c.ctr ? `${c.ctr}%` : "—"}</td>
                <td className="px-6 py-4 text-right text-[#8b8fa8] text-sm">{c.conversions?.toLocaleString() || "—"}</td>
                <td className="px-6 py-4 text-right text-green-400 text-sm">{c.revenueAttributed ? `$${c.revenueAttributed.toLocaleString()}` : "—"}</td>
                <td className="px-6 py-4"><span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[c.status]}`}>{c.status}</span></td>
                <td className="px-6 py-4">
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => { setEditing(c); setShowForm(true); }} className="text-[#8b8fa8] hover:text-indigo-400"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(c)} className="text-[#8b8fa8] hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={9} className="px-6 py-10 text-center text-[#8b8fa8] text-sm">No campaigns yet.</td></tr>}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setShowForm(false)}>
          <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#2a2d3a]">
              <h2 className="text-white font-semibold">{editing ? "Edit Campaign" : "New Campaign"}</h2>
              <button onClick={() => setShowForm(false)} className="text-[#8b8fa8] hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <form action={handleSubmit} className="p-6 grid grid-cols-2 gap-4">
              <div className="col-span-2"><label className="block text-[#8b8fa8] text-xs mb-1.5">Name *</label><input name="name" required defaultValue={editing?.name || ""} className={inputClass} /></div>
              <div><label className="block text-[#8b8fa8] text-xs mb-1.5">Platform</label><select name="platform" defaultValue={editing?.platform || "Meta"} className={inputClass}>{PLATFORMS.map((p) => <option key={p}>{p}</option>)}</select></div>
              <div><label className="block text-[#8b8fa8] text-xs mb-1.5">Status</label><select name="status" defaultValue={editing?.status || "DRAFT"} className={inputClass}>{STATUSES.map((s) => <option key={s}>{s}</option>)}</select></div>
              <div><label className="block text-[#8b8fa8] text-xs mb-1.5">Objective</label><input name="objective" defaultValue={editing?.objective || ""} className={inputClass} /></div>
              <div><label className="block text-[#8b8fa8] text-xs mb-1.5">Song</label><select name="songId" defaultValue={editing?.songId || ""} className={inputClass}><option value="">— none —</option>{songs.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}</select></div>
              <div><label className="block text-[#8b8fa8] text-xs mb-1.5">Budget ($)</label><input name="budget" type="number" step="0.01" defaultValue={editing?.budget ?? ""} className={inputClass} /></div>
              <div><label className="block text-[#8b8fa8] text-xs mb-1.5">Target Audience</label><input name="targetAudience" defaultValue={editing?.targetAudience || ""} className={inputClass} /></div>
              <div><label className="block text-[#8b8fa8] text-xs mb-1.5">Start Date</label><input name="startDate" type="date" defaultValue={editing?.startDate ? editing.startDate.slice(0, 10) : ""} className={inputClass} /></div>
              <div><label className="block text-[#8b8fa8] text-xs mb-1.5">End Date</label><input name="endDate" type="date" defaultValue={editing?.endDate ? editing.endDate.slice(0, 10) : ""} className={inputClass} /></div>
              <div><label className="block text-[#8b8fa8] text-xs mb-1.5">Impressions</label><input name="impressions" type="number" defaultValue={editing?.impressions ?? ""} className={inputClass} /></div>
              <div><label className="block text-[#8b8fa8] text-xs mb-1.5">Clicks</label><input name="clicks" type="number" defaultValue={editing?.clicks ?? ""} className={inputClass} /></div>
              <div><label className="block text-[#8b8fa8] text-xs mb-1.5">Conversions</label><input name="conversions" type="number" defaultValue={editing?.conversions ?? ""} className={inputClass} /></div>
              <div><label className="block text-[#8b8fa8] text-xs mb-1.5">Revenue Attributed ($)</label><input name="revenueAttributed" type="number" step="0.01" defaultValue={editing?.revenueAttributed ?? ""} className={inputClass} /></div>

              {/* Flyers / creative — uploaded to storage, URLs submitted via hidden field */}
              <div className="col-span-2">
                <label className="block text-[#8b8fa8] text-xs mb-1.5">Flyers / ad creative</label>
                <input type="hidden" name="creativeAssets" value={flyers.join(",")} />
                {flyers.length > 0 && (
                  <div className="grid grid-cols-4 gap-2 mb-2">
                    {flyers.map((url) => (
                      <div key={url} className="group relative overflow-hidden rounded-lg border border-[#2a2d3a]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt="" className="aspect-square w-full object-cover" />
                        <button type="button" onClick={() => setFlyers((f) => f.filter((u) => u !== url))} title="Remove" className="absolute right-1 top-1 rounded bg-black/70 px-1.5 py-0.5 text-xs text-white opacity-0 transition group-hover:opacity-100">✕</button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <input ref={flyerInput} type="file" accept="image/*" onChange={handleFlyerUpload} disabled={uploadingFlyer} className="hidden" id="flyer-input" />
                  <label htmlFor="flyer-input" className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-[#2a2d3a] px-3 py-1.5 text-xs text-[#c7cad8] hover:text-white hover:border-indigo-500">
                    <Upload className="w-3.5 h-3.5" /> {uploadingFlyer ? "Uploading…" : "Upload flyer"}
                  </label>
                  <span className="text-[#5a5e72] text-xs">JPG/PNG/WebP, under 8 MB. Add as many as you like.</span>
                </div>
                {flyerError && <p className="text-red-400 text-xs mt-1">{flyerError}</p>}
              </div>

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
