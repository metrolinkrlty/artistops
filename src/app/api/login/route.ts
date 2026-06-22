import { NextRequest, NextResponse } from "next/server";

const SESSION_COOKIE = "ao_session";
const IDLE_SECONDS = 60 * 30;

export async function POST(req: NextRequest) {
  let password = "";
  try {
    const body = await req.json();
    password = String(body.password || "");
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const expectedPass = process.env.SITE_PASSWORD;
  const token = process.env.SESSION_TOKEN;

  if (!expectedPass || !token) {
    return NextResponse.json({ ok: false, error: "Auth not configured" }, { status: 500 });
  }

  if (password === expectedPass) {
    const res = NextResponse.json({ ok: true });
    res.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: IDLE_SECONDS,
    });
    return res;
  }

  return NextResponse.json({ ok: false, error: "Incorrect password" }, { status: 401 });
}
