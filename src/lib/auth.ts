// Runtime-agnostic auth crypto (works in both edge middleware and Node server).
// Uses Web Crypto (globalThis.crypto.subtle), available in both runtimes.

const enc = new TextEncoder();

function toB64(bytes: ArrayBuffer | Uint8Array): string {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let bin = "";
  for (let i = 0; i < arr.length; i++) bin += String.fromCharCode(arr[i]);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromB64(s: string): Uint8Array {
  const b = atob(s.replace(/-/g, "+").replace(/_/g, "/"));
  const out = new Uint8Array(b.length);
  for (let i = 0; i < b.length; i++) out[i] = b.charCodeAt(i);
  return out;
}

// ---------- Password hashing (PBKDF2-SHA256) ----------

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey("raw", enc.encode(password) as BufferSource, "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt: salt as BufferSource, iterations: 100_000, hash: "SHA-256" }, key, 256);
  return `pbkdf2$${toB64(salt)}$${toB64(bits)}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split("$");
  if (parts.length !== 3 || parts[0] !== "pbkdf2") return false;
  const salt = fromB64(parts[1]);
  const key = await crypto.subtle.importKey("raw", enc.encode(password) as BufferSource, "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt: salt as BufferSource, iterations: 100_000, hash: "SHA-256" }, key, 256);
  return toB64(bits) === parts[2];
}

// ---------- Signed session token: "<userId>.<status>.<admin>.<hmac(payload)>" ----------
// The status + admin flag ride inside the signed token so middleware can gate
// access with zero DB or network round-trips on every request. HMAC covers the
// whole payload, so the claims can't be tampered with.

async function hmac(data: string): Promise<string> {
  const secret = process.env.SESSION_TOKEN || "dev-secret";
  const key = await crypto.subtle.importKey("raw", enc.encode(secret) as BufferSource, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(data) as BufferSource);
  return toB64(sig);
}

export type SessionClaims = { userId: string; status: string; isAdmin: boolean };

export async function signSession(userId: string, status: string = "APPROVED", isAdmin: boolean = false): Promise<string> {
  const payload = `${userId}.${status}.${isAdmin ? "1" : "0"}`;
  return `${payload}.${await hmac(payload)}`;
}

// Verify signature and return all claims. Rejects the old 2-part token format
// (those sessions simply re-authenticate once).
export async function verifySessionClaims(value: string | undefined | null): Promise<SessionClaims | null> {
  if (!value) return null;
  const idx = value.lastIndexOf(".");
  if (idx <= 0) return null;
  const payload = value.slice(0, idx);
  const sig = value.slice(idx + 1);
  const expected = await hmac(payload);
  if (sig.length !== expected.length) return null;
  let diff = 0;
  for (let i = 0; i < sig.length; i++) diff |= sig.charCodeAt(i) ^ expected.charCodeAt(i);
  if (diff !== 0) return null;
  const parts = payload.split(".");
  if (parts.length !== 3) return null; // old format or malformed
  return { userId: parts[0], status: parts[1], isAdmin: parts[2] === "1" };
}

// Back-compat: callers that only need the user id.
export async function verifySession(value: string | undefined | null): Promise<string | null> {
  const claims = await verifySessionClaims(value);
  return claims?.userId ?? null;
}

export const SESSION_COOKIE = "ao_session";
export const IDLE_SECONDS = 60 * 30;

// ---------- One-way token hashing (for password-reset tokens) ----------

export function randomToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return toB64(bytes);
}

export async function hashToken(token: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", enc.encode(token) as BufferSource);
  return toB64(digest);
}
