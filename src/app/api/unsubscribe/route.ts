import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// One-click unsubscribe for artist broadcasts. GET = a human clicked the link in
// the email; POST = a mail client's one-click unsubscribe (RFC 8058). Both mark
// the subscriber unsubscribed so they can never be broadcast to (or re-selected)
// again.
function page(title: string, msg: string) {
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title></head><body style="font-family:system-ui,sans-serif;max-width:520px;margin:64px auto;padding:0 20px;text-align:center;color:#222"><h1 style="font-size:20px;margin-bottom:8px">${title}</h1><p style="color:#555">${msg}</p></body></html>`;
}

async function unsubscribe(token: string) {
  if (!token) return { status: 400, title: "Invalid link", msg: "This unsubscribe link is missing its code." };
  const sub = await prisma.mailingSubscriber.findUnique({
    where: { unsubToken: token },
    select: { id: true, email: true, unsubscribed: true },
  });
  if (!sub) return { status: 404, title: "Link not found", msg: "We couldn't find this subscription — it may already be removed." };
  if (!sub.unsubscribed) {
    await prisma.mailingSubscriber.update({
      where: { id: sub.id },
      data: { unsubscribed: true, unsubscribedAt: new Date() },
    });
  }
  return { status: 200, title: "You're unsubscribed", msg: `${sub.email} has been removed from this mailing list — you won't get further emails.` };
}

export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("t") || "";
  const r = await unsubscribe(token);
  return new NextResponse(page(r.title, r.msg), { status: r.status, headers: { "Content-Type": "text/html; charset=utf-8" } });
}

export async function POST(req: Request) {
  const token = new URL(req.url).searchParams.get("t") || "";
  const r = await unsubscribe(token);
  return NextResponse.json({ ok: r.status === 200 }, { status: r.status });
}
