import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashToken, hashPassword, signSession, SESSION_COOKIE, IDLE_SECONDS } from "@/lib/auth";

export async function POST(req: NextRequest) {
  let token = "", password = "";
  try {
    const body = await req.json();
    token = String(body.token || "");
    password = String(body.password || "");
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  if (!token || password.length < 6) {
    return NextResponse.json({ ok: false, error: "Password must be at least 6 characters" }, { status: 400 });
  }

  const tokenHash = await hashToken(token);
  const reset = await prisma.passwordReset.findUnique({ where: { tokenHash } });
  if (!reset || reset.usedAt || reset.expiresAt < new Date()) {
    return NextResponse.json({ ok: false, error: "This reset link is invalid or has expired." }, { status: 400 });
  }

  await prisma.user.update({ where: { id: reset.userId }, data: { passwordHash: await hashPassword(password) } });
  await prisma.passwordReset.update({ where: { id: reset.id }, data: { usedAt: new Date() } });

  // Sign the user in directly after a successful reset.
  const sessionToken = await signSession(reset.userId);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: IDLE_SECONDS,
  });
  return res;
}
