import "server-only";
import { lookup } from "dns/promises";
import net from "net";

// Helpers for importing an artist's existing website. Kept out of any
// "use server" file so we can export non-async utilities.

function ipv4IsPrivate(ip: string): boolean {
  const p = ip.split(".").map(Number);
  if (p.length !== 4 || p.some((n) => Number.isNaN(n))) return true;
  const [a, b] = p;
  return (
    a === 10 ||
    a === 127 ||
    a === 0 ||
    (a === 169 && b === 254) || // link-local incl. cloud metadata 169.254.169.254
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 100 && b >= 64 && b <= 127) // CGNAT
  );
}

function ipIsPrivate(ip: string): boolean {
  if (net.isIPv4(ip)) return ipv4IsPrivate(ip);
  // IPv6: block loopback, unique-local (fc00::/7), link-local (fe80::/10),
  // and IPv4-mapped private addresses.
  const low = ip.toLowerCase();
  if (low === "::1" || low === "::") return true;
  if (low.startsWith("fc") || low.startsWith("fd")) return true;
  if (low.startsWith("fe8") || low.startsWith("fe9") || low.startsWith("fea") || low.startsWith("feb")) return true;
  const mapped = low.match(/::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return ipv4IsPrivate(mapped[1]);
  return false;
}

// Validates a user-supplied URL and blocks SSRF to internal/private hosts.
export async function assertSafeUrl(raw: string): Promise<URL> {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    throw new Error("That doesn't look like a valid URL.");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Only http(s) websites can be imported.");
  }
  const host = url.hostname.toLowerCase().replace(/\.$/, "");
  if (host === "localhost" || host.endsWith(".local") || host.endsWith(".internal")) {
    throw new Error("That host isn't allowed.");
  }
  // If it's an IP literal, check directly; otherwise resolve and check.
  if (net.isIP(host)) {
    if (ipIsPrivate(host)) throw new Error("That host isn't allowed.");
  } else {
    let address: string;
    try {
      ({ address } = await lookup(host));
    } catch {
      throw new Error("Couldn't resolve that website.");
    }
    if (ipIsPrivate(address)) throw new Error("That host isn't allowed.");
  }
  return url;
}

// Fetch with a wall-clock timeout and a hard byte cap (streams, aborts early).
export async function fetchCapped(
  url: string,
  { maxBytes, timeoutMs, accept }: { maxBytes: number; timeoutMs: number; accept?: string }
): Promise<{ contentType: string; bytes: Uint8Array }> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      redirect: "follow",
      headers: {
        "User-Agent": "ArtistOpsImporter/1.0",
        ...(accept ? { Accept: accept } : {}),
      },
    });
    if (!res.ok) throw new Error(`Fetch failed (${res.status}).`);
    const contentType = res.headers.get("content-type") || "";
    const reader = res.body?.getReader();
    if (!reader) throw new Error("Empty response.");
    const chunks: Uint8Array[] = [];
    let total = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        total += value.byteLength;
        if (total > maxBytes) {
          await reader.cancel();
          break;
        }
        chunks.push(value);
      }
    }
    const bytes = new Uint8Array(total > maxBytes ? maxBytes : total);
    let off = 0;
    for (const c of chunks) {
      if (off + c.byteLength > bytes.length) {
        bytes.set(c.subarray(0, bytes.length - off), off);
        break;
      }
      bytes.set(c, off);
      off += c.byteLength;
    }
    return { contentType, bytes };
  } finally {
    clearTimeout(timer);
  }
}

// Strip scripts/styles/comments and truncate, keeping tags (img/a/meta/headings)
// so the model can still extract images, links, and text.
export function cleanHtmlForModel(html: string, maxChars = 60000): string {
  const cleaned = html
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, "")
    .replace(/<svg[\s\S]*?<\/svg>/gi, "")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned.slice(0, maxChars);
}

export function decodeHtml(bytes: Uint8Array): string {
  return new TextDecoder("utf-8", { fatal: false }).decode(bytes);
}

// Map an Anthropic SDK failure to a clear, actionable message. `fallback` is
// used for unrecognized errors so each caller keeps its own default wording.
// This exists because a rejected API key (bad/revoked key, or no access to the
// model) otherwise surfaces as a vague "couldn't read the website".
export function describeAiError(err: unknown, fallback: string): string {
  const e = err as { status?: number; name?: string };
  switch (e?.status) {
    case 401:
      return "The AI service rejected the API key (invalid or revoked). Check the ANTHROPIC_API_KEY environment variable.";
    case 403:
      return "The AI API key doesn't have access to the required model (claude-opus-4-8).";
    case 404:
      return "The AI model (claude-opus-4-8) isn't available to this API key.";
    case 429:
      return "The AI service is rate-limited right now. Wait a moment and try again.";
    case 500:
    case 503:
    case 529:
      return "The AI service is temporarily unavailable. Please try again shortly.";
  }
  if (e?.name === "APIConnectionError" || e?.name === "APIConnectionTimeoutError") {
    return "Couldn't reach the AI service. Please try again.";
  }
  return fallback;
}
