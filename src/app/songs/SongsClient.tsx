"use client";
import { Plus, Search, Shield, FileText, CheckCircle2, XCircle, Pencil, Trash2, X, Music, UploadCloud, Loader2, Play, Globe, Link2, Download, SlidersHorizontal } from "lucide-react";

// Columns the artist can hide to free up space (Title + Actions always show).
const SONG_TOGGLE_COLS = [
  { key: "isrc", label: "ISRC" },
  { key: "genre", label: "Genre" },
  { key: "writers", label: "Writers" },
  { key: "bpmkey", label: "BPM / Key" },
  { key: "rights", label: "Rights" },
  { key: "status", label: "Status" },
  { key: "release", label: "Release" },
] as const;
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { formatDate } from "@/lib/dateUtils";
import { useRouter } from "next/navigation";
import { createSong, updateSong, deleteSong, createAudioUploadUrl, getAudioUrl, featureSongOnWebsite, unfeatureSongFromWebsite, getSongSmartLink, upsertSongSmartLink } from "./actions";
import TagWriter from "./TagWriter";

// Platform link fields shown on the Song (keep keys in sync with SONG_PLATFORMS).
const SONG_PLATFORM_FIELDS: { key: string; label: string; placeholder: string }[] = [
  { key: "spotify", label: "Spotify", placeholder: "https://open.spotify.com/track/…" },
  { key: "apple", label: "Apple Music", placeholder: "https://music.apple.com/…" },
  { key: "youtube", label: "YouTube Music", placeholder: "https://music.youtube.com/…" },
  { key: "amazon", label: "Amazon Music", placeholder: "https://music.amazon.com/…" },
  { key: "soundcloud", label: "SoundCloud", placeholder: "https://soundcloud.com/…" },
  { key: "bandcamp", label: "Bandcamp", placeholder: "https://yourband.bandcamp.com/track/…" },
];
import { supabaseBrowser, AUDIO_BUCKET } from "@/lib/supabaseClient";
import { DISTROKID_GENRES, DISTROKID_SUBGENRES } from "@/lib/genres";

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
  subgenre: string | null;
  bpm: number | null;
  key: string | null;
  notes: string | null;
  collectionTitle: string | null;
  status: string;
  audioFileRef: string | null;
  metadataFile: string | null;
  masterFileUrl: string | null;
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

// Encode the first `seconds` of an AudioBuffer as a 16-bit PCM WAV clip. Used
// to make a short website preview from the full song entirely in the browser.
function audioBufferToWavClip(buffer: AudioBuffer, seconds: number): Blob {
  const sampleRate = buffer.sampleRate;
  const numCh = Math.min(2, buffer.numberOfChannels);
  const frames = Math.min(buffer.length, Math.floor(seconds * sampleRate));
  const blockAlign = numCh * 2;
  const dataSize = frames * blockAlign;
  const buf = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buf);
  const writeStr = (o: number, s: string) => { for (let i = 0; i < s.length; i++) view.setUint8(o + i, s.charCodeAt(i)); };
  writeStr(0, "RIFF"); view.setUint32(4, 36 + dataSize, true); writeStr(8, "WAVE");
  writeStr(12, "fmt "); view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, numCh, true);
  view.setUint32(24, sampleRate, true); view.setUint32(28, sampleRate * blockAlign, true); view.setUint16(32, blockAlign, true); view.setUint16(34, 16, true);
  writeStr(36, "data"); view.setUint32(40, dataSize, true);
  const chans: Float32Array[] = [];
  for (let c = 0; c < numCh; c++) chans.push(buffer.getChannelData(c));
  let off = 44;
  for (let i = 0; i < frames; i++) {
    for (let c = 0; c < numCh; c++) {
      const s = Math.max(-1, Math.min(1, chans[c][i]));
      view.setInt16(off, s < 0 ? s * 0x8000 : s * 0x7fff, true);
      off += 2;
    }
  }
  return new Blob([buf], { type: "audio/wav" });
}

// --- Audio spec formatting (from the stored/parsed file metadata) ----------
type AudioMeta = { container?: string; codec?: string; sampleRate?: number; bitsPerSample?: number; bitrate?: number; durationSec?: number | null; channels?: number };

