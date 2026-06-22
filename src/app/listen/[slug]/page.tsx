import { notFound } from "next/navigation";
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
    .sort((a, b) => a.priority - b.priority)
    .map((p) => ({ ...p, free: FREE_PLATFORMS.has(p.name) }));

  const colorIdx = Math.abs(slug.split("").reduce((a, c) => a + c.charCodeAt(0), 0)) % COVER_COLORS.length;

  const link = {
    slug: record.slug,
    title: record.title,
    artistName: record.artistName,
    coverColor: record.coverArtUrl ? "#1a1060" : COVER_COLORS[colorIdx],
    platforms,
  };

  return <ListenPageClient link={link} />;
}
