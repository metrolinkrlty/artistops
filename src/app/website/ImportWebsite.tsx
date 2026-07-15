"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { importFromWebsite } from "./import-actions";

export default function ImportWebsite({
  onDone,
}: {
  onDone: (slug: string, summary: string[]) => void;
}) {
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function go() {
    const u = url.trim();
    if (!u || busy) return;
    setBusy(true);
    setError(null);
    const res = await importFromWebsite(u);
    setBusy(false);
    if (res.ok && res.slug) onDone(res.slug, res.summary ?? []);
    else setError(res.error || "Import failed.");
  }

  return (
    <div>
      <div className="flex gap-2">
        <Input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://your-website.com"
          disabled={busy}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              go();
            }
          }}
        />
        <Button onClick={go} disabled={busy || !url.trim()}>
          {busy ? "Importing…" : "Import"}
        </Button>
      </div>
      {busy && (
        <p className="mt-2 text-xs text-muted-foreground">
          Reading your site and pulling in your photos &amp; details — this can take 20–40 seconds.
        </p>
      )}
      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
    </div>
  );
}
