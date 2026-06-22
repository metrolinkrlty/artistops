"use client";
import Header from "@/components/layout/Header";
import { mockDistributions } from "@/lib/mock-data";
import { Plus, Search } from "lucide-react";
import { useState } from "react";

const statusColors: Record<string, string> = {
  PENDING: "bg-amber-500/20 text-amber-400",
  ACTIVE: "bg-green-500/20 text-green-400",
  TAKEN_DOWN: "bg-red-500/20 text-red-400",
};

export default function ReleasesPage() {
  const [search, setSearch] = useState("");
  const filtered = mockDistributions.filter(d =>
    d.songTitle.toLowerCase().includes(search.toLowerCase()) ||
    d.distributorName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex-1">
      <Header title="Releases" subtitle="Distribution and release management" />
      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="relative">
            <Search className="w-4 h-4 text-[#8b8fa8] absolute left-3 top-1/2 -translate-y-1/2" />
            <input type="text" placeholder="Search releases..." value={search} onChange={e => setSearch(e.target.value)}
              className="bg-[#1a1d27] border border-[#2a2d3a] text-white pl-10 pr-4 py-2 rounded-lg text-sm placeholder:text-[#8b8fa8] focus:outline-none focus:border-indigo-500 w-72" />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700">
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
              </tr>
            </thead>
            <tbody>
              {filtered.map((d) => (
                <tr key={d.id} className="border-b border-[#2a2d3a] last:border-0 hover:bg-[#2a2d3a]/40 transition-colors">
                  <td className="px-6 py-4 text-white font-medium">{d.songTitle}</td>
                  <td className="px-6 py-4 text-[#8b8fa8] text-sm">{d.distributorName}</td>
                  <td className="px-6 py-4">
                    <div className="text-[#8b8fa8] text-xs font-mono">{d.isrc}</div>
                    <div className="text-[#8b8fa8] text-xs font-mono">{d.upc}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {d.stores.slice(0, 3).map(s => (
                        <span key={s} className="text-xs bg-[#2a2d3a] text-[#8b8fa8] px-2 py-0.5 rounded">{s}</span>
                      ))}
                      {d.stores.length > 3 && <span className="text-xs text-[#8b8fa8]">+{d.stores.length - 3}</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-[#8b8fa8] text-sm">{d.releaseDate ? new Date(d.releaseDate).toLocaleDateString() : "—"}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[d.status]}`}>
                      {d.status.replace("_", " ")}
                    </span>
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
