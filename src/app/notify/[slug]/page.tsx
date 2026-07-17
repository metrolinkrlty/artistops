import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Music, Calendar } from "lucide-react";
import NotifyForm from "./NotifyForm";

// The fan-facing "tell me when it's out" page. Anonymous — no ArtistOps account.
export const dynamic = "force-dynamic";

// A release date is a calendar date, not a moment in time: an artist who picks
// Sept 4 must never see "Out September 3" because the fan is west of UTC.
function formatReleaseDate(d: Date) {
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

export default async function NotifyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const campaign = await prisma.releaseCampaign.findUnique({
    where: { slug },
    select: { title: true, releaseAt: true, status: true, linkUrl: true, userId: true },
  });
  if (!campaign) notFound();

  // Branding comes from the artist's site record — nothing extra to configure.
  const site = await prisma.artistSite.findFirst({
    where: { userId: campaign.userId },
    select: { displayName: true, heroImageUrl: true, themeColor: true },
  });
  const artistName = site?.displayName || "";
  const accent = site?.themeColor || "#6366f1";

  // The artist's ad pixels, so a signup counts as a Lead for retargeting.
  const adPixels: Record<string, string> = {};
  try {
    const rows = await prisma.adPixel.findMany({
      where: { userId: campaign.userId },
      select: { platform: true, pixelId: true },
    });
    for (const r of rows) adPixels[r.platform] = r.pixelId;
  } catch {
    // No pixels configured yet — the form still works.
  }

  const isOut = campaign.status !== "scheduled";

  return (
    <div className="min-h-screen bg-[#0f1117] text-white flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-2xl overflow-hidden">
          {site?.heroImageUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={site.heroImageUrl} alt="" className="w-full h-44 object-cover" />
          ) : (
            <div
              className="w-full h-44 flex items-center justify-center"
              style={{ backgroundColor: `${accent}22` }}
            >
              <Music className="w-10 h-10" style={{ color: accent }} />
            </div>
          )}

          <div className="p-8">
            {artistName && <p className="text-[#8b8fa8] text-sm mb-1">{artistName}</p>}
            <h1 className="text-2xl font-bold leading-tight">{campaign.title}</h1>

            <p className="flex items-center gap-2 text-[#8b8fa8] text-sm mt-3">
              <Calendar className="w-4 h-4" />
              Out {formatReleaseDate(campaign.releaseAt)}
            </p>

            {isOut ? (
              <div className="mt-6">
                <p className="text-white text-sm font-medium">It&rsquo;s out now.</p>
                {campaign.linkUrl && (
                  <a
                    href={campaign.linkUrl}
                    className="mt-4 w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-full text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
                  >
                    <Music className="w-4 h-4" />
                    Listen now
                  </a>
                )}
              </div>
            ) : (
              <>
                <p className="text-[#8b8fa8] text-sm mt-5 leading-snug">
                  {`Leave your email and we'll send you ${campaign.title} the day it drops — so you hear it first.`}
                </p>

                <NotifyForm slug={slug} title={campaign.title} adPixels={adPixels} />

                <p className="text-[#5a5e72] text-xs mt-4 leading-snug">
                  One email on release day. No spam, and you can unsubscribe any time.
                </p>
              </>
            )}
          </div>
        </div>

        <p className="text-center text-[#5a5e72] text-xs mt-6">Powered by ArtistOps</p>
      </div>
    </div>
  );
}
