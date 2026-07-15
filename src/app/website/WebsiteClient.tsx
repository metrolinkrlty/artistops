"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { saveArtistSite, deleteSubscriber, type SocialLinks } from "./actions";
import { SECTION_KEYS, type Show } from "./site-fields";
import AiEditor from "./AiEditor";

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
