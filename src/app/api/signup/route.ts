import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, signSession, SESSION_COOKIE, IDLE_SECONDS } from "@/lib/auth";
import { seedSampleDataForUser } from "@/lib/sampleData";
import { sendEmail, pendingApprovalEmailHtml } from "@/lib/email";

export async function POST(req: NextRequest) {
  let email = "", password = "", artistName = "";
  try {
    const body = await req.json();
    email = String(body.email || "").trim().toLowerCase();
    password = String(body.password || "");
    artistName = String(body.artistName || "").trim();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  if (!email || !password || !artistName) {
    return NextResponse.json({ ok: false, error: "All fields are required" }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ ok: false, error: "Password must be at least 6 characters" }, { status: 400 });
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json({ ok: false, error: "Enter a valid email" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ ok: false, error: "An account with that email already exists" }, { status: 409 });
  }

  const user = await prisma.user.create({
    data: { email, artistName, passwordHash: await hashPassword(password), status: "PENDING" },
  });

  // Seed sample data in the background (don't await — user sees pending page immediately)
  seedSampleDataForUser(user.id, artistName).catch((e) => console.error("Sample data seed failed:", e));

  // Send pending-approval email
  sendEmail(email, "Your ArtistOps account is pending approval", pendingApprovalEmailHtml(artistName), email).catch(console.error);

  // Sign the user in so they can see the pending page, but they can't access the dashboard yet
  const token = await signSession(user.id);
  const res = NextResponse.json({ ok: true, pending: true });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: IDLE_SECONDS,
  });
  return res;
}