function parseMeta(json: string | null | undefined): AudioMeta | null {
  if (!json) return null;
  try { return JSON.parse(json) as AudioMeta; } catch { return null; }
}
function clock(sec?: number | null): string | null {
  if (!sec || sec < 0) return null;
  const m = Math.floor(sec / 60), s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}
function containerLabel(container?: string, codec?: string): string | null {
  const c = String(container || "").toUpperCase(), k = String(codec || "").toUpperCase();
  if (c.includes("WAV") || k.includes("PCM")) return "WAV";
  if (c.includes("MPEG") || k.includes("MPEG") || k.includes("MP3")) return "MP3";
  if (c.includes("FLAC")) return "FLAC";
  if (c.includes("MP4") || c.includes("M4A") || k.includes("AAC")) return "AAC";
  if (c.includes("OGG") || k.includes("VORBIS") || k.includes("OPUS")) return "OGG";
  return container || null;
}
function audioSpecs(meta: AudioMeta | null): string[] {
  if (!meta) return [];
  const parts: string[] = [];
  const fmt = containerLabel(meta.container, meta.codec);
  if (fmt) parts.push(fmt);
  if (meta.sampleRate) parts.push(`${+(meta.sampleRate / 1000).toFixed(1)} kHz`);
  if (meta.bitsPerSample) parts.push(`${meta.bitsPerSample}-bit`);
  else if (meta.bitrate) parts.push(`${Math.round(meta.bitrate / 1000)} kbps`);
  const d = clock(meta.durationSec);
  if (d) parts.push(d);
  if (meta.channels === 1) parts.push("Mono");
  else if (meta.channels === 2) parts.push("Stereo");
  else if (meta.channels) parts.push(`${meta.channels} ch`);
  return parts;
}

// Turn a Google Drive "…/file/d/ID/view" (or "?id=ID") link into a direct
// download URL, so the master saves to disk instead of opening Drive's player.
function driveDownloadUrl(url: string): string | null {
  const m = url.match(/\/file\/d\/([^/]+)/) || url.match(/[?&]id=([^&]+)/);
  return m ? `https://drive.google.com/uc?export=download&id=${m[1]}` : null;
}

