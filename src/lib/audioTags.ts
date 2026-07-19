// Client-side audio tag writer. Stamps ArtistOps song metadata into a local
// file WITHOUT uploading it anywhere — MP3 via ID3v2, WAV via RIFF INFO plus an
// embedded ID3 chunk (which is what most tools actually read for the ISRC).
// Only tag/text chunks change; the audio samples are copied through untouched.
import { ID3Writer } from "browser-id3-writer";

export type TagFields = {
  title?: string;
  artist?: string;
  album?: string;
  genre?: string;
  date?: string; // year or YYYY-MM-DD
  track?: string;
  isrc?: string;
  composer?: string; // writers
  publisher?: string;
  comment?: string;
  copyright?: string;
};

type Writer = InstanceType<typeof ID3Writer>;

function applyFrames(w: Writer, f: TagFields) {
  if (f.title) w.setFrame("TIT2", f.title);
  if (f.artist) w.setFrame("TPE1", [f.artist]);
  if (f.album) w.setFrame("TALB", f.album);
  if (f.genre) w.setFrame("TCON", [f.genre]);
  const year = f.date ? parseInt(String(f.date).slice(0, 4), 10) : NaN;
  if (Number.isFinite(year)) w.setFrame("TYER", year);
  if (f.track) w.setFrame("TRCK", String(f.track));
  if (f.isrc) w.setFrame("TSRC", f.isrc);
  if (f.composer) w.setFrame("TCOM", [f.composer]);
  if (f.publisher) w.setFrame("TPUB", f.publisher);
  if (f.copyright) w.setFrame("TCOP", f.copyright);
  if (f.comment) w.setFrame("COMM", { description: "", text: f.comment, language: "eng" });
}

export function writeMp3Tags(buf: ArrayBuffer, f: TagFields): ArrayBuffer {
  const w = new ID3Writer(buf);
  applyFrames(w, f);
  return w.addTag();
}

// --- WAV (RIFF) helpers -----------------------------------------------------
const enc = new TextEncoder();
function str4(v: DataView, o: number) {
  return String.fromCharCode(v.getUint8(o), v.getUint8(o + 1), v.getUint8(o + 2), v.getUint8(o + 3));
}
function makeChunk(id: string, data: Uint8Array): Uint8Array {
  const size = data.length;
  const out = new Uint8Array(8 + size + (size & 1)); // pad to even
  for (let i = 0; i < 4; i++) out[i] = id.charCodeAt(i);
  new DataView(out.buffer).setUint32(4, size, true);
  out.set(data, 8);
  return out;
}
function concat(arrs: Uint8Array[]): Uint8Array {
  const len = arrs.reduce((a, b) => a + b.length, 0);
  const o = new Uint8Array(len);
  let p = 0;
  for (const a of arrs) { o.set(a, p); p += a.length; }
  return o;
}
function buildId3Tag(f: TagFields): Uint8Array {
  const w = new ID3Writer(new ArrayBuffer(0));
  applyFrames(w, f);
  return new Uint8Array(w.addTag());
}

export function writeWavTags(buf: ArrayBuffer, f: TagFields): ArrayBuffer {
  const view = new DataView(buf);
  if (str4(view, 0) !== "RIFF" || str4(view, 8) !== "WAVE") throw new Error("This doesn't look like a WAV file.");

  // Walk top-level chunks.
  const chunks: { id: string; size: number; start: number }[] = [];
  let off = 12;
  const end = Math.min(buf.byteLength, view.getUint32(4, true) + 8);
  while (off + 8 <= end) {
    const id = str4(view, off);
    const size = view.getUint32(off + 4, true);
    chunks.push({ id, size, start: off });
    off = off + 8 + size + (size & 1);
  }

  // Keep everything except existing metadata chunks (stale LIST/INFO + id3).
  const keep = chunks.filter((c) => {
    if (c.id === "LIST") return str4(view, c.start + 8) !== "INFO";
    if (c.id.toLowerCase() === "id3 ") return false;
    return true;
  });

  // Fresh RIFF INFO (standard text fields).
  const infoMap: [string, string | undefined][] = [
    ["INAM", f.title], ["IART", f.artist], ["IPRD", f.album], ["IGNR", f.genre],
    ["ICRD", f.date], ["ICMT", f.comment], ["ICOP", f.copyright], ["ITRK", f.track],
    ["ISRC", f.isrc], ["IWRI", f.composer], ["ICMS", f.publisher],
  ];
  const infoParts = infoMap
    .filter(([, v]) => v)
    .map(([code, val]) => {
      const b = enc.encode(String(val) + "\0");
      const sub = new Uint8Array(8 + b.length + (b.length & 1));
      for (let i = 0; i < 4; i++) sub[i] = code.charCodeAt(i);
      new DataView(sub.buffer).setUint32(4, b.length, true);
      sub.set(b, 8);
      return sub;
    });
  const infoBody = concat(infoParts);
  const listData = new Uint8Array(4 + infoBody.length);
  listData.set(enc.encode("INFO"), 0);
  listData.set(infoBody, 4);
  const listChunk = makeChunk("LIST", listData);
  const id3Chunk = makeChunk("id3 ", buildId3Tag(f));

  const kept = keep.map((c) => {
    const len = Math.min(8 + c.size + (c.size & 1), buf.byteLength - c.start);
    return new Uint8Array(buf, c.start, len);
  });
  const body = [...kept, listChunk, id3Chunk];
  const bodyLen = body.reduce((a, b) => a + b.length, 0);

  const out = new Uint8Array(12 + bodyLen);
  const odv = new DataView(out.buffer);
  out.set(enc.encode("RIFF"), 0);
  odv.setUint32(4, 4 + bodyLen, true);
  out.set(enc.encode("WAVE"), 8);
  let p = 12;
  for (const part of body) { out.set(part, p); p += part.length; }
  return out.buffer;
}

export function isWav(name: string, type: string) {
  return /\.wav$/i.test(name) || /wav|wave|x-wav/i.test(type);
}

// Read a WAV's ISRC straight from its RIFF INFO 'ISRC' tag (music-metadata
// doesn't surface this one), so we can show what's actually embedded.
export function readRiffInfoIsrc(buf: ArrayBuffer): string | null {
  try {
    const v = new DataView(buf);
    if (str4(v, 0) !== "RIFF" || str4(v, 8) !== "WAVE") return null;
    let off = 12;
    const end = Math.min(buf.byteLength, v.getUint32(4, true) + 8);
    while (off + 8 <= end) {
      const id = str4(v, off);
      const size = v.getUint32(off + 4, true);
      if (id === "LIST" && str4(v, off + 8) === "INFO") {
        let p = off + 12;
        const listEnd = off + 8 + size;
        while (p + 8 <= listEnd) {
          const code = str4(v, p);
          const csize = v.getUint32(p + 4, true);
          if (code === "ISRC") {
            const bytes = new Uint8Array(buf, p + 8, Math.min(csize, buf.byteLength - p - 8));
            return new TextDecoder().decode(bytes).replace(/\0+$/, "").trim() || null;
          }
          p = p + 8 + csize + (csize & 1);
        }
      }
      off = off + 8 + size + (size & 1);
    }
    return null;
  } catch {
    return null;
  }
}
