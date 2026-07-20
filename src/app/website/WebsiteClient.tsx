"use client";

import { useEffect, useRef, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  saveArtistSite,
  deleteSubscriber,
  uploadSiteImage,
  clearHeroImage,
  removeGalleryImage,
  reorderGalleryImages,
  hideGalleryImage,
  showGalleryImage,
  reorderSiteTracks,
  setSiteTrackGate,
  setSiteTrackLinks,
  setSiteTrackLinksMode,
  syncStreamLinksFromSmartLinks,
  setHeroImage,
  type SocialLinks,
} from "./actions";
import { SECTION_KEYS, type Show } from "./site-fields";
import { SITE_FONTS, DEFAULT_FONT, FONT_CATEGORIES, FONT_PREVIEW_HREF } from "@/lib/siteFonts";
import AiEditor from "./AiEditor";
import ImportWebsite from "./ImportWebsite";

const SECTION_LABELS: Record<(typeof SECTION_KEYS)[number], string> = {
  gallery: "Gallery",
  shows: "Upcoming Shows",
};

type ArtistSite = {
  slug: string;
  displayName: string;
  tagline: string | null;
  location: string | null;
  bio: string | null;
  heroSubtext: string | null;
  themeColor: string | null;
  fontFamily: string | null;
  footerText: string | null;
  playerStyle: string | null;
  showStreamLinks: boolean;
  showMusicNotes: boolean;
  streamLinksAfterGate: boolean;
  heroCtaPrimary: string | null;
  heroCtaSecondary: string | null;
  previewSeconds: number;
  unlockGate: string;
  unlockFollowUrl: string | null;
  fbLikeShare: boolean;
  fbPageUrl: string | null;
  heroImageUrl: string | null;
  galleryImages: string[];
  hiddenGalleryImages: string[];
  hiddenSections: string[];
  shows: unknown;
  socialLinks: unknown;
  availableEmails: string[];
  contactEmail: string | null;
  notifyEmail: string | null;
  mailFromEmail: string | null;
  mailReplyTo: string | null;
} | null;

// Platform addresses only admins may select in the dropdowns.
const ADMIN_ONLY_EMAILS = ["hello@artistops.net"];

const EMAIL_FIELDS: { key: "contactEmail" | "notifyEmail" | "mailFromEmail" | "mailReplyTo"; label: string; hint: string; placeholder: string }[] = [
  { key: "contactEmail", label: "Contact / booking email", hint: "Shown publicly on your website for fans and bookers.", placeholder: "booking@yourdomain.com" },
  { key: "notifyEmail", label: "Notify me of new signups", hint: "Private — we email you here when someone joins your mailing list.", placeholder: "you@yourdomain.com" },
  { key: "mailFromEmail", label: "Mailing list — From address", hint: "The From address on emails you send to your list.", placeholder: "hello@yourdomain.com" },
  { key: "mailReplyTo", label: "Mailing list — Reply-To", hint: "Where replies to your mailing-list emails go.", placeholder: "you@yourdomain.com" },
];

type Subscriber = {
  id: string;
  email: string;
  name: string | null;
  notifyOptIn: boolean;
  source: string | null;
  createdAt: Date;
};

const SOCIAL_FIELDS: { key: keyof SocialLinks; label: string; placeholder: string }[] = [
  { key: "spotify", label: "Spotify", placeholder: "https://open.spotify.com/artist/…" },
  { key: "appleMusic", label: "Apple Music", placeholder: "https://music.apple.com/…" },
  { key: "youtube", label: "YouTube", placeholder: "https://youtube.com/@…" },
  { key: "instagram", label: "Instagram", placeholder: "https://instagram.com/…" },
  { key: "facebook", label: "Facebook", placeholder: "https://facebook.com/…" },
  { key: "tiktok", label: "TikTok", placeholder: "https://tiktok.com/@…" },
  { key: "bandcamp", label: "Bandcamp", placeholder: "https://….bandcamp.com" },
  { key: "website", label: "Other / Website", placeholder: "https://…" },
];

