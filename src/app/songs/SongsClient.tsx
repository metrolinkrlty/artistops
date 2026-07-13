"use client";
import { Plus, Search, Shield, FileText, CheckCircle2, XCircle, Pencil, Trash2, X, Music, UploadCloud, Loader2, Play } from "lucide-react";
import { useState, useRef } from "react";
import Link from "next/link";
import { formatDate } from "@/lib/dateUtils";
import { useRouter } from "next/navigation";
import { createSong, updateSong, deleteSong, createAudioUploadUrl, getAudioUrl } from "./actions";
import { supabaseBrowser, AUDIO_BUCKET } from "@/lib/supabaseClient";

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
  collectionTitle: string | null;
  status: string;
  audioFileRef: string | null;
  metadataFile: string | null;
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
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [metaJson, setMetaJson] = useState<string>("");
  const [reading, setReading] = useState(false);
  const [uploadPct, setUploadPct] = useState<number | null>(null);
  const [playUrl, setPlayUrl] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  function fillIfEmpty(name: string, value: string | number | null | undefined) {
    if (value === null || value === undefined || value === "") return;
    const el = formRef.current?.elements.namedItem(name) as HTMLInputElement | HTMLSelectElement | null;
    if (el && !el.value) el.value = String(value);
  }

  async function onAudioSelected(file: File | null) {
    setAudioFile(file);
    setMetaJson("");
    if (!file) return;
    setReading(true);
    try {
      const { parseBlob } = await import("music-metadata");
      const mm = await parseBlob(file);
      const c = mm.common;
      const f = mm.format;
      // Pre-fill blank form fields from tags (never overwrite what's there)
      fillIfEmpty("title", c.title);
      fillIfEmpty("artist", c.artist);
      fillIfEmpty("genre", (c.genre || [])[0]);
      fillIfEmpty("isrc", (c.isrc || [])[0]);
      fillIfEmpty("bpm", c.bpm ?? undefined);
      fillIfEmpty("key", c.key);
      const summary = {
        title: c.title, artist: c.artist, album: c.album, year: c.year,
        genre: c.genre, isrc: c.isrc, bpm: c.bpm, key: c.key, track: c.track,
        container: f.container, codec: f.codec,
        durationSec: f.duration ? Math.round(f.duration) : null,
        sampleRate: f.sampleRate, bitsPerSample: f.bitsPerSample, bitrate: f.bitrate,
        channels: f.numberOfChannels,
      };
      setMetaJson(JSON.stringify(summary));
    } catch (e) {
      console.error("metadata read failed", e);
      setMetaJson(JSON.stringify({ note: "No readable metadata", fileName: file.name }));
    } finally {
      setReading(false);
    }
  }

  async function loadPlayback(path: string) {
    setPlayUrl(null);
    const url = await getAudioUrl(path);
    if (url) setPlayUrl(url);
  }

  const filtered = songs.filter(
    (s) =>
      s.title.toLowerCase().includes(search.toLowerCase()) ||
      s.artist.toLowerCase().includes(search.toLowerCase())
  );

  function resetAudioState() {
    setAudioFile(null); setMetaJson(""); setReading(false); setUploadPct(null); setPlayUrl(null);
  }
  function openAdd() {
    setEditing(null); resetAudioState(); setShowForm(true);
  }
  function openEdit(song: Song) {
    setEditing(song); resetAudioState(); setShowForm(true);
    if (song.audioFileRef) loadPlayback(song.audioFileRef);
  }

  async function handleSubmit(formData: FormData) {
    setSaving(true);
    try {
      // If a new audio file was staged, upload it straight to Supabase Storage
      if (audioFile) {
        setUploadPct(0);
        const { path, token } = await createAudioUploadUrl(audioFile.name);
        const { error } = await supabaseBrowser.storage
          .from(AUDIO_BUCKET)
          .uploadToSignedUrl(path, token, audioFile, { contentType: audioFile.type || "audio/mpeg" });
        if (error) throw error;
        setUploadPct(100);
        formData.set("audioFileRef", path);
        if (metaJson) formData.set("metadataFile", metaJson);
      }
      if (editing) await updateSong(editing.id, formData);
      else await createSong(formData);
      setShowForm(false);
      setEditing(null);
      resetAudioState();
      router.refresh();
    } catch (e) {
      console.error(e);
      alert("Upload failed: " + (e instanceof Error ? e.message : "unknown error"));
    } finally {
      setSaving(false);
    }
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
                <tr key={song.id} onClick={() => openEdit(song)} className="border-b border-[#2a2d3a] last:border-0 hover:bg-[#2a2d3a]/40 transition-colors cursor-pointer">
                  <td className="px-6 py-4">
                    <div className="text-white font-medium flex items-center gap-2">
                      {song.title}
                      {song.collectionTitle && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-500/15 text-amber-300 border border-amber-500/30" title={`Also a collection: ${song.collectionTitle}`}>
                          Collection
                        </span>
                      )}
                    </div>
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
                    {song.releaseDate ? formatDate(song.releaseDate) : "—"}
                  </td>
                  <td className="px-6 py-4" onClick={e => e.stopPropagation()}>
                    <div className="flex gap-2">
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
            <form ref={formRef} action={handleSubmit} className="p-6 grid grid-cols-2 gap-4">
              {/* Persist existing refs unless replaced on submit */}
              <input type="hidden" name="audioFileRef" defaultValue={editing?.audioFileRef || ""} />
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
                <Field label="Collection Title (if this song also names a collection/group registration)">
                  <input name="collectionTitle" defaultValue={editing?.collectionTitle || ""} placeholder='e.g. "Hey Evelyn"' className={inputClass} />
                </Field>
              </div>
              {/* Audio file upload */}
              <div className="col-span-2">
                <label className="block text-[#8b8fa8] text-xs mb-1.5">Audio File (MP3 / WAV · up to 50 MB)</label>
                <div className="bg-[#0f1117] border border-dashed border-[#2a2d3a] rounded-lg p-4">
                  {editing?.audioFileRef && !audioFile && (
                    <div className="flex items-center gap-3 mb-3">
                      <Music className="w-4 h-4 text-indigo-400" />
                      <span className="text-sm text-white flex-1 truncate">Current: {editing.audioFileRef.split("/").pop()}</span>
                      {playUrl ? (
                        <audio controls src={playUrl} className="h-8" />
                      ) : (
                        <button type="button" onClick={() => loadPlayback(editing.audioFileRef!)} className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300"><Play className="w-3 h-3" /> Load</button>
                      )}
                    </div>
                  )}
                  <label className="flex items-center gap-2 cursor-pointer text-sm text-indigo-400 hover:text-indigo-300 w-fit">
                    <UploadCloud className="w-4 h-4" />
                    {audioFile ? "Choose a different file" : editing?.audioFileRef ? "Replace file" : "Choose audio file"}
                    <input type="file" accept="audio/mpeg,audio/mp3,audio/wav,audio/x-wav,.mp3,.wav" className="hidden" onChange={(e) => onAudioSelected(e.target.files?.[0] || null)} />
                  </label>
                  {reading && <p className="text-xs text-[#8b8fa8] mt-2 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Reading metadata…</p>}
                  {audioFile && !reading && (
                    <div className="mt-2 text-xs text-[#8b8fa8]">
                      <p className="text-white">{audioFile.name} · {(audioFile.size / 1048576).toFixed(1)} MB</p>
                      {metaJson && <p className="mt-1 text-green-400">✓ Metadata read — blank fields above were pre-filled for your review.</p>}
                      {uploadPct === 100 ? <p className="text-green-400">Uploaded ✓</p> : uploadPct !== null && <p>Uploading…</p>}
                    </div>
                  )}
                </div>
              </div>
              <input type="hidden" name="metadataFile" defaultValue={editing?.metadataFile || ""} />
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
