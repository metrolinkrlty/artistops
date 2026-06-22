"use client";
import Header from "@/components/layout/Header";
import { mockContacts } from "@/lib/mock-data";
import { Plus, Search, Mail, Phone, ExternalLink } from "lucide-react";
import { useState } from "react";

const roleColors: Record<string, string> = {
  producer: "bg-blue-500/20 text-blue-400",
  "co-writer": "bg-purple-500/20 text-purple-400",
  publisher: "bg-green-500/20 text-green-400",
  curator: "bg-amber-500/20 text-amber-400",
  sync_agent: "bg-indigo-500/20 text-indigo-400",
  video_creator: "bg-pink-500/20 text-pink-400",
  label: "bg-red-500/20 text-red-400",
  venue: "bg-cyan-500/20 text-cyan-400",
};

export default function ContactsPage() {
  const [search, setSearch] = useState("");
  const filtered = mockContacts.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.role.toLowerCase().includes(search.toLowerCase()) ||
    (c.company || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex-1">
      <Header title="Contacts" subtitle="Manage your industry network" />
      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="relative">
            <Search className="w-4 h-4 text-[#8b8fa8] absolute left-3 top-1/2 -translate-y-1/2" />
            <input type="text" placeholder="Search contacts..." value={search} onChange={e => setSearch(e.target.value)}
              className="bg-[#1a1d27] border border-[#2a2d3a] text-white pl-10 pr-4 py-2 rounded-lg text-sm placeholder:text-[#8b8fa8] focus:outline-none focus:border-indigo-500 w-72" />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700">
            <Plus className="w-4 h-4" /> Add Contact
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((c) => (
            <div key={c.id} className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl p-5 hover:border-indigo-500/50 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-white font-semibold">{c.name}</h3>
                  {c.company && <p className="text-[#8b8fa8] text-sm">{c.company}</p>}
                </div>
                <span className={`px-2 py-1 rounded text-xs font-medium ${roleColors[c.role] || "bg-gray-500/20 text-gray-400"}`}>
                  {c.role.replace("_", " ")}
                </span>
              </div>
              <div className="space-y-1 mb-3">
                {c.email && (
                  <div className="flex items-center gap-2 text-[#8b8fa8] text-sm">
                    <Mail className="w-3 h-3" />
                    <span>{c.email}</span>
                  </div>
                )}
                {c.phone && (
                  <div className="flex items-center gap-2 text-[#8b8fa8] text-sm">
                    <Phone className="w-3 h-3" />
                    <span>{c.phone}</span>
                  </div>
                )}
                {c.website && (
                  <div className="flex items-center gap-2 text-[#8b8fa8] text-sm">
                    <ExternalLink className="w-3 h-3" />
                    <a href={c.website} target="_blank" className="hover:text-white">{c.website.replace("https://", "")}</a>
                  </div>
                )}
              </div>
              {c.notes && <p className="text-[#8b8fa8] text-xs border-t border-[#2a2d3a] pt-2">{c.notes}</p>}
              {c.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {c.tags.map(t => (
                    <span key={t} className="text-xs bg-[#2a2d3a] text-[#8b8fa8] px-2 py-0.5 rounded">{t}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
