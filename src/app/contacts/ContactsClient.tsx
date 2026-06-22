"use client";
import { Plus, Search, Mail, Phone, ExternalLink, Pencil, Trash2, X } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createContact, updateContact, deleteContact } from "./actions";

const roleColors: Record<string, string> = {
  producer: "bg-blue-500/20 text-blue-400",
  "co-writer": "bg-purple-500/20 text-purple-400",
  publisher: "bg-green-500/20 text-green-400",
  curator: "bg-amber-500/20 text-amber-400",
  sync_agent: "bg-indigo-500/20 text-indigo-400",
  video_creator: "bg-pink-500/20 text-pink-400",
  label: "bg-red-500/20 text-red-400",
  venue: "bg-cyan-500/20 text-cyan-400",
};

const ROLES = ["producer", "co-writer", "publisher", "curator", "sync_agent", "video_creator", "label", "venue"];

type Contact = {
  id: string;
  name: string;
  role: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  website: string | null;
  notes: string | null;
  tags: string[];
};

const inputClass =
  "w-full bg-[#0f1117] border border-[#2a2d3a] text-white px-3 py-2 rounded-lg text-sm placeholder:text-[#8b8fa8] focus:outline-none focus:border-indigo-500";

export default function ContactsClient({ contacts }: { contacts: Contact[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Contact | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const filtered = contacts.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.role.toLowerCase().includes(search.toLowerCase()) ||
      (c.company || "").toLowerCase().includes(search.toLowerCase())
  );

  async function handleSubmit(formData: FormData) {
    setSaving(true);
    if (editing) await updateContact(editing.id, formData);
    else await createContact(formData);
    setSaving(false);
    setShowForm(false);
    setEditing(null);
    router.refresh();
  }

  async function handleDelete(c: Contact) {
    if (!confirm(`Delete contact "${c.name}"?`)) return;
    await deleteContact(c.id);
    router.refresh();
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="relative">
          <Search className="w-4 h-4 text-[#8b8fa8] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search contacts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-[#1a1d27] border border-[#2a2d3a] text-white pl-10 pr-4 py-2 rounded-lg text-sm placeholder:text-[#8b8fa8] focus:outline-none focus:border-indigo-500 w-72"
          />
        </div>
        <button onClick={() => { setEditing(null); setShowForm(true); }} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700">
          <Plus className="w-4 h-4" /> Add Contact
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((c) => (
          <div key={c.id} className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl p-5 hover:border-indigo-500/50 transition-colors group">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-white font-semibold">{c.name}</h3>
                {c.company && <p className="text-[#8b8fa8] text-sm">{c.company}</p>}
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded text-xs font-medium ${roleColors[c.role] || "bg-gray-500/20 text-gray-400"}`}>
                  {c.role.replace("_", " ")}
                </span>
              </div>
            </div>
            <div className="space-y-1 mb-3">
              {c.email && (
                <div className="flex items-center gap-2 text-[#8b8fa8] text-sm"><Mail className="w-3 h-3" /><span>{c.email}</span></div>
              )}
              {c.phone && (
                <div className="flex items-center gap-2 text-[#8b8fa8] text-sm"><Phone className="w-3 h-3" /><span>{c.phone}</span></div>
              )}
              {c.website && (
                <div className="flex items-center gap-2 text-[#8b8fa8] text-sm"><ExternalLink className="w-3 h-3" /><a href={c.website} target="_blank" className="hover:text-white">{c.website.replace("https://", "")}</a></div>
              )}
            </div>
            {c.notes && <p className="text-[#8b8fa8] text-xs border-t border-[#2a2d3a] pt-2">{c.notes}</p>}
            {c.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {c.tags.map((t) => <span key={t} className="text-xs bg-[#2a2d3a] text-[#8b8fa8] px-2 py-0.5 rounded">{t}</span>)}
              </div>
            )}
            <div className="flex gap-2 mt-3 pt-3 border-t border-[#2a2d3a] opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => { setEditing(c); setShowForm(true); }} className="flex items-center gap-1 text-xs text-[#8b8fa8] hover:text-indigo-400"><Pencil className="w-3 h-3" /> Edit</button>
              <button onClick={() => handleDelete(c)} className="flex items-center gap-1 text-xs text-[#8b8fa8] hover:text-red-400"><Trash2 className="w-3 h-3" /> Delete</button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full text-center text-[#8b8fa8] text-sm py-10">No contacts yet. Click &ldquo;Add Contact&rdquo; to add one.</div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setShowForm(false)}>
          <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#2a2d3a]">
              <h2 className="text-white font-semibold">{editing ? "Edit Contact" : "Add Contact"}</h2>
              <button onClick={() => setShowForm(false)} className="text-[#8b8fa8] hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <form action={handleSubmit} className="p-6 grid grid-cols-2 gap-4">
              <Field label="Name *"><input name="name" required defaultValue={editing?.name || ""} className={inputClass} /></Field>
              <Field label="Role">
                <select name="role" defaultValue={editing?.role || "producer"} className={inputClass}>
                  {ROLES.map((r) => <option key={r} value={r}>{r.replace("_", " ")}</option>)}
                </select>
              </Field>
              <Field label="Email"><input name="email" type="email" defaultValue={editing?.email || ""} className={inputClass} /></Field>
              <Field label="Phone"><input name="phone" defaultValue={editing?.phone || ""} className={inputClass} /></Field>
              <Field label="Company"><input name="company" defaultValue={editing?.company || ""} className={inputClass} /></Field>
              <Field label="Website"><input name="website" defaultValue={editing?.website || ""} className={inputClass} placeholder="https://" /></Field>
              <div className="col-span-2"><Field label="Tags (comma-separated)"><input name="tags" defaultValue={editing?.tags.join(", ") || ""} className={inputClass} /></Field></div>
              <div className="col-span-2"><Field label="Notes"><textarea name="notes" defaultValue={editing?.notes || ""} className={inputClass} rows={3} /></Field></div>
              <div className="col-span-2 flex justify-end gap-3 mt-2">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-[#8b8fa8] hover:text-white text-sm">Cancel</button>
                <button type="submit" disabled={saving} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-50">{saving ? "Saving..." : editing ? "Save Changes" : "Add Contact"}</button>
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
