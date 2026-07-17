"use client";

import { useEffect, useRef, useState, useTransition } from "react";
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
  setHeroImage,
  type SocialLinks,
} from "./actions";
import { SECTION_KEYS, type Show } from "./site-fields";
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
  heroCtaPrimary: string | null;
  heroCtaSecondary: string | null;
  previewSeconds: number;
  unlockGate: string;
  unlockFollowUrl: string | null;
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
}: {
  site: ArtistSite;
  subscribers: Subscriber[];
  isAdmin: boolean;
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

  // The address pool that drives the dropdowns. Editing the list updates the
  // dropdown options live.
  const [availableText, setAvailableText] = useState(
    (site?.availableEmails ?? []).join("\n")
  );
  const emailOptions = Array.from(
    new Set([
      ...availableText
        .split(/[\n,]+/)
        .map((e) => e.trim().toLowerCase())
        .filter((e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)),
      ...(isAdmin ? ADMIN_ONLY_EMAILS : []),
    ])
  );

  async function onSave(formData: FormData) {
    setStatus(null);
    const res = await saveArtistSite(formData);
    setStatus(res);
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
        <form action={onSave} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Display name" required>
              <Input name="displayName" defaultValue={site?.displayName ?? ""} placeholder="Luke Corliss" required />
            </Field>
            <Field label="Slug" required>
              <Input name="slug" defaultValue={site?.slug ?? ""} placeholder="luke-corliss" required />
            </Field>
            <Field label="Tagline">
              <Input name="tagline" defaultValue={site?.tagline ?? ""} placeholder="Honky-tonk, rockabilly & western rock" />
            </Field>
            <Field label="Location">
              <Input name="location" defaultValue={site?.location ?? ""} placeholder="Greeley, Colorado" />
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
            <h3 className="mb-1 text-sm font-semibold">Song unlock gate</h3>
            <p className="mb-3 text-xs text-muted-foreground">
              Fans hear a preview, then unlock the full songs. Choose how they unlock.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Preview length (seconds)">
                <Input name="previewSeconds" type="number" min={5} max={30} defaultValue={site?.previewSeconds ?? 30} />
              </Field>
              <Field label="Unlock method">
                <select
                  name="unlockGate"
                  defaultValue={site?.unlockGate ?? "email"}
                  className="w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
                >
                  <option value="email">Email — captures the address (recommended)</option>
                  <option value="share">Share — optimistic, grows reach</option>
                  <option value="follow">Follow — optimistic, grows a profile</option>
                </select>
              </Field>
            </div>
            <Field label="Follow / profile URL (used by the Follow method)">
              <Input name="unlockFollowUrl" defaultValue={site?.unlockFollowUrl ?? ""} placeholder="https://instagram.com/yourhandle" />
            </Field>
            <p className="mt-2 text-xs text-muted-foreground">
              Only Email gives you data you own; Share/Follow unlock on click and can&rsquo;t be verified.
            </p>
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
                placeholder={"Aug 3, 2026 | Moxi Theater | Greeley, CO | https://tickets.example.com"}
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
              <textarea
                name="availableEmails"
                value={availableText}
                onChange={(e) => setAvailableText(e.target.value)}
                rows={3}
                placeholder={"luke@lukecorliss.com\nadmin@lukecorliss.com\nhello@lukecorliss.com"}
                className="w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
              />
              <span className="text-xs text-muted-foreground">
                One per line. These populate the dropdowns below.
                {isAdmin && " Admin addresses are always available."}
              </span>
            </Field>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {EMAIL_FIELDS.map((f) => (
                <Field key={f.key} label={f.label}>
                  <select
                    name={f.key}
                    defaultValue={site?.[f.key] ?? ""}
                    className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
                  >
                    <option value="">— none —</option>
                    {emailOptions.map((addr) => (
                      <option key={addr} value={addr}>
                        {addr}
                        {ADMIN_ONLY_EMAILS.includes(addr) ? " (admin)" : ""}
                      </option>
                    ))}
                    {/* Keep a previously-saved value selectable even if not in the pool */}
                    {site?.[f.key] && !emailOptions.includes(site[f.key]!) && (
                      <option value={site[f.key]!}>{site[f.key]}</option>
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
            <div className="mb-3 grid grid-cols-3 gap-3 sm:grid-cols-5">
              {order.map((url) => (
                <div
                  key={url}
                  draggable
                  onDragStart={(e) => {
                    dragUrl.current = url;
                    e.dataTransfer.setData("text/uri-list", url);
                    e.dataTransfer.setData("text/plain", url);
                    e.dataTransfer.effectAllowed = "copyMove";
                  }}
                  onDragOver={(e) => { if (dragUrl.current && dragUrl.current !== url) { e.preventDefault(); setOverUrl(url); } }}
                  onDragLeave={() => setOverUrl((u) => (u === url ? null : u))}
                  onDrop={(e) => { e.preventDefault(); reorderTo(url); setOverUrl(null); }}
                  onDragEnd={() => { dragUrl.current = null; setOverUrl(null); }}
                  title="Drag onto another photo to reorder, or onto the hero to set it as the hero"
                  className={`group relative cursor-grab overflow-hidden rounded-lg border transition active:cursor-grabbing ${overUrl === url ? "border-primary ring-2 ring-primary" : "border-border"}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" draggable={false} className="aspect-square w-full object-cover" />
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
          {hiddenGalleryImages.length > 0 && (
            <div className="mb-3">
              <p className="mb-2 text-xs font-medium text-muted-foreground">
                Hidden from your public gallery ({hiddenGalleryImages.length}) — kept in your library
              </p>
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
                {hiddenGalleryImages.map((url) => (
                  <div key={url} className="group relative overflow-hidden rounded-lg border border-border opacity-60">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="" className="aspect-square w-full object-cover" />
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
          )}
          <div className="flex items-center gap-2">
            <input ref={galleryInput} type="file" accept="image/*" multiple disabled={disabled || busy === "gallery"} onChange={() => upload("gallery", galleryInput.current)} className="text-sm text-muted-foreground file:mr-3 file:rounded-md file:border file:border-input file:bg-transparent file:px-3 file:py-1.5 file:text-sm file:text-foreground" />
            {busy === "gallery" && <span className="text-xs text-muted-foreground">Uploading…</span>}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Select multiple photos to upload at once. Drag a photo to reorder it (or onto the hero to feature it), and hover + click ✕ to remove one.
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
