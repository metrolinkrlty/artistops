import { notFound, redirect } from "next/navigation";
import ListenPageClient from "./ListenPageClient";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const FREE_PLATFORMS = new Set(["Spotify", "YouTube Music", "YouTube", "SoundCloud", "Audiomack"]);
const COVER_COLORS = ["#1a1060", "#3d2a00", "#0a2a1a", "#2a0a1a", "#0a1a2a"];

type Platform = { name: string; url: string; priority: number };

export default async function ListenPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const record = await prisma.smartLink.findUnique({ where: { slug } });
  if (!record || !record.isActive) notFound();

  const platforms = ((record.platforms as unknown as Platform[]) || [])
    .filter((p) => p?.url)
    .sort((a, b) => a.priority - b.priority)
    .map((p) => ({ ...p, free: FREE_PLATFORMS.has(p.name) }));

  // No platform links → send the fan to the artist's music player, not a dead end.
  if (platforms.length === 0) {
    const site = record.userId
      ? await prisma.artistSite.findUnique({ where: { userId: record.userId }, select: { slug: true } })
      : null;
    if (site) redirect(`/sites/${site.slug}#music`);
  }

  const colorIdx = Math.abs(slug.split("").reduce((a, c) => a + c.charCodeAt(0), 0)) % COVER_COLORS.length;

  const link = {
    slug: record.slug,
    title: record.title,
    artistName: record.artistName,
    coverColor: record.coverArtUrl ? "#1a1060" : COVER_COLORS[colorIdx],
    gateEmail: record.gateEmail,
    platforms,
  };

  return <ListenPageClient link={link} />;
}
