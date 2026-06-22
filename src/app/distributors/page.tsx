"use client";
import Header from "@/components/layout/Header";
import { mockDistributors } from "@/lib/mock-data";
import { Plus, Search, ExternalLink } from "lucide-react";
import { useState } from "react";

export default function DistributorsPage() {
  const [search, setSearch] = useState("");
  const filtered = mockDistributors.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex-1">
      <Header title="Distributors" subtitle="Manage your distribution partners" />
      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="relative">
            <Search className="w-4 h-4 text-[#8b8fa8] absolute left-3 top-1/2 -translate-y-1/2" />
            <input type="text" placeholder="Search distributors..." value={search} onChange={e => setSearch(e.target.value)}
              className="bg-[#1a1d27] border border-[#2a2d3a] text-white pl-10 pr-4 py-2 rounded-lg text-sm placeholder:text-[#8b8fa8] focus:outline-none focus:border-indigo-500 w-72" />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700">
            <Plus className="w-4 h-4" /> Add Distributor
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {filtered.map((d) => (
            <div key={d.id} className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl p-6 hover:border-indigo-500/50 transition-colors">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-white font-semibold text-lg">{d.name}</h3>
                  <p className="text-[#8b8fa8] text-sm">{d.accountId}</p>
                </div>
                <a href={d.website} target="_blank" rel="noopener noreferrer" className="text-[#8b8fa8] hover:text-white">
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
              <div className="space-y-2 mb-4">
                <div className="flex justify-between">
                  <span className="text-[#8b8fa8] text-sm">Active Songs</span>
                  <span className="text-white text-sm">{d.activeSongs}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8b8fa8] text-sm">Total Revenue</span>
                  <span className="text-green-400 text-sm font-medium">${d.totalRevenue.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8b8fa8] text-sm">Email</span>
                  <span className="text-[#8b8fa8] text-sm">{d.email}</span>
                </div>
              </div>
              {d.notes && <p className="text-[#8b8fa8] text-xs border-t border-[#2a2d3a] pt-3">{d.notes}</p>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
