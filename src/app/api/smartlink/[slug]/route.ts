import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Public, read-only Smart Link data so an artist's own website can render a
// branded /listen page instead of sending fans to artistops.net.

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

type Platform = { name: string; url: string; priority: number };

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const record = await prisma.smartLink.findUnique({ where: { slug } });
  if (!record || !record.isActive) {
    return NextResponse.json({ ok: false, error: "Not found" }, { status: 404, headers: CORS });
  }
  const platforms = ((record.platforms as unknown as Platform[]) || [])
    .filter((p) => p?.url)
    .sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0));
  return NextResponse.json(
    { ok: true, link: { slug: record.slug, title: record.title, artistName: record.artistName, platforms } },
    { headers: CORS }
  );
}
