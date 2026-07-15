"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles } from "lucide-react";
import { saveArtistSite } from "./actions";

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function Onboarding() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [tagline, setTagline] = useState("");
  const [location, setLocation] = useState("");
  const [accent, setAccent] = useState("#e0a530");
  const [bio, setBio] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [doneSlug, setDoneSlug] = useState<string | null>(null);

  const effectiveSlug = slugTouched ? slug : slugify(name);

  async function create() {
    setBusy(true);
    setError(null);
    const fd = new FormData();
    fd.set("displayName", name.trim());
    fd.set("slug", effectiveSlug);
    fd.set("tagline", tagline.trim());
    fd.set("location", location.trim());
    fd.set("bio", bio.trim());
    fd.set("themeColor", accent);
    // Sensible defaults for a fresh site: sections visible.
    fd.set("section_gallery", "on");
    fd.set("section_shows", "on");
    const res = await saveArtistSite(fd);
    setBusy(false);
    if (res.ok) setDoneSlug(effectiveSlug);
    else setError(res.error || "Something went wrong.");
  }

  if (doneSlug) {
    return (
      <div className="mx-auto max-w-lg p-6">
        <div className="rounded-2xl border border-border bg-card p-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full" style={{ backgroundColor: accent }}>
            <Sparkles className="h-6 w-6 text-neutral-950" />
          </div>
          <h2 className="mb-1 text-xl font-semibold">Your site is live 🎉</h2>
          <p className="mb-6 text-sm text-muted-foreground">
            It&rsquo;s published at <span className="font-medium text-foreground">artistops.net/sites/{doneSlug}</span>
          </p>
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
            <a href={`/sites/${doneSlug}`} target="_blank" rel="noopener noreferrer">
              <Button className="w-full sm:w-auto">View my site</Button>
            </a>
            <Button variant="outline" onClick={() => router.refresh()} className="w-full sm:w-auto">
              Customize it
            </Button>
          </div>
          <p className="mt-6 text-xs text-muted-foreground">
            Add photos, music, and more — or just chat with the AI editor — from your dashboard.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg p-6">
      <div className="rounded-2xl border border-border bg-card p-8">
        <div className="mb-6 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">Let&rsquo;s build your website</h2>
        </div>

        {/* Progress */}
        <div className="mb-6 flex gap-1.5">
          {[1, 2, 3].map((n) => (
            <div key={n} className={`h-1.5 flex-1 rounded-full ${n <= step ? "bg-primary" : "bg-border"}`} />
          ))}
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Start with your name — everything else you can change later.</p>
            <Field label="Artist / band name">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Luke Corliss"
                autoFocus
              />
            </Field>
            <Field label="Your site address">
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <span className="shrink-0">artistops.net/sites/</span>
                <Input
                  value={effectiveSlug}
                  onChange={(e) => {
                    setSlugTouched(true);
                    setSlug(slugify(e.target.value));
                  }}
                  placeholder="luke-corliss"
                />
              </div>
            </Field>
            <div className="flex justify-end">
              <Button disabled={!name.trim() || !effectiveSlug} onClick={() => setStep(2)}>
                Next
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Set the vibe. This shapes your homepage.</p>
            <Field label="Tagline / genre">
              <Input value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="Honky-tonk, rockabilly & western rock" autoFocus />
            </Field>
            <Field label="Location">
              <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Greeley, Colorado" />
            </Field>
            <Field label="Accent color">
              <div className="flex items-center gap-2">
                <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="h-8 w-10 shrink-0 cursor-pointer rounded border border-input bg-transparent" aria-label="Accent color" />
                <Input value={accent} onChange={(e) => setAccent(e.target.value)} placeholder="#e0a530" />
              </div>
            </Field>
            <div className="flex justify-between">
              <Button variant="ghost" onClick={() => setStep(1)}>Back</Button>
              <Button onClick={() => setStep(3)}>Next</Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Optional — a short bio for your About section. You can leave this blank and add it later.</p>
            <Field label="Bio">
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={5}
                placeholder="Tell fans who you are… (separate paragraphs with a blank line)"
                className="w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
                autoFocus
              />
            </Field>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex justify-between">
              <Button variant="ghost" onClick={() => setStep(2)} disabled={busy}>Back</Button>
              <Button onClick={create} disabled={busy}>
                {busy ? "Creating…" : "Create my site"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-foreground">{label}</span>
      {children}
    </label>
  );
}
