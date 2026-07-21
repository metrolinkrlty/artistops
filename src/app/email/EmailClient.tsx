"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  saveEmailSettings,
  emailMyList,
  saveMailingList,
  deleteMailingList,
  addSubscriber,
  setSubscriberDeleted,
  purgeSubscriber,
} from "../website/actions";

// Platform addresses only admins may select in the dropdowns.
const ADMIN_ONLY_EMAILS = ["hello@artistops.net"];
const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const SETTINGS_FIELDS: { key: "notifyEmail" | "mailFromEmail" | "mailReplyTo"; label: string; hint: string }[] = [
  { key: "mailFromEmail", label: "From address", hint: "The From address on emails you send to your list." },
  { key: "mailReplyTo", label: "Reply-To", hint: "Where replies to your list emails go." },
  { key: "notifyEmail", label: "Notify me of new signups", hint: "Private — we email you here when someone joins your list." },
];

type Subscriber = {
  id: string;
  email: string;
  name: string | null;
  notifyOptIn: boolean;
  source: string | null;
  unsubscribed: boolean;
  resubscribed: boolean;
  deleted: boolean;
  signupCount: number;
  blockedAttempts: number;
  createdAt: Date;
};

type SavedList = { id: string; name: string; emails: string[]; updatedAt: string };

