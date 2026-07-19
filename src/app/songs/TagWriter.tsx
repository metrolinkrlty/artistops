"use client";

import { useState } from "react";
import { UploadCloud, Loader2, Download, Check, Tags } from "lucide-react";
import { writeMp3Tags, writeWavTags, isWav, type TagFields } from "@/lib/audioTags";

// The metadata we'll stamp, taken from the song in ArtistOps.
type SongTags = {
  title: string;
  artist: string;
  genre?: string | null;
  isrc?: string | null;
  date?: string | null; // releaseDate
  composer?: string | null; // writers joined
  publisher?: string | null; // publishers joined
  comment?: string | null; // notes
  album?: string | null; // collectionTitle
};

type Row = { label: string; inFile: string; toWrite: string };

export default function TagWriter({ song }: { song: SongTags }) {
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileType, setFileType] = useState<string>("");
  const [buf, setBuf] = useState<ArrayBuffer | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [reading, setReading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fields: TagFields = {
    title: song.title || undefined,
    artist: song.artist || undefined,
    genre: song.genre || undefined,
    isrc: song.isrc || undefined,
    date: song.date || undefined,
    composer: song.composer || undefined,
    publisher: song.publisher || undefined,
    comment: song.comment || undefined,
    album: song.album || undefined,
  };

  async function onFile(file: File | null) {
    setDone(false); setError(null); setRows([]); setBuf(null); setFileName(null);
    if (!file) return;
    setFileName(file.name); setFileType(file.type);
    setReading(true);
    try {
      const ab = await file.arrayBuffer();
      setBuf(ab);
      const { parseBuffer } = await import("music-metadata");
      const mm = await parseBuffer(new Uint8Array(ab), { mimeType: file.type, path: file.name });
      const c = mm.common;
      const cur = {
        Title: c.title || "",
        Artist: (c.artist || ""),
        Genre: (c.genre || [])[0] || "",
        ISRC: (c.isrc || [])[0] || "",
        Year: c.year ? String(c.year) : "",
        Writers: (c.composer || []).join(", "),
      };
      const wr: Record<string, string> = {
        Title: fields.title || "", Artist: fields.artist || "", Genre: fields.genre || "",
        ISRC: fields.isrc || "", Year: fields.date ? String(fields.date).slice(0, 4) : "", Writers: fields.composer || "",
      };
      setRows(Object.keys(cur).map((k) => ({ label: k, inFile: (cur as Record<string, string>)[k], toWrite: wr[k] })));
    } catch {
      setError("Couldn't read this file's metadata. It may not be a valid MP3/WAV.");
    } finally {
      setReading(false);
    }
  }

  function writeAndDownload() {
    if (!buf) return;
    setBusy(true); setError(null);
    try {
      const wav = isWav(fileName || "", fileType);
      const out = wav ? writeWavTags(buf, fields) : writeMp3Tags(buf, fields);
      const blob = new Blob([out], { type: wav ? "audio/wav" : "audio/mpeg" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const base = (fileName || "track").replace(/\.(mp3|wav)$/i, "");
      a.href = url; a.download = `${base} (tagged).${wav ? "wav" : "mp3"}`;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not write tags.");
    } finally {
      setBusy(false);
    }
  }

  const wav = isWav(fileName || "", fileType);

  return (
    <div className="col-span-2 rounded-lg border border-[#2a2d3a] bg-[#0f1117] p-4">
      <div className="mb-1 flex items-center gap-2">
        <Tags className="w-4 h-4 text-indigo-400" />
        <h3 className="text-sm font-semibold text-white">Write metadata to a file</h3>
      </div>
      <p className="mb-3 text-xs text-[#8b8fa8]">
        Stamp this song&rsquo;s ArtistOps details (title, artist, genre, ISRC, writers, date) into a local MP3 or WAV — great for fixing tags before distribution. The file is processed <strong>here in your browser</strong> and never uploaded; you get a corrected copy to download (your original is untouched).
      </p>

      <label className="flex w-fit cursor-pointer items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300">
        <UploadCloud className="w-4 h-4" />
        {fileName ? "Choose a different file" : "Choose an MP3 or WAV file"}
        <input type="file" accept="audio/mpeg,audio/mp3,audio/wav,audio/x-wav,.mp3,.wav" className="hidden" onChange={(e) => onFile(e.target.files?.[0] || null)} />
      </label>

      {reading && <p className="mt-2 flex items-center gap-1 text-xs text-[#8b8fa8]"><Loader2 className="w-3 h-3 animate-spin" /> Reading current tags…</p>}

      {rows.length > 0 && !reading && (
        <div className="mt-3">
          <div className="overflow-hidden rounded-lg border border-[#2a2d3a]">
            <table className="w-full text-xs">
              <thead className="bg-[#1a1d27] text-[#8b8fa8]">
                <tr><th className="px-3 py-2 text-left">Field</th><th className="px-3 py-2 text-left">In file now</th><th className="px-3 py-2 text-left">Will write (from ArtistOps)</th></tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const changed = r.toWrite && r.inFile.trim() !== r.toWrite.trim();
                  return (
                    <tr key={r.label} className="border-t border-[#2a2d3a]">
                      <td className="px-3 py-2 text-[#8b8fa8]">{r.label}</td>
                      <td className={`px-3 py-2 ${changed ? "text-red-400" : "text-white"}`}>{r.inFile || "—"}</td>
                      <td className={`px-3 py-2 ${changed ? "text-green-400" : "text-white"}`}>{r.toWrite || "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {wav && <p className="mt-2 text-xs text-amber-400">WAV note: text tags + ISRC are written (RIFF INFO + embedded ID3). Some fields aren&rsquo;t standardized in WAV — for distribution, the ISRC also travels in the delivery form.</p>}
          <button
            type="button"
            onClick={writeAndDownload}
            disabled={busy}
            className="mt-3 flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : done ? <Check className="w-4 h-4" /> : <Download className="w-4 h-4" />}
            {done ? "Downloaded — tagged copy saved" : `Write tags & download ${wav ? "WAV" : "MP3"}`}
          </button>
        </div>
      )}

      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
    </div>
  );
}
