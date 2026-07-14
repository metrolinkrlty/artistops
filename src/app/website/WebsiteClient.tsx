"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { saveArtistSite, deleteSubscriber, type SocialLinks } from "./actions";

type ArtistSite = {
  slug: string;
  displayName: string;
  tagline: string | null;
  location: string | null;
  bio: string | null;
  socialLinks: unknown;
} | null;

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
}: {
  site: ArtistSite;
  subscribers: Subscriber[];
}) {
  const social = (site?.socialLinks as SocialLinks) || {};
  const [status, setStatus] = useState<{ ok?: boolean; error?: string } | null>(null);
  const [pending, startTransition] = useTransition();

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
          </div>
          <Field label="Bio">
            <textarea
              name="bio"
              defaultValue={site?.bio ?? ""}
              rows={4}
              placeholder="Short artist bio…"
              className="w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
            />
          </Field>

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
