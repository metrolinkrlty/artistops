import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, signSession, SESSION_COOKIE, IDLE_SECONDS } from "@/lib/auth";

export async function POST(req: NextRequest) {
  let email = "", password = "";
  try {
    const body = await req.json();
    email = String(body.email || "").trim().toLowerCase();
    password = String(body.password || "");
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  if (!email || !password) {
    return NextResponse.json({ ok: false, error: "Email and password required" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return NextResponse.json({ ok: false, error: "Incorrect email or password" }, { status: 401 });
  }

  const token = await signSession(user.id, user.status, user.isAdmin);
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
