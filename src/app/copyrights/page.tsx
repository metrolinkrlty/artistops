"use client";
import Header from "@/components/layout/Header";
import { mockCopyrights } from "@/lib/mock-data";
import { Plus, Search, CheckCircle, XCircle } from "lucide-react";
import { useState } from "react";

export default function CopyrightsPage() {
  const [search, setSearch] = useState("");
  const filtered = mockCopyrights.filter(c =>
    c.songTitle.toLowerCase().includes(search.toLowerCase())
  );

  const Check = ({ val }: { val: boolean }) =>
    val ? <CheckCircle className="w-4 h-4 text-green-400" /> : <XCircle className="w-4 h-4 text-[#8b8fa8]" />;

  return (
    <div className="flex-1">
      <Header title="Copyrights" subtitle="Track copyright registrations" />
      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="relative">
            <Search className="w-4 h-4 text-[#8b8fa8] absolute left-3 top-1/2 -translate-y-1/2" />
            <input type="text" placeholder="Search copyrights..." value={search} onChange={e => setSearch(e.target.value)}
              className="bg-[#1a1d27] border border-[#2a2d3a] text-white pl-10 pr-4 py-2 rounded-lg text-sm placeholder:text-[#8b8fa8] focus:outline-none focus:border-indigo-500 w-72" />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700">
            <Plus className="w-4 h-4" /> Register Copyright
          </button>
        </div>
        <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="text-[#8b8fa8] text-sm border-b border-[#2a2d3a] bg-[#161820]">
                <th className="text-left px-6 py-4">Song</th>
                <th className="text-left px-6 py-4">Reg. Number</th>
                <th className="text-left px-6 py-4">Filing Date</th>
                <th className="text-left px-6 py-4">PRO</th>
                <th className="text-center px-6 py-4">USCO</th>
                <th className="text-center px-6 py-4">PRO</th>
                <th className="text-center px-6 py-4">MLC</th>
                <th className="text-center px-6 py-4">SoundEx</th>
                <th className="text-center px-6 py-4">Dist</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} className="border-b border-[#2a2d3a] last:border-0 hover:bg-[#2a2d3a]/40 transition-colors">
                  <td className="px-6 py-4 text-white font-medium">{c.songTitle}</td>
                  <td className="px-6 py-4 text-[#8b8fa8] text-xs font-mono">{c.registrationNumber || "Pending"}</td>
                  <td className="px-6 py-4 text-[#8b8fa8] text-sm">{c.filingDate ? new Date(c.filingDate).toLocaleDateString() : "—"}</td>
                  <td className="px-6 py-4 text-[#8b8fa8] text-sm">{c.proName || "—"}</td>
                  <td className="px-6 py-4 text-center"><Check val={c.registeredWithUSCO} /></td>
                  <td className="px-6 py-4 text-center"><Check val={c.registeredWithPRO} /></td>
                  <td className="px-6 py-4 text-center"><Check val={c.registeredWithMLC} /></td>
                  <td className="px-6 py-4 text-center"><Check val={c.registeredWithSX} /></td>
                  <td className="px-6 py-4 text-center"><Check val={c.registeredWithDist} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
