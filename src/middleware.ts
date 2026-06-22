import { NextRequest, NextResponse } from "next/server";
import { verifySession, signSession, SESSION_COOKIE, IDLE_SECONDS } from "@/lib/auth";

const PUBLIC_PREFIXES = ["/login", "/api/login", "/api/signup", "/api/logout", "/listen/", "/api/pixel", "/api/smart-link-click"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const userId = await verifySession(token);

  if (userId) {
    // Valid session — refresh the cookie so the 30-min idle window rolls forward.
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

  const url = req.nextUrl.clone();
  url.pathname = "/login";
  if (pathname !== "/") url.searchParams.set("from", pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.svg$).*)"],
};
