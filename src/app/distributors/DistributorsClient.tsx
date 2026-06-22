"use client";
import { Plus, Search, ExternalLink, Pencil, Trash2, X } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createDistributor, updateDistributor, deleteDistributor } from "./actions";

type Distributor = {
  id: string;
  name: string;
  accountId: string | null;
  email: string | null;
  website: string | null;
  notes: string | null;
  activeSongs: number;
  totalRevenue: number;
};

const inputClass =
  "w-full bg-[#0f1117] border border-[#2a2d3a] text-white px-3 py-2 rounded-lg text-sm placeholder:text-[#8b8fa8] focus:outline-none focus:border-indigo-500";

export default function DistributorsClient({ distributors }: { distributors: Distributor[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Distributor | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const filtered = distributors.filter((d) => d.name.toLowerCase().includes(search.toLowerCase()));

  async function handleSubmit(formData: FormData) {
    setSaving(true);
    if (editing) await updateDistributor(editing.id, formData);
    else await createDistributor(formData);
    setSaving(false);
    setShowForm(false);
    setEditing(null);
    router.refresh();
  }

  async function handleDelete(d: Distributor) {
    if (!confirm(`Delete "${d.name}"? Its distributions will also be removed.`)) return;
    await deleteDistributor(d.id);
    router.refresh();
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="relative">
          <Search className="w-4 h-4 text-[#8b8fa8] absolute left-3 top-1/2 -translate-y-1/2" />
          <input type="text" placeholder="Search distributors..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="bg-[#1a1d27] border border-[#2a2d3a] text-white pl-10 pr-4 py-2 rounded-lg text-sm placeholder:text-[#8b8fa8] focus:outline-none focus:border-indigo-500 w-72" />
        </div>
        <button onClick={() => { setEditing(null); setShowForm(true); }} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700">
          <Plus className="w-4 h-4" /> Add Distributor
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {filtered.map((d) => (
          <div key={d.id} className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl p-6 hover:border-indigo-500/50 transition-colors group">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-white font-semibold text-lg">{d.name}</h3>
                <p className="text-[#8b8fa8] text-sm">{d.accountId}</p>
              </div>
              <div className="flex items-center gap-2">
                {d.website && <a href={d.website} target="_blank" rel="noopener noreferrer" className="text-[#8b8fa8] hover:text-white"><ExternalLink className="w-4 h-4" /></a>}
              </div>
            </div>
            <div className="space-y-2 mb-4">
              <div className="flex justify-between"><span className="text-[#8b8fa8] text-sm">Active Songs</span><span className="text-white text-sm">{d.activeSongs}</span></div>
              <div className="flex justify-between"><span className="text-[#8b8fa8] text-sm">Total Revenue</span><span className="text-green-400 text-sm font-medium">${d.totalRevenue.toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-[#8b8fa8] text-sm">Email</span><span className="text-[#8b8fa8] text-sm">{d.email}</span></div>
            </div>
            {d.notes && <p className="text-[#8b8fa8] text-xs border-t border-[#2a2d3a] pt-3">{d.notes}</p>}
            <div className="flex gap-3 mt-3 pt-3 border-t border-[#2a2d3a] opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => { setEditing(d); setShowForm(true); }} className="flex items-center gap-1 text-xs text-[#8b8fa8] hover:text-indigo-400"><Pencil className="w-3 h-3" /> Edit</button>
              <button onClick={() => handleDelete(d)} className="flex items-center gap-1 text-xs text-[#8b8fa8] hover:text-red-400"><Trash2 className="w-3 h-3" /> Delete</button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <div className="col-span-full text-center text-[#8b8fa8] text-sm py-10">No distributors yet.</div>}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setShowForm(false)}>
          <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#2a2d3a]">
              <h2 className="text-white font-semibold">{editing ? "Edit Distributor" : "Add Distributor"}</h2>
              <button onClick={() => setShowForm(false)} className="text-[#8b8fa8] hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <form action={handleSubmit} className="p-6 space-y-4">
              <Field label="Name *"><input name="name" required defaultValue={editing?.name || ""} className={inputClass} placeholder="DistroKid" /></Field>
              <Field label="Account ID"><input name="accountId" defaultValue={editing?.accountId || ""} className={inputClass} /></Field>
              <Field label="Email"><input name="email" defaultValue={editing?.email || ""} className={inputClass} /></Field>
              <Field label="Website"><input name="website" defaultValue={editing?.website || ""} className={inputClass} placeholder="https://" /></Field>
              <Field label="Notes"><textarea name="notes" defaultValue={editing?.notes || ""} className={inputClass} rows={3} /></Field>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-[#8b8fa8] hover:text-white text-sm">Cancel</button>
                <button type="submit" disabled={saving} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-50">{saving ? "Saving..." : editing ? "Save Changes" : "Add Distributor"}</button>
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
