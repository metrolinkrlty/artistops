"use client";
import Header from "@/components/layout/Header";
import { mockAdCampaigns } from "@/lib/mock-data";
import { Plus, Search } from "lucide-react";
import { useState } from "react";

const statusColors: Record<string, string> = {
  DRAFT: "bg-gray-500/20 text-gray-400",
  ACTIVE: "bg-green-500/20 text-green-400",
  PAUSED: "bg-amber-500/20 text-amber-400",
  COMPLETED: "bg-blue-500/20 text-blue-400",
};

export default function AdvertisingPage() {
  const [search, setSearch] = useState("");
  const filtered = mockAdCampaigns.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.platform.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex-1">
      <Header title="Advertising" subtitle="Manage ad campaigns" />
      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="relative">
            <Search className="w-4 h-4 text-[#8b8fa8] absolute left-3 top-1/2 -translate-y-1/2" />
            <input type="text" placeholder="Search campaigns..." value={search} onChange={e => setSearch(e.target.value)}
              className="bg-[#1a1d27] border border-[#2a2d3a] text-white pl-10 pr-4 py-2 rounded-lg text-sm placeholder:text-[#8b8fa8] focus:outline-none focus:border-indigo-500 w-72" />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700">
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
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} className="border-b border-[#2a2d3a] last:border-0 hover:bg-[#2a2d3a]/40 transition-colors">
                  <td className="px-6 py-4">
                    <div className="text-white font-medium">{c.name}</div>
                    <div className="text-[#8b8fa8] text-xs">{c.objective}</div>
                  </td>
                  <td className="px-6 py-4 text-[#8b8fa8] text-sm">{c.platform}</td>
                  <td className="px-6 py-4 text-[#8b8fa8] text-sm">{c.budget ? `$${c.budget}` : "—"}</td>
                  <td className="px-6 py-4 text-right text-[#8b8fa8] text-sm">{c.impressions?.toLocaleString() || "—"}</td>
                  <td className="px-6 py-4 text-right text-[#8b8fa8] text-sm">{c.ctr ? `${c.ctr}%` : "—"}</td>
                  <td className="px-6 py-4 text-right text-[#8b8fa8] text-sm">{c.conversions?.toLocaleString() || "—"}</td>
                  <td className="px-6 py-4 text-right text-green-400 text-sm">{c.revenueAttributed ? `$${c.revenueAttributed.toLocaleString()}` : "—"}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[c.status]}`}>{c.status}</span>
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
