"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, X, Shield, User, ChevronDown, ChevronUp, Eye, CheckCircle, XCircle, Mail, MessageSquare, Send, SlidersHorizontal } from "lucide-react";

// Columns the admin can hide to reclaim space (Artist + Actions always show).
const TOGGLE_COLS = [
  { key: "email", label: "Email" },
  { key: "role", label: "Role" },
  { key: "status", label: "Status" },
  { key: "songs", label: "Songs" },
  { key: "revenue", label: "Revenue" },
  { key: "joined", label: "Joined" },
] as const;
import { createUser, updateUser, deleteUser, approveUser, rejectUser, messageUser, getUserThread, adminSendMessage, sendBlast, countBlastRecipients, updateLoginTagline, type AdminMessageView } from "./actions";

type MembershipApplicationView = {
  role: string; referredBy: string; workLink: string | null;
  goals: string[]; catalogSize: string | null; location: string | null;
};

type UserRow = {
  id: string; email: string; artistName: string; isAdmin: boolean;
  status: string; createdAt: string; songs: number; totalRevenue: number;
  application: MembershipApplicationView | null;
  unreadMessages: number;
};

const inputClass = "w-full bg-[#0f1117] border border-[#2a2d3a] text-white px-3 py-2 rounded-lg text-sm placeholder:text-[#8b8fa8] focus:outline-none focus:border-indigo-500";

const statusBadge: Record<string, string> = {
  APPROVED: "bg-green-500/20 text-green-400",
  PENDING: "bg-amber-500/20 text-amber-400",
  REJECTED: "bg-red-500/20 text-red-400",
};

