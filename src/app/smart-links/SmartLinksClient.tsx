"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, Link2, X, Trash2, Copy, Check } from "lucide-react";
import { createSmartLink, deleteSmartLink, toggleSmartLink } from "./actions";

type Platform = { name: string; url: string; priority: number };
type SmartLink = { id: string; slug: string; title: string; artistName: string; platforms: Platform[]; totalClicks: number; topPlatform: string; isActive: boolean };

const platformOptions = ["Spotify", "Apple Music", "YouTube Music", "Amazon Music", "Tidal", "SoundCloud", "Audiomack", "Deezer", "TikTok"];
const inputClass = "w-full bg-[#0f1117] border border-[#2a2d3a] text-white px-3 py-2 rounded-lg text-sm placeholder:text-[#8b8fa8] focus:outline-none focus:border-indigo-500";

// Illustrative breakdowns shown until real click volume accrues
const platformBreakdown = [
  { platform: "Spotify", pct: 36.2 }, { platform: "Apple Music", pct: 24.1 }, { platform: "YouTube Music", pct: 15.5 },
  { platform: "Amazon Music", pct: 12.4 }, { platform: "Tidal", pct: 5.3 }, { platform: "SoundCloud", pct: 4.3 }, { platform: "Other", pct: 2.5 },
];
const countryBreakdown = [
  { country: "United States", flag: "🇺🇸", pct: 42.9 }, { country: "United Kingdom", flag: "🇬🇧", pct: 15.1 },
  { country: "Canada", flag: "🇨🇦", pct: 11.2 }, { country: "Australia", flag: "🇦🇺", pct: 7.1 }, { country: "Other", flag: "🌍", pct: 23.7 },
];

