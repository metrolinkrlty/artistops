import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";

// Public booking-inquiry endpoint so an artist's own website can post a "book me"
// form. Emails the site's contact/booking address, falling back to the artist's
// account email if none is set. CORS-open so cross-origin sites (e.g. the artist's
// own domain) can submit.
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

function esc(s: string): string {
  return String(s).replace(/[<>&]/g, (c) => (c === "<" ? "&lt;" : c === ">" ? "&gt;" : "&amp;"));
}

function isEmail(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const site = await prisma.artistSite.findUnique({
    where: { slug },
    select: { userId: true, displayName: true, contactEmail: true },
  });
  if (!site) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404, headers: CORS });

  let body: Record<string, unknown> = {};
  try { body = await req.json(); } catch { /* ignore malformed */ }
  const s = (k: string) => String(body[k] ?? "").trim();
  const name = s("name");
  const email = s("email");
  const date = s("date");
  const location = s("location");
  const audience = s("audience");
  const message = s("message");

  if (!name || !isEmail(email)) {
    return NextResponse.json({ ok: false, error: "Please include your name and a valid email." }, { status: 400, headers: CORS });
  }

  // Booking address: the site's contact/booking email, else the artist's account email.
  let to = site.contactEmail?.trim() || "";
  if (!to) {
    const owner = await prisma.user.findUnique({ where: { id: site.userId }, select: { email: true } });
    to = owner?.email || "";
  }
  if (!to) return NextResponse.json({ ok: false, error: "No booking address is set for this artist." }, { status: 400, headers: CORS });

  const artist = site.displayName || slug;
  const rows: [string, string][] = [
    ["From", `${name} <${email}>`],
    ["Preferred date", date],
    ["Location / venue", location],
    ["Expected audience", audience],
  ];
  const html = `
    <h2 style="margin:0 0 12px">🎤 Booking inquiry — ${esc(artist)}</h2>
    <table cellpadding="6" style="border-collapse:collapse;font-size:14px">
      ${rows.filter(([, v]) => v).map(([k, v]) => `<tr><td style="color:#666;white-space:nowrap"><strong>${esc(k)}</strong></td><td>${esc(v)}</td></tr>`).join("")}
    </table>
    ${message ? `<p style="margin:14px 0 4px"><strong>Message</strong></p><p style="font-size:14px;white-space:pre-wrap">${esc(message)}</p>` : ""}
    <hr style="margin:18px 0;border:none;border-top:1px solid #eee">
    <p style="color:#888;font-size:12px">Sent from your ArtistOps website booking form. Just reply to this email to reach ${esc(name)} directly.</p>
  `;

  const res = await sendEmail(to, `Booking inquiry — ${artist} (${name})`, html, email);
  if (!res.ok && !res.skipped) {
    return NextResponse.json({ ok: false, error: "Could not send your inquiry. Please try again." }, { status: 502, headers: CORS });
  }
  return NextResponse.json({ ok: true }, { headers: CORS });
}
