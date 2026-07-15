import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";

// Public endpoint: an artist's website posts a captured email here.
// notifyOptIn=true means the visitor explicitly asked to hear about future
// releases and shows. Emails captured only to unlock a full track come in with
// notifyOptIn=false. One row per (site, email); opt-in is never downgraded.

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, x-site-key",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  // Optional shared-secret gate. If SITE_INGEST_KEY is configured, require it.
  const requiredKey = process.env.SITE_INGEST_KEY;
  if (requiredKey && req.headers.get("x-site-key") !== requiredKey) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401, headers: CORS }
    );
  }

  let email = "";
  let notifyOptIn = false;
  let name: string | null = null;
  let source: string | null = null;
  try {
    const body = await req.json();
    email = String(body.email || "").trim().toLowerCase();
    notifyOptIn = Boolean(body.notifyOptIn);
    name = body.name ? String(body.name).trim() : null;
    source = body.source ? String(body.source).trim() : null;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid request body" },
      { status: 400, headers: CORS }
    );
  }

  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json(
      { ok: false, error: "Enter a valid email" },
      { status: 400, headers: CORS }
    );
  }

  // Resolve the owning artist (if a site record exists) so subscribers show up
  // in that artist's dashboard. Still store even if no site row exists yet.
  const site = await prisma.artistSite.findUnique({
    where: { slug },
    select: { userId: true, notifyEmail: true, mailReplyTo: true, displayName: true },
  });

  // Only notify the artist about brand-new signups (not re-submits).
  const existing = await prisma.mailingSubscriber.findUnique({
    where: { site_email: { site: slug, email } },
    select: { id: true },
  });

  try {
    await prisma.mailingSubscriber.upsert({
      where: { site_email: { site: slug, email } },
      create: {
        site: slug,
        email,
        name,
        notifyOptIn,
        source,
        userId: site?.userId ?? null,
      },
      update: {
        // Never downgrade an existing opt-in; upgrade to true if they opt in now.
        ...(notifyOptIn ? { notifyOptIn: true } : {}),
        ...(name ? { name } : {}),
        ...(source ? { source } : {}),
        ...(site?.userId ? { userId: site.userId } : {}),
      },
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Could not save. Try again." },
      { status: 500, headers: CORS }
    );
  }

  // Fire-and-forget notification to the artist's chosen address (if set).
  if (!existing && site?.notifyEmail) {
    const who = site.displayName || slug;
    const subject = `New mailing-list signup — ${who}`;
    const html = signupNotificationHtml(who, email, notifyOptIn, source);
    // Don't block the response or fail the signup if email is down.
    sendEmail(site.notifyEmail, subject, html, site.mailReplyTo || undefined).catch(
      () => {}
    );
  }

  return NextResponse.json({ ok: true }, { headers: CORS });
}

function signupNotificationHtml(
  who: string,
  email: string,
  notifyOptIn: boolean,
  source: string | null
): string {
  return `
  <div style="font-family:Inter,Arial,sans-serif;background:#0f1117;color:#fff;padding:32px;border-radius:12px;max-width:480px;margin:0 auto">
    <h2 style="margin:0 0 8px">New signup for ${who}</h2>
    <p style="color:#8b8fa8;margin:0 0 20px">Someone just joined from your website.</p>
    <div style="background:#1a1d27;border:1px solid #334155;border-radius:10px;padding:16px;margin-bottom:20px">
      <p style="margin:0 0 6px"><strong>Email:</strong> ${email}</p>
      <p style="margin:0 0 6px"><strong>Wants release &amp; show updates:</strong> ${notifyOptIn ? "Yes" : "No"}</p>
      <p style="margin:0"><strong>Source:</strong> ${source || "website"}</p>
    </div>
    <a href="https://artistops.net/website" style="display:inline-block;background:#6366f1;color:#fff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:600">View your mailing list</a>
  </div>`;
}
