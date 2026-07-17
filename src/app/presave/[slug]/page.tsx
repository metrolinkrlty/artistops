import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Music, Check, Calendar } from "lucide-react";

// The fan-facing pre-save page. Anonymous — no ArtistOps account involved.
export const dynamic = "force-dynamic";

function formatReleaseDate(d: Date) {
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default async function PreSavePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ presave?: string }>;
}) {
  const { slug } = await params;
  const { presave } = await searchParams;

  const campaign = await prisma.preSaveCampaign.findUnique({
    where: { slug },
    select: {
      title: true,
      releaseAt: true,
      status: true,
      actions: true,
      userId: true,
    },
  });
  if (!campaign) notFound();

  // Artist name/branding comes from their site record, if they have one.
  const site = await prisma.artistSite.findFirst({
    where: { userId: campaign.userId },
    select: { displayName: true, heroImageUrl: true, themeColor: true },
  });
  const artistName = site?.displayName || "";
  const accent = site?.themeColor || "#6366f1";

  const willFollow = campaign.actions.includes("follow");
  const closed = campaign.status !== "scheduled";

  return (
    <div className="min-h-screen bg-[#0f1117] text-white flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-2xl overflow-hidden">
          {site?.heroImageUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={site.heroImageUrl} alt="" className="w-full h-44 object-cover" />
          ) : (
            <div className="w-full h-44 flex items-center justify-center" style={{ backgroundColor: `${accent}22` }}>
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

            {presave === "ok" ? (
              <div className="mt-6 rounded-xl border border-green-500/30 bg-green-500/10 p-4">
                <p className="flex items-center gap-2 text-green-400 font-medium text-sm">
                  <Check className="w-4 h-4" /> You&rsquo;re all set!
                </p>
                <p className="text-[#8b8fa8] text-sm mt-1.5 leading-snug">
                  {campaign.title} will appear in your Spotify library automatically on
                  release day. Nothing else to do — you can close this page.
                </p>
              </div>
            ) : closed ? (
              <div className="mt-6 rounded-xl border border-[#2a2d3a] bg-[#0f1117] p-4">
                <p className="text-white text-sm font-medium">This release is out now.</p>
                <p className="text-[#8b8fa8] text-sm mt-1.5">
                  Pre-saves have closed — go give it a listen on Spotify.
                </p>
              </div>
            ) : (
              <>
                <p className="text-[#8b8fa8] text-sm mt-5 leading-snug">
                  Pre-save {campaign.title} and it lands in your Spotify library the
                  moment it drops
                  {willFollow ? `, and you'll follow ${artistName || "the artist"}` : ""}.
                  You&rsquo;ll be sent to Spotify to approve — it takes one tap.
                </p>

                {presave === "denied" && (
                  <p className="mt-4 text-amber-400 text-sm">
                    No problem — nothing was saved. You can try again any time.
                  </p>
                )}
                {presave === "error" && (
                  <p className="mt-4 text-red-400 text-sm">
                    Something went wrong on our end. Please try again.
                  </p>
                )}

                <a
                  href={`/api/presave/${slug}/authorize`}
                  className="mt-6 w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-full text-sm font-semibold text-black bg-[#1DB954] hover:bg-[#1ed760] transition-colors"
                >
                  <Music className="w-4 h-4" />
                  Pre-save on Spotify
                </a>

                <p className="text-[#5a5e72] text-xs mt-4 leading-snug">
                  We only use this to add the song to your library
                  {willFollow ? " and follow the artist" : ""} on release day. We can&rsquo;t
                  see your password, and you can remove access any time in your Spotify
                  settings.
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
