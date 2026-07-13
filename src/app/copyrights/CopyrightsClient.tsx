"use client";
import { Plus, Search, CheckCircle, XCircle, Pencil, Trash2, X, Users, ExternalLink, Lock } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatDate } from "@/lib/dateUtils";
import { createCopyright, updateCopyright, deleteCopyright } from "./actions";

type Copyright = {
  id: string;
  songIds: string[];
  songTitles: string[];
  groupTitle: string | null;
  isGroup: boolean;
  serviceRequestNumber: string | null;
  serviceRequestUrl: string | null;
  registrationNumber: string | null;
  registrationCertUrl: string | null;
  filingDate: string | null;
  claimant: string | null;
  proName: string | null;
  registeredWithUSCO: boolean;
  registeredWithPRO: boolean;
  registeredWithMLC: boolean;
  registeredWithSX: boolean;
  registeredWithDist: boolean;
};
type SongOpt = { id: string; title: string };

const inputClass = "w-full bg-[#0f1117] border border-[#2a2d3a] text-white px-3 py-2 rounded-lg text-sm placeholder:text-[#8b8fa8] focus:outline-none focus:border-indigo-500";

export default function CopyrightsClient({ copyrights, songs }: { copyrights: Copyright[]; songs: SongOpt[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Copyright | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedSongIds, setSelectedSongIds] = useState<string[]>([]);

  const Check = ({ val }: { val: boolean }) => (
    val ? <CheckCircle className="w-4 h-4 text-green-400" /> : <XCircle className="w-4 h-4 text-[#8b8fa8]" />
  );

  const filtered = copyrights.filter((c) => {
    const q = search.toLowerCase();
    return c.songTitles.some(t => t.toLowerCase().includes(q)) ||
      (c.groupTitle || "").toLowerCase().includes(q) ||
      (c.registrationNumber || "").toLowerCase().includes(q);
  });

  function openAdd() {
    setEditing(null);
    setSelectedSongIds([]);
    setShowForm(true);
  }

  function openEdit(c: Copyright) {
    setEditing(c);
    setSelectedSongIds(c.songIds);
    setShowForm(true);
  }

  function toggleSong(id: string) {
    setSelectedSongIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  async function handleSubmit(formData: FormData) {
    // Inject selected song IDs into formData
    selectedSongIds.forEach(id => formData.append("songIds", id));
    setSaving(true);
    if (editing) await updateCopyright(editing.id, formData);
    else await createCopyright(formData);
    setSaving(false);
    setShowForm(false);
    setEditing(null);
    router.refresh();
  }

  async function handleDelete(c: Copyright) {
    const label = c.isGroup ? (c.groupTitle || "group registration") : c.songTitles[0];
    if (!confirm(`Delete copyright record for "${label}"?`)) return;
    await deleteCopyright(c.id);
    router.refresh();
  }

  const Toggle = ({ name, label, checked }: { name: string; label: string; checked?: boolean }) => (
    <label className="flex items-center gap-2 text-sm text-[#8b8fa8]">
      <input type="checkbox" name={name} defaultChecked={checked} className="accent-indigo-600" /> {label}
    </label>
  );

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="relative">
          <Search className="w-4 h-4 text-[#8b8fa8] absolute left-3 top-1/2 -translate-y-1/2" />
          <input type="text" placeholder="Search copyrights..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="bg-[#1a1d27] border border-[#2a2d3a] text-white pl-10 pr-4 py-2 rounded-lg text-sm placeholder:text-[#8b8fa8] focus:outline-none focus:border-indigo-500 w-72" />
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700">
          <Plus className="w-4 h-4" /> Register Copyright
        </button>
      </div>

      <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="text-[#8b8fa8] text-sm border-b border-[#2a2d3a] bg-[#161820]">
              <th className="text-left px-6 py-4">Song(s)</th>
              <th className="text-left px-6 py-4">Service Req #</th>
              <th className="text-left px-6 py-4">Reg. Number</th>
              <th className="text-left px-6 py-4">Filing Date</th>
              <th className="text-left px-6 py-4">PRO</th>
              <th className="text-center px-6 py-4">USCO</th>
              <th className="text-center px-6 py-4">PRO</th>
              <th className="text-center px-6 py-4">MLC</th>
              <th className="text-center px-6 py-4">SoundEx</th>
              <th className="text-center px-6 py-4">Dist</th>
              <th className="px-6 py-4"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.id} onClick={() => openEdit(c)} className="border-b border-[#2a2d3a] last:border-0 hover:bg-[#2a2d3a]/40 transition-colors cursor-pointer">
                <td className="px-6 py-4">
                  {c.isGroup ? (
                    <div>
                      <div className="flex items-center gap-1.5 text-white font-medium">
                        <Users className="w-3.5 h-3.5 text-indigo-400" />
                        <span>{c.groupTitle || "Group Registration"}</span>
                        <span className="text-xs bg-indigo-500/20 text-indigo-400 px-1.5 py-0.5 rounded">{c.songIds.length} songs</span>
                      </div>
                      <div className="text-[#8b8fa8] text-xs mt-0.5">{c.songTitles.join(", ")}</div>
                    </div>
                  ) : (
                    <span className="text-white font-medium">{c.songTitles[0] || "—"}</span>
                  )}
                </td>
                <td className="px-6 py-4 text-xs font-mono" onClick={e => e.stopPropagation()}>
                  {c.serviceRequestNumber ? (
                    c.serviceRequestUrl ? (
                      <a href={c.serviceRequestUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300">
                        {c.serviceRequestNumber}<ExternalLink className="w-3 h-3 flex-shrink-0" />
                      </a>
                    ) : <span className="text-[#8b8fa8]">{c.serviceRequestNumber}</span>
                  ) : "—"}
                </td>
                <td className="px-6 py-4 text-xs font-mono">
                  {c.registrationNumber ? (
                    c.registrationCertUrl ? (
                      <a href={c.registrationCertUrl} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="flex items-center gap-1 text-green-400 hover:text-green-300">
                        {c.registrationNumber}<ExternalLink className="w-3 h-3 flex-shrink-0" />
                      </a>
                    ) : <span className="text-[#8b8fa8]">{c.registrationNumber}</span>
                  ) : <span className="text-[#8b8fa8]">Pending</span>}
                </td>
                <td className="px-6 py-4 text-[#8b8fa8] text-sm">{c.filingDate ? formatDate(c.filingDate) : "—"}</td>
                <td className="px-6 py-4 text-[#8b8fa8] text-sm">{c.proName || "—"}</td>
                <td className="px-6 py-4 text-center"><div className="flex justify-center"><Check val={c.registeredWithUSCO} /></div></td>
                <td className="px-6 py-4 text-center"><div className="flex justify-center"><Check val={c.registeredWithPRO} /></div></td>
                <td className="px-6 py-4 text-center"><div className="flex justify-center"><Check val={c.registeredWithMLC} /></div></td>
                <td className="px-6 py-4 text-center"><div className="flex justify-center"><Check val={c.registeredWithSX} /></div></td>
                <td className="px-6 py-4 text-center"><div className="flex justify-center"><Check val={c.registeredWithDist} /></div></td>
                <td className="px-6 py-4">
                  <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                    <button onClick={() => handleDelete(c)} className="text-[#8b8fa8] hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={11} className="px-6 py-10 text-center text-[#8b8fa8] text-sm">No copyright records yet.</td></tr>}
          </tbody>
        </table>
      </div>

      {showForm && (() => {
      // Once a registration/case number exists the work has been filed with the
      // Copyright Office; the covered works & group title are fixed and can't be edited.
      const locked = !!(editing && editing.registrationNumber && editing.registrationNumber.trim());
      return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setShowForm(false)}>
          <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#2a2d3a]">
              <h2 className="text-white font-semibold">{editing ? "Edit Copyright" : "Register Copyright"}</h2>
              <button onClick={() => setShowForm(false)} className="text-[#8b8fa8] hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <form action={handleSubmit} className="p-6 space-y-4">
              {/* Song selection — locked once filed with the Copyright Office */}
              <div>
                <label className="block text-[#8b8fa8] text-xs mb-2">
                  Songs Covered * <span className="text-[#5a5e72]">(select one or more)</span>
                </label>
                {locked ? (
                  <>
                    <div className="bg-[#0f1117] border border-[#2a2d3a] rounded-lg p-3 space-y-1.5 max-h-40 overflow-y-auto opacity-90">
                      {songs.filter((s) => selectedSongIds.includes(s.id)).map((s) => (
                        <div key={s.id} className="flex items-center gap-2 text-sm text-white">
                          <Lock className="w-3 h-3 text-[#8b8fa8] flex-shrink-0" />{s.title}
                        </div>
                      ))}
                    </div>
                    <p className="text-amber-400/90 text-xs mt-1.5 flex items-center gap-1">
                      <Lock className="w-3 h-3" /> Covered works are locked — this registration has been filed with the Copyright Office (Reg./Case #{editing?.registrationNumber}) and its works can&apos;t be changed.
                    </p>
                  </>
                ) : (
                  <>
                    <div className="bg-[#0f1117] border border-[#2a2d3a] rounded-lg p-3 space-y-2 max-h-40 overflow-y-auto">
                      {songs.map((s) => (
                        <label key={s.id} className="flex items-center gap-2 cursor-pointer text-sm">
                          <input
                            type="checkbox"
                            checked={selectedSongIds.includes(s.id)}
                            onChange={() => toggleSong(s.id)}
                            className="accent-indigo-600"
                          />
                          <span className={selectedSongIds.includes(s.id) ? "text-white" : "text-[#8b8fa8]"}>{s.title}</span>
                        </label>
                      ))}
                    </div>
                    {selectedSongIds.length === 0 && <p className="text-red-400 text-xs mt-1">Select at least one song</p>}
                    {selectedSongIds.length > 1 && (
                      <p className="text-indigo-400 text-xs mt-1">Group registration — {selectedSongIds.length} songs selected</p>
                    )}
                  </>
                )}
              </div>

              {/* Group title (shown when multiple songs selected) */}
              {selectedSongIds.length > 1 && (
                <div>
                  <label className="block text-[#8b8fa8] text-xs mb-1.5">Group Registration Title</label>
                  <input name="groupTitle" defaultValue={editing?.groupTitle || ""} readOnly={locked} className={`${inputClass} ${locked ? "opacity-70 cursor-not-allowed" : ""}`} placeholder="e.g. Spring 2024 EP Registration" />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-[#8b8fa8] text-xs mb-1.5">Service Request #</label><input name="serviceRequestNumber" defaultValue={editing?.serviceRequestNumber || ""} className={inputClass} /></div>
                <div><label className="block text-[#8b8fa8] text-xs mb-1.5">Service Request URL</label><input name="serviceRequestUrl" type="url" defaultValue={editing?.serviceRequestUrl || ""} className={inputClass} placeholder="https://..." /></div>
                <div><label className="block text-[#8b8fa8] text-xs mb-1.5">Reg. / Certificate #</label><input name="registrationNumber" defaultValue={editing?.registrationNumber || ""} className={inputClass} /></div>
                <div><label className="block text-[#8b8fa8] text-xs mb-1.5">Certificate URL</label><input name="registrationCertUrl" type="url" defaultValue={editing?.registrationCertUrl || ""} className={inputClass} placeholder="https://..." /></div>
                <div><label className="block text-[#8b8fa8] text-xs mb-1.5">Filing Date</label><input name="filingDate" type="date" defaultValue={editing?.filingDate ? editing.filingDate.slice(0, 10) : ""} className={inputClass} /></div>
                <div><label className="block text-[#8b8fa8] text-xs mb-1.5">Claimant</label><input name="claimant" defaultValue={editing?.claimant || ""} className={inputClass} /></div>
                <div><label className="block text-[#8b8fa8] text-xs mb-1.5">PRO</label><input name="proName" defaultValue={editing?.proName || ""} className={inputClass} placeholder="ASCAP" /></div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <Toggle name="registeredWithUSCO" label="U.S. Copyright Office" checked={editing?.registeredWithUSCO} />
                <Toggle name="registeredWithPRO" label="PRO" checked={editing?.registeredWithPRO} />
                <Toggle name="registeredWithMLC" label="MLC" checked={editing?.registeredWithMLC} />
                <Toggle name="registeredWithSX" label="SoundExchange" checked={editing?.registeredWithSX} />
                <Toggle name="registeredWithDist" label="Distributor" checked={editing?.registeredWithDist} />
              </div>

              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-[#8b8fa8] hover:text-white text-sm">Cancel</button>
                <button type="submit" disabled={saving || selectedSongIds.length === 0} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-50">{saving ? "Saving..." : "Save"}</button>
              </div>
            </form>
          </div>
        </div>
      );
      })()}
    </div>
  );
}
