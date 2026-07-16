import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE, verifySession } from "@/lib/auth";

const IMPERSONATE_COOKIE = "ao_impersonate";

// Cached per request: the layout, the page, and impersonation checks all read
// the session user, so memoizing collapses them to a single verify + query.
const getSessionUserId = cache(async (): Promise<string | null> => {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  return verifySession(token);
});

// Cached per request. Excludes passwordHash (never needed off the session user)
// and dedupes the repeated by-id lookups the hot path otherwise fires.
const getUserById = cache(async (id: string) => {
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      artistName: true,
      isAdmin: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  });
});

// Returns the effective userId — impersonated target if admin is impersonating.
export async function getCurrentUserId(): Promise<string | null> {
  const store = await cookies();
  const sessionId = await getSessionUserId();
  if (!sessionId) return null;

  const impersonateId = store.get(IMPERSONATE_COOKIE)?.value;
  if (!impersonateId) return sessionId;

  // Honour the impersonate cookie only if the session user is actually admin.
  // Shares the cached lookup, so repeated requireUserId() calls cost one query.
  try {
    const row = await getUserById(sessionId);
    if (row?.isAdmin) return impersonateId;
  } catch {
    // DB error — fall back to the real session user.
  }
  return sessionId;
}

export async function requireUserId(): Promise<string> {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/login");
  return userId;
}

// Returns the actual signed-in user (never the impersonated one).
// Used by the layout to get admin info and the artist name for the sidebar.
export async function getCurrentUser() {
  const sessionId = await getSessionUserId();
  if (!sessionId) return null;
  return getUserById(sessionId);
}

// Returns admin context for the layout banner.
export async function getAdminContext(): Promise<{
  adminUser: { id: string; artistName: string; isAdmin: boolean } | null;
  viewingAs: { id: string; artistName: string } | null;
}> {
  const store = await cookies();
  const sessionId = await getSessionUserId();
  if (!sessionId) return { adminUser: null, viewingAs: null };

  const user = await getUserById(sessionId).catch(() => null);
  if (!user?.isAdmin) return { adminUser: null, viewingAs: null };
  const adminUser = { id: user.id, artistName: user.artistName, isAdmin: user.isAdmin };

  const impersonateId = store.get(IMPERSONATE_COOKIE)?.value;
  if (!impersonateId) return { adminUser, viewingAs: null };

  const target = await getUserById(impersonateId).catch(() => null);
  return {
    adminUser,
    viewingAs: target ? { id: target.id, artistName: target.artistName } : null,
  };
}
