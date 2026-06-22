import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { randomToken, hashToken } from "@/lib/auth";
import { sendEmail, passwordResetEmailHtml } from "@/lib/email";

export async function POST(req: NextRequest) {
  let email = "";
  try {
    email = String((await req.json()).email || "").trim().toLowerCase();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  if (!email) return NextResponse.json({ ok: false, error: "Email required" }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { email } });

  // Always respond the same way to avoid leaking which emails exist.
  if (user) {
    // invalidate prior unused tokens
    await prisma.passwordReset.deleteMany({ where: { userId: user.id, usedAt: null } });

    const token = randomToken();
    const tokenHash = await hashToken(token);
    await prisma.passwordReset.create({
      data: { userId: user.id, tokenHash, expiresAt: new Date(Date.now() + 60 * 60 * 1000) },
    });

    const link = `${req.nextUrl.origin}/reset-password?token=${encodeURIComponent(token)}`;
    const result = await sendEmail(user.email, "Reset your ArtistOps password", passwordResetEmailHtml(user.artistName, link));
    if (result.skipped) {
      console.log("[forgot-password] reset link (email not configured):", link);
    }
  }

  return NextResponse.json({ ok: true });
}
