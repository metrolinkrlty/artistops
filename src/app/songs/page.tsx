"use client";
import Header from "@/components/layout/Header";
import { mockSongs } from "@/lib/mock-data";
import { Plus, Search, Shield, FileText, Link2, CheckCircle2, XCircle } from "lucide-react";
import { useState } from "react";
import Link from "next/link";

const statusColors: Record<string, string> = {
  DEMO: "bg-gray-500/20 text-gray-400",
  MIXED: "bg-blue-500/20 text-blue-400",
  MASTERED: "bg-purple-500/20 text-purple-400",
  RELEASED: "bg-green-500/20 text-green-400",
  REGISTERED: "bg-amber-500/20 text-amber-400",
  MONETIZED: "bg-indigo-500/20 text-indigo-400",
};

// Mock rights status per song
const rightsStatus: Record<string, { pro: boolean; mlc: boolean; soundExchange: boolean; smartLinkSlug: string | null }> = {
  "1": { pro: true, mlc: true, soundExchange: false, smartLinkSlug: "midnight-drive" },
  "2": { pro: true, mlc: true, soundExchange: true, smartLinkSlug: "golden-hours" },
  "3": { pro: false, mlc: false, soundExchange: false, smartLinkSlug: "electric-soul-preview" },
  "4": { pro: false, mlc: false, soundExchange: false, smartLinkSlug: null },
  "5": { pro: false, mlc: false, soundExchange: false, smartLinkSlug: null },
};

function RightsIcon({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className="flex items-center gap-0.5" title={label}>
      {ok
        ? <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
        : <XCircle className="w-3.5 h-3.5 text-red-400 opacity-50" />}
      <span className="text-xs text-[#8b8fa8]">{label}</span>
    </div>
  );
}

export default function SongsPage() {
  const [search, setSearch] = useState("");
  const filtered = mockSongs.filter(s =>
    s.title.toLowerCase().includes(search.toLowerCase()) ||
    s.artist.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex-1">
      <Header title="Songs" subtitle="Manage your music catalog" />
      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="relative">
            <Search className="w-4 h-4 text-[#8b8fa8] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search songs..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="bg-[#1a1d27] border border-[#2a2d3a] text-white pl-10 pr-4 py-2 rounded-lg text-sm placeholder:text-[#8b8fa8] focus:outline-none focus:border-indigo-500 w-72"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700">
            <Plus className="w-4 h-4" /> Add Song
          </button>
        </div>
        <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="text-[#8b8fa8] text-sm border-b border-[#2a2d3a] bg-[#161820]">
                <th className="text-left px-6 py-4">Title</th>
                <th className="text-left px-6 py-4">ISRC</th>
                <th className="text-left px-6 py-4">Genre</th>
                <th className="text-left px-6 py-4">Writers</th>
                <th className="text-left px-6 py-4">BPM / Key</th>
                <th className="text-left px-6 py-4">Rights</th>
                <th className="text-left px-6 py-4">Status</th>
                <th className="text-left px-6 py-4">Release</th>
                <th className="text-left px-6 py-4">Links</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((song) => {
                const rights = rightsStatus[song.id];
                return (
                  <tr key={song.id} className="border-b border-[#2a2d3a] last:border-0 hover:bg-[#2a2d3a]/40 transition-colors cursor-pointer">
                    <td className="px-6 py-4">
                      <div className="text-white font-medium">{song.title}</div>
                      <div className="text-[#8b8fa8] text-xs">{song.artist}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-mono ${song.isrc ? "text-indigo-400" : "text-[#8b8fa8]"}`}>
                        {song.isrc || "—"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-[#8b8fa8] text-sm">{song.genre}</td>
                    <td className="px-6 py-4 text-[#8b8fa8] text-sm">{song.writers.join(", ")}</td>
                    <td className="px-6 py-4 text-[#8b8fa8] text-sm">{song.bpm ? `${song.bpm} BPM · ${song.key}` : "—"}</td>
                    <td className="px-6 py-4">
                      {rights && (
                        <div className="flex flex-col gap-0.5">
                          <RightsIcon ok={rights.pro} label="PRO" />
                          <RightsIcon ok={rights.mlc} label="MLC" />
                          <RightsIcon ok={rights.soundExchange} label="SX" />
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[song.status]}`}>
                        {song.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-[#8b8fa8] text-sm">
                      {song.releaseDate ? new Date(song.releaseDate).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <Link href="/rights" className="p-1 text-[#8b8fa8] hover:text-amber-400 transition-colors" title="Rights">
                          <Shield className="w-4 h-4" />
                        </Link>
                        <Link href="/copyrights" className="p-1 text-[#8b8fa8] hover:text-blue-400 transition-colors" title="Copyright">
                          <FileText className="w-4 h-4" />
                        </Link>
                        {rights?.smartLinkSlug && (
                          <Link href={`/listen/${rights.smartLinkSlug}`} className="p-1 text-[#8b8fa8] hover:text-indigo-400 transition-colors" title="Smart Link">
                            <Link2 className="w-4 h-4" />
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