export default function WebsiteClient({
  site,
  subscribers,
  isAdmin,
  siteTracks,
}: {
  site: ArtistSite;
  subscribers: Subscriber[];
  isAdmin: boolean;
  siteTracks: { id: string; title: string; gate: string; streamLinks: unknown; linksMode: string }[];
}) {
  const router = useRouter();
  const social = (site?.socialLinks as SocialLinks) || {};
  const hidden = site?.hiddenSections ?? [];
  const showsText = (Array.isArray(site?.shows) ? (site!.shows as Show[]) : [])
    .map((s) => {
      const parts = [s.date, s.venue, s.city, s.ticketUrl];
      while (parts.length && !parts[parts.length - 1]) parts.pop();
      return parts.join(" | ");
    })
    .join("\n");
  const [status, setStatus] = useState<{ ok?: boolean; error?: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const [font, setFont] = useState(site?.fontFamily ?? DEFAULT_FONT);

  // The address pool that drives the dropdowns. A locked list so addresses can't
  // be deleted by accident — each row is locked (checked) by default; uncheck to
  // edit or remove it. Editing updates the dropdown options live.
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const [emails, setEmails] = useState<string[]>(() => (site?.availableEmails ?? []).filter(Boolean));
  const [unlocked, setUnlocked] = useState<Set<number>>(new Set());
  const [newEmail, setNewEmail] = useState("");
  const emailOptions = Array.from(
    new Set([
      ...emails.map((e) => e.trim().toLowerCase()).filter((e) => emailRe.test(e)),
      ...(isAdmin ? ADMIN_ONLY_EMAILS : []),
    ])
  );
  // Serialized for the save action (unchanged server-side: newline/comma list).
  const availableEmailsValue = emails.map((e) => e.trim()).filter(Boolean).join("\n");
  function toggleLock(i: number) {
    setUnlocked((s) => { const n = new Set(s); if (n.has(i)) n.delete(i); else n.add(i); return n; });
  }
  function updateEmail(i: number, val: string) {
    setEmails((list) => list.map((e, idx) => (idx === i ? val : e)));
  }
  function removeEmail(i: number) {
    setEmails((list) => list.filter((_, idx) => idx !== i));
    setUnlocked(new Set()); // re-lock the rest after a removal
  }
  function addEmail() {
    const v = newEmail.trim().toLowerCase();
    if (!emailRe.test(v) || emails.some((e) => e.trim().toLowerCase() === v)) { setNewEmail(""); return; }
    setEmails((list) => [...list, v]);
    setNewEmail("");
  }
  // Controlled so React 19's post-submit form reset doesn't snap these back to
  // "none" (the uncontrolled version reverted every save).
  const [emailSel, setEmailSel] = useState<Record<string, string>>({
    contactEmail: site?.contactEmail ?? "",
    notifyEmail: site?.notifyEmail ?? "",
    mailFromEmail: site?.mailFromEmail ?? "",
    mailReplyTo: site?.mailReplyTo ?? "",
  });

  // onSubmit (not <form action=…>) so React 19 doesn't auto-reset the form after
  // saving — that reset was blanking the controlled dropdowns' DOM value until the
  // next render (they'd show "none" right after save, then reappear on refresh).
  function onSave(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget); // capture synchronously
    setStatus(null);
    startTransition(async () => {
      const res = await saveArtistSite(fd);
      setStatus(res);
    });
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
    a.download = `${site?.slug || "site"}-subscribers.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-8 p-6">
      {/* Live site link */}
      {site?.slug && (
        <a
          href={`/sites/${site.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between rounded-xl border border-border bg-card px-6 py-4 transition hover:border-primary"
        >
          <div>
            <p className="text-sm font-semibold text-foreground">Your website is live</p>
            <p className="text-sm text-muted-foreground">
              /sites/{site.slug} — click to view it in a new tab
            </p>
          </div>
          <span className="text-sm font-medium text-primary">View site →</span>
        </a>
      )}

      {/* Conversational AI editor */}
      <AiEditor />

      {/* Import from an existing website */}
      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="mb-1 text-lg font-semibold">Import from a website</h2>
        <p className="mb-3 text-sm text-muted-foreground">
          Have an existing site? Pull its photos, bio, and details into this one. (Only import sites you own.)
        </p>
        <ImportWebsite onDone={() => router.refresh()} />
      </section>

      {/* Site settings */}
      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="mb-1 text-lg font-semibold">Site details</h2>
        <p className="mb-5 text-sm text-muted-foreground">
          These power your public website. The slug is its public id (e.g.{" "}
          <code className="text-foreground">luke-corliss</code>).
        </p>
        <form onSubmit={onSave} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Display name" required>
              <Input name="displayName" defaultValue={site?.displayName ?? ""} placeholder="Your name or band name" required />
            </Field>
            <Field label="Slug" required>
              <Input name="slug" defaultValue={site?.slug ?? ""} placeholder="luke-corliss" required />
            </Field>
            <Field label="Tagline">
              <Input name="tagline" defaultValue={site?.tagline ?? ""} placeholder="Your genre or vibe (e.g. indie folk, hip-hop)" />
            </Field>
            <Field label="Location">
              <Input name="location" defaultValue={site?.location ?? ""} placeholder="Your city, state" />
            </Field>
            <Field label="Accent color">
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  defaultValue={site?.themeColor ?? "#e0a530"}
                  onChange={(e) => {
                    const hex = e.currentTarget.parentElement?.querySelector<HTMLInputElement>('input[name="themeColor"]');
                    if (hex) hex.value = e.currentTarget.value;
                  }}
                  className="h-8 w-10 shrink-0 cursor-pointer rounded border border-input bg-transparent"
                  aria-label="Pick accent color"
                />
                <Input name="themeColor" defaultValue={site?.themeColor ?? ""} placeholder="#e0a530" />
              </div>
              <span className="text-xs text-muted-foreground">Highlight color used across your site (buttons, links, headings).</span>
            </Field>
          </div>

          <Field label="Heading font">
            {/* Load the option fonts so each choice renders in its own typeface. */}
            <link rel="stylesheet" href={FONT_PREVIEW_HREF} />
            <input type="hidden" name="fontFamily" value={font} />
            <FontDropdown value={font} onChange={setFont} />
            <span className="text-xs text-muted-foreground">Sets the big headings on your public site. Changes go live after you save.</span>
          </Field>

          <Field label="Hero subtext">
            <textarea
              name="heroSubtext"
              defaultValue={site?.heroSubtext ?? ""}
              rows={3}
              placeholder="The line under your name at the top of the site…"
              className="w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Hero button (primary)">
              <Input name="heroCtaPrimary" defaultValue={site?.heroCtaPrimary ?? ""} placeholder="Listen Now" />
            </Field>
            <Field label="Hero button (secondary)">
              <Input name="heroCtaSecondary" defaultValue={site?.heroCtaSecondary ?? ""} placeholder="Join the Mailing List" />
            </Field>
          </div>
          <div className="rounded-lg border border-border p-4">
            <h3 className="mb-1 text-sm font-semibold">Song unlock</h3>
            <p className="mb-3 text-xs text-muted-foreground">
              Fans hear a preview, then unlock the full song. Set each song&rsquo;s unlock method (Email / Share / Follow / Free) <strong>per song in &ldquo;Song order&rdquo; below.</strong>
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Preview length (seconds)">
                <Input name="previewSeconds" type="number" min={5} max={30} defaultValue={site?.previewSeconds ?? 30} />
              </Field>
              <Field label="Follow / profile URL (for Follow-gated songs)">
                <Input name="unlockFollowUrl" defaultValue={site?.unlockFollowUrl ?? ""} placeholder="https://instagram.com/yourhandle" />
              </Field>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Only Email gives you data you own; Share/Follow unlock on click and can&rsquo;t be verified.
            </p>
          </div>
          <div className="rounded-lg border border-border p-4">
            <h3 className="mb-1 text-sm font-semibold">Music player style</h3>
            <p className="mb-3 text-xs text-muted-foreground">
              How your songs look while they play. Pick the one that feels most like you — you can change it anytime.
            </p>
            <div className="grid gap-2.5">
              {[
                { value: "waveform", title: "Waveform", desc: "A moving sound wave sweeps across the song as it plays, and the title lights up. Lively and modern.", recommended: true },
                { value: "shade", title: "Shade sweep", desc: "A soft colored glow glides across the song as it plays. Clean and simple — with a handle you can grab to scrub." },
                { value: "classic", title: "Classic", desc: "A song list with a player bar at the bottom — big play knob and a slider to scrub. The familiar look." },
                { value: "simple", title: "Simple list", desc: "Just press play and listen. No moving effects — the most understated." },
              ].map((opt) => (
                <label
                  key={opt.value}
                  className="flex cursor-pointer items-start gap-3 rounded-lg border border-input p-3 transition hover:border-ring has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                >
                  <input
                    type="radio"
                    name="playerStyle"
                    value={opt.value}
                    defaultChecked={(site?.playerStyle ?? "waveform") === opt.value}
                    className="mt-0.5 accent-primary"
                  />
                  <span className="text-sm">
                    <span className="font-semibold">
                      {opt.title}
                      {opt.recommended && <span className="ml-2 rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-primary">Recommended</span>}
                    </span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">{opt.desc}</span>
                  </span>
                </label>
              ))}
            </div>
            <label className="mt-3 flex cursor-pointer items-center gap-2 rounded-full border border-input px-3 py-1.5 text-sm font-medium transition hover:border-ring has-[:checked]:border-primary has-[:checked]:bg-primary/10">
              <input type="checkbox" name="showMusicNotes" defaultChecked={site?.showMusicNotes ?? true} className="accent-primary" />
              Music notes
              <span className="text-xs font-normal text-muted-foreground">— little notes fly off the scrubber while a song plays (waveform player only)</span>
            </label>
          </div>
          <div className="rounded-lg border border-border p-4">
            <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold">
              <input type="checkbox" name="showStreamLinks" defaultChecked={site?.showStreamLinks ?? true} className="accent-primary" />
              Show streaming links on your songs
            </label>
            <p className="mb-3 mt-1 text-xs text-muted-foreground">
              Shows the &ldquo;Full song on Spotify / Apple Music / …&rdquo; buttons under each song (only where you&rsquo;ve added a link in &ldquo;Song order&rdquo; below). Turn off to hide them everywhere.
            </p>
            <fieldset className="grid gap-2">
              <legend className="mb-1 text-xs font-medium text-muted-foreground">When should fans see them?</legend>
              {[
                { value: "before", title: "Right away", desc: "Fans can jump to Spotify/Apple anytime. Best for plays and royalties." },
                { value: "after", title: "After they unlock the song", desc: "Fans give their email (or share/follow) first, then get the streaming links. Best for growing your list." },
              ].map((opt) => (
                <label key={opt.value} className="flex cursor-pointer items-start gap-3 rounded-lg border border-input p-2.5 transition hover:border-ring has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                  <input
                    type="radio"
                    name="streamLinksTiming"
                    value={opt.value}
                    defaultChecked={(site?.streamLinksAfterGate ? "after" : "before") === opt.value}
                    className="mt-0.5 accent-primary"
                  />
                  <span className="text-sm">
                    <span className="font-semibold">{opt.title}</span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">{opt.desc}</span>
                  </span>
                </label>
              ))}
            </fieldset>
          </div>
          <div className="rounded-lg border border-border p-4">
            <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold">
              <input type="checkbox" name="fbLikeShare" defaultChecked={site?.fbLikeShare ?? false} className="accent-primary" />
              Show Facebook Like &amp; Share buttons
            </label>
            <p className="mb-3 mt-1 text-xs text-muted-foreground">
              Adds real Facebook Like &amp; Share buttons to your site (for growth). Visitors stay on your page — Like is inline, Share opens a Facebook popup. Great for reach, but they can&rsquo;t gate songs.
            </p>
            <Field label="Facebook Page URL (target of the Like button)">
              <Input name="fbPageUrl" defaultValue={site?.fbPageUrl ?? ""} placeholder="https://facebook.com/yourpage" />
            </Field>
          </div>
          <Field label="Bio">
            <textarea
              name="bio"
              defaultValue={site?.bio ?? ""}
              rows={5}
              placeholder="Your About section. Separate paragraphs with a blank line."
              className="w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
            />
          </Field>

          <Field label="Footer text">
            <textarea
              name="footerText"
              defaultValue={site?.footerText ?? ""}
              rows={2}
              placeholder="A line for the bottom of your site — a thank-you, a management credit, anything."
              className="w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
            />
            <span className="text-xs text-muted-foreground">Shown above the copyright line in your site footer. Leave blank to hide.</span>
          </Field>

          <div>
            <h3 className="mb-1 text-sm font-semibold text-foreground">Sections &amp; shows</h3>
            <p className="mb-3 text-xs text-muted-foreground">
              Choose which sections appear on your site, and list your upcoming dates.
            </p>
            <div className="mb-4 flex flex-wrap gap-5">
              {SECTION_KEYS.map((key) => (
                <label key={key} className="flex items-center gap-2 text-sm text-foreground">
                  <input
                    type="checkbox"
                    name={`section_${key}`}
                    defaultChecked={!hidden.includes(key)}
                    className="h-4 w-4 rounded border-input"
                  />
                  Show {SECTION_LABELS[key]}
                </label>
              ))}
            </div>
            <Field label="Upcoming shows">
              <textarea
                name="shows"
                defaultValue={showsText}
                rows={4}
                placeholder={"Aug 3, 2026 | Venue Name | City, ST | https://tickets.example.com"}
                className="w-full rounded-lg border border-input bg-transparent px-2.5 py-2 font-mono text-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
              />
              <span className="text-xs text-muted-foreground">
                One show per line: <code>date | venue | city | ticket link</code>. City and link are optional. Leave empty to show &ldquo;dates to be announced.&rdquo;
              </span>
            </Field>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold text-foreground">Social &amp; streaming links</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              {SOCIAL_FIELDS.map((f) => (
                <Field key={f.key} label={f.label}>
                  <Input
                    name={`social_${f.key}`}
                    defaultValue={social[f.key] ?? ""}
                    placeholder={f.placeholder}
                    type="url"
                  />
                </Field>
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-1 text-sm font-semibold text-foreground">Email</h3>
            <p className="mb-3 text-xs text-muted-foreground">
              List the mailboxes you&rsquo;ve created, then choose which one to use for each purpose.
            </p>

            <Field label="Your email addresses">
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
                {/* Serialized value the save action reads (unchanged server-side). */}
                <input type="hidden" name="availableEmails" value={availableEmailsValue} />
              </div>
              <span className="mt-1 block text-xs text-muted-foreground">
                Each address is <strong>locked&nbsp;☑</strong> so it can&rsquo;t be deleted by accident. Uncheck a row to edit or remove it. These populate the dropdowns below.
                {isAdmin && " Admin addresses are always available."}
              </span>
            </Field>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {EMAIL_FIELDS.map((f) => (
                <Field key={f.key} label={f.label}>
                  <select
                    name={f.key}
                    value={emailSel[f.key] ?? ""}
                    onChange={(e) => setEmailSel((s) => ({ ...s, [f.key]: e.target.value }))}
                    className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
                  >
                    <option value="">— none —</option>
                    {emailOptions.map((addr) => (
                      <option key={addr} value={addr}>
                        {addr}
                        {ADMIN_ONLY_EMAILS.includes(addr) ? " (admin)" : ""}
                      </option>
                    ))}
                    {/* Keep the selected value selectable even if it's not in the pool */}
                    {emailSel[f.key] && !emailOptions.includes(emailSel[f.key]) && (
                      <option value={emailSel[f.key]}>{emailSel[f.key]}</option>
                    )}
                  </select>
                  <span className="text-xs text-muted-foreground">{f.hint}</span>
                </Field>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button type="submit" disabled={pending}>
              Save site details
            </Button>
            {status?.ok && <span className="text-sm text-emerald-500">Saved.</span>}
            {status?.error && <span className="text-sm text-destructive">{status.error}</span>}
          </div>
        </form>
      </section>

      {/* Images */}
      <ImageManager heroImageUrl={site?.heroImageUrl ?? null} galleryImages={site?.galleryImages ?? []} hiddenGalleryImages={site?.hiddenGalleryImages ?? []} disabled={!site?.slug} />

      <TrackOrder tracks={siteTracks} />

      {/* Mailing list */}
      <section className="rounded-xl border border-border bg-card p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Mailing list</h2>
            <p className="text-sm text-muted-foreground">
              {subscribers.length} captured · {notifyCount} opted in to release &amp; show updates
            </p>
          </div>
          <Button variant="outline" onClick={exportCsv} disabled={!subscribers.length}>
            Export CSV
          </Button>
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
                  <th className="py-2 pr-4 font-medium">Email</th>
                  <th className="py-2 pr-4 font-medium">Notify</th>
                  <th className="py-2 pr-4 font-medium">Source</th>
                  <th className="py-2 pr-4 font-medium">Added</th>
                  <th className="py-2 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {subscribers.map((s) => (
                  <SubscriberRow key={s.id} sub={s} onDelete={() =>
                    startTransition(() => { deleteSubscriber(s.id); })
                  } />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

// Custom dropdown so each option renders in its own font (native <select>
// options don't honor font-family in Chrome). Closed by default, like a select.
function FontDropdown({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = SITE_FONTS.find((f) => f.key === value) ?? SITE_FONTS[0];

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between rounded-lg border border-input bg-transparent px-3 py-2 text-left outline-none focus-visible:border-ring dark:bg-input/30"
      >
        <span className="truncate text-xl leading-tight text-foreground" style={{ fontFamily: selected.css }}>
          {selected.label}
        </span>
        <span className="ml-2 shrink-0 text-xs text-muted-foreground">{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="absolute z-20 mt-1 max-h-80 w-full overflow-y-auto rounded-lg border border-border bg-popover shadow-lg">
          {FONT_CATEGORIES.map((cat) => (
            <div key={cat}>
              <div className="sticky top-0 bg-muted/80 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground backdrop-blur">
                {cat}
              </div>
              {SITE_FONTS.filter((f) => f.category === cat).map((f) => (
                <button
                  type="button"
                  key={f.key}
                  onClick={() => { onChange(f.key); setOpen(false); }}
                  className={`flex w-full items-baseline justify-between gap-3 px-3 py-2 text-left hover:bg-accent ${f.key === value ? "bg-accent" : ""}`}
                >
                  <span className="truncate text-xl leading-tight text-foreground" style={{ fontFamily: f.css }}>{f.label}</span>
                  <span className="shrink-0 text-[11px] text-muted-foreground">{f.note}</span>
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const STREAM_PLATFORMS: { key: string; label: string; placeholder: string }[] = [
  { key: "spotify", label: "Spotify", placeholder: "https://open.spotify.com/track/…" },
  { key: "apple", label: "Apple Music", placeholder: "https://music.apple.com/…" },
  { key: "amazon", label: "Amazon Music", placeholder: "https://music.amazon.com/…" },
  { key: "bandcamp", label: "Bandcamp", placeholder: "https://yourband.bandcamp.com/track/…" },
  { key: "youtube", label: "YouTube", placeholder: "https://youtube.com/watch?v=…" },
  { key: "soundcloud", label: "SoundCloud", placeholder: "https://soundcloud.com/…" },
];

function asLinks(v: unknown): Record<string, string> {
  return v && typeof v === "object" ? (v as Record<string, string>) : {};
}

function TrackOrder({ tracks }: { tracks: { id: string; title: string; gate: string; streamLinks: unknown; linksMode: string }[] }) {
  const router = useRouter();
  const [order, setOrder] = useState(tracks);
  useEffect(() => { setOrder(tracks); }, [tracks]);
  const dragId = useRef<string | null>(null);
  const [openLinks, setOpenLinks] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  if (!tracks.length) return null;

  const setGate = (id: string, gate: string) => {
    setOrder((o) => o.map((t) => (t.id === id ? { ...t, gate } : t)));
    startTransition(() => { setSiteTrackGate(id, gate).then(() => router.refresh()); });
  };

  const saveLinks = (id: string, links: Record<string, string>) => {
    setOrder((o) => o.map((t) => (t.id === id ? { ...t, streamLinks: links } : t)));
    startTransition(() => { setSiteTrackLinks(id, links).then(() => router.refresh()); });
  };

  const saveLinksMode = (id: string, mode: string) => {
    setOrder((o) => o.map((t) => (t.id === id ? { ...t, linksMode: mode } : t)));
    startTransition(() => { setSiteTrackLinksMode(id, mode).then(() => router.refresh()); });
  };

  const [syncMsg, setSyncMsg] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const pullFromSmartLinks = async () => {
    setSyncing(true); setSyncMsg(null);
    const res = await syncStreamLinksFromSmartLinks();
    setSyncing(false);
    setSyncMsg(res.updated ? `Updated ${res.updated} song${res.updated === 1 ? "" : "s"} from your Smart Links.` : "No new links found in your Smart Links.");
    router.refresh();
  };

  function reorderTo(targetId: string) {
    const from = order.findIndex((t) => t.id === dragId.current);
    const to = order.findIndex((t) => t.id === targetId);
    if (from < 0 || to < 0 || from === to) return;
    const next = [...order];
    next.splice(to, 0, next.splice(from, 1)[0]);
    setOrder(next);
    startTransition(() => { reorderSiteTracks(next.map((t) => t.id)).then(() => router.refresh()); });
  }

  return (
    <section className="rounded-xl border border-border bg-card p-6">
      <div className="mb-1 flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Song order</h2>
        <button
          type="button"
          onClick={pullFromSmartLinks}
          disabled={syncing}
          className="shrink-0 rounded-md border border-input px-2.5 py-1 text-xs text-muted-foreground transition hover:border-ring hover:text-foreground disabled:opacity-60"
          title="Fill each song's streaming links from your Smart Links"
        >
          {syncing ? "Pulling…" : "↻ Pull links from Smart Links"}
        </button>
      </div>
      <p className="mb-4 text-sm text-muted-foreground">
        Drag to set order (the first plays first). Pick each song&rsquo;s unlock gate — mix Email (captures the address) and Share/Follow (grows reach) to get the best of both. Streaming links auto-fill from your <strong>Smart Links</strong> (or add them by hand per song below) so fans can hear the full song on Spotify, Apple Music and more — that&rsquo;s where you earn royalties.
      </p>
      {syncMsg && <p className="mb-3 text-xs text-primary">{syncMsg}</p>}
      <ul className="space-y-2">
        {order.map((t, i) => {
          const links = asLinks(t.streamLinks);
          const linkCount = STREAM_PLATFORMS.filter((p) => links[p.key]).length;
          const isOpen = openLinks === t.id;
          return (
          <li
            key={t.id}
            className="rounded-lg border border-border bg-background/40 transition hover:border-ring"
          >
            <div
              draggable
              onDragStart={() => { dragId.current = t.id; }}
              onDragOver={(e) => { if (dragId.current && dragId.current !== t.id) e.preventDefault(); }}
              onDrop={(e) => { e.preventDefault(); reorderTo(t.id); }}
              onDragEnd={() => { dragId.current = null; }}
              className="flex cursor-grab items-center gap-3 px-3 py-2 active:cursor-grabbing"
            >
              <span className="w-5 text-xs text-muted-foreground">{i + 1}</span>
              <span className="flex-1 truncate text-sm text-foreground">{t.title}</span>
              <button
                type="button"
                onClick={() => setOpenLinks(isOpen ? null : t.id)}
                onPointerDown={(e) => e.stopPropagation()}
                className={`rounded-md border px-2 py-1 text-xs transition ${linkCount ? "border-primary/50 text-primary" : "border-input text-muted-foreground"} hover:border-ring`}
              >
                {linkCount ? `Links · ${linkCount}` : "+ Links"}
              </button>
              <select
                value={t.gate}
                onChange={(e) => setGate(t.id, e.target.value)}
                onPointerDown={(e) => e.stopPropagation()}
                className="rounded-md border border-input bg-transparent px-2 py-1 text-xs outline-none focus-visible:border-ring dark:bg-input/30"
              >
                <option value="email">Email gate</option>
                <option value="share">Share gate</option>
                <option value="follow">Follow gate</option>
                <option value="free">Free (no gate)</option>
              </select>
              <span className="select-none text-muted-foreground">⠿</span>
            </div>
            {isOpen && (
              <div className="space-y-2 border-t border-border px-3 py-3">
                <label className="flex items-center justify-between gap-2 pb-1">
                  <span className="text-xs font-medium text-foreground">When to show these on your site</span>
                  <select
                    value={t.linksMode || "default"}
                    onChange={(e) => saveLinksMode(t.id, e.target.value)}
                    className="rounded-md border border-input bg-transparent px-2 py-1 text-xs outline-none focus-visible:border-ring dark:bg-input/30"
                    title="Override the site-wide streaming-links timing for just this song"
                  >
                    <option value="default">Use site setting</option>
                    <option value="before">Show right away</option>
                    <option value="after">Only after they unlock</option>
                    <option value="off">Hide for this song</option>
                  </select>
                </label>
                <p className="text-xs text-muted-foreground">
                  Paste the full-song URL on each platform. Only the ones you fill in show up on your site. Tip: for an unreleased or exclusive track, set this to <strong>Only after they unlock</strong> (or leave the links empty) so fans have to give their email to hear it.
                </p>
                {STREAM_PLATFORMS.map((p) => (
                  <label key={p.key} className="flex items-center gap-2">
                    <span className="w-24 shrink-0 text-xs text-muted-foreground">{p.label}</span>
                    <input
                      type="url"
                      defaultValue={links[p.key] ?? ""}
                      placeholder={p.placeholder}
                      onBlur={(e) => {
                        const next = { ...links, [p.key]: e.target.value.trim() };
                        if (!e.target.value.trim()) delete next[p.key];
                        saveLinks(t.id, next);
                      }}
                      className="w-full rounded-md border border-input bg-transparent px-2 py-1 text-xs outline-none focus-visible:border-ring dark:bg-input/30"
                    />
                  </label>
                ))}
              </div>
            )}
          </li>
          );
        })}
      </ul>
    </section>
  );
}

function ImageManager({
  heroImageUrl,
  galleryImages,
  hiddenGalleryImages,
  disabled,
}: {
  heroImageUrl: string | null;
  galleryImages: string[];
  hiddenGalleryImages: string[];
  disabled: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<"hero" | "gallery" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const heroInput = useRef<HTMLInputElement>(null);
  const galleryInput = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [dragOver, setDragOver] = useState(false);

  // Local gallery order for optimistic drag-to-reorder; synced from the server.
  const [order, setOrder] = useState<string[]>(galleryImages);
  useEffect(() => { setOrder(galleryImages); }, [galleryImages]);
  const dragUrl = useRef<string | null>(null);
  const [overUrl, setOverUrl] = useState<string | null>(null);

  // Natural pixel size per image, read as each loads — shown on hover so the
  // artist can judge which photos are sharp enough to publish.
  const [dims, setDims] = useState<Record<string, string>>({});
  function onImgLoad(url: string, e: React.SyntheticEvent<HTMLImageElement>) {
    const img = e.currentTarget;
    if (img.naturalWidth) {
      setDims((d) => (d[url] ? d : { ...d, [url]: `${img.naturalWidth}×${img.naturalHeight}` }));
    }
  }

  // Which section a dragged photo came from, so a drop on the other section
  // moves it (public ↔ hidden). dropZone highlights the section being hovered.
  const dragSource = useRef<"gallery" | "hidden" | null>(null);
  const [dropZone, setDropZone] = useState<"gallery" | "hidden" | null>(null);
  function moveToGallery(url: string) {
    startTransition(() => { showGalleryImage(url).then(() => router.refresh()); });
  }
  function moveToHidden(url: string) {
    startTransition(() => { hideGalleryImage(url).then(() => router.refresh()); });
  }
  function endDrag() { dragUrl.current = null; dragSource.current = null; setOverUrl(null); setDropZone(null); }

  async function upload(kind: "hero" | "gallery", input: HTMLInputElement | null) {
    const files = input?.files ? Array.from(input.files) : [];
    if (!files.length) return;
    setBusy(kind);
    setError(null);
    try {
      // Hero takes one photo; gallery accepts all selected files.
      for (const file of kind === "hero" ? files.slice(0, 1) : files) {
        const fd = new FormData();
        fd.set("kind", kind);
        fd.set("file", file);
        const res = await uploadSiteImage(fd);
        if (!res.ok) { setError(res.error || "Upload failed."); break; }
      }
      router.refresh();
    } catch {
      setError("Upload failed — an image may be too large (max 8 MB).");
    } finally {
      setBusy(null);
      if (input) input.value = "";
    }
  }

  function reorderTo(targetUrl: string) {
    const dragged = dragUrl.current;
    if (!dragged || dragged === targetUrl) return;
    const from = order.indexOf(dragged);
    const to = order.indexOf(targetUrl);
    if (from < 0 || to < 0) return;
    const next = [...order];
    next.splice(to, 0, next.splice(from, 1)[0]);
    setOrder(next);
    startTransition(() => { reorderGalleryImages(next).then(() => router.refresh()); });
  }

  return (
    <section className="rounded-xl border border-border bg-card p-6">
      <h2 className="mb-1 text-lg font-semibold">Images</h2>
      <p className="mb-5 text-sm text-muted-foreground">
        {disabled ? "Save your site details first, then add photos." : "Upload a hero background and gallery photos for your site."}
      </p>

      <div className="space-y-6">
        <div>
          <h3 className="mb-2 text-sm font-semibold text-foreground">Hero background</h3>
          <div
            onDragOver={(e) => { if (!disabled) { e.preventDefault(); e.dataTransfer.dropEffect = "copy"; setDragOver(true); } }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              if (disabled) return;
              const url = e.dataTransfer.getData("text/uri-list") || e.dataTransfer.getData("text/plain");
              if (url) startTransition(() => { setHeroImage(url).then(() => router.refresh()); });
            }}
            className={`flex flex-wrap items-center gap-4 rounded-lg border-2 border-dashed p-3 transition-colors ${dragOver ? "border-primary bg-primary/10" : "border-transparent"}`}
          >
            {heroImageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={heroImageUrl} alt="Hero" draggable={false} className="h-20 w-32 rounded-lg border border-border object-cover" />
            )}
            <div className="flex items-center gap-2">
              <input ref={heroInput} type="file" accept="image/*" disabled={disabled || busy === "hero"} onChange={() => upload("hero", heroInput.current)} className="text-sm text-muted-foreground file:mr-3 file:rounded-md file:border file:border-input file:bg-transparent file:px-3 file:py-1.5 file:text-sm file:text-foreground" />
              {busy === "hero" && <span className="text-xs text-muted-foreground">Uploading…</span>}
              {(pending && dragOver) && <span className="text-xs text-muted-foreground">Setting…</span>}
              {heroImageUrl && (
                <Button variant="ghost" size="xs" disabled={pending} onClick={() => startTransition(() => { clearHeroImage().then(() => router.refresh()); })}>
                  Remove
                </Button>
              )}
            </div>
          </div>
          {galleryImages.length > 0 && (
            <p className="mt-1 text-xs text-muted-foreground">Tip: drag a gallery photo here to make it the hero background.</p>
          )}
        </div>

        <div>
          <h3 className="mb-2 text-sm font-semibold text-foreground">Gallery</h3>
          {order.length > 0 && (
            <div
              className={`mb-3 grid grid-cols-3 gap-3 rounded-lg sm:grid-cols-5 ${dropZone === "gallery" ? "outline outline-2 outline-dashed outline-primary" : ""}`}
              onDragOver={(e) => { if (dragSource.current === "hidden") { e.preventDefault(); setDropZone("gallery"); } }}
              onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDropZone(null); }}
              onDrop={(e) => { if (dragSource.current === "hidden" && dragUrl.current) { e.preventDefault(); moveToGallery(dragUrl.current); } setDropZone(null); }}
            >
              {order.map((url, i) => (
                <div
                  key={url}
                  draggable
                  onDragStart={(e) => {
                    dragUrl.current = url;
                    dragSource.current = "gallery";
                    e.dataTransfer.setData("text/uri-list", url);
                    e.dataTransfer.setData("text/plain", url);
                    e.dataTransfer.effectAllowed = "copyMove";
                  }}
                  onDragOver={(e) => { if (dragSource.current === "gallery" && dragUrl.current !== url) { e.preventDefault(); setOverUrl(url); } }}
                  onDragLeave={() => setOverUrl((u) => (u === url ? null : u))}
                  onDrop={(e) => {
                    e.preventDefault(); e.stopPropagation();
                    if (dragSource.current === "hidden" && dragUrl.current) moveToGallery(dragUrl.current);
                    else reorderTo(url);
                    setOverUrl(null); setDropZone(null);
                  }}
                  onDragEnd={endDrag}
                  title={i === 0 ? "This is your primary photo — drag another photo here to make it primary" : "Drag onto another photo to reorder, or onto the hero to set it as the hero"}
                  className={`group relative cursor-grab overflow-hidden rounded-lg border transition active:cursor-grabbing ${overUrl === url ? "border-primary ring-2 ring-primary" : i === 0 ? "border-primary" : "border-border"}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" draggable={false} onLoad={(e) => onImgLoad(url, e)} className="aspect-square w-full object-cover" />
                  {dims[url] && (
                    <span className="pointer-events-none absolute left-1/2 top-1 -translate-x-1/2 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-medium text-white opacity-0 transition group-hover:opacity-100">
                      {dims[url]}
                    </span>
                  )}
                  {i === 0 && (
                    <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-primary/90 px-1.5 py-0.5 text-center text-[10px] font-semibold text-primary-foreground">
                      ★ Primary photo
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => startTransition(() => { hideGalleryImage(url).then(() => router.refresh()); })}
                    title="Hide from public gallery (keeps it in your library)"
                    className="absolute left-1 top-1 rounded bg-black/70 px-1.5 py-0.5 text-xs text-white opacity-0 transition group-hover:opacity-100"
                  >
                    Hide
                  </button>
                  <button
                    type="button"
                    onClick={() => startTransition(() => { removeGalleryImage(url).then(() => router.refresh()); })}
                    title="Delete permanently"
                    className="absolute right-1 top-1 rounded bg-black/70 px-1.5 py-0.5 text-xs text-white opacity-0 transition group-hover:opacity-100"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="mb-3">
            <p className="mb-2 text-xs font-medium text-muted-foreground">
              Hidden from your public gallery ({hiddenGalleryImages.length}) — kept in your library. Drag photos in or out to hide or show them.
            </p>
            <div
              className={`grid grid-cols-3 gap-3 rounded-lg sm:grid-cols-5 ${dropZone === "hidden" ? "outline outline-2 outline-dashed outline-primary" : ""}`}
              onDragOver={(e) => { if (dragSource.current === "gallery") { e.preventDefault(); setDropZone("hidden"); } }}
              onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDropZone(null); }}
              onDrop={(e) => { if (dragSource.current === "gallery" && dragUrl.current) { e.preventDefault(); moveToHidden(dragUrl.current); } setDropZone(null); }}
            >
              {hiddenGalleryImages.length === 0 && (
                <div className="col-span-full rounded-lg border border-dashed border-border px-4 py-6 text-center text-xs text-muted-foreground">
                  Drag a gallery photo here to hide it from your public site.
                </div>
              )}
              {hiddenGalleryImages.map((url) => (
                <div
                  key={url}
                  draggable
                  onDragStart={(e) => {
                    dragUrl.current = url;
                    dragSource.current = "hidden";
                    e.dataTransfer.setData("text/uri-list", url);
                    e.dataTransfer.setData("text/plain", url);
                    e.dataTransfer.effectAllowed = "copyMove";
                  }}
                  onDragEnd={endDrag}
                  title="Drag into the gallery above to show this photo publicly"
                  className="group relative cursor-grab overflow-hidden rounded-lg border border-border opacity-60 transition active:cursor-grabbing hover:opacity-100"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" draggable={false} onLoad={(e) => onImgLoad(url, e)} className="aspect-square w-full object-cover" />
                  {dims[url] && (
                    <span className="pointer-events-none absolute left-1/2 top-1 -translate-x-1/2 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-medium text-white opacity-0 transition group-hover:opacity-100">
                      {dims[url]}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => startTransition(() => { showGalleryImage(url).then(() => router.refresh()); })}
                    title="Show in public gallery"
                    className="absolute left-1 top-1 rounded bg-primary px-1.5 py-0.5 text-xs text-primary-foreground opacity-0 transition group-hover:opacity-100"
                  >
                    Show
                  </button>
                  <button
                    type="button"
                    onClick={() => startTransition(() => { removeGalleryImage(url).then(() => router.refresh()); })}
                    title="Delete permanently"
                    className="absolute right-1 top-1 rounded bg-black/70 px-1.5 py-0.5 text-xs text-white opacity-0 transition group-hover:opacity-100"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input ref={galleryInput} type="file" accept="image/*" multiple disabled={disabled || busy === "gallery"} onChange={() => upload("gallery", galleryInput.current)} className="text-sm text-muted-foreground file:mr-3 file:rounded-md file:border file:border-input file:bg-transparent file:px-3 file:py-1.5 file:text-sm file:text-foreground" />
            {busy === "gallery" && <span className="text-xs text-muted-foreground">Uploading…</span>}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            The first photo is your <span className="font-medium text-foreground">primary photo</span> — it leads your gallery. Drag any photo to the front to make it primary (or onto the hero to feature it). Select multiple photos to upload at once, and hover + click ✕ to remove one.
          </p>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    </section>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-foreground">
        {label} {required && <span className="text-destructive">*</span>}
      </span>
      {children}
    </label>
  );
}

function SubscriberRow({ sub, onDelete }: { sub: Subscriber; onDelete: () => void }) {
  return (
    <tr className="border-b border-border/60">
      <td className="py-2.5 pr-4">
        <span className="font-medium text-foreground">{sub.email}</span>
        {sub.name && <span className="ml-2 text-muted-foreground">{sub.name}</span>}
      </td>
      <td className="py-2.5 pr-4">
        {sub.notifyOptIn ? (
          <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs text-emerald-500">Opted in</span>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )}
      </td>
      <td className="py-2.5 pr-4 text-muted-foreground">{sub.source ?? "—"}</td>
      <td className="py-2.5 pr-4 text-muted-foreground">
        {new Date(sub.createdAt).toLocaleDateString()}
      </td>
      <td className="py-2.5 text-right">
        <Button variant="ghost" size="xs" onClick={onDelete}>Remove</Button>
      </td>
    </tr>
  );
}
