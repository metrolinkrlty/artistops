"use client";
import Header from "@/components/layout/Header";
import { useState } from "react";
import { Search, FileText, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";

const songRights = [
  {
    id: "1", title: "Midnight Drive", isrc: "USRC12345678",
    writers: ["Alex Rivera (60%)", "Maya Chen (40%)"],
    publishers: ["Sunset Music Publishing"],
    masterOwner: "Alex Rivera",
    pro: "ASCAP", mlc: true, soundExchange: false, syncAvailable: true,
    splits: [{ name: "Alex Rivera", pct: 60 }, { name: "Maya Chen", pct: 40 }],
  },
  {
    id: "2", title: "Golden Hours", isrc: "USRC12345679",
    writers: ["Alex Rivera (100%)"],
    publishers: ["Sunset Music Publishing"],
    masterOwner: "Alex Rivera",
    pro: "ASCAP", mlc: true, soundExchange: true, syncAvailable: true,
    splits: [{ name: "Alex Rivera", pct: 100 }],
  },
  {
    id: "3", title: "Electric Soul", isrc: "USRC12345680",
    writers: ["Alex Rivera (50%)", "Jordan Blake (30%)", "Sam Torres (20%)"],
    publishers: ["Sunset Music Publishing", "Nova Sound"],
    masterOwner: "Alex Rivera",
    pro: null, mlc: false, soundExchange: false, syncAvailable: false,
    splits: [{ name: "Alex Rivera", pct: 50 }, { name: "Jordan Blake", pct: 30 }, { name: "Sam Torres", pct: 20 }],
  },
  {
    id: "4", title: "Sunrise Boulevard", isrc: null,
    writers: ["Alex Rivera (70%)", "Maya Chen (30%)"],
    publishers: ["Sunset Music Publishing"],
    masterOwner: "Alex Rivera",
    pro: null, mlc: false, soundExchange: false, syncAvailable: false,
    splits: [{ name: "Alex Rivera", pct: 70 }, { name: "Maya Chen", pct: 30 }],
  },
  {
    id: "5", title: "Neon Nights", isrc: null,
    writers: ["Alex Rivera (100%)"],
    publishers: ["Sunset Music Publishing"],
    masterOwner: "Alex Rivera",
    pro: null, mlc: false, soundExchange: false, syncAvailable: false,
    splits: [{ name: "Alex Rivera", pct: 100 }],
  },
];

const documents = [
  { id: "1", songTitle: "Midnight Drive", type: "split_sheet", title: "Midnight Drive Split Sheet", parties: ["Alex Rivera", "Maya Chen"], expiresAt: null, status: "active" },
  { id: "2", songTitle: "Midnight Drive", type: "sync_license", title: "TV Placement License — Show A", parties: ["Alex Rivera", "SyncBridge Agency", "Network Corp"], expiresAt: "2025-03-15", status: "active" },
  { id: "3", songTitle: "Golden Hours", type: "split_sheet", title: "Golden Hours Split Sheet", parties: ["Alex Rivera"], expiresAt: null, status: "active" },
  { id: "4", songTitle: "Electric Soul", type: "split_sheet", title: "Electric Soul Split Sheet", parties: ["Alex Rivera", "Jordan Blake", "Sam Torres"], expiresAt: null, status: "draft" },
  { id: "5", songTitle: "Midnight Drive", type: "recording_contract", title: "Master Recording Agreement", parties: ["Alex Rivera", "Sunset Music Publishing"], expiresAt: "2026-01-01", status: "active" },
  { id: "6", songTitle: "Golden Hours", type: "distribution_agreement", title: "DistroKid Distribution Agreement", parties: ["Alex Rivera", "DistroKid"], expiresAt: "2025-08-20", status: "active" },
  { id: "7", songTitle: "Sunrise Boulevard", type: "split_sheet", title: "Sunrise Boulevard Split Sheet", parties: ["Alex Rivera", "Maya Chen"], expiresAt: null, status: "draft" },
  { id: "8", songTitle: "Electric Soul", type: "license", title: "Sync License Pitch Approval", parties: ["Alex Rivera", "SyncBridge Agency"], expiresAt: "2024-12-31", status: "expiring" },
];

const docTypeColors: Record<string, string> = {
  split_sheet: "bg-blue-500/20 text-blue-400",
  sync_license: "bg-purple-500/20 text-purple-400",
  recording_contract: "bg-amber-500/20 text-amber-400",
  distribution_agreement: "bg-indigo-500/20 text-indigo-400",
  license: "bg-green-500/20 text-green-400",
};

const statusColors: Record<string, string> = {
  active: "bg-green-500/20 text-green-400",
  draft: "bg-gray-500/20 text-gray-400",
  expiring: "bg-red-500/20 text-red-400",
};

const splitColors = ["bg-indigo-500", "bg-purple-500", "bg-pink-500", "bg-amber-500", "bg-green-500"];

export default function RightsPage() {
  const [search, setSearch] = useState("");
  const [selectedSong, setSelectedSong] = useState(songRights[0]);
  const [docFilter, setDocFilter] = useState("all");

  const filteredSongs = songRights.filter(s =>
    s.title.toLowerCase().includes(search.toLowerCase())
  );

  const filteredDocs = documents.filter(d =>
    (docFilter === "all" || d.type === docFilter) &&
    d.songTitle.toLowerCase().includes(search.toLowerCase())
  );

  const expiring = documents.filter(d => d.status === "expiring");
  const unregisteredCount = songRights.filter(s => !s.pro || !s.mlc).length;

  return (
    <div className="flex-1">
      <Header title="Rights & Ownership" subtitle="Manage splits, registrations, and documents" />
      <div className="p-8 space-y-6">
        {/* Alert banners */}
        {unregisteredCount > 0 && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-amber-400 font-medium">{unregisteredCount} songs missing rights registrations</p>
              <p className="text-[#8b8fa8] text-sm">Electric Soul, Sunrise Boulevard, and Neon Nights are not registered with a PRO or the MLC. Estimated uncollected: ~$240.</p>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl p-4">
            <p className="text-[#8b8fa8] text-sm">Songs Tracked</p>
            <p className="text-white text-2xl font-bold mt-1">{songRights.length}</p>
          </div>
          <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl p-4">
            <p className="text-[#8b8fa8] text-sm">PRO Registered</p>
            <p className="text-white text-2xl font-bold mt-1">{songRights.filter(s => s.pro).length}</p>
          </div>
          <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl p-4">
            <p className="text-[#8b8fa8] text-sm">MLC Registered</p>
            <p className="text-white text-2xl font-bold mt-1">{songRights.filter(s => s.mlc).length}</p>
          </div>
          <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl p-4">
            <p className="text-[#8b8fa8] text-sm">Documents</p>
            <p className="text-white text-2xl font-bold mt-1">{documents.length}</p>
          </div>
        </div>

        {/* Song rights table */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-semibold">Song Rights Overview</h2>
            <div className="relative">
              <Search className="w-4 h-4 text-[#8b8fa8] absolute left-3 top-1/2 -translate-y-1/2" />
              <input type="text" placeholder="Search songs..." value={search} onChange={e => setSearch(e.target.value)}
                className="bg-[#1a1d27] border border-[#2a2d3a] text-white pl-10 pr-4 py-2 rounded-lg text-sm placeholder:text-[#8b8fa8] focus:outline-none focus:border-indigo-500 w-64" />
            </div>
          </div>
          <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[#8b8fa8] border-b border-[#2a2d3a] bg-[#161820]">
                  <th className="text-left px-4 py-3">Song</th>
                  <th className="text-left px-4 py-3">ISRC</th>
                  <th className="text-left px-4 py-3">Writers</th>
                  <th className="text-left px-4 py-3">PRO</th>
                  <th className="text-center px-4 py-3">MLC</th>
                  <th className="text-center px-4 py-3">SoundEx</th>
                  <th className="text-center px-4 py-3">Sync</th>
                </tr>
              </thead>
              <tbody>
                {filteredSongs.map(song => (
                  <tr
                    key={song.id}
                    onClick={() => setSelectedSong(song)}
                    className={`border-b border-[#2a2d3a] last:border-0 cursor-pointer transition-colors ${selectedSong.id === song.id ? "bg-indigo-600/10" : "hover:bg-[#2a2d3a]/40"}`}
                  >
                    <td className="px-4 py-3 text-white font-medium">{song.title}</td>
                    <td className="px-4 py-3 text-[#8b8fa8] font-mono text-xs">{song.isrc || "—"}</td>
                    <td className="px-4 py-3 text-[#8b8fa8]">{song.writers.join(", ")}</td>
                    <td className="px-4 py-3">
                      {song.pro ? <span className="text-green-400">{song.pro}</span> : <span className="text-red-400">—</span>}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {song.mlc ? <CheckCircle2 className="w-4 h-4 text-green-400 mx-auto" /> : <XCircle className="w-4 h-4 text-red-400 mx-auto" />}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {song.soundExchange ? <CheckCircle2 className="w-4 h-4 text-green-400 mx-auto" /> : <XCircle className="w-4 h-4 text-red-400 mx-auto" />}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {song.syncAvailable ? <CheckCircle2 className="w-4 h-4 text-green-400 mx-auto" /> : <XCircle className="w-4 h-4 text-[#2a2d3a] mx-auto" />}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Split visualizer + documents */}
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl p-6">
            <h2 className="text-white font-semibold mb-1">Ownership Splits</h2>
            <p className="text-[#8b8fa8] text-sm mb-4">{selectedSong.title}</p>
            <div className="flex h-6 rounded-full overflow-hidden mb-4">
              {selectedSong.splits.map((s, i) => (
                <div key={s.name} className={`${splitColors[i]} flex items-center justify-center text-white text-xs font-bold`} style={{ width: `${s.pct}%` }}>
                  {s.pct >= 20 ? `${s.pct}%` : ""}
                </div>
              ))}
            </div>
            <div className="space-y-2">
              {selectedSong.splits.map((s, i) => (
                <div key={s.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-sm ${splitColors[i]}`} />
                    <span className="text-white text-sm">{s.name}</span>
                  </div>
                  <span className="text-[#8b8fa8] text-sm">{s.pct}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Expiring soon */}
          <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl p-6">
            <h2 className="text-white font-semibold mb-4">Renewal Reminders (90 days)</h2>
            {expiring.length === 0 ? (
              <p className="text-[#8b8fa8] text-sm">No documents expiring soon.</p>
            ) : (
              <div className="space-y-3">
                {expiring.map(doc => (
                  <div key={doc.id} className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                    <p className="text-white text-sm font-medium">{doc.title}</p>
                    <p className="text-[#8b8fa8] text-xs">{doc.songTitle}</p>
                    <p className="text-red-400 text-xs mt-1">Expires: {doc.expiresAt}</p>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-4 pt-4 border-t border-[#2a2d3a]">
              <h3 className="text-white text-sm font-medium mb-3">Upcoming (next 6 months)</h3>
              {documents.filter(d => d.expiresAt && d.status === "active").map(doc => (
                <div key={doc.id} className="flex justify-between text-sm py-1">
                  <span className="text-[#8b8fa8]">{doc.title.slice(0, 30)}...</span>
                  <span className="text-amber-400">{doc.expiresAt}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Documents */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-semibold">Rights Documents</h2>
            <div className="flex gap-2">
              {["all", "split_sheet", "sync_license", "recording_contract", "distribution_agreement"].map(t => (
                <button
                  key={t}
                  onClick={() => setDocFilter(t)}
                  className={`px-3 py-1 rounded-lg text-xs ${docFilter === t ? "bg-indigo-600 text-white" : "border border-[#2a2d3a] text-[#8b8fa8] hover:text-white"}`}
                >
                  {t === "all" ? "All" : t.replace(/_/g, " ")}
                </button>
              ))}
            </div>
          </div>
          <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[#8b8fa8] border-b border-[#2a2d3a] bg-[#161820]">
                  <th className="text-left px-6 py-4">Document</th>
                  <th className="text-left px-6 py-4">Song</th>
                  <th className="text-left px-6 py-4">Type</th>
                  <th className="text-left px-6 py-4">Parties</th>
                  <th className="text-left px-6 py-4">Expires</th>
                  <th className="text-left px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredDocs.map(doc => (
                  <tr key={doc.id} className="border-b border-[#2a2d3a] last:border-0 hover:bg-[#2a2d3a]/40">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-white">
                        <FileText className="w-4 h-4 text-[#8b8fa8]" />
                        {doc.title}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-[#8b8fa8]">{doc.songTitle}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${docTypeColors[doc.type] || "bg-gray-500/20 text-gray-400"}`}>
                        {doc.type.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-[#8b8fa8]">{doc.parties.join(", ")}</td>
                    <td className="px-6 py-4 text-[#8b8fa8]">{doc.expiresAt || "—"}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[doc.status]}`}>
                        {doc.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
