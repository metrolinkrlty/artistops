"use client";
import Header from "@/components/layout/Header";
import { mockSocialPosts } from "@/lib/mock-data";
import { Plus, Search } from "lucide-react";
import { useState } from "react";

const statusColors: Record<string, string> = {
  IDEA: "bg-gray-500/20 text-gray-400",
  DRAFTED: "bg-blue-500/20 text-blue-400",
  SCHEDULED: "bg-amber-500/20 text-amber-400",
  POSTED: "bg-green-500/20 text-green-400",
  BOOSTED: "bg-indigo-500/20 text-indigo-400",
  COMPLETED: "bg-purple-500/20 text-purple-400",
};

const platformColors: Record<string, string> = {
  Instagram: "text-pink-400",
  TikTok: "text-cyan-400",
  Facebook: "text-blue-400",
  YouTube: "text-red-400",
  X: "text-white",
};

export default function SocialPage() {
  const [search, setSearch] = useState("");
  const filtered = mockSocialPosts.filter(p =>
    (p.songTitle || "").toLowerCase().includes(search.toLowerCase()) ||
    p.platform.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex-1">
      <Header title="Social Media" subtitle="Manage posts and campaigns" />
      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="relative">
            <Search className="w-4 h-4 text-[#8b8fa8] absolute left-3 top-1/2 -translate-y-1/2" />
            <input type="text" placeholder="Search posts..." value={search} onChange={e => setSearch(e.target.value)}
              className="bg-[#1a1d27] border border-[#2a2d3a] text-white pl-10 pr-4 py-2 rounded-lg text-sm placeholder:text-[#8b8fa8] focus:outline-none focus:border-indigo-500 w-72" />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700">
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
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="border-b border-[#2a2d3a] last:border-0 hover:bg-[#2a2d3a]/40 transition-colors">
                  <td className="px-6 py-4 text-white">{p.songTitle}</td>
                  <td className={`px-6 py-4 text-sm font-medium ${platformColors[p.platform] || "text-white"}`}>{p.platform}</td>
                  <td className="px-6 py-4 text-[#8b8fa8] text-sm max-w-xs truncate">{p.caption}</td>
                  <td className="px-6 py-4 text-[#8b8fa8] text-sm">{p.campaign || "—"}</td>
                  <td className="px-6 py-4 text-[#8b8fa8] text-sm">
                    {p.postedAt ? new Date(p.postedAt).toLocaleDateString() : p.scheduledAt ? new Date(p.scheduledAt).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[p.status]}`}>{p.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
