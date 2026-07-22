"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, FileText, AlertTriangle, CheckCircle2, XCircle, Plus, Pencil, Trash2, Download, X, Loader2 } from "lucide-react";
import { RIGHTS_DOC_TYPES } from "./doc-types";
import {
  createRightsDocument,
  updateRightsDocument,
  deleteRightsDocument,
  createRightsDocUploadUrl,
  getRightsDocUrl,
} from "./actions";
import { supabaseBrowser, AUDIO_BUCKET } from "@/lib/supabaseClient";

type Split = { name: string; pct: number };
type SongRight = { id: string; title: string; isrc: string | null; writers: string[]; publishers: string[]; masterOwner: string; pro: string | null; mlc: boolean; soundExchange: boolean; syncAvailable: boolean; splits: Split[] };
type Doc = { id: string; songId: string; songTitle: string; type: string; title: string; parties: string[]; expiresAt: string | null; notes: string | null; fileUrl: string | null; status: string };

const inputClass = "w-full bg-[#0f1117] border border-[#2a2d3a] text-white px-3 py-2 rounded-lg text-sm placeholder:text-[#8b8fa8] focus:outline-none focus:border-indigo-500";

const docTypeColors: Record<string, string> = {
  split_sheet: "bg-blue-500/20 text-blue-400",
  sync_license: "bg-purple-500/20 text-purple-400",
  license: "bg-green-500/20 text-green-400",
  recording_contract: "bg-amber-500/20 text-amber-400",
  distribution_agreement: "bg-indigo-500/20 text-indigo-400",
};
const statusColors: Record<string, string> = {
  active: "bg-green-500/20 text-green-400",
  expiring: "bg-red-500/20 text-red-400",
};
const splitColors = ["bg-indigo-500", "bg-purple-500", "bg-pink-500", "bg-amber-500", "bg-green-500"];

