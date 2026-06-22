import { NextRequest, NextResponse } from "next/server";

// Paths that never require authentication.
const PUBLIC_PREFIXES = ["/login", "/api/login", "/api/logout", "/listen/", "/api/pixel", "/api/smart-link-click"];

const SESSION_COOKIE = "ao_session";
const IDLE_SECONDS = 60 * 30; // 30 minutes rolling timeout

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const expected = process.env.SESSION_TOKEN || "";

  if (expected && token === expected) {
    // Valid session — refresh the cookie so the 30-min window rolls forward on use.
    const res = NextResponse.next();
    res.cookies.set(SESSION_COOKIE, expected, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: IDLE_SECONDS,
    });
    return res;
  }

  const url = req.nextUrl.clone();
  url.pathname = "/login";
  if (pathname !== "/") url.searchParams.set("from", pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.svg$).*)"],
};
