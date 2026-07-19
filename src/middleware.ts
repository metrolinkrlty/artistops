import { NextRequest, NextResponse } from "next/server";
import { verifySessionClaims, signSession, SESSION_COOKIE, IDLE_SECONDS } from "@/lib/auth";

const PUBLIC_PREFIXES = [
  "/login", "/forgot-password", "/reset-password", "/pending-approval",
  "/api/login", "/api/signup", "/api/logout", "/api/forgot-password", "/api/reset-password",
  "/api/user-status", "/listen/", "/api/pixel", "/api/smart-link-click",
  "/api/smartlink/", "/api/site/", "/sites/", "/api/booking/",
  // Release notify: fans are never logged into ArtistOps, so this page must be
  // reachable anonymously.
  "/notify/",
];

const IMPERSONATE_COOKIE = "ao_impersonate";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const claims = await verifySessionClaims(token);

  if (!claims) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    if (pathname !== "/") url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  // status + isAdmin ride inside the signed token — no DB or network call needed.
  const { userId, status, isAdmin } = claims;

  if ((status === "PENDING" || status === "REJECTED") && !isAdmin) {
    const url = req.nextUrl.clone();
    url.pathname = "/pending-approval";
    return NextResponse.redirect(url);
  }

  const impersonateId = req.cookies.get(IMPERSONATE_COOKIE)?.value;
  if (isAdmin && pathname === "/" && !impersonateId) {
    const url = req.nextUrl.clone();
    url.pathname = "/admin";
    return NextResponse.redirect(url);
  }

  const res = NextResponse.next();
  res.cookies.set(SESSION_COOKIE, await signSession(userId, status, isAdmin), {
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
