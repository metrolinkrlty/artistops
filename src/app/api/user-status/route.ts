import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  // Only callable internally (middleware passes the SESSION_TOKEN as a header)
  const secret = req.headers.get("x-internal-check");
  if (!secret || secret !== process.env.SESSION_TOKEN) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const userId = req.nextUrl.searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { status: true, isAdmin: true },
  });

  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ status: user.status, isAdmin: user.isAdmin });
}
