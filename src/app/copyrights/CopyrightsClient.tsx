"use client";
import { Plus, Search, CheckCircle, XCircle, Pencil, Trash2, X } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createCopyright, updateCopyright, deleteCopyright } from "./actions";

type Copyright = {
  id: string;
  songId: string;
  song: { id: string; title: string } | null;
  registrationNumber: string | null;
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

const inputClass =
  "w-full bg-[#0f1117] border border-[#2a2d3a] text-white px-3 py-2 rounded-lg text-sm placeholder:text-[#8b8fa8] focus:outline-none focus:border-indigo-500";

export default function CopyrightsClient({ copyrights, songs }: { copyrights: Copyright[]; songs: SongOpt[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Copyright | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const Check = ({ val }: { val: boolean }) => (val ? <CheckCircle className="w-4 h-4 text-green-400" /> : <XCircle className="w-4 h-4 text-[#8b8fa8]" />);

  const filtered = copyrights.filter((c) => (c.song?.title || "").toLowerCase().includes(search.toLowerCase()));

  async function handleSubmit(formData: FormData) {
    setSaving(true);
    if (editing) await updateCopyright(editing.id, formData);
    else await createCopyright(formData);
    setSaving(false);
    setShowForm(false);
    setEditing(null);
    router.refresh();
  }
  async function handleDelete(c: Copyright) {
    if (!confirm(`Delete copyright record for "${c.song?.title}"?`)) return;
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
        <button onClick={() => { setEditing(null); setShowForm(true); }} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700">
          <Plus className="w-4 h-4" /> Register Copyright
        </button>
      </div>
      <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="text-[#8b8fa8] text-sm border-b border-[#2a2d3a] bg-[#161820]">
              <th className="text-left px-6 py-4">Song</th>
              <th className="text-left px-6 py-4">Reg. Number</th>
              <th className="text-left px-6 py-4">Filing Date</th>
              <th className="text-left px-6 py-4">PRO</th>
              <th className="text-center px-6 py-4">USCO</th>
              <th className="text-center px-6 py-4">PRO</th>
              <th className="text-center px-6 py-4">MLC</th>
              <th className="text-center px-6 py-4">SoundEx</th>
              <th className="text-center px-6 py-4">Dist</th>
              <th className="text-center px-6 py-4"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.id} className="border-b border-[#2a2d3a] last:border-0 hover:bg-[#2a2d3a]/40 transition-colors group">
                <td className="px-6 py-4 text-white font-medium">{c.song?.title || "—"}</td>
                <td className="px-6 py-4 text-[#8b8fa8] text-xs font-mono">{c.registrationNumber || "Pending"}</td>
                <td className="px-6 py-4 text-[#8b8fa8] text-sm">{c.filingDate ? new Date(c.filingDate).toLocaleDateString() : "—"}</td>
                <td className="px-6 py-4 text-[#8b8fa8] text-sm">{c.proName || "—"}</td>
                <td className="px-6 py-4 text-center"><div className="flex justify-center"><Check val={c.registeredWithUSCO} /></div></td>
                <td className="px-6 py-4 text-center"><div className="flex justify-center"><Check val={c.registeredWithPRO} /></div></td>
                <td className="px-6 py-4 text-center"><div className="flex justify-center"><Check val={c.registeredWithMLC} /></div></td>
                <td className="px-6 py-4 text-center"><div className="flex justify-center"><Check val={c.registeredWithSX} /></div></td>
                <td className="px-6 py-4 text-center"><div className="flex justify-center"><Check val={c.registeredWithDist} /></div></td>
                <td className="px-6 py-4">
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => { setEditing(c); setShowForm(true); }} className="text-[#8b8fa8] hover:text-indigo-400"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(c)} className="text-[#8b8fa8] hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={10} className="px-6 py-10 text-center text-[#8b8fa8] text-sm">No copyright records yet.</td></tr>}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setShowForm(false)}>
          <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#2a2d3a]">
              <h2 className="text-white font-semibold">{editing ? "Edit Copyright" : "Register Copyright"}</h2>
              <button onClick={() => setShowForm(false)} className="text-[#8b8fa8] hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <form action={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-[#8b8fa8] text-xs mb-1.5">Song *</label>
                <select name="songId" required defaultValue={editing?.songId || ""} className={inputClass}>
                  <option value="">Select a song…</option>
                  {songs.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-[#8b8fa8] text-xs mb-1.5">Reg. Number</label><input name="registrationNumber" defaultValue={editing?.registrationNumber || ""} className={inputClass} /></div>
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
                <button type="submit" disabled={saving} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-50">{saving ? "Saving..." : "Save"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