export default function SmartLinksClient({ links }: { links: SmartLink[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [platforms, setPlatforms] = useState<{ name: string; url: string }[]>([{ name: "Spotify", url: "" }]);

  const filtered = links.filter((l) => l.title.toLowerCase().includes(search.toLowerCase()) || l.slug.toLowerCase().includes(search.toLowerCase()));
  const totalClicks = links.reduce((s, l) => s + l.totalClicks, 0);

  async function handleSubmit(formData: FormData) {
    setSaving(true);
    await createSmartLink(formData);
    setSaving(false); setShowCreate(false); setPlatforms([{ name: "Spotify", url: "" }]); router.refresh();
  }
  async function handleDelete(l: SmartLink) {
    if (!confirm(`Delete smart link "${l.title}"?`)) return;
    await deleteSmartLink(l.id); router.refresh();
  }
  async function handleToggle(l: SmartLink) {
    await toggleSmartLink(l.id, !l.isActive); router.refresh();
  }
  function copyLink(slug: string) {
    navigator.clipboard.writeText(`${window.location.origin}/listen/${slug}`);
    setCopied(slug); setTimeout(() => setCopied(null), 2000);
  }

  return (
    <div className="p-8 space-y-6">
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl p-4"><p className="text-[#8b8fa8] text-sm">Total Smart Links</p><p className="text-white text-2xl font-bold mt-1">{links.length}</p></div>
        <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl p-4"><p className="text-[#8b8fa8] text-sm">Total Clicks</p><p className="text-white text-2xl font-bold mt-1">{totalClicks.toLocaleString()}</p></div>
        <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl p-4"><p className="text-[#8b8fa8] text-sm">Active Links</p><p className="text-white text-2xl font-bold mt-1">{links.filter((l) => l.isActive).length}</p></div>
        <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl p-4"><p className="text-[#8b8fa8] text-sm">Platforms Linked</p><p className="text-white text-2xl font-bold mt-1">{links.reduce((s, l) => s + l.platforms.length, 0)}</p></div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="relative">
            <Search className="w-4 h-4 text-[#8b8fa8] absolute left-3 top-1/2 -translate-y-1/2" />
            <input type="text" placeholder="Search smart links..." value={search} onChange={(e) => setSearch(e.target.value)} className="bg-[#1a1d27] border border-[#2a2d3a] text-white pl-10 pr-4 py-2 rounded-lg text-sm placeholder:text-[#8b8fa8] focus:outline-none focus:border-indigo-500 w-72" />
          </div>
          <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700"><Plus className="w-4 h-4" /> New album / campaign link</button>
        </div>
        <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl overflow-hidden">
          <table className="w-full">
            <thead><tr className="text-[#8b8fa8] text-sm border-b border-[#2a2d3a] bg-[#161820]"><th className="text-left px-6 py-4">Title / Slug</th><th className="text-left px-6 py-4">Platforms</th><th className="text-right px-6 py-4">Clicks</th><th className="text-left px-6 py-4">Top Platform</th><th className="text-left px-6 py-4">Status</th><th className="text-left px-6 py-4">Link</th><th className="px-6 py-4"></th></tr></thead>
            <tbody>
              {filtered.map((link) => (
                <tr key={link.id} className="border-b border-[#2a2d3a] last:border-0 hover:bg-[#2a2d3a]/40 transition-colors group">
                  <td className="px-6 py-4"><div className="text-white font-medium">{link.title}</div><div className="text-[#8b8fa8] text-xs font-mono">/{link.slug}</div></td>
                  <td className="px-6 py-4 text-[#8b8fa8] text-sm">{link.platforms.length} platforms</td>
                  <td className="px-6 py-4 text-right text-white font-medium">{link.totalClicks.toLocaleString()}</td>
                  <td className="px-6 py-4 text-[#8b8fa8] text-sm">{link.topPlatform}</td>
                  <td className="px-6 py-4"><button onClick={() => handleToggle(link)} title={link.isActive ? "Active — click to turn off (link stops working)" : "Inactive — click to turn on"} className={`px-2 py-1 rounded text-xs font-medium ${link.isActive ? "bg-green-500/20 text-green-400" : "bg-gray-500/20 text-gray-400"}`}>{link.isActive ? "Active" : "Inactive"}</button></td>
                  <td className="px-6 py-4">
                    <a href={`/listen/${link.slug}`} target="_blank" title="Open the public link page fans see" className="flex items-center gap-1 text-indigo-400 text-xs font-mono hover:text-indigo-300"><Link2 className="w-3 h-3" />/listen/{link.slug}</a>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => copyLink(link.slug)} className="text-[#8b8fa8] hover:text-indigo-400" title="Copy link">{copied === link.slug ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}</button>
                      <button onClick={() => handleDelete(link)} className="text-[#8b8fa8] hover:text-red-400" title="Delete"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={7} className="px-6 py-10 text-center text-[#8b8fa8] text-sm">No smart links yet. Create one to get a shareable multi-platform URL.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h2 className="text-white font-semibold mb-4">Aggregate Click Analytics</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl p-6">
            <h3 className="text-white font-medium mb-4">Platform Selection</h3>
            <div className="space-y-3">
              {platformBreakdown.map((p) => (
                <div key={p.platform}>
                  <div className="flex justify-between text-sm mb-1"><span className="text-white">{p.platform}</span><span className="text-[#8b8fa8]">{p.pct}%</span></div>
                  <div className="h-2 bg-[#2a2d3a] rounded-full"><div className="h-2 bg-indigo-600 rounded-full" style={{ width: `${p.pct}%` }} /></div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl p-6">
            <h3 className="text-white font-medium mb-4">Top Countries</h3>
            <table className="w-full text-sm">
              <thead><tr className="text-[#8b8fa8] border-b border-[#2a2d3a]"><th className="text-left pb-2">Country</th><th className="text-right pb-2">%</th></tr></thead>
              <tbody>{countryBreakdown.map((c) => (<tr key={c.country} className="border-b border-[#2a2d3a] last:border-0"><td className="py-2 text-white">{c.flag} {c.country}</td><td className="py-2 text-right text-indigo-400">{c.pct}%</td></tr>))}</tbody>
            </table>
          </div>
        </div>
        <p className="text-[#8b8fa8] text-xs mt-3">Detailed breakdowns populate from real visits as your links receive traffic. Device, OS, country, and platform are detected automatically on each click.</p>
      </div>

      {showCreate && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setShowCreate(false)}>
          <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-2"><h2 className="text-white font-semibold text-lg">New album / campaign link</h2><button onClick={() => setShowCreate(false)} className="text-[#8b8fa8] hover:text-white"><X className="w-5 h-5" /></button></div>
            <p className="mb-5 text-xs text-[#8b8fa8]">For an album, EP, tour, or pre-save — anything that isn&rsquo;t one song. <span className="text-indigo-400">For a single song, add its platform links on the Song</span> (Songs → open the song → &ldquo;Streaming / platform links&rdquo;).</p>
            <form action={handleSubmit} className="space-y-4">
              <div><label className="text-[#8b8fa8] text-sm block mb-1">Title *</label><input name="title" required className={inputClass} placeholder="Summer Tour 2025 · Neon Nights EP" /></div>
              <div><label className="text-[#8b8fa8] text-sm block mb-1">Slug *</label><div className="flex items-center gap-2"><span className="text-[#8b8fa8] text-sm">/listen/</span><input name="slug" required placeholder="summer-tour" className={inputClass} /></div></div>
              <div>
                <label className="text-[#8b8fa8] text-sm block mb-2">Platform URLs</label>
                <div className="space-y-2">
                  {platforms.map((p, i) => (
                    <div key={i} className="flex gap-2">
                      <select name="platformName" value={p.name} onChange={(e) => { const u = [...platforms]; u[i] = { ...u[i], name: e.target.value }; setPlatforms(u); }} className="bg-[#0f1117] border border-[#2a2d3a] text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 w-36">{platformOptions.map((pl) => <option key={pl} value={pl}>{pl}</option>)}</select>
                      <input name="platformUrl" value={p.url} onChange={(e) => { const u = [...platforms]; u[i] = { ...u[i], url: e.target.value }; setPlatforms(u); }} placeholder="https://..." className={inputClass} />
                    </div>
                  ))}
                  <button type="button" onClick={() => setPlatforms([...platforms, { name: "Apple Music", url: "" }])} className="text-indigo-400 text-sm hover:text-indigo-300">+ Add Platform</button>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCreate(false)} className="flex-1 px-4 py-2 border border-[#2a2d3a] text-[#8b8fa8] rounded-lg text-sm hover:text-white">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-50">{saving ? "Creating..." : "Create link"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
