"use client";
import { Plus, Search, Shield, FileText, CheckCircle2, XCircle, Pencil, Trash2, X } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createSong, updateSong, deleteSong } from "./actions";

const statusColors: Record<string, string> = {
  DEMO: "bg-gray-500/20 text-gray-400",
  MIXED: "bg-blue-500/20 text-blue-400",
  MASTERED: "bg-purple-500/20 text-purple-400",
  RELEASED: "bg-green-500/20 text-green-400",
  REGISTERED: "bg-amber-500/20 text-amber-400",
  MONETIZED: "bg-indigo-500/20 text-indigo-400",
};

const STATUSES = ["DEMO", "MIXED", "MASTERED", "RELEASED", "REGISTERED", "MONETIZED"];

type Copyright = {
  registeredWithPRO: boolean;
  registeredWithMLC: boolean;
  registeredWithSX: boolean;
};

type Song = {
  id: string;
  title: string;
  artist: string;
  writers: string[];
  publishers: string[];
  isrc: string | null;
  upc: string | null;
  releaseDate: string | null;
  genre: string | null;
  bpm: number | null;
  key: string | null;
  notes: string | null;
  status: string;
  copyrights: Copyright[];
};

function RightsIcon({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className="flex items-center gap-0.5" title={label}>
      {ok ? <CheckCircle2 className="w-3.5 h-3.5 text-green-400" /> : <XCircle className="w-3.5 h-3.5 text-red-400 opacity-50" />}
      <span className="text-xs text-[#8b8fa8]">{label}</span>
    </div>
  );
}

const inputClass =
  "w-full bg-[#0f1117] border border-[#2a2d3a] text-white px-3 py-2 rounded-lg text-sm placeholder:text-[#8b8fa8] focus:outline-none focus:border-indigo-500";

export default function SongsClient({ songs }: { songs: Song[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Song | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const filtered = songs.filter(
    (s) =>
      s.title.toLowerCase().includes(search.toLowerCase()) ||
      s.artist.toLowerCase().includes(search.toLowerCase())
  );

  function openAdd() {
    setEditing(null);
    setShowForm(true);
  }
  function openEdit(song: Song) {
    setEditing(song);
    setShowForm(true);
  }

  async function handleSubmit(formData: FormData) {
    setSaving(true);
    if (editing) await updateSong(editing.id, formData);
    else await createSong(formData);
    setSaving(false);
    setShowForm(false);
    setEditing(null);
    router.refresh();
  }

  async function handleDelete(song: Song) {
    if (!confirm(`Delete "${song.title}"? This also removes its linked records.`)) return;
    await deleteSong(song.id);
    router.refresh();
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="relative">
          <Search className="w-4 h-4 text-[#8b8fa8] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search songs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-[#1a1d27] border border-[#2a2d3a] text-white pl-10 pr-4 py-2 rounded-lg text-sm placeholder:text-[#8b8fa8] focus:outline-none focus:border-indigo-500 w-72"
          />
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700">
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
              <th className="text-left px-6 py-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((song) => {
              const cr = song.copyrights?.[0];
              return (
                <tr key={song.id} className="border-b border-[#2a2d3a] last:border-0 hover:bg-[#2a2d3a]/40 transition-colors">
                  <td className="px-6 py-4">
                    <div className="text-white font-medium">{song.title}</div>
                    <div className="text-[#8b8fa8] text-xs">{song.artist}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-mono ${song.isrc ? "text-indigo-400" : "text-[#8b8fa8]"}`}>{song.isrc || "—"}</span>
                  </td>
                  <td className="px-6 py-4 text-[#8b8fa8] text-sm">{song.genre || "—"}</td>
                  <td className="px-6 py-4 text-[#8b8fa8] text-sm">{song.writers.join(", ")}</td>
                  <td className="px-6 py-4 text-[#8b8fa8] text-sm">{song.bpm ? `${song.bpm} BPM · ${song.key}` : "—"}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-0.5">
                      <RightsIcon ok={!!cr?.registeredWithPRO} label="PRO" />
                      <RightsIcon ok={!!cr?.registeredWithMLC} label="MLC" />
                      <RightsIcon ok={!!cr?.registeredWithSX} label="SX" />
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[song.status]}`}>{song.status}</span>
                  </td>
                  <td className="px-6 py-4 text-[#8b8fa8] text-sm">
                    {song.releaseDate ? new Date(song.releaseDate).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(song)} className="p-1 text-[#8b8fa8] hover:text-indigo-400 transition-colors" title="Edit">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(song)} className="p-1 text-[#8b8fa8] hover:text-red-400 transition-colors" title="Delete">
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <Link href="/rights" className="p-1 text-[#8b8fa8] hover:text-amber-400 transition-colors" title="Rights">
                        <Shield className="w-4 h-4" />
                      </Link>
                      <Link href="/copyrights" className="p-1 text-[#8b8fa8] hover:text-blue-400 transition-colors" title="Copyright">
                        <FileText className="w-4 h-4" />
                      </Link>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={9} className="px-6 py-10 text-center text-[#8b8fa8] text-sm">
                  No songs yet. Click &ldquo;Add Song&rdquo; to create your first one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setShowForm(false)}>
          <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#2a2d3a]">
              <h2 className="text-white font-semibold">{editing ? "Edit Song" : "Add Song"}</h2>
              <button onClick={() => setShowForm(false)} className="text-[#8b8fa8] hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form action={handleSubmit} className="p-6 grid grid-cols-2 gap-4">
              <Field label="Title *"><input name="title" required defaultValue={editing?.title || ""} className={inputClass} /></Field>
              <Field label="Artist *"><input name="artist" required defaultValue={editing?.artist || "Alex Rivera"} className={inputClass} /></Field>
              <Field label="Writers (comma-separated)"><input name="writers" defaultValue={editing?.writers.join(", ") || ""} className={inputClass} /></Field>
              <Field label="Publishers (comma-separated)"><input name="publishers" defaultValue={editing?.publishers.join(", ") || ""} className={inputClass} /></Field>
              <Field label="ISRC"><input name="isrc" defaultValue={editing?.isrc || ""} className={inputClass} placeholder="USRC12345678" /></Field>
              <Field label="UPC"><input name="upc" defaultValue={editing?.upc || ""} className={inputClass} /></Field>
              <Field label="Genre"><input name="genre" defaultValue={editing?.genre || ""} className={inputClass} /></Field>
              <Field label="Release Date"><input name="releaseDate" type="date" defaultValue={editing?.releaseDate ? editing.releaseDate.slice(0, 10) : ""} className={inputClass} /></Field>
              <Field label="BPM"><input name="bpm" type="number" defaultValue={editing?.bpm ?? ""} className={inputClass} /></Field>
              <Field label="Key"><input name="key" defaultValue={editing?.key || ""} className={inputClass} placeholder="C Major" /></Field>
              <Field label="Status">
                <select name="status" defaultValue={editing?.status || "DEMO"} className={inputClass}>
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </Field>
              <div className="col-span-2">
                <Field label="Notes"><textarea name="notes" defaultValue={editing?.notes || ""} className={inputClass} rows={3} /></Field>
              </div>
              <div className="col-span-2 flex justify-end gap-3 mt-2">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-[#8b8fa8] hover:text-white text-sm">Cancel</button>
                <button type="submit" disabled={saving} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-50">
                  {saving ? "Saving..." : editing ? "Save Changes" : "Add Song"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[#8b8fa8] text-xs mb-1.5">{label}</label>
      {children}
    </div>
  );
}
