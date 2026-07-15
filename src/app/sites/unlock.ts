// Plain (non-server) helper so it can be imported by route handlers, server
// components, and the "use server" actions file alike. A "use server" file may
// only export async functions, so this can't live in actions.ts.

export function unlockCookieName(slug: string) {
  return `sites_unlock_${slug}`;
}

export const UNLOCK_MAX_AGE = 60 * 60 * 24 * 180; // 180 days
