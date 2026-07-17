import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildAuthorizeUrl } from "@/lib/spotify";
import { signState } from "@/lib/presaveCrypto";

// A fan lands here (from the pre-save page's "Pre-save on Spotify" button) and we
// bounce them to Spotify's consent screen. Nothing sensitive happens here.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const campaign = await prisma.preSaveCampaign.findUnique({
    where: { slug },
    select: { status: true },
  });
  if (!campaign) {
    return NextResponse.json({ ok: false, error: "Campaign not found" }, { status: 404 });
  }
  if (campaign.status !== "scheduled") {
    return NextResponse.json(
      { ok: false, error: "This pre-save is closed." },
      { status: 410 }
    );
  }

  const state = signState(slug);
  return NextResponse.redirect(buildAuthorizeUrl(state));
}
