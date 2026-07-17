import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, signSession, SESSION_COOKIE, IDLE_SECONDS } from "@/lib/auth";
import { seedSampleDataForUser } from "@/lib/sampleData";
import { sendEmail, pendingApprovalEmailHtml, adminSignupNotificationHtml } from "@/lib/email";

const VALID_ROLES = ["artist", "band", "manager", "label", "producer", "other"];

export async function POST(req: NextRequest) {
  let email = "", password = "", artistName = "";
  let role = "", referredBy = "", workLink = "", catalogSize = "", location = "";
  let goals: string[] = [];
  try {
    const body = await req.json();
    email = String(body.email || "").trim().toLowerCase();
    password = String(body.password || "");
    artistName = String(body.artistName || "").trim();
    role = String(body.role || "").trim();
    referredBy = String(body.referredBy || "").trim();
    workLink = String(body.workLink || "").trim();
    catalogSize = String(body.catalogSize || "").trim();
    location = String(body.location || "").trim();
    goals = Array.isArray(body.goals) ? body.goals.map((g: unknown) => String(g)).slice(0, 10) : [];
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  if (!email || !password || !artistName) {
    return NextResponse.json({ ok: false, error: "All fields are required" }, { status: 400 });
  }
  // Invite-only questionnaire: role and referral are required for review.
  if (!VALID_ROLES.includes(role)) {
    return NextResponse.json({ ok: false, error: "Please tell us what you do" }, { status: 400 });
  }
  if (!referredBy) {
    return NextResponse.json({ ok: false, error: "Please tell us who referred you" }, { status: 400 });
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

  // Store the questionnaire so the admin can review it when approving. Isolated
  // table — a failure here must not block the signup.
  const roleLabel: Record<string, string> = {
    artist: "Artist", band: "Band member", manager: "Artist manager",
    label: "Label / industry professional", producer: "Producer / engineer", other: "Other",
  };
  prisma.membershipApplication.create({
    data: { userId: user.id, email, role, referredBy, workLink: workLink || null, goals, catalogSize: catalogSize || null, location: location || null },
  }).catch((e) => console.error("Membership application save failed:", e));

  // Notify admin — reply-to goes directly to the applicant
  const adminEmail = process.env.ADMIN_EMAIL || "admin@artistops.net";
  const applicationDetail = [
    `Role: ${roleLabel[role] || role}`,
    `Referred by: ${referredBy}`,
    workLink && `Work link: ${workLink}`,
    goals.length && `Wants help with: ${goals.join(", ")}`,
    catalogSize && `Catalog: ${catalogSize}`,
    location && `Based in: ${location}`,
  ].filter(Boolean).join("\n");
  sendEmail(
    adminEmail,
    `New ArtistOps signup request from ${email}`,
    adminSignupNotificationHtml(artistName, email) +
      `<pre style="font-family:Inter,Arial,sans-serif;background:#1a1d27;color:#c7cad8;padding:16px;border-radius:10px;white-space:pre-wrap;font-size:13px;max-width:480px;margin:12px auto 0">${applicationDetail}</pre>`,
    email
  ).catch(console.error);

  // Seed sample data in the background (don't await — user sees pending page immediately)
  seedSampleDataForUser(user.id, artistName).catch((e) => console.error("Sample data seed failed:", e));

  // Confirm receipt to the user — reply-to goes to admin so replies are seen
  sendEmail(email, "Your ArtistOps account is pending approval", pendingApprovalEmailHtml(artistName), adminEmail).catch(console.error);

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
