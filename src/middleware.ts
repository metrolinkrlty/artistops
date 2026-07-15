import { NextRequest, NextResponse } from "next/server";
import { verifySession, signSession, SESSION_COOKIE, IDLE_SECONDS } from "@/lib/auth";

const PUBLIC_PREFIXES = [
  "/login", "/forgot-password", "/reset-password", "/pending-approval",
  "/api/login", "/api/signup", "/api/logout", "/api/forgot-password", "/api/reset-password",
  "/api/user-status", "/listen/", "/api/pixel", "/api/smart-link-click",
  "/api/site/", "/sites/",
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

  // Pass userId to the page layer via a header — pages/actions
  // call requireUserId() which reads from the session cookie directly.
  // We check status via a lightweight API call only if the token is valid.
  let status = "APPROVED"; // optimistic default — pages enforce auth too
  let isAdmin = false;
  try {
    const base = req.nextUrl.origin;
    const res = await fetch(
      `${base}/api/user-status?userId=${encodeURIComponent(userId)}`,
      {
        headers: { "x-internal-check": process.env.SESSION_TOKEN || "" },
        signal: AbortSignal.timeout(3000),
      }
    );
    if (res.ok) {
      const data = await res.json();
      status = data.status ?? "APPROVED";
      isAdmin = data.isAdmin ?? false;
    }
  } catch {
    // If status check fails, allow through — page-level auth still protects data
  }

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
