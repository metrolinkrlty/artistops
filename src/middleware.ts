import { NextRequest, NextResponse } from "next/server";
import { verifySession, signSession, SESSION_COOKIE, IDLE_SECONDS } from "@/lib/auth";

const PUBLIC_PREFIXES = [
  "/login", "/forgot-password", "/reset-password", "/pending-approval",
  "/api/login", "/api/signup", "/api/logout", "/api/forgot-password", "/api/reset-password",
  "/listen/", "/api/pixel", "/api/smart-link-click",
];

const IMPERSONATE_COOKIE = "ao_impersonate";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const userId = await verifySession(token);

  if (!userId) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    if (pathname !== "/") url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  // Fetch user status from DB via the edge-compatible API route
  // We pass userId as a header so the status check API can verify
  const statusRes = await fetch(`${req.nextUrl.origin}/api/user-status?userId=${userId}`, {
    headers: { "x-internal-check": process.env.SESSION_TOKEN || "" },
  }).catch(() => null);

  if (statusRes?.ok) {
    const { status, isAdmin, impersonating } = await statusRes.json().catch(() => ({}));

    // PENDING users can only see /pending-approval
    if (status === "PENDING" && !isAdmin) {
      const url = req.nextUrl.clone();
      url.pathname = "/pending-approval";
      return NextResponse.redirect(url);
    }

    // Admin users: redirect / to /admin (unless they're impersonating)
    const impersonateId = req.cookies.get(IMPERSONATE_COOKIE)?.value;
    if (isAdmin && pathname === "/" && !impersonateId) {
      const url = req.nextUrl.clone();
      url.pathname = "/admin";
      return NextResponse.redirect(url);
    }
  }

  // Refresh rolling session cookie
  const res = NextResponse.next();
  res.cookies.set(SESSION_COOKIE, await signSession(userId), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: IDLE_SECONDS,
  });
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.svg$).*)"],
};