export default function AdminClient({ users, currentUserId, loginTagline, defaultLoginTagline }: { users: UserRow[]; currentUserId: string; loginTagline: string; defaultLoginTagline: string }) {
  const router = useRouter();
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<UserRow | null>(null);

  // Editable sign-in page tagline.
  const [tagline, setTagline] = useState(loginTagline);
  const [savingTagline, setSavingTagline] = useState(false);
  const [taglineSaved, setTaglineSaved] = useState(false);

  async function handleSaveTagline() {
    setSavingTagline(true);
    setTaglineSaved(false);
    await updateLoginTagline(tagline);
    setSavingTagline(false);
    setTaglineSaved(true);
    router.refresh();
    setTimeout(() => setTaglineSaved(false), 2500);
  }
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [messaging, setMessaging] = useState<UserRow | null>(null);
  const [msgSubject, setMsgSubject] = useState("");
  const [msgBody, setMsgBody] = useState("");
  const [msgSent, setMsgSent] = useState(false);

  // Which columns are hidden (persisted), plus the little "Columns" menu.
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [showCols, setShowCols] = useState(false);
  useEffect(() => {
    try { const s = localStorage.getItem("admin_hidden_cols"); if (s) setHidden(new Set(JSON.parse(s))); } catch {}
  }, []);
  function toggleCol(key: string) {
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      try { localStorage.setItem("admin_hidden_cols", JSON.stringify([...next])); } catch {}
      return next;
    });
  }
  const visibleColCount = 2 + TOGGLE_COLS.filter((c) => !hidden.has(c.key)).length;

  function openMessage(u: UserRow) {
    setMessaging(u);
    setMsgSubject("A quick question about your ArtistOps request");
    setMsgBody("");
    setMsgSent(false);
    setError("");
  }

  async function handleSendMessage() {
    if (!messaging) return;
    setSaving(true); setError("");
    const res = await messageUser(messaging.id, msgSubject, msgBody);
    setSaving(false);
    if (!res.ok) { setError(res.error || "Couldn't send."); return; }
    setMsgSent(true);
  }

  // In-app thread (approved artists)
  const [thread, setThread] = useState<UserRow | null>(null);
  const [threadMsgs, setThreadMsgs] = useState<AdminMessageView[]>([]);
  const [threadBody, setThreadBody] = useState("");
  const [threadLoading, setThreadLoading] = useState(false);

  async function openThread(u: UserRow) {
    setThread(u);
    setThreadBody("");
    setError("");
    setThreadLoading(true);
    const msgs = await getUserThread(u.id);
    setThreadMsgs(msgs);
    setThreadLoading(false);
  }

  async function handleThreadSend() {
    if (!thread) return;
    const text = threadBody.trim();
    if (!text) return;
    setSaving(true); setError("");
    const res = await adminSendMessage(thread.id, text);
    setSaving(false);
    if (!res.ok) { setError(res.error || "Couldn't send."); return; }
    setThreadMsgs((m) => [...m, { id: `tmp-${Date.now()}`, fromAdmin: true, body: text, createdAt: new Date().toISOString() }]);
    setThreadBody("");
  }

  // Blast email
  const [blastOpen, setBlastOpen] = useState(false);
  const [blastScope, setBlastScope] = useState("artists");
  const [blastSubject, setBlastSubject] = useState("");
  const [blastBody, setBlastBody] = useState("");
  const [blastCount, setBlastCount] = useState<number | null>(null);
  const [blastResult, setBlastResult] = useState<string | null>(null);

  function openBlast() {
    setBlastOpen(true);
    setBlastScope("artists");
    setBlastSubject("");
    setBlastBody("");
    setBlastResult(null);
    setError("");
    countBlastRecipients("artists").then(setBlastCount).catch(() => setBlastCount(null));
  }

  function changeBlastScope(scope: string) {
    setBlastScope(scope);
    setBlastCount(null);
    countBlastRecipients(scope).then(setBlastCount).catch(() => setBlastCount(null));
  }

  async function handleBlastSend() {
    if (!blastSubject.trim() || !blastBody.trim()) { setError("Add a subject and message."); return; }
    if (!confirm(`Send this email to ${blastCount ?? "the selected"} recipient(s)?`)) return;
    setSaving(true); setError("");
    const res = await sendBlast(blastSubject, blastBody, blastScope);
    setSaving(false);
    if (!res.ok) { setError(res.error || "Couldn't send."); return; }
    setBlastResult(`Sent to ${res.sent} recipient${res.sent === 1 ? "" : "s"}${res.failed ? `, ${res.failed} failed` : ""}.`);
  }

  const pending = users.filter(u => u.status === "PENDING");
  const approved = users.filter(u => u.status !== "PENDING");
  const totalRevenue = users.reduce((s, u) => s + u.totalRevenue, 0);

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

  async function handleApprove(u: UserRow) {
    await approveUser(u.id); router.refresh();
  }

  async function handleReject(u: UserRow) {
    if (!confirm(`Reject "${u.artistName}"? They will not be able to access the app.`)) return;
    await rejectUser(u.id); router.refresh();
  }

  async function handleViewAs(u: UserRow) {
    await fetch("/api/admin/impersonate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: u.id }),
    });
    // Full-page load so the server re-renders "/" with the new impersonation
    // cookie — a soft router.push serves the stale admin-time RSC cache (sidebar
    // only, empty body until a manual refresh).
    window.location.href = "/";
  }

  return (
    <div className="p-8 space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl p-4"><p className="text-[#8b8fa8] text-sm">Total Users</p><p className="text-white text-2xl font-bold mt-1">{users.length}</p></div>
        <div className="bg-[#1a1d27] border border-amber-500/30 rounded-xl p-4"><p className="text-[#8b8fa8] text-sm">Pending Approval</p><p className="text-amber-400 text-2xl font-bold mt-1">{pending.length}</p></div>
        <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl p-4"><p className="text-[#8b8fa8] text-sm">Approved Artists</p><p className="text-white text-2xl font-bold mt-1">{users.filter(u => u.status === "APPROVED" && !u.isAdmin).length}</p></div>
        <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl p-4"><p className="text-[#8b8fa8] text-sm">Total Revenue Tracked</p><p className="text-white text-2xl font-bold mt-1">${totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p></div>
      </div>

      {/* Sign-in page tagline (public copy) */}
      <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl p-5">
        <div className="flex items-center gap-2 mb-1">
          <SlidersHorizontal className="w-4 h-4 text-indigo-400" />
          <h2 className="text-white font-semibold">Sign-in page tagline</h2>
        </div>
        <p className="text-[#8b8fa8] text-xs mb-3">The paragraph shown under the sign-in box on the public <span className="text-[#c7cad8]">/login</span> page. Changes go live immediately.</p>
        <textarea
          value={tagline}
          onChange={(e) => { setTagline(e.target.value); setTaglineSaved(false); }}
          rows={4}
          className={`${inputClass} leading-relaxed resize-y`}
          placeholder="Leave blank to reset to the default tagline."
        />
        <div className="flex items-center gap-3 mt-3">
          <button
            onClick={handleSaveTagline}
            disabled={savingTagline || tagline === loginTagline}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {savingTagline ? "Saving…" : "Save tagline"}
          </button>
          <button
            onClick={() => setTagline(defaultLoginTagline)}
            type="button"
            className="text-[#8b8fa8] text-sm hover:text-white"
          >
            Reset to default
          </button>
          {taglineSaved && <span className="text-green-400 text-sm">Saved — live on /login</span>}
          <span className="ml-auto text-[#5a5e72] text-xs">{tagline.length} chars</span>
        </div>
      </div>

      {/* Pending approvals */}
      {pending.length > 0 && (
        <div>
          <h2 className="text-amber-400 font-semibold mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            Pending Approval ({pending.length})
          </h2>
          <div className="space-y-2">
            {pending.map(u => (
              <div key={u.id} className="bg-amber-500/5 border border-amber-500/30 rounded-xl px-5 py-4 flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">{u.artistName}</p>
                  <p className="text-[#8b8fa8] text-sm">{u.email} · Signed up {new Date(u.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openMessage(u)} className="flex items-center gap-1 px-3 py-1.5 border border-[#2a2d3a] text-[#8b8fa8] hover:text-white rounded-lg text-xs"><Mail className="w-3 h-3" /> Message</button>
                  <button onClick={() => handleApprove(u)} className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs hover:bg-green-700"><CheckCircle className="w-3 h-3" /> Approve</button>
                  <button onClick={() => handleReject(u)} className="flex items-center gap-1 px-3 py-1.5 bg-red-600/20 text-red-400 border border-red-600/30 rounded-lg text-xs hover:bg-red-600/40"><XCircle className="w-3 h-3" /> Reject</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All accounts */}
      <div className="flex items-center justify-between">
        <h2 className="text-white font-semibold">All Accounts ({users.length})</h2>
        <div className="flex items-center gap-2">
          <div className="relative">
            <button onClick={() => setShowCols((v) => !v)} className="flex items-center gap-2 px-4 py-2 border border-[#2a2d3a] text-[#c7cad8] rounded-lg text-sm hover:text-white hover:border-indigo-500" title="Show or hide columns to free up space">
              <SlidersHorizontal className="w-4 h-4" /> Columns
            </button>
            {showCols && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowCols(false)} />
                <div className="absolute right-0 z-20 mt-1 w-44 rounded-lg border border-[#2a2d3a] bg-[#1a1d27] p-1.5 shadow-xl">
                  {TOGGLE_COLS.map((c) => (
                    <label key={c.key} className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm text-[#c7cad8] hover:bg-[#2a2d3a]">
                      <input type="checkbox" checked={!hidden.has(c.key)} onChange={() => toggleCol(c.key)} className="accent-indigo-500" />
                      {c.label}
                    </label>
                  ))}
                </div>
              </>
            )}
          </div>
          <button onClick={openBlast} className="flex items-center gap-2 px-4 py-2 border border-[#2a2d3a] text-[#c7cad8] rounded-lg text-sm hover:text-white hover:border-indigo-500">
            <Mail className="w-4 h-4" /> Email members
          </button>
          <button onClick={() => { setShowCreate(true); setError(""); }} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700">
            <Plus className="w-4 h-4" /> Create Account
          </button>
        </div>
      </div>

      <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-[#8b8fa8] text-sm border-b border-[#2a2d3a] bg-[#161820]">
              <th className="text-left px-6 py-4">Artist</th>
              {!hidden.has("email") && <th className="text-left px-6 py-4">Email</th>}
              {!hidden.has("role") && <th className="text-left px-6 py-4">Role</th>}
              {!hidden.has("status") && <th className="text-left px-6 py-4">Status</th>}
              {!hidden.has("songs") && <th className="text-right px-6 py-4">Songs</th>}
              {!hidden.has("revenue") && <th className="text-right px-6 py-4">Revenue</th>}
              {!hidden.has("joined") && <th className="text-left px-6 py-4">Joined</th>}
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
                      {!u.isAdmin && u.status === "APPROVED" ? (
                        <button onClick={() => handleViewAs(u)} title="View as this artist" className="text-left text-white font-medium transition-colors hover:text-indigo-400 hover:underline">{u.artistName}</button>
                      ) : (
                        <span className="text-white font-medium">{u.artistName}</span>
                      )}
                      {u.id === currentUserId && <span className="text-xs bg-indigo-500/20 text-indigo-400 px-1.5 py-0.5 rounded">You</span>}
                      {u.unreadMessages > 0 && (
                        <button onClick={() => openThread(u)} className="inline-flex items-center gap-1 text-xs bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded hover:bg-red-500/30" title="Unread messages">
                          <MessageSquare className="w-3 h-3" /> {u.unreadMessages}
                        </button>
                      )}
                    </div>
                  </td>
                  {!hidden.has("email") && <td className="px-6 py-4 text-[#8b8fa8] text-sm">{u.email}</td>}
                  {!hidden.has("role") && (
                    <td className="px-6 py-4">
                      {u.isAdmin
                        ? <span className="flex items-center gap-1 text-amber-400 text-xs"><Shield className="w-3 h-3" /> Admin</span>
                        : <span className="flex items-center gap-1 text-[#8b8fa8] text-xs"><User className="w-3 h-3" /> Artist</span>}
                    </td>
                  )}
                  {!hidden.has("status") && (
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${statusBadge[u.status] || "bg-gray-500/20 text-gray-400"}`}>{u.status}</span>
                    </td>
                  )}
                  {!hidden.has("songs") && <td className="px-6 py-4 text-right text-[#8b8fa8] text-sm">{u.songs}</td>}
                  {!hidden.has("revenue") && <td className="px-6 py-4 text-right text-green-400 text-sm">${u.totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>}
                  {!hidden.has("joined") && <td className="px-6 py-4 text-[#8b8fa8] text-sm">{new Date(u.createdAt).toLocaleDateString()}</td>}
                  <td className="px-6 py-4">
                    <div className="flex gap-1.5">
                      <button onClick={() => setExpandedId(expandedId === u.id ? null : u.id)} className="p-2 rounded-lg text-[#8b8fa8] hover:bg-[#2a2d3a] hover:text-white transition-colors" title="Details">
                        {expandedId === u.id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </button>
                      {!u.isAdmin && u.status === "APPROVED" && (
                        <button onClick={() => openThread(u)} className="relative p-2 rounded-lg text-[#8b8fa8] hover:bg-[#2a2d3a] hover:text-indigo-400 transition-colors" title="Messages">
                          <MessageSquare className="w-5 h-5" />
                          {u.unreadMessages > 0 && (
                            <span className="absolute top-0.5 right-0.5 min-w-[14px] h-[14px] px-1 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">{u.unreadMessages}</span>
                          )}
                        </button>
                      )}
                      {!u.isAdmin && u.status === "APPROVED" && (
                        <button onClick={() => handleViewAs(u)} className="p-2 rounded-lg text-[#8b8fa8] hover:bg-[#2a2d3a] hover:text-indigo-400 transition-colors" title="View as this artist"><Eye className="w-5 h-5" /></button>
                      )}
                      <button onClick={() => { setEditing(u); setError(""); }} className="p-2 rounded-lg text-[#8b8fa8] hover:bg-[#2a2d3a] hover:text-indigo-400 transition-colors" title="Edit"><Pencil className="w-5 h-5" /></button>
                      {u.id !== currentUserId && (
                        <button onClick={() => handleDelete(u)} className="p-2 rounded-lg text-[#8b8fa8] hover:bg-[#2a2d3a] hover:text-red-400 transition-colors" title="Delete"><Trash2 className="w-5 h-5" /></button>
                      )}
                    </div>
                  </td>
                </tr>
                {expandedId === u.id && (
                  <tr key={u.id + "-exp"} className="border-b border-[#2a2d3a] bg-[#161820]">
                    <td colSpan={visibleColCount} className="px-6 py-4">
                      <div className="grid grid-cols-4 gap-4 text-sm">
                        <div><p className="text-[#8b8fa8]">User ID</p><p className="text-white font-mono text-xs">{u.id}</p></div>
                        <div><p className="text-[#8b8fa8]">Songs in catalog</p><p className="text-white">{u.songs}</p></div>
                        <div><p className="text-[#8b8fa8]">Total revenue tracked</p><p className="text-green-400">${u.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p></div>
                        <div><p className="text-[#8b8fa8]">Account status</p><p className={statusBadge[u.status] ? `text-${u.status === "APPROVED" ? "green" : u.status === "PENDING" ? "amber" : "red"}-400` : "text-white"}>{u.status}</p></div>
                      </div>

                      {/* Signup questionnaire — the context for approving this account */}
                      <div className="mt-4 pt-4 border-t border-[#2a2d3a]">
                        <p className="text-[#8b8fa8] text-xs uppercase tracking-wide mb-3">Signup questionnaire</p>
                        {u.application ? (
                          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                            <div><p className="text-[#8b8fa8]">Role</p><p className="text-white">{u.application.role}</p></div>
                            <div><p className="text-[#8b8fa8]">Referred by</p><p className="text-white">{u.application.referredBy}</p></div>
                            <div>
                              <p className="text-[#8b8fa8]">Music / work link</p>
                              {u.application.workLink ? (
                                <a href={u.application.workLink} target="_blank" rel="noreferrer" className="text-indigo-400 hover:underline break-all">{u.application.workLink}</a>
                              ) : <p className="text-[#5a5e72]">—</p>}
                            </div>
                            <div><p className="text-[#8b8fa8]">Catalog size</p><p className="text-white">{u.application.catalogSize || "—"}</p></div>
                            <div><p className="text-[#8b8fa8]">Based in</p><p className="text-white">{u.application.location || "—"}</p></div>
                            <div>
                              <p className="text-[#8b8fa8]">Wants help with</p>
                              {u.application.goals.length ? (
                                <p className="text-white">{u.application.goals.join(", ")}</p>
                              ) : <p className="text-[#5a5e72]">—</p>}
                            </div>
                          </div>
                        ) : (
                          <p className="text-[#5a5e72] text-sm">No questionnaire on file — this account was created before the questionnaire, or by an admin.</p>
                        )}
                      </div>

                      {!u.isAdmin && u.status === "APPROVED" && (
                        <button onClick={() => handleViewAs(u)} className="mt-3 flex items-center gap-2 px-3 py-1.5 bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 rounded-lg text-xs hover:bg-indigo-600/40">
                          <Eye className="w-3 h-3" /> View and edit this artist&apos;s full dashboard
                        </button>
                      )}
                    </td>
                  </tr>
                )}
              </>
            ))}
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
            <p className="text-[#8b8fa8] text-xs">Accounts created here are auto-approved.</p>
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
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm text-[#8b8fa8] cursor-pointer">
                <input type="checkbox" name="isAdmin" defaultChecked={editing.isAdmin} className="accent-indigo-600" />
                Administrator access
              </label>
            </div>
            <div>
              <label className="block text-[#8b8fa8] text-xs mb-1.5">Account Status</label>
              <select name="status" defaultValue={editing.status} className={inputClass}>
                <option value="APPROVED">APPROVED</option>
                <option value="PENDING">PENDING</option>
                <option value="REJECTED">REJECTED</option>
              </select>
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setEditing(null)} className="px-4 py-2 text-[#8b8fa8] hover:text-white text-sm">Cancel</button>
              <button type="submit" disabled={saving} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-50">{saving ? "Saving…" : "Save Changes"}</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Message applicant modal */}
      {messaging && (
        <Modal title={`Message ${messaging.artistName}`} onClose={() => setMessaging(null)}>
          {msgSent ? (
            <div className="text-center py-4">
              <div className="w-12 h-12 rounded-full bg-green-500/15 flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="w-6 h-6 text-green-400" />
              </div>
              <p className="text-white font-medium">Message sent to {messaging.email}</p>
              <p className="text-[#8b8fa8] text-sm mt-1">Their reply comes back to your admin inbox.</p>
              <button onClick={() => setMessaging(null)} className="mt-5 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700">Done</button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-[#8b8fa8] text-sm">
                Sends an email to <span className="text-white">{messaging.email}</span>. Replies come back to your admin inbox — handy for asking a pending applicant who referred them before you approve.
              </p>
              <Field label="Subject">
                <input value={msgSubject} onChange={(e) => setMsgSubject(e.target.value)} className={inputClass} />
              </Field>
              <Field label="Message">
                <textarea value={msgBody} onChange={(e) => setMsgBody(e.target.value)} rows={5} placeholder={`Hi ${messaging.artistName},\n\n`} className={`${inputClass} resize-y`} />
              </Field>
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <div className="flex gap-2">
                <button onClick={handleSendMessage} disabled={saving} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-50">{saving ? "Sending…" : "Send message"}</button>
                <button onClick={() => setMessaging(null)} className="px-4 py-2 text-[#8b8fa8] hover:text-white text-sm">Cancel</button>
              </div>
            </div>
          )}
        </Modal>
      )}

      {/* Blast email modal */}
      {blastOpen && (
        <Modal title="Email members" onClose={() => setBlastOpen(false)}>
          {blastResult ? (
            <div className="text-center py-4">
              <div className="w-12 h-12 rounded-full bg-green-500/15 flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="w-6 h-6 text-green-400" />
              </div>
              <p className="text-white font-medium">{blastResult}</p>
              <p className="text-[#8b8fa8] text-sm mt-1">Replies come back to your admin inbox.</p>
              <button onClick={() => setBlastOpen(false)} className="mt-5 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700">Done</button>
            </div>
          ) : (
            <div className="space-y-4">
              <Field label="Send to">
                <select value={blastScope} onChange={(e) => changeBlastScope(e.target.value)} className={inputClass}>
                  <option value="artists">Approved artists</option>
                  <option value="approved">All approved members (incl. admins)</option>
                  <option value="everyone">Everyone (incl. pending)</option>
                </select>
              </Field>
              <p className="text-[#8b8fa8] text-sm -mt-2">
                {blastCount === null ? "Counting recipients…" : `${blastCount} recipient${blastCount === 1 ? "" : "s"}. Each gets their own email; replies go to you.`}
              </p>
              <Field label="Subject"><input value={blastSubject} onChange={(e) => setBlastSubject(e.target.value)} className={inputClass} placeholder="A quick update from ArtistOps" /></Field>
              <Field label="Message"><textarea value={blastBody} onChange={(e) => setBlastBody(e.target.value)} rows={6} className={`${inputClass} resize-y`} placeholder="Write your announcement…" /></Field>
              <p className="text-[#5a5e72] text-xs">Sent one at a time to stay within mail-server limits — a large list may take a moment. For big blasts later, a dedicated email service is more reliable.</p>
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <div className="flex gap-2">
                <button onClick={handleBlastSend} disabled={saving} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-50">{saving ? "Sending…" : `Send${blastCount ? ` to ${blastCount}` : ""}`}</button>
                <button onClick={() => setBlastOpen(false)} className="px-4 py-2 text-[#8b8fa8] hover:text-white text-sm">Cancel</button>
              </div>
            </div>
          )}
        </Modal>
      )}

      {/* In-app thread with an approved artist */}
      {thread && (
        <Modal title={`Messages with ${thread.artistName}`} onClose={() => setThread(null)}>
          <div className="flex flex-col" style={{ minHeight: "18rem" }}>
            <div className="flex-1 space-y-2.5 overflow-y-auto mb-3" style={{ maxHeight: "50vh" }}>
              {threadLoading ? (
                <p className="text-[#8b8fa8] text-sm text-center py-8">Loading…</p>
              ) : threadMsgs.length === 0 ? (
                <p className="text-[#8b8fa8] text-sm text-center py-8">No messages yet. Start the conversation below.</p>
              ) : (
                threadMsgs.map((m) => (
                  <div key={m.id} className={`flex ${m.fromAdmin ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[80%] rounded-2xl px-3.5 py-2 ${m.fromAdmin ? "bg-indigo-600 text-white" : "bg-[#2a2d3a] text-white"}`}>
                      <p className="text-[10px] uppercase tracking-wide opacity-60 mb-0.5">{m.fromAdmin ? "You (team)" : thread.artistName}</p>
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">{m.body}</p>
                      <p className="text-[10px] opacity-50 mt-1">{new Date(m.createdAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
            {error && <p className="text-red-400 text-sm mb-2">{error}</p>}
            <div className="flex items-end gap-2 border-t border-[#2a2d3a] pt-3">
              <textarea
                value={threadBody}
                onChange={(e) => setThreadBody(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleThreadSend(); } }}
                rows={2}
                placeholder={`Reply to ${thread.artistName}…`}
                className={`${inputClass} resize-none`}
              />
              <button onClick={handleThreadSend} disabled={saving || !threadBody.trim()} className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-50 flex-shrink-0">
                <Send className="w-4 h-4" /> Send
              </button>
            </div>
            <p className="text-[#5a5e72] text-xs mt-2">They&rsquo;ll get an email that a new message is waiting, and can reply from their Messages page.</p>
          </div>
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