export default function EmailClient({
  slug,
  availableEmails,
  notifyEmail,
  mailFromEmail,
  mailReplyTo,
  subscribers,
  isAdmin,
  mailingLists,
}: {
  slug: string;
  availableEmails: string[];
  notifyEmail: string | null;
  mailFromEmail: string | null;
  mailReplyTo: string | null;
  subscribers: Subscriber[];
  isAdmin: boolean;
  mailingLists: SavedList[];
}) {
  const router = useRouter();

  // ── Address pool (locked list so addresses can't be deleted by accident) ──
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

  // Purpose dropdowns — controlled so they persist through re-renders.
  const [settingsSel, setSettingsSel] = useState<Record<string, string>>({
    notifyEmail: notifyEmail ?? "",
    mailFromEmail: mailFromEmail ?? "",
    mailReplyTo: mailReplyTo ?? "",
  });
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsStatus, setSettingsStatus] = useState<{ ok?: boolean; error?: string } | null>(null);
  async function saveSettings() {
    setSavingSettings(true);
    setSettingsStatus(null);
    const res = await saveEmailSettings({
      availableEmails: emails.map((e) => e.trim()).filter(Boolean),
      notifyEmail: settingsSel.notifyEmail || null,
      mailFromEmail: settingsSel.mailFromEmail || null,
      mailReplyTo: settingsSel.mailReplyTo || null,
    });
    setSavingSettings(false);
    setSettingsStatus(res);
    if (res.ok) router.refresh();
  }

  // ── "Email my list" broadcast composer ──
  const [blastFrom, setBlastFrom] = useState(mailFromEmail ?? "");
  const [blastSubject, setBlastSubject] = useState("");
  const [blastBody, setBlastBody] = useState("");
  const [blasting, setBlasting] = useState(false);
  const [blastMsg, setBlastMsg] = useState<string | null>(null);

  // Recipient selection — default to the last-saved list (most recent), else ALL.
  // Unsubscribed/deleted can never be picked.
  const selectableEmails = subscribers.filter((s) => !s.unsubscribed && !s.deleted).map((s) => s.email);
  const selectableSet = new Set(selectableEmails);
  const [selected, setSelected] = useState<Set<string>>(() => {
    const last = mailingLists[0];
    return last ? new Set(last.emails.filter((e) => selectableSet.has(e))) : new Set(selectableEmails);
  });
  const [activeListId, setActiveListId] = useState<string>(() => mailingLists[0]?.id ?? "");
  const allSelected = selectableEmails.length > 0 && selectableEmails.every((e) => selected.has(e));
  const selectedCount = selectableEmails.filter((e) => selected.has(e)).length;
  const [, startTransition] = useTransition();

  function toggleRecipient(email: string) {
    setSelected((s) => { const n = new Set(s); if (n.has(email)) n.delete(email); else n.add(email); return n; });
  }
  function toggleAllRecipients() { setSelected(allSelected ? new Set() : new Set(selectableEmails)); }
  function selectAllRecipients() { setSelected(new Set(selectableEmails)); }
  function clearRecipients() { setSelected(new Set()); }
  function applyList(id: string) {
    setActiveListId(id);
    if (!id) { setSelected(new Set(selectableEmails)); return; } // "All subscribers"
    const list = mailingLists.find((l) => l.id === id);
    if (list) setSelected(new Set(list.emails.filter((e) => selectableSet.has(e))));
  }
  const [savingList, setSavingList] = useState(false);
  async function saveCurrentList() {
    const existing = mailingLists.find((l) => l.id === activeListId);
    const name = prompt("Name this list (re-using a name overwrites it):", existing?.name ?? "");
    if (name === null || !name.trim()) return;
    setSavingList(true);
    const res = await saveMailingList(name, selectableEmails.filter((e) => selected.has(e)));
    setSavingList(false);
    if (res.ok) router.refresh(); else alert(res.error || "Could not save the list.");
  }
  async function removeCurrentList() {
    const list = mailingLists.find((l) => l.id === activeListId);
    if (!list || !confirm(`Delete the saved list "${list.name}"? Your subscribers aren't affected.`)) return;
    await deleteMailingList(list.id);
    setActiveListId("");
    router.refresh();
  }

  // Manual add.
  const [manualEmail, setManualEmail] = useState("");
  const [manualName, setManualName] = useState("");
  const [addingManual, setAddingManual] = useState(false);
  async function addManualSubscriber() {
    if (!manualEmail.trim()) return;
    setAddingManual(true);
    const res = await addSubscriber(manualEmail, manualName);
    setAddingManual(false);
    if (res.ok) { setManualEmail(""); setManualName(""); router.refresh(); }
    else alert(res.error || "Could not add.");
  }

  async function sendListEmail() {
    const recipients = selectableEmails.filter((e) => selected.has(e));
    if (!blastFrom || !blastSubject.trim() || !blastBody.trim()) { setBlastMsg("Pick a From address, subject, and message."); return; }
    if (recipients.length === 0) { setBlastMsg("Select at least one recipient."); return; }
    if (!confirm(`Send this email to ${recipients.length} subscriber${recipients.length === 1 ? "" : "s"}?`)) return;
    setBlasting(true); setBlastMsg(null);
    const res = await emailMyList(blastFrom, blastSubject, blastBody, recipients);
    setBlasting(false);
    if (res.ok) { setBlastMsg(`Sent to ${res.sent} subscriber${res.sent === 1 ? "" : "s"}.`); setBlastSubject(""); setBlastBody(""); }
    else setBlastMsg(res.error || "Could not send.");
  }

  const notifyCount = subscribers.filter((s) => s.notifyOptIn).length;

  function exportCsv() {
    const rows = [
      ["email", "name", "notify_opt_in", "source", "created_at"],
      ...subscribers.map((s) => [
        s.email,
        s.name ?? "",
        s.notifyOptIn ? "yes" : "no",
        s.source ?? "",
        new Date(s.createdAt).toISOString(),
      ]),
    ];
    const csv = rows
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${slug || "site"}-subscribers.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-8 p-6">
      {/* Email addresses & settings */}
      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="mb-1 text-lg font-semibold">Email addresses</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          List the mailboxes you&rsquo;ve created, then choose which one to use for each purpose. These also feed the booking-email picker on your{" "}
          <Link href="/website" className="font-medium text-primary hover:underline">Website</Link> page.
        </p>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-foreground">Your email addresses</span>
          <div className="space-y-2">
            {emails.length === 0 && (
              <p className="text-xs text-muted-foreground">No addresses yet — add one below.</p>
            )}
            {emails.map((email, i) => {
              const isUnlocked = unlocked.has(i);
              return (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={!isUnlocked}
                    onChange={() => toggleLock(i)}
                    title={isUnlocked ? "Check to lock (protect from edits)" : "Uncheck to edit or remove this address"}
                    className="accent-primary"
                    aria-label={isUnlocked ? "Lock address" : "Unlock address to edit or remove"}
                  />
                  {isUnlocked ? (
                    <input
                      value={email}
                      onChange={(e) => updateEmail(i, e.target.value)}
                      className="flex-1 rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm outline-none focus-visible:border-ring dark:bg-input/30"
                    />
                  ) : (
                    <span className="flex-1 truncate px-2.5 py-1.5 text-sm">{email}</span>
                  )}
                  {isUnlocked && (
                    <button
                      type="button"
                      onClick={() => removeEmail(i)}
                      title="Remove this address"
                      className="shrink-0 rounded-lg border border-input px-2.5 py-1.5 text-xs text-red-500 transition hover:border-red-500 hover:bg-red-500/10"
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
                className="flex-1 rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm outline-none focus-visible:border-ring dark:bg-input/30"
              />
              <button
                type="button"
                onClick={addEmail}
                className="shrink-0 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition hover:opacity-90"
              >
                Add
              </button>
            </div>
          </div>
          <span className="mt-1 block text-xs text-muted-foreground">
            Each address is <strong>locked&nbsp;☑</strong> so it can&rsquo;t be deleted by accident. Uncheck a row to edit or remove it. These populate the dropdowns below.
            {isAdmin && " Admin addresses are always available."}
          </span>
        </label>

        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {SETTINGS_FIELDS.map((f) => (
            <label key={f.key} className="block space-y-1.5">
              <span className="text-sm font-medium text-foreground">{f.label}</span>
              <select
                value={settingsSel[f.key] ?? ""}
                onChange={(e) => setSettingsSel((s) => ({ ...s, [f.key]: e.target.value }))}
                className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
              >
                <option value="">— none —</option>
                {emailOptions.map((addr) => (
                  <option key={addr} value={addr}>
                    {addr}
                    {ADMIN_ONLY_EMAILS.includes(addr) ? " (admin)" : ""}
                  </option>
                ))}
                {settingsSel[f.key] && !emailOptions.includes(settingsSel[f.key]) && (
                  <option value={settingsSel[f.key]}>{settingsSel[f.key]}</option>
                )}
              </select>
              <span className="text-xs text-muted-foreground">{f.hint}</span>
            </label>
          ))}
        </div>

        <div className="mt-5 flex items-center gap-3">
          <Button onClick={saveSettings} disabled={savingSettings}>
            {savingSettings ? "Saving…" : "Save email settings"}
          </Button>
          {settingsStatus?.ok && <span className="text-sm text-emerald-500">Saved.</span>}
          {settingsStatus?.error && <span className="text-sm text-destructive">{settingsStatus.error}</span>}
        </div>
      </section>

      {/* Subscribers */}
      <section className="rounded-xl border border-border bg-card p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Your subscribers</h2>
            <p className="text-sm text-muted-foreground">
              {subscribers.length} captured · {notifyCount} opted in to release &amp; show updates
            </p>
          </div>
          <Button variant="outline" onClick={exportCsv} disabled={!subscribers.length}>
            Export CSV
          </Button>
        </div>

        {/* Saved lists, bulk select, and manual add */}
        <div className="mb-4 flex flex-col gap-3 rounded-lg border border-border p-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">Recipients:</span>
            <select
              value={activeListId}
              onChange={(e) => applyList(e.target.value)}
              className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring dark:bg-input/30"
            >
              <option value="">All subscribers</option>
              {mailingLists.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
            <Button variant="outline" size="xs" onClick={saveCurrentList} disabled={savingList}>
              {savingList ? "Saving…" : "Save list"}
            </Button>
            {activeListId && <Button variant="ghost" size="xs" onClick={removeCurrentList}>Delete list</Button>}
            <span className="mx-1 text-muted-foreground">·</span>
            <Button variant="ghost" size="xs" onClick={selectAllRecipients}>Select all</Button>
            <Button variant="ghost" size="xs" onClick={clearRecipients}>Clear</Button>
            <span className="ml-auto text-xs text-muted-foreground">{selectedCount} selected</span>
          </div>
          <div className="flex flex-wrap items-center gap-2 border-t border-border/60 pt-3">
            <span className="text-xs font-medium text-muted-foreground">Add manually:</span>
            <input
              value={manualEmail}
              onChange={(e) => setManualEmail(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addManualSubscriber(); } }}
              placeholder="name@email.com"
              className="h-8 w-52 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring dark:bg-input/30"
            />
            <input
              value={manualName}
              onChange={(e) => setManualName(e.target.value)}
              placeholder="Name (optional)"
              className="h-8 w-40 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring dark:bg-input/30"
            />
            <Button variant="outline" size="xs" onClick={addManualSubscriber} disabled={addingManual || !manualEmail.trim()}>
              {addingManual ? "Adding…" : "Add"}
            </Button>
          </div>
        </div>

        {subscribers.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No subscribers yet. Emails captured on your website show up here.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="py-2 pr-3 font-medium" title="Include in broadcast">
                    <input type="checkbox" checked={allSelected} onChange={toggleAllRecipients} className="accent-primary" aria-label="Select all recipients" />
                  </th>
                  <th className="py-2 pr-4 font-medium">Email</th>
                  <th className="py-2 pr-4 font-medium">Status</th>
                  <th className="py-2 pr-4 font-medium">Notify</th>
                  <th className="py-2 pr-4 font-medium">Source</th>
                  <th className="py-2 pr-4 font-medium">Added</th>
                  <th className="py-2 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {subscribers.map((s) => (
                  <SubscriberRow
                    key={s.id}
                    sub={s}
                    isAdmin={isAdmin}
                    checked={selected.has(s.email)}
                    onToggle={() => toggleRecipient(s.email)}
                    onToggleDeleted={() => startTransition(() => { setSubscriberDeleted(s.id, !s.deleted).then(() => router.refresh()); })}
                    onPurge={() => {
                      if (!confirm(`Permanently delete ${s.email}? This can't be undone.`)) return;
                      startTransition(() => { purgeSubscriber(s.id).then(() => router.refresh()); });
                    }}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Email your list */}
        <div className="mt-6 rounded-lg border border-border p-4">
          <h3 className="text-sm font-semibold">Email your list</h3>
          <p className="mb-3 text-xs text-muted-foreground">
            Goes to the <strong>{selectedCount}</strong> selected subscriber{selectedCount === 1 ? "" : "s"} (uncheck anyone in the list above to skip them; unsubscribed people can&rsquo;t be selected). Replies come back to the From address you choose, and every email includes a one-click unsubscribe link.
          </p>
          <div className="grid gap-3">
            <div className="grid gap-3 sm:grid-cols-[220px_1fr]">
              <label className="text-sm">
                <span className="mb-1 block text-xs text-muted-foreground">From</span>
                <select
                  value={blastFrom}
                  onChange={(e) => setBlastFrom(e.target.value)}
                  className="h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring dark:bg-input/30"
                >
                  <option value="">— choose an address —</option>
                  {emailOptions.map((addr) => <option key={addr} value={addr}>{addr}</option>)}
                </select>
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-xs text-muted-foreground">Subject</span>
                <input
                  value={blastSubject}
                  onChange={(e) => setBlastSubject(e.target.value)}
                  placeholder="New song out now…"
                  className="h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring dark:bg-input/30"
                />
              </label>
            </div>
            <textarea
              value={blastBody}
              onChange={(e) => setBlastBody(e.target.value)}
              rows={5}
              placeholder="Write your message…"
              className="w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:border-ring dark:bg-input/30"
            />
            <div className="flex flex-wrap items-center gap-3">
              <Button onClick={sendListEmail} disabled={blasting || selectedCount === 0}>
                {blasting ? "Sending…" : `Send to ${selectedCount} subscriber${selectedCount === 1 ? "" : "s"}`}
              </Button>
              {blastMsg && <span className="text-sm text-muted-foreground">{blastMsg}</span>}
            </div>
            <p className="text-xs text-muted-foreground">
              Tip: add your own address as a subscriber and send a test first to check how it looks and lands.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

function SubscriberRow({ sub, isAdmin, checked, onToggle, onToggleDeleted, onPurge }: {
  sub: Subscriber; isAdmin: boolean; checked: boolean; onToggle: () => void; onToggleDeleted: () => void; onPurge: () => void;
}) {
  const eligible = !sub.unsubscribed && !sub.deleted;
  return (
    <tr className={`border-b border-border/60 ${!eligible ? "opacity-60" : ""}`}>
      <td className="py-2.5 pr-3">
        <input
          type="checkbox"
          checked={checked && eligible}
          onChange={onToggle}
          disabled={!eligible}
          className="accent-primary disabled:cursor-not-allowed"
          title={sub.deleted ? "Deleted — can't be emailed" : sub.unsubscribed ? "Unsubscribed — can't be emailed" : "Include in broadcast"}
          aria-label="Include in broadcast"
        />
      </td>
      <td className="py-2.5 pr-4">
        <span className="font-medium text-foreground">{sub.email}</span>
        {sub.name && <span className="ml-2 text-muted-foreground">{sub.name}</span>}
      </td>
      <td className="py-2.5 pr-4">
        <div className="flex flex-wrap items-center gap-1">
          {sub.deleted ? (
            <button type="button" onClick={onToggleDeleted} title="Click to undelete" className="rounded-full bg-red-500/15 px-2 py-0.5 text-xs font-medium text-red-500 transition hover:bg-red-500/25">Deleted</button>
          ) : sub.unsubscribed ? (
            <span className="rounded-full bg-yellow-500/15 px-2 py-0.5 text-xs text-yellow-600 dark:text-yellow-500" title="Only the listener can undo this, by re-signing up">Unsubscribed</span>
          ) : sub.resubscribed ? (
            <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs text-emerald-500" title="Unsubscribed before, then signed up again">Re-subscribed</span>
          ) : (
            <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs text-emerald-500">Subscribed</span>
          )}
          {sub.signupCount >= 2 && (
            <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs text-emerald-500" title="Number of signup submissions (watch for play-gate re-subs)">×{sub.signupCount}</span>
          )}
          {sub.blockedAttempts >= 1 && (
            <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-xs text-red-500" title="Website re-add attempts blocked while deleted">{sub.blockedAttempts} blocked</span>
          )}
        </div>
      </td>
      <td className="py-2.5 pr-4">
        {sub.notifyOptIn ? (
          <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs text-primary">Opted in</span>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )}
      </td>
      <td className="py-2.5 pr-4 text-muted-foreground">
        {sub.source === "manual"
          ? <span className="rounded-full bg-blue-500/15 px-2 py-0.5 text-xs text-blue-500">Manual add</span>
          : (sub.source ?? "—")}
      </td>
      <td className="py-2.5 pr-4 text-muted-foreground">
        {new Date(sub.createdAt).toLocaleDateString()}
      </td>
      <td className="py-2.5 text-right whitespace-nowrap">
        <Button variant="ghost" size="xs" onClick={onToggleDeleted}>{sub.deleted ? "Undelete" : "Delete"}</Button>
        {isAdmin && sub.deleted && (
          <Button variant="ghost" size="xs" onClick={onPurge} className="text-red-500" title="Admin: permanently remove this record">Purge</Button>
        )}
      </td>
    </tr>
  );
}
