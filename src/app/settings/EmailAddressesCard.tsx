"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { saveEmailSettings } from "../website/actions";

// Platform addresses only admins may select in the dropdowns.
const ADMIN_ONLY_EMAILS = ["hello@artistops.net"];
const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const inputClass = "w-full bg-[#0f1117] border border-[#2a2d3a] text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-indigo-500";

const SETTINGS_FIELDS: { key: "mailFromEmail" | "mailReplyTo" | "notifyEmail"; label: string; hint: string }[] = [
  { key: "mailFromEmail", label: "From address", hint: "The From address on emails you send to your list." },
  { key: "mailReplyTo", label: "Reply-To", hint: "Where replies to your list emails go." },
  { key: "notifyEmail", label: "Notify me of new signups", hint: "Private — we email you here when someone joins your list." },
];

export default function EmailAddressesCard({
  hasSite,
  availableEmails,
  notifyEmail,
  mailFromEmail,
  mailReplyTo,
  isAdmin,
}: {
  hasSite: boolean;
  availableEmails: string[];
  notifyEmail: string | null;
  mailFromEmail: string | null;
  mailReplyTo: string | null;
  isAdmin: boolean;
}) {
  const router = useRouter();

  const [emails, setEmails] = useState<string[]>(() => (availableEmails ?? []).filter(Boolean));
  const [unlocked, setUnlocked] = useState<Set<number>>(new Set());
  const [newEmail, setNewEmail] = useState("");
  const emailOptions = Array.from(
    new Set([
      ...emails.map((e) => e.trim().toLowerCase()).filter((e) => emailRe.test(e)),
      ...(isAdmin ? ADMIN_ONLY_EMAILS : []),
    ])
  );
  function toggleLock(i: number) {
    setUnlocked((s) => { const n = new Set(s); if (n.has(i)) n.delete(i); else n.add(i); return n; });
  }
  function updateEmail(i: number, val: string) {
    setEmails((list) => list.map((e, idx) => (idx === i ? val : e)));
  }
  function removeEmail(i: number) {
    setEmails((list) => list.filter((_, idx) => idx !== i));
    setUnlocked(new Set());
  }
  function addEmail() {
    const v = newEmail.trim().toLowerCase();
    if (!emailRe.test(v) || emails.some((e) => e.trim().toLowerCase() === v)) { setNewEmail(""); return; }
    setEmails((list) => [...list, v]);
    setNewEmail("");
  }

  const [sel, setSel] = useState<Record<string, string>>({
    notifyEmail: notifyEmail ?? "",
    mailFromEmail: mailFromEmail ?? "",
    mailReplyTo: mailReplyTo ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function save() {
    setSaving(true);
    setError(null);
    const res = await saveEmailSettings({
      availableEmails: emails.map((e) => e.trim()).filter(Boolean),
      notifyEmail: sel.notifyEmail || null,
      mailFromEmail: sel.mailFromEmail || null,
      mailReplyTo: sel.mailReplyTo || null,
    });
    setSaving(false);
    if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 2500); router.refresh(); }
    else setError(res.error || "Could not save.");
  }

  return (
    <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl p-6">
      <h2 className="text-white font-semibold mb-2">Email addresses</h2>
      <p className="text-[#8b8fa8] text-sm mb-4">
        List the mailboxes you&rsquo;ve created, then choose which one to use for each purpose. These feed your{" "}
        <a href="/email" className="text-indigo-400 hover:underline">Fan Email</a> broadcasts and the booking-email picker on your{" "}
        <a href="/website" className="text-indigo-400 hover:underline">Website</a>.
      </p>

      {!hasSite ? (
        <p className="text-[#8b8fa8] text-sm">
          Create your website first on the <a href="/website" className="text-indigo-400 hover:underline">Website</a> page, then you can add sending addresses here.
        </p>
      ) : (
        <>
          <label className="block text-[#8b8fa8] text-sm mb-1">Your email addresses</label>
          <div className="space-y-2">
            {emails.length === 0 && <p className="text-xs text-[#8b8fa8]">No addresses yet — add one below.</p>}
            {emails.map((email, i) => {
              const isUnlocked = unlocked.has(i);
              return (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={!isUnlocked}
                    onChange={() => toggleLock(i)}
                    title={isUnlocked ? "Check to lock (protect from edits)" : "Uncheck to edit or remove this address"}
                    className="accent-indigo-500"
                    aria-label={isUnlocked ? "Lock address" : "Unlock address to edit or remove"}
                  />
                  {isUnlocked ? (
                    <input value={email} onChange={(e) => updateEmail(i, e.target.value)} className={`${inputClass} flex-1`} />
                  ) : (
                    <span className="flex-1 truncate px-3 py-2 text-sm text-white">{email}</span>
                  )}
                  {isUnlocked && (
                    <button
                      type="button"
                      onClick={() => removeEmail(i)}
                      title="Remove this address"
                      className="shrink-0 rounded-lg border border-[#2a2d3a] px-2.5 py-2 text-xs text-red-400 transition hover:border-red-500 hover:bg-red-500/10"
                    >
                      Remove
                    </button>
                  )}
                </div>
              );
            })}
            <div className="flex items-center gap-2 pt-1">
              <input
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addEmail(); } }}
                placeholder="add another address — name@yourdomain.com"
                className={`${inputClass} flex-1`}
              />
              <button type="button" onClick={addEmail} className="shrink-0 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-indigo-700">
                Add
              </button>
            </div>
          </div>
          <p className="mt-1 text-xs text-[#8b8fa8]">
            Each address is <strong>locked&nbsp;☑</strong> so it can&rsquo;t be deleted by accident. Uncheck a row to edit or remove it. These populate the dropdowns below.
            {isAdmin && " Admin addresses are always available."}
          </p>

          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {SETTINGS_FIELDS.map((f) => (
              <div key={f.key}>
                <label className="block text-[#8b8fa8] text-sm mb-1">{f.label}</label>
                <select
                  value={sel[f.key] ?? ""}
                  onChange={(e) => setSel((s) => ({ ...s, [f.key]: e.target.value }))}
                  className={`${inputClass} [color-scheme:dark]`}
                >
                  <option value="">— none —</option>
                  {emailOptions.map((addr) => (
                    <option key={addr} value={addr}>
                      {addr}{ADMIN_ONLY_EMAILS.includes(addr) ? " (admin)" : ""}
                    </option>
                  ))}
                  {sel[f.key] && !emailOptions.includes(sel[f.key]) && <option value={sel[f.key]}>{sel[f.key]}</option>}
                </select>
                <p className="mt-1 text-xs text-[#8b8fa8]">{f.hint}</p>
              </div>
            ))}
          </div>

          <div className="mt-5 flex items-center gap-3">
            <button type="button" onClick={save} disabled={saving} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-50">
              {saving ? "Saving..." : "Save email settings"}
            </button>
            {saved && <span className="flex items-center gap-1 text-green-400 text-sm"><CheckCircle2 className="w-4 h-4" /> Saved</span>}
            {error && <span className="text-red-400 text-sm">{error}</span>}
          </div>
        </>
      )}
    </div>
  );
}
