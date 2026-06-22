import { notFound } from "next/navigation";
import ListenPageClient from "./ListenPageClient";

const mockSmartLinks: Record<string, {
  slug: string;
  title: string;
  artistName: string;
  coverColor: string;
  platforms: { name: string; url: string; free: boolean; priority: number }[];
}> = {
  "midnight-drive": {
    slug: "midnight-drive",
    title: "Midnight Drive",
    artistName: "Alex Rivera",
    coverColor: "#1a1060",
    platforms: [
      { name: "Spotify", url: "https://open.spotify.com", free: true, priority: 1 },
      { name: "Apple Music", url: "https://music.apple.com", free: false, priority: 2 },
      { name: "YouTube Music", url: "https://music.youtube.com", free: true, priority: 3 },
      { name: "Amazon Music", url: "https://music.amazon.com", free: false, priority: 4 },
      { name: "Tidal", url: "https://tidal.com", free: false, priority: 5 },
    ],
  },
  "golden-hours": {
    slug: "golden-hours",
    title: "Golden Hours",
    artistName: "Alex Rivera",
    coverColor: "#3d2a00",
    platforms: [
      { name: "Spotify", url: "https://open.spotify.com", free: true, priority: 1 },
      { name: "Apple Music", url: "https://music.apple.com", free: false, priority: 2 },
      { name: "YouTube Music", url: "https://music.youtube.com", free: true, priority: 3 },
      { name: "Amazon Music", url: "https://music.amazon.com", free: false, priority: 4 },
    ],
  },
  "electric-soul-preview": {
    slug: "electric-soul-preview",
    title: "Electric Soul (Preview)",
    artistName: "Alex Rivera",
    coverColor: "#0a2a1a",
    platforms: [
      { name: "Spotify", url: "https://open.spotify.com", free: true, priority: 1 },
      { name: "SoundCloud", url: "https://soundcloud.com", free: true, priority: 2 },
    ],
  },
};

export default async function ListenPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const link = mockSmartLinks[slug];
  if (!link) notFound();
  return <ListenPageClient link={link} />;
}

export async function generateStaticParams() {
  return Object.keys(mockSmartLinks).map(slug => ({ slug }));
}
