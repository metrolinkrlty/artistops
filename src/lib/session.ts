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

export async function getCurrentUserId(): Promise<string | null> {
  const store = await cookies();
  const adminId = await getSessionUserId();
  if (!adminId) return null;

  // If admin is impersonating, verify they're actually admin, then return the impersonated userId
  const impersonateId = store.get(IMPERSONATE_COOKIE)?.value;
  if (impersonateId) {
    const admin = await prisma.user.findUnique({ where: { id: adminId }, select: { isAdmin: true } });
    if (admin?.isAdmin) return impersonateId;
  }
  return adminId;
}

export async function requireUserId(): Promise<string> {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/login");
  return userId;
}

export async function getCurrentUser() {
  const sessionId = await getSessionUserId();
  if (!sessionId) return null;
  return prisma.user.findUnique({ where: { id: sessionId } });
}

// Returns both the real admin user and who they're viewing as (if impersonating)
export async function getAdminContext(): Promise<{ adminUser: { id: string; artistName: string; isAdmin: boolean } | null; viewingAs: { id: string; artistName: string } | null }> {
  const store = await cookies();
  const adminId = await getSessionUserId();
  if (!adminId) return { adminUser: null, viewingAs: null };

  const adminUser = await prisma.user.findUnique({ where: { id: adminId }, select: { id: true, artistName: true, isAdmin: true } });
  if (!adminUser?.isAdmin) return { adminUser: null, viewingAs: null };

  const impersonateId = store.get(IMPERSONATE_COOKIE)?.value;
  if (!impersonateId) return { adminUser, viewingAs: null };

  const target = await prisma.user.findUnique({ where: { id: impersonateId }, select: { id: true, artistName: true } });
  return { adminUser, viewingAs: target };
}
