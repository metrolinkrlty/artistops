import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE, verifySession } from "@/lib/auth";

const IMPERSONATE_COOKIE = "ao_impersonate";

async function getSessionUserId(): Promise<string | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  return verifySession(token);
}

// Returns the effective userId — impersonated target if admin is impersonating
export async function getCurrentUserId(): Promise<string | null> {
  const store = await cookies();
  const sessionId = await getSessionUserId();
  if (!sessionId) return null;

  const impersonateId = store.get(IMPERSONATE_COOKIE)?.value;
  if (!impersonateId) return sessionId;

  // Verify the session user is actually admin before honouring the impersonate cookie.
  // Use a fast single-column query to minimise pool pressure.
  try {
    const row = await prisma.user.findUnique({
      where: { id: sessionId },
      select: { isAdmin: true },
    });
    if (row?.isAdmin) return impersonateId;
  } catch {
    // Pool exhausted or DB error — fall back to the real session user
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
  return prisma.user.findUnique({ where: { id: sessionId } });
}

// Returns admin context for the layout banner.
export async function getAdminContext(): Promise<{
  adminUser: { id: string; artistName: string; isAdmin: boolean } | null;
  viewingAs: { id: string; artistName: string } | null;
}> {
  const store = await cookies();
  const sessionId = await getSessionUserId();
  if (!sessionId) return { adminUser: null, viewingAs: null };

  const adminUser = await prisma.user
    .findUnique({ where: { id: sessionId }, select: { id: true, artistName: true, isAdmin: true } })
    .catch(() => null);

  if (!adminUser?.isAdmin) return { adminUser: null, viewingAs: null };

  const impersonateId = store.get(IMPERSONATE_COOKIE)?.value;
  if (!impersonateId) return { adminUser, viewingAs: null };

  const target = await prisma.user
    .findUnique({ where: { id: impersonateId }, select: { id: true, artistName: true } })
    .catch(() => null);

  return { adminUser, viewingAs: target };
}