export default function RightsClient({ songRights, documents }: { songRights: SongRight[]; documents: Doc[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState(songRights[0]?.id);
  const [docFilter, setDocFilter] = useState("all");

  // ---- Add / edit a rights document ----
  const blank = { songId: songRights[0]?.id ?? "", type: "split_sheet", title: "", parties: "", expiresAt: "", notes: "" };
  const [showForm, setShowForm] = useState(false);
  const [editingDoc, setEditingDoc] = useState<Doc | null>(null);
  const [form, setForm] = useState(blank);
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  function openAddDoc() {
    setEditingDoc(null);
    setForm(blank);
    setFile(null);
    setFormError(null);
    setShowForm(true);
  }
  function openEditDoc(doc: Doc) {
    setEditingDoc(doc);
    setForm({
      songId: doc.songId,
      type: doc.type,
      title: doc.title,
      parties: doc.parties.join(", "),
      expiresAt: doc.expiresAt ?? "",
      notes: doc.notes ?? "",
    });
    setFile(null);
    setFormError(null);
    setShowForm(true);
  }

  async function saveDoc() {
    setSaving(true);
    setFormError(null);
    try {
      // Upload the file first (private bucket, signed URL) and store its path.
      let fileUrl = editingDoc?.fileUrl ?? null;
      if (file) {
        const { path, token } = await createRightsDocUploadUrl(file.name);
        const { error } = await supabaseBrowser.storage.from(AUDIO_BUCKET).uploadToSignedUrl(path, token, file);
        if (error) throw new Error(error.message);
        fileUrl = path;
      }
      const payload = {
        songId: form.songId,
        type: form.type,
        title: form.title,
        parties: form.parties.split(",").map((p) => p.trim()).filter(Boolean),
        expiresAt: form.expiresAt || null,
        notes: form.notes || null,
        fileUrl,
      };
      const res = editingDoc
        ? await updateRightsDocument(editingDoc.id, payload)
        : await createRightsDocument(payload);
      if (!res.ok) { setFormError(res.error || "Could not save."); return; }
      setShowForm(false);
      router.refresh();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setSaving(false);
    }
  }

  async function removeDoc(doc: Doc) {
    if (!confirm(`Delete "${doc.title}"? This also removes its uploaded file and can't be undone.`)) return;
    const res = await deleteRightsDocument(doc.id);
    if (!res.ok) { alert(res.error || "Could not delete."); return; }
    router.refresh();
  }

  async function openFile(path: string) {
    const url = await getRightsDocUrl(path);
    if (url) window.open(url, "_blank", "noopener");
    else alert("Couldn't open that file.");
  }

  const selectedSong = songRights.find((s) => s.id === selectedId) || songRights[0];
  const filteredSongs = songRights.filter((s) => s.title.toLowerCase().includes(search.toLowerCase()));
  const filteredDocs = documents.filter((d) => (docFilter === "all" || d.type === docFilter) && d.songTitle.toLowerCase().includes(search.toLowerCase()));
  const expiring = documents.filter((d) => d.status === "expiring");
  const unregistered = songRights.filter((s) => !s.pro || !s.mlc);

  return (
    <div className="p-8 space-y-6">
      {unregistered.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-amber-400 font-medium">{unregistered.length} songs missing rights registrations</p>
            <p className="text-[#8b8fa8] text-sm">{unregistered.map((s) => s.title).join(", ")} are not fully registered with a PRO and the MLC — register them to avoid uncollected royalties.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl p-4"><p className="text-[#8b8fa8] text-sm">Songs Tracked</p><p className="text-white text-2xl font-bold mt-1">{songRights.length}</p></div>
        <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl p-4"><p className="text-[#8b8fa8] text-sm">PRO Registered</p><p className="text-white text-2xl font-bold mt-1">{songRights.filter((s) => s.pro).length}</p></div>
        <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl p-4"><p className="text-[#8b8fa8] text-sm">MLC Registered</p><p className="text-white text-2xl font-bold mt-1">{songRights.filter((s) => s.mlc).length}</p></div>
        <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl p-4"><p className="text-[#8b8fa8] text-sm">Documents</p><p className="text-white text-2xl font-bold mt-1">{documents.length}</p></div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-semibold">Song Rights Overview</h2>
          <div className="relative">
            <Search className="w-4 h-4 text-[#8b8fa8] absolute left-3 top-1/2 -translate-y-1/2" />
            <input type="text" placeholder="Search songs..." value={search} onChange={(e) => setSearch(e.target.value)} className="bg-[#1a1d27] border border-[#2a2d3a] text-white pl-10 pr-4 py-2 rounded-lg text-sm placeholder:text-[#8b8fa8] focus:outline-none focus:border-indigo-500 w-64" />
          </div>
        </div>
        <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="text-[#8b8fa8] border-b border-[#2a2d3a] bg-[#161820]"><th className="text-left px-4 py-3">Song</th><th className="text-left px-4 py-3">ISRC</th><th className="text-left px-4 py-3">Writers</th><th className="text-left px-4 py-3">PRO</th><th className="text-center px-4 py-3">MLC</th><th className="text-center px-4 py-3">SoundEx</th><th className="text-center px-4 py-3">Sync</th></tr></thead>
            <tbody>
              {filteredSongs.map((song) => (
                <tr key={song.id} onClick={() => setSelectedId(song.id)} className={`border-b border-[#2a2d3a] last:border-0 cursor-pointer transition-colors ${selectedSong?.id === song.id ? "bg-indigo-600/10" : "hover:bg-[#2a2d3a]/40"}`}>
                  <td className="px-4 py-3 text-white font-medium">{song.title}</td>
                  <td className="px-4 py-3 text-[#8b8fa8] font-mono text-xs">{song.isrc || "—"}</td>
                  <td className="px-4 py-3 text-[#8b8fa8]">{song.writers.join(", ")}</td>
                  <td className="px-4 py-3">{song.pro ? <span className="text-green-400">{song.pro}</span> : <span className="text-red-400">—</span>}</td>
                  <td className="px-4 py-3 text-center">{song.mlc ? <CheckCircle2 className="w-4 h-4 text-green-400 mx-auto" /> : <XCircle className="w-4 h-4 text-red-400 mx-auto" />}</td>
                  <td className="px-4 py-3 text-center">{song.soundExchange ? <CheckCircle2 className="w-4 h-4 text-green-400 mx-auto" /> : <XCircle className="w-4 h-4 text-red-400 mx-auto" />}</td>
                  <td className="px-4 py-3 text-center">{song.syncAvailable ? <CheckCircle2 className="w-4 h-4 text-green-400 mx-auto" /> : <XCircle className="w-4 h-4 text-[#2a2d3a] mx-auto" />}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl p-6">
          <h2 className="text-white font-semibold mb-1">Ownership Splits</h2>
          <p className="text-[#8b8fa8] text-sm mb-4">{selectedSong?.title}</p>
          <div className="flex h-6 rounded-full overflow-hidden mb-4">
            {selectedSong?.splits.map((s, i) => (<div key={s.name} className={`${splitColors[i % splitColors.length]} flex items-center justify-center text-white text-xs font-bold`} style={{ width: `${s.pct}%` }}>{s.pct >= 20 ? `${s.pct}%` : ""}</div>))}
          </div>
          <div className="space-y-2">
            {selectedSong?.splits.map((s, i) => (<div key={s.name} className="flex items-center justify-between"><div className="flex items-center gap-2"><div className={`w-3 h-3 rounded-sm ${splitColors[i % splitColors.length]}`} /><span className="text-white text-sm">{s.name}</span></div><span className="text-[#8b8fa8] text-sm">{s.pct}%</span></div>))}
          </div>
        </div>

        <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl p-6">
          <h2 className="text-white font-semibold mb-4">Renewal Reminders (90 days)</h2>
          {expiring.length === 0 ? <p className="text-[#8b8fa8] text-sm">No documents expiring soon.</p> : (
            <div className="space-y-3">
              {expiring.map((doc) => (<div key={doc.id} className="bg-red-500/10 border border-red-500/30 rounded-lg p-3"><p className="text-white text-sm font-medium">{doc.title}</p><p className="text-[#8b8fa8] text-xs">{doc.songTitle}</p><p className="text-red-400 text-xs mt-1">Expires: {doc.expiresAt}</p></div>))}
            </div>
          )}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-semibold">Rights Documents</h2>
          <div className="flex items-center gap-2 flex-wrap">
            {["all", ...RIGHTS_DOC_TYPES].map((t) => (
              <button key={t} onClick={() => setDocFilter(t)} className={`px-3 py-1 rounded-lg text-xs ${docFilter === t ? "bg-indigo-600 text-white" : "border border-[#2a2d3a] text-[#8b8fa8] hover:text-white"}`}>{t === "all" ? "All" : t.replace(/_/g, " ")}</button>
            ))}
            <button
              onClick={openAddDoc}
              disabled={songRights.length === 0}
              title={songRights.length === 0 ? "Add a song first — every document is attached to one of your songs." : "Upload a split sheet, license, contract or distribution agreement and set its expiry date."}
              className="ml-2 flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700 disabled:opacity-50"
            >
              <Plus className="w-3.5 h-3.5" /> Add document
            </button>
          </div>
        </div>
        <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="text-[#8b8fa8] border-b border-[#2a2d3a] bg-[#161820]"><th className="text-left px-6 py-4">Document</th><th className="text-left px-6 py-4">Song</th><th className="text-left px-6 py-4">Type</th><th className="text-left px-6 py-4">Parties</th><th className="text-left px-6 py-4">Expires</th><th className="text-left px-6 py-4">Status</th><th className="text-right px-6 py-4">Actions</th></tr></thead>
            <tbody>
              {filteredDocs.map((doc) => (
                <tr key={doc.id} className="border-b border-[#2a2d3a] last:border-0 hover:bg-[#2a2d3a]/40">
                  <td className="px-6 py-4"><div className="flex items-center gap-2 text-white"><FileText className="w-4 h-4 text-[#8b8fa8]" />{doc.title}</div></td>
                  <td className="px-6 py-4 text-[#8b8fa8]">{doc.songTitle}</td>
                  <td className="px-6 py-4"><span className={`px-2 py-1 rounded text-xs font-medium ${docTypeColors[doc.type] || "bg-gray-500/20 text-gray-400"}`}>{doc.type.replace(/_/g, " ")}</span></td>
                  <td className="px-6 py-4 text-[#8b8fa8]">{doc.parties.join(", ")}</td>
                  <td className="px-6 py-4 text-[#8b8fa8]">{doc.expiresAt || "—"}</td>
                  <td className="px-6 py-4"><span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[doc.status]}`}>{doc.status}</span></td>
                  <td className="px-6 py-4 text-right whitespace-nowrap">
                    {doc.fileUrl ? (
                      <button onClick={() => openFile(doc.fileUrl!)} title="Open the uploaded file" className="p-2 rounded-lg text-[#8b8fa8] hover:bg-[#2a2d3a] hover:text-indigo-400"><Download className="w-4 h-4" /></button>
                    ) : (
                      <span title="No file uploaded for this document yet" className="inline-block p-2 text-[#3a3d4a]"><Download className="w-4 h-4" /></span>
                    )}
                    <button onClick={() => openEditDoc(doc)} title="Edit this document, its parties, or its expiry date" className="p-2 rounded-lg text-[#8b8fa8] hover:bg-[#2a2d3a] hover:text-white"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => removeDoc(doc)} title="Delete this document" className="p-2 rounded-lg text-[#8b8fa8] hover:bg-[#2a2d3a] hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
              {filteredDocs.length === 0 && <tr><td colSpan={7} className="px-6 py-10 text-center text-[#8b8fa8] text-sm">No documents yet — use “Add document” to upload a split sheet, license, contract, or distribution agreement.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setShowForm(false)}>
          <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#2a2d3a]">
              <h2 className="text-white font-semibold">{editingDoc ? "Edit document" : "Add document"}</h2>
              <button onClick={() => setShowForm(false)} className="text-[#8b8fa8] hover:text-white"><X className="w-5 h-5" /></button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-[#8b8fa8] text-sm mb-1">Song</label>
                <select value={form.songId} onChange={(e) => setForm({ ...form, songId: e.target.value })} className={`${inputClass} [color-scheme:dark]`}>
                  {songRights.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
                </select>
                <p className="mt-1 text-xs text-[#8b8fa8]">Every document is filed against one of your songs, so it shows up with that song&rsquo;s rights.</p>
              </div>

              <div>
                <label className="block text-[#8b8fa8] text-sm mb-1">Type</label>
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className={`${inputClass} [color-scheme:dark]`}>
                  {RIGHTS_DOC_TYPES.map((t) => <option key={t} value={t}>{t.replace(/_/g, " ")}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[#8b8fa8] text-sm mb-1">Title</label>
                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Midnight Drive — Split Sheet" className={inputClass} />
              </div>

              <div>
                <label className="block text-[#8b8fa8] text-sm mb-1">Parties</label>
                <input value={form.parties} onChange={(e) => setForm({ ...form, parties: e.target.value })} placeholder="You, Co-writer, Label" className={inputClass} />
                <p className="mt-1 text-xs text-[#8b8fa8]">Everyone who signed this document, separated by commas.</p>
              </div>

              <div>
                <label className="block text-[#8b8fa8] text-sm mb-1">Expires</label>
                <input type="date" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} className={`${inputClass} [color-scheme:dark]`} />
                <p className="mt-1 text-xs text-[#8b8fa8]">Leave blank for documents that never expire, like a split sheet. Anything expiring within 90 days shows up in Renewal Reminders.</p>
              </div>

              <div>
                <label className="block text-[#8b8fa8] text-sm mb-1">File</label>
                <input type="file" accept=".pdf,.doc,.docx,.png,.jpg,.jpeg" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="text-sm text-[#8b8fa8] file:mr-3 file:rounded-md file:border file:border-[#2a2d3a] file:bg-transparent file:px-3 file:py-1.5 file:text-sm file:text-white" />
                <p className="mt-1 text-xs text-[#8b8fa8]">
                  {editingDoc?.fileUrl && !file ? "A file is already attached — choosing a new one replaces it. " : ""}
                  Stored privately; only you can open it, through a temporary link.
                </p>
              </div>

              <div>
                <label className="block text-[#8b8fa8] text-sm mb-1">Notes</label>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} className={`${inputClass} resize-y`} />
              </div>

              {formError && <p className="text-sm text-red-400">{formError}</p>}
            </div>

            <div className="flex items-center gap-3 px-6 py-4 border-t border-[#2a2d3a]">
              <button onClick={saveDoc} disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {saving ? "Saving…" : editingDoc ? "Save changes" : "Add document"}
              </button>
              <button onClick={() => setShowForm(false)} className="text-[#8b8fa8] text-sm hover:text-white">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