export default function SongsClient({ songs, featuredSongIds, smartLinkSongIds }: { songs: Song[]; featuredSongIds: string[]; smartLinkSongIds: string[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [hiddenCols, setHiddenCols] = useState<Set<string>>(new Set());
  const [showCols, setShowCols] = useState(false);
  useEffect(() => {
    try { const s = localStorage.getItem("songs_hidden_cols"); if (s) setHiddenCols(new Set(JSON.parse(s))); } catch {}
  }, []);
  function toggleCol(key: string) {
    setHiddenCols((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      try { localStorage.setItem("songs_hidden_cols", JSON.stringify([...next])); } catch {}
      return next;
    });
  }
  const visibleColCount = 2 + SONG_TOGGLE_COLS.filter((c) => !hiddenCols.has(c.key)).length;
  const [editing, setEditing] = useState<Song | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [genreSel, setGenreSel] = useState("");
  useEffect(() => {
    if (showForm) setGenreSel(editing?.genre || "");
  }, [showForm, editing]);
  const subgenreOptions = DISTROKID_SUBGENRES[genreSel] || [];
  const [saving, setSaving] = useState(false);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [metaJson, setMetaJson] = useState<string>("");
  const [reading, setReading] = useState(false);
  const [uploadPct, setUploadPct] = useState<number | null>(null);
  const [playUrl, setPlayUrl] = useState<string | null>(null);
  const [detectingBpm, setDetectingBpm] = useState(false);
  const [bpmNote, setBpmNote] = useState<string | null>(null);
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

  // Get the audio bytes for the song being edited: the just-selected file if
  // there is one, otherwise the stored master.
  async function getEditingAudioBuffer(): Promise<ArrayBuffer | null> {
    if (audioFile) return await audioFile.arrayBuffer();
    const ref = editing?.audioFileRef;
    if (!ref) return null;
    const url = await getAudioUrl(ref);
    if (!url) return null;
    return await (await fetch(url)).arrayBuffer();
  }

  // Estimate tempo from the audio when there's no BPM tag to read. Decodes the
  // file in the browser and runs beat detection; writes the result into the BPM
  // field. Explicitly an estimate — beat detectors can land on half/double tempo.
  async function detectBpm() {
    setBpmNote(null);
    setDetectingBpm(true);
    try {
      const ab = await getEditingAudioBuffer();
      if (!ab) { setBpmNote("Add or upload this song's audio first, then detect."); return; }
      const AC: typeof AudioContext = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AC();
      const audioBuf = await ctx.decodeAudioData(ab);
      ctx.close();
      const { analyze } = await import("web-audio-beat-detector");
      const tempo = await analyze(audioBuf);
      const rounded = Math.round(tempo);
      const el = formRef.current?.elements.namedItem("bpm") as HTMLInputElement | null;
      if (el) el.value = String(rounded);
      setBpmNote(`Estimated ~${rounded} BPM — double-check it (detection can land on half or double the real tempo).`);
    } catch (e) {
      console.error("bpm detect failed", e);
      setBpmNote("Couldn't analyze this audio — enter the BPM manually.");
    } finally {
      setDetectingBpm(false);
    }
  }

  const [featured, setFeatured] = useState<Set<string>>(new Set(featuredSongIds));
  const [featuring, setFeaturing] = useState<string | null>(null);
  const hasSmartLink = new Set(smartLinkSongIds);
  const [platformLinks, setPlatformLinks] = useState<Record<string, string>>({});

  // Feature a song on the public website: trim a 30s preview in the browser,
  // upload it, then create the linked website track (full audio copied server-side).
  async function handleFeature(song: Song) {
    if (!song.audioFileRef) { alert("Upload audio for this song first, then feature it on your website."); return; }
    setFeaturing(song.id);
    try {
      const url = await getAudioUrl(song.audioFileRef);
      if (!url) throw new Error("Could not load this song's audio.");
      const arrayBuf = await (await fetch(url)).arrayBuffer();
      const AC: typeof AudioContext = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AC();
      const audioBuf = await ctx.decodeAudioData(arrayBuf);
      ctx.close();
      const clip = audioBufferToWavClip(audioBuf, 30);
      const { path, token } = await createAudioUploadUrl(`preview-${song.id}.wav`);
      const { error } = await supabaseBrowser.storage.from(AUDIO_BUCKET).uploadToSignedUrl(path, token, clip, { contentType: "audio/wav" });
      if (error) throw new Error("Could not upload the preview. Try again.");
      const res = await featureSongOnWebsite(song.id, path);
      if (!res.ok) throw new Error(res.error || "Could not feature this song.");
      setFeatured((prev) => new Set(prev).add(song.id));
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Something went wrong featuring this song.");
    } finally {
      setFeaturing(null);
    }
  }

  // Remove a song from the website.
  async function handleUnfeature(song: Song) {
    if (!confirm(`Remove "${song.title}" from your website?`)) return;
    setFeaturing(song.id);
    try {
      const res = await unfeatureSongFromWebsite(song.id);
      if (!res.ok) throw new Error(res.error || "Could not remove this song.");
      setFeatured((prev) => { const next = new Set(prev); next.delete(song.id); return next; });
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Something went wrong removing this song.");
    } finally {
      setFeaturing(null);
    }
  }

  const filtered = songs.filter(
    (s) =>
      s.title.toLowerCase().includes(search.toLowerCase()) ||
      s.artist.toLowerCase().includes(search.toLowerCase())
  );

  // Audio specs for the open song: freshly-read tags after an upload, else the
  // stored metadata from a previous upload.
  const specs = audioSpecs(parseMeta(metaJson || editing?.metadataFile));

  function resetAudioState() {
    setAudioFile(null); setMetaJson(""); setReading(false); setUploadPct(null); setPlayUrl(null);
  }
  function openAdd() {
    setEditing(null); resetAudioState(); setPlatformLinks({}); setShowForm(true);
  }
  function openEdit(song: Song) {
    setEditing(song); resetAudioState(); setPlatformLinks({}); setShowForm(true);
    if (song.audioFileRef) loadPlayback(song.audioFileRef);
    getSongSmartLink(song.id).then(setPlatformLinks).catch(() => {});
  }
  // Open the editor and jump straight to the streaming/platform links section.
  const linksSectionRef = useRef<HTMLDivElement>(null);
  const [scrollToLinks, setScrollToLinks] = useState(false);
  function openEditToLinks(song: Song) { openEdit(song); setScrollToLinks(true); }
  useEffect(() => {
    if (showForm && scrollToLinks) {
      const t = setTimeout(() => { linksSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }); setScrollToLinks(false); }, 80);
      return () => clearTimeout(t);
    }
  }, [showForm, scrollToLinks]);

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
      let songId = editing?.id ?? null;
      if (editing) await updateSong(editing.id, formData);
      else { const created = await createSong(formData); songId = created?.id ?? null; }
      // Save the song's platform links onto its Smart Link (feeds the website chips).
      if (songId) await upsertSongSmartLink(songId, platformLinks);
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
        <div className="flex items-center gap-2">
          <div className="relative">
            <button onClick={() => setShowCols((v) => !v)} className="flex items-center gap-2 px-4 py-2 border border-[#2a2d3a] text-[#c7cad8] rounded-lg text-sm hover:text-white hover:border-indigo-500" title="Show or hide columns to free up space">
              <SlidersHorizontal className="w-4 h-4" /> Columns
            </button>
            {showCols && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowCols(false)} />
                <div className="absolute right-0 z-20 mt-1 w-44 rounded-lg border border-[#2a2d3a] bg-[#1a1d27] p-1.5 shadow-xl">
                  {SONG_TOGGLE_COLS.map((c) => (
                    <label key={c.key} className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm text-[#c7cad8] hover:bg-[#2a2d3a]">
                      <input type="checkbox" checked={!hiddenCols.has(c.key)} onChange={() => toggleCol(c.key)} className="accent-indigo-500" />
                      {c.label}
                    </label>
                  ))}
                </div>
              </>
            )}
          </div>
          <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700">
            <Plus className="w-4 h-4" /> Add Song
          </button>
        </div>
      </div>

      <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-[#8b8fa8] text-sm border-b border-[#2a2d3a] bg-[#161820]">
              <th className="text-left px-6 py-4">Title</th>
              {!hiddenCols.has("isrc") && <th className="text-left px-6 py-4">ISRC</th>}
              {!hiddenCols.has("genre") && <th className="text-left px-6 py-4">Genre</th>}
              {!hiddenCols.has("writers") && <th className="text-left px-6 py-4">Writers</th>}
              {!hiddenCols.has("bpmkey") && <th className="text-left px-6 py-4">BPM / Key</th>}
              {!hiddenCols.has("rights") && <th className="text-left px-6 py-4">Rights</th>}
              {!hiddenCols.has("status") && <th className="text-left px-6 py-4">Status</th>}
              {!hiddenCols.has("release") && <th className="text-left px-6 py-4">Release</th>}
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
                    <div className="text-[#8b8fa8] text-xs">
                      {song.artist}
                      {(() => { const d = clock(parseMeta(song.metadataFile)?.durationSec); return d ? ` · ${d}` : ""; })()}
                    </div>
                  </td>
                  {!hiddenCols.has("isrc") && (
                    <td className="px-6 py-4">
                      <span className={`text-xs font-mono ${song.isrc ? "text-indigo-400" : "text-[#8b8fa8]"}`}>{song.isrc || "—"}</span>
                    </td>
                  )}
                  {!hiddenCols.has("genre") && <td className="px-6 py-4 text-[#8b8fa8] text-sm">{song.genre || "—"}</td>}
                  {!hiddenCols.has("writers") && <td className="px-6 py-4 text-[#8b8fa8] text-sm">{song.writers.join(", ")}</td>}
                  {!hiddenCols.has("bpmkey") && <td className="px-6 py-4 text-[#8b8fa8] text-sm">{song.bpm ? `${song.bpm} BPM · ${song.key}` : "—"}</td>}
                  {!hiddenCols.has("rights") && (
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-0.5">
                        <RightsIcon ok={!!cr?.registeredWithPRO} label="PRO" />
                        <RightsIcon ok={!!cr?.registeredWithMLC} label="MLC" />
                        <RightsIcon ok={!!cr?.registeredWithSX} label="SX" />
                      </div>
                    </td>
                  )}
                  {!hiddenCols.has("status") && (
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[song.status]}`}>{song.status}</span>
                    </td>
                  )}
                  {!hiddenCols.has("release") && (
                    <td className="px-6 py-4 text-[#8b8fa8] text-sm">
                      {song.releaseDate ? formatDate(song.releaseDate) : "—"}
                    </td>
                  )}
                  <td className="px-6 py-4" onClick={e => e.stopPropagation()}>
                    <div className="flex gap-1.5">
                      {featured.has(song.id) ? (
                        <button
                          onClick={() => handleUnfeature(song)}
                          disabled={featuring === song.id}
                          className="group p-2 rounded-lg bg-green-500/10 text-green-400 hover:bg-red-500/10 hover:text-red-400 transition-colors disabled:opacity-40"
                          title="On your website — click to remove"
                        >
                          {featuring === song.id ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                            <>
                              <Globe className="w-5 h-5 block group-hover:hidden" />
                              <X className="w-5 h-5 hidden group-hover:block" />
                            </>
                          )}
                        </button>
                      ) : (
                        <button
                          onClick={() => handleFeature(song)}
                          disabled={featuring === song.id || !song.audioFileRef}
                          className="p-2 rounded-lg text-[#8b8fa8] hover:bg-[#2a2d3a] hover:text-indigo-400 transition-colors disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-[#8b8fa8]"
                          title={song.audioFileRef ? "Feature on website" : "Upload audio first"}
                        >
                          {featuring === song.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <Globe className="w-5 h-5" />}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => openEditToLinks(song)}
                        className={`p-2 rounded-lg hover:bg-[#2a2d3a] transition-colors ${hasSmartLink.has(song.id) ? "text-indigo-400" : "text-[#8b8fa8] hover:text-indigo-400"}`}
                        title={hasSmartLink.has(song.id) ? "Streaming links set — edit" : "Add streaming links"}
                      >
                        <Link2 className="w-5 h-5" />
                      </button>
                      <Link href="/rights" className="p-2 rounded-lg text-[#8b8fa8] hover:bg-[#2a2d3a] hover:text-amber-400 transition-colors" title="Rights">
                        <Shield className="w-5 h-5" />
                      </Link>
                      <Link href="/copyrights" className="p-2 rounded-lg text-[#8b8fa8] hover:bg-[#2a2d3a] hover:text-blue-400 transition-colors" title="Copyright">
                        <FileText className="w-5 h-5" />
                      </Link>
                      <button onClick={() => handleDelete(song)} className="p-2 rounded-lg text-[#8b8fa8] hover:bg-[#2a2d3a] hover:text-red-400 transition-colors" title="Delete">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={visibleColCount} className="px-6 py-10 text-center text-[#8b8fa8] text-sm">
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
              <Field label="ISRC">
                <input
                  name="isrc"
                  defaultValue={editing?.isrc || ""}
                  className={inputClass}
                  placeholder="USRC12345678"
                  title="A recording's permanent global ID. Get your own ISRCs once, assign one per recording, and enter this SAME code in every distributor's form. Never let a distributor auto-assign — that gives the same recording different ISRCs on different platforms and splits your stats and royalties."
                />
                <p className="mt-1 text-[10px] leading-tight text-[#8b8fa8]">
                  Use <strong className="text-[#c7cad8]">your own</strong> ISRC and enter this <strong className="text-[#c7cad8]">same code</strong> in your distributor — don&rsquo;t let them auto-assign a new one. It&rsquo;s permanent per recording.{" "}
                  <a href="https://usisrc.org" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">Get your own (US)</a>
                </p>
              </Field>
              <Field label="UPC"><input name="upc" defaultValue={editing?.upc || ""} className={inputClass} /></Field>
              <Field label="Genre">
                <select name="genre" value={genreSel} onChange={(e) => setGenreSel(e.target.value)} className={inputClass}>
                  <option value="">Select a genre…</option>
                  {editing?.genre && !DISTROKID_GENRES.includes(editing.genre) && (
                    <option value={editing.genre}>{editing.genre} (current)</option>
                  )}
                  {DISTROKID_GENRES.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </Field>
              {subgenreOptions.length > 0 && (
                <Field label="Subgenre">
                  <select name="subgenre" defaultValue={editing?.subgenre || ""} className={inputClass}>
                    <option value="">Select subgenre…</option>
                    {editing?.subgenre && !subgenreOptions.includes(editing.subgenre) && (
                      <option value={editing.subgenre}>{editing.subgenre} (current)</option>
                    )}
                    {subgenreOptions.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </Field>
              )}
              <Field label="Release Date"><input name="releaseDate" type="date" defaultValue={editing?.releaseDate ? editing.releaseDate.slice(0, 10) : ""} className={inputClass} /></Field>
              <Field label="BPM">
                <div className="flex items-center gap-2">
                  <input name="bpm" type="number" defaultValue={editing?.bpm ?? ""} className={inputClass} />
                  <button
                    type="button"
                    onClick={detectBpm}
                    disabled={detectingBpm}
                    title="Estimate the tempo from the audio (uses the selected file, or this song's uploaded master). BPM/Key already auto-fill from the file's tags when present."
                    className="whitespace-nowrap rounded-lg border border-[#2a2d3a] px-2.5 py-2 text-xs text-indigo-400 transition hover:border-indigo-500 disabled:opacity-50"
                  >
                    {detectingBpm ? "Analyzing…" : "Detect"}
                  </button>
                </div>
                {bpmNote && <p className="mt-1 text-xs text-[#8b8fa8]">{bpmNote}</p>}
              </Field>
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
                  {specs.length > 0 && (
                    <div className="mt-3 flex flex-wrap items-center gap-1.5" title="Read from the audio file's embedded metadata">
                      {specs.map((s, i) => (
                        <span key={i} className="rounded-md border border-[#2a2d3a] bg-[#1a1d27] px-2 py-0.5 text-xs text-white">{s}</span>
                      ))}
                    </div>
                  )}
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
              {/* Master file + tagging (external WAV on Drive → download → write tags) */}
              <div className="col-span-2 rounded-lg border border-[#2a2d3a] bg-[#0f1117] p-4">
                <label className="block text-[#8b8fa8] text-xs mb-1.5">Master File Link (external — e.g. full-quality Google Drive .wav)</label>
                <input name="masterFileUrl" defaultValue={editing?.masterFileUrl || ""} placeholder="https://drive.google.com/file/d/…/view" className={inputClass} />
                {editing?.masterFileUrl && (
                  <div className="mt-1.5 flex flex-wrap items-center gap-4">
                    <a href={editing.masterFileUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300">
                      <Music className="w-3 h-3" /> Open master
                    </a>
                    <a href={driveDownloadUrl(editing.masterFileUrl) || editing.masterFileUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300" title="Download the master to your computer, then use 'Write metadata to a file' below">
                      <Download className="w-3 h-3" /> Download for tagging
                    </a>
                  </div>
                )}
                {editing && (
                  <TagWriter song={{
                    title: editing.title,
                    artist: editing.artist,
                    genre: editing.genre,
                    isrc: editing.isrc,
                    date: editing.releaseDate,
                    composer: editing.writers.join(", ") || null,
                    publisher: editing.publishers.join(", ") || null,
                    comment: editing.notes,
                    album: editing.collectionTitle,
                  }} />
                )}
              </div>
              {/* Streaming / platform links → this song's Smart Link (feeds the website chips) */}
              <div ref={linksSectionRef} className="col-span-2 rounded-lg border border-[#2a2d3a] bg-[#0f1117] p-4">
                <div className="mb-1 flex items-center gap-2">
                  <Link2 className="w-4 h-4 text-indigo-400" />
                  <h3 className="text-sm font-semibold text-white">Streaming / platform links</h3>
                </div>
                <p className="mb-3 text-xs text-[#8b8fa8]">
                  Paste where this song lives on each platform. Saved to the song&rsquo;s Smart Link and shown as &ldquo;Full song on…&rdquo; buttons on your website. Enter once — used everywhere.
                </p>
                <div className="grid gap-2">
                  {SONG_PLATFORM_FIELDS.map((p) => (
                    <label key={p.key} className="flex items-center gap-2">
                      <span className="w-28 shrink-0 text-xs text-[#8b8fa8]">{p.label}</span>
                      <input
                        type="url"
                        value={platformLinks[p.key] ?? ""}
                        onChange={(e) => setPlatformLinks((prev) => ({ ...prev, [p.key]: e.target.value }))}
                        placeholder={p.placeholder}
                        className={inputClass}
                      />
                    </label>
                  ))}
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
