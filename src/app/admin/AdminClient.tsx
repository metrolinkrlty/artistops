"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, X, Shield, User, ChevronDown, ChevronUp } from "lucide-react";
import { createUser, updateUser, deleteUser } from "./actions";

type UserRow = {
  id: string; email: string; artistName: string; isAdmin: boolean;
  createdAt: string; songs: number; totalRevenue: number;
};

const inputClass = "w-full bg-[#0f1117] border border-[#2a2d3a] text-white px-3 py-2 rounded-lg text-sm placeholder:text-[#8b8fa8] focus:outline-none focus:border-indigo-500";

export default function AdminClient({ users, currentUserId }: { users: UserRow[]; currentUserId: string }) {
  const router = useRouter();
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<UserRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  async function handleCreate(formData: FormData) {
    setSaving(true); setError("");
    const res = await createUser(formData);
    setSaving(false);
    if (res?.error) { setError(res.error); return; }
    setShowCreate(false); router.refresh();
  }

  async function handleUpdate(formData: FormData) {
    if (!editing) return;
    setSaving(true); setError("");
    await updateUser(editing.id, formData);
    setSaving(false); setEditing(null); router.refresh();
  }

  async function handleDelete(u: UserRow) {
    if (!confirm(`Delete "${u.artistName}" (${u.email})? This permanently deletes all their data.`)) return;
    await deleteUser(u.id); router.refresh();
  }

  const totalRevenue = users.reduce((s, u) => s + u.totalRevenue, 0);

  return (
    <div className="p-8 space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl p-4">
          <p className="text-[#8b8fa8] text-sm">Total Users</p>
          <p className="text-white text-2xl font-bold mt-1">{users.length}</p>
        </div>
        <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl p-4">
          <p className="text-[#8b8fa8] text-sm">Admins</p>
          <p className="text-white text-2xl font-bold mt-1">{users.filter(u => u.isAdmin).length}</p>
        </div>
        <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl p-4">
          <p className="text-[#8b8fa8] text-sm">Total Revenue Tracked</p>
          <p className="text-white text-2xl font-bold mt-1">${totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
        </div>
      </div>

      {/* Header row */}
      <div className="flex items-center justify-between">
        <h2 className="text-white font-semibold">All Accounts ({users.length})</h2>
        <button onClick={() => { setShowCreate(true); setError(""); }} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700">
          <Plus className="w-4 h-4" /> Create Account
        </button>
      </div>

      {/* User table */}
      <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="text-[#8b8fa8] text-sm border-b border-[#2a2d3a] bg-[#161820]">
              <th className="text-left px-6 py-4">Artist</th>
              <th className="text-left px-6 py-4">Email</th>
              <th className="text-left px-6 py-4">Role</th>
              <th className="text-right px-6 py-4">Songs</th>
              <th className="text-right px-6 py-4">Revenue</th>
              <th className="text-left px-6 py-4">Joined</th>
              <th className="px-6 py-4"></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <>
                <tr key={u.id} className="border-b border-[#2a2d3a] last:border-0 hover:bg-[#2a2d3a]/40 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold">
                        {u.artistName.trim().split(/\s+/).map(w => w[0]).slice(0, 2).join("").toUpperCase()}
                      </div>
                      <span className="text-white font-medium">{u.artistName}</span>
                      {u.id === currentUserId && <span className="text-xs bg-indigo-500/20 text-indigo-400 px-1.5 py-0.5 rounded">You</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-[#8b8fa8] text-sm">{u.email}</td>
                  <td className="px-6 py-4">
                    {u.isAdmin
                      ? <span className="flex items-center gap-1 text-amber-400 text-xs"><Shield className="w-3 h-3" /> Admin</span>
                      : <span className="flex items-center gap-1 text-[#8b8fa8] text-xs"><User className="w-3 h-3" /> Artist</span>}
                  </td>
                  <td className="px-6 py-4 text-right text-[#8b8fa8] text-sm">{u.songs}</td>
                  <td className="px-6 py-4 text-right text-green-400 text-sm">${u.totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                  <td className="px-6 py-4 text-[#8b8fa8] text-sm">{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => setExpandedId(expandedId === u.id ? null : u.id)} className="text-[#8b8fa8] hover:text-white" title="Details">
                        {expandedId === u.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                      <button onClick={() => { setEditing(u); setError(""); }} className="text-[#8b8fa8] hover:text-indigo-400" title="Edit"><Pencil className="w-4 h-4" /></button>
                      {u.id !== currentUserId && (
                        <button onClick={() => handleDelete(u)} className="text-[#8b8fa8] hover:text-red-400" title="Delete"><Trash2 className="w-4 h-4" /></button>
                      )}
                    </div>
                  </td>
                </tr>
                {expandedId === u.id && (
                  <tr key={u.id + "-exp"} className="border-b border-[#2a2d3a] bg-[#161820]">
                    <td colSpan={7} className="px-6 py-4">
                      <div className="grid grid-cols-4 gap-4 text-sm">
                        <div><p className="text-[#8b8fa8]">User ID</p><p className="text-white font-mono text-xs">{u.id}</p></div>
                        <div><p className="text-[#8b8fa8]">Songs in catalog</p><p className="text-white">{u.songs}</p></div>
                        <div><p className="text-[#8b8fa8]">Total revenue tracked</p><p className="text-green-400">${u.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p></div>
                        <div><p className="text-[#8b8fa8]">Account type</p><p className={u.isAdmin ? "text-amber-400" : "text-white"}>{u.isAdmin ? "Administrator" : "Artist"}</p></div>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
            {users.length === 0 && (
              <tr><td colSpan={7} className="px-6 py-10 text-center text-[#8b8fa8] text-sm">No users yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Create modal */}
      {showCreate && (
        <Modal title="Create Account" onClose={() => setShowCreate(false)}>
          <form action={handleCreate} className="space-y-4">
            <Field label="Artist / Band Name *"><input name="artistName" required className={inputClass} placeholder="Luna Ray" /></Field>
            <Field label="Email *"><input name="email" type="email" required className={inputClass} placeholder="artist@email.com" /></Field>
            <Field label="Password *"><input name="password" type="password" required className={inputClass} placeholder="Min 6 characters" /></Field>
            <label className="flex items-center gap-2 text-sm text-[#8b8fa8] cursor-pointer">
              <input type="checkbox" name="isAdmin" className="accent-indigo-600" />
              Grant administrator access
            </label>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 text-[#8b8fa8] hover:text-white text-sm">Cancel</button>
              <button type="submit" disabled={saving} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-50">{saving ? "Creating…" : "Create Account"}</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit modal */}
      {editing && (
        <Modal title={`Edit — ${editing.artistName}`} onClose={() => setEditing(null)}>
          <form action={handleUpdate} className="space-y-4">
            <Field label="Artist / Band Name"><input name="artistName" defaultValue={editing.artistName} className={inputClass} /></Field>
            <Field label="Email"><input name="email" type="email" defaultValue={editing.email} className={inputClass} /></Field>
            <Field label="New Password (leave blank to keep current)"><input name="newPassword" type="password" className={inputClass} placeholder="Leave blank to keep" /></Field>
            <label className="flex items-center gap-2 text-sm text-[#8b8fa8] cursor-pointer">
              <input type="checkbox" name="isAdmin" defaultChecked={editing.isAdmin} className="accent-indigo-600" />
              Administrator access
            </label>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setEditing(null)} className="px-4 py-2 text-[#8b8fa8] hover:text-white text-sm">Cancel</button>
              <button type="submit" disabled={saving} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-50">{saving ? "Saving…" : "Save Changes"}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2a2d3a]">
          <h2 className="text-white font-semibold">{title}</h2>
          <button onClick={onClose} className="text-[#8b8fa8] hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6">{children}</div>
      </div>
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
