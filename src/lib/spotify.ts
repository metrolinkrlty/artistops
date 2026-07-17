// Spotify Web API helpers for native pre-save. Operator plumbing — the artist
// never sees any of this; they only see the campaign UI (built later).
//
// Env vars (set once by the operator, not per artist):
//   SPOTIFY_CLIENT_ID
//   SPOTIFY_CLIENT_SECRET
//   SPOTIFY_REDIRECT_URI   e.g. https://artistops.net/api/presave/callback

// Scopes we request from a fan when they pre-save:
//   user-library-modify  — add the release to their Saved songs on release day
//   user-follow-modify   — follow the artist (optional per campaign)
export const PRESAVE_SCOPES = ["user-library-modify", "user-follow-modify"] as const;

const AUTH_BASE = "https://accounts.spotify.com";
const API_BASE = "https://api.spotify.com/v1";

function clientCreds() {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  const redirectUri = process.env.SPOTIFY_REDIRECT_URI;
  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error(
      "Spotify pre-save is not configured. Set SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, and SPOTIFY_REDIRECT_URI."
    );
  }
  return { clientId, clientSecret, redirectUri };
}

// Where we send a fan to grant access. `state` carries the campaign slug (signed
// by the caller) so the callback knows which release this pre-save is for.
export function buildAuthorizeUrl(state: string): string {
  const { clientId, redirectUri } = clientCreds();
  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    redirect_uri: redirectUri,
    scope: PRESAVE_SCOPES.join(" "),
    state,
    show_dialog: "false",
  });
  return `${AUTH_BASE}/authorize?${params.toString()}`;
}

type TokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope: string;
  token_type: string;
};

async function tokenRequest(body: URLSearchParams): Promise<TokenResponse> {
  const { clientId, clientSecret } = clientCreds();
  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const res = await fetch(`${AUTH_BASE}/api/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
    cache: "no-store",
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Spotify token exchange failed (${res.status}): ${detail}`);
  }
  return res.json();
}

// One-time exchange of the callback `code` for tokens. The refresh_token is what
// we encrypt and store; the access_token is short-lived and used immediately.
export function exchangeCodeForTokens(code: string): Promise<TokenResponse> {
  const { redirectUri } = clientCreds();
  return tokenRequest(
    new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
    })
  );
}

// On release day we swap the stored refresh_token for a fresh access_token.
export function refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
  return tokenRequest(
    new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    })
  );
}

// The fan's Spotify user id — our dedupe key so one person can't double-pre-save.
export async function getSpotifyUserId(accessToken: string): Promise<string> {
  const res = await fetch(`${API_BASE}/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Spotify /me failed (${res.status}): ${detail}`);
  }
  const data = (await res.json()) as { id: string };
  return data.id;
}
