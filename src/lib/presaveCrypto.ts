import crypto from "crypto";

// Fan Spotify refresh tokens are long-lived credentials — we never store them in
// the clear. AES-256-GCM with a 32-byte key from PRESAVE_ENC_KEY (hex or base64).
// Operator setup only; nothing here is artist-facing.

function getKey(): Buffer {
  const raw = process.env.PRESAVE_ENC_KEY;
  if (!raw) {
    throw new Error(
      "PRESAVE_ENC_KEY is not set. Generate one with: openssl rand -hex 32"
    );
  }
  // Accept hex (64 chars) or base64; must decode to exactly 32 bytes.
  let key: Buffer;
  if (/^[0-9a-fA-F]{64}$/.test(raw)) {
    key = Buffer.from(raw, "hex");
  } else {
    key = Buffer.from(raw, "base64");
  }
  if (key.length !== 32) {
    throw new Error("PRESAVE_ENC_KEY must decode to 32 bytes (use: openssl rand -hex 32).");
  }
  return key;
}

// Returns "iv.tag.ciphertext", all base64url. Safe to store in a text column.
export function encryptToken(plaintext: string): string {
  const key = getKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const ct = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv, tag, ct].map((b) => b.toString("base64url")).join(".");
}

export function decryptToken(stored: string): string {
  const key = getKey();
  const [ivB64, tagB64, ctB64] = stored.split(".");
  if (!ivB64 || !tagB64 || !ctB64) throw new Error("Malformed encrypted token.");
  const iv = Buffer.from(ivB64, "base64url");
  const tag = Buffer.from(tagB64, "base64url");
  const ct = Buffer.from(ctB64, "base64url");
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ct), decipher.final()]).toString("utf8");
}

// The OAuth `state` round-trips through Spotify, so it must be tamper-proof: we
// sign the campaign slug (plus a timestamp) with HMAC. The callback verifies it
// before trusting which campaign a pre-save belongs to.
export function signState(slug: string): string {
  const key = getKey();
  const payload = `${slug}:${Date.now()}`;
  const sig = crypto
    .createHmac("sha256", key)
    .update(payload)
    .digest("base64url");
  return `${Buffer.from(payload).toString("base64url")}.${sig}`;
}

// Returns the campaign slug if the state is authentic and under maxAgeMs old.
export function verifyState(state: string, maxAgeMs = 60 * 60 * 1000): string | null {
  const key = getKey();
  const [payloadB64, sig] = state.split(".");
  if (!payloadB64 || !sig) return null;
  const payload = Buffer.from(payloadB64, "base64url").toString("utf8");
  const expected = crypto
    .createHmac("sha256", key)
    .update(payload)
    .digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  const [slug, tsRaw] = payload.split(":");
  const ts = Number(tsRaw);
  if (!slug || !Number.isFinite(ts) || Date.now() - ts > maxAgeMs) return null;
  return slug;
}
