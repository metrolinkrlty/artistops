import Header from "@/components/layout/Header";
import { getPlaylists } from "./actions";
import PlaylistClient from "./PlaylistClient";

export const dynamic = "force-dynamic";

export default async function PlaylistIntelligencePage() {
  const playlists = await getPlaylists();
  return (
    <div className="flex-1">
      <Header title="Playlist Intelligence" subtitle="Track playlist placements and performance" />
      <PlaylistClient playlists={JSON.parse(JSON.stringify(playlists))} />
    </div>
  );
}
