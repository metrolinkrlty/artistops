import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifySession, SESSION_COOKIE } from "@/lib/auth";

const IMPERSONATE_COOKIE = "ao_impersonate";

export async function POST(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const adminId = await verifySession(token);
  if (!adminId) return NextResponse.json({ ok: false }, { status: 401 });

  const admin = await prisma.user.findUnique({ where: { id: adminId } });
  if (!admin?.isAdmin) return NextResponse.json({ ok: false, error: "Not admin" }, { status: 403 });

  const { userId } = await req.json();
  if (!userId) return NextResponse.json({ ok: false }, { status: 400 });

  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target) return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });

  const res = NextResponse.json({ ok: true });
  res.cookies.set(IMPERSONATE_COOKIE, userId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60, // 1 hour max
  });
  return res;
}

export async function DELETE(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const adminId = await verifySession(token);
  if (!adminId) return NextResponse.json({ ok: false }, { status: 401 });

  const res = NextResponse.json({ ok: true });
  res.cookies.set(IMPERSONATE_COOKIE, "", { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 0 });
  return res;
}
