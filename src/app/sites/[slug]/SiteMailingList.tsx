"use client";

import { useState } from "react";

// Posts to the existing public per-slug subscribe endpoint.
export default function SiteMailingList({ slug }: { slug: string }) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || state === "sending") return;
    setState("sending");
    setError(null);
    try {
      const res = await fetch(`/api/site/${slug}/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          name: name.trim() || undefined,
          notifyOptIn: true,
          source: "site_mailing_list",
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        setState("error");
        setError(data.error || "Something went wrong. Try again.");
      } else {
        setState("done");
      }
    } catch {
      setState("error");
      setError("Couldn't reach the server. Try again.");
    }
  }

  if (state === "done") {
    return (
      <p className="rounded-xl border border-[var(--accent)]/40 bg-white/[0.03] px-6 py-5 text-center text-neutral-100">
        You&rsquo;re on the list — thanks for signing up.
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto flex max-w-md flex-col gap-3">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Name (optional)"
        className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3 text-neutral-100 outline-none placeholder:text-neutral-500 focus:border-[var(--accent)]"
      />
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@email.com"
        className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3 text-neutral-100 outline-none placeholder:text-neutral-500 focus:border-[var(--accent)]"
      />
      <button
        type="submit"
        disabled={state === "sending"}
        className="rounded-lg px-6 py-3 font-semibold text-neutral-950 transition disabled:opacity-60"
        style={{ backgroundColor: "var(--accent)" }}
      >
        {state === "sending" ? "Joining…" : "Join the Mailing List"}
      </button>
      {error && <p className="text-sm text-red-400">{error}</p>}
    </form>
  );
}
