import Header from "@/components/layout/Header";
import { getSongs } from "./actions";
import SongsClient from "./SongsClient";

export const dynamic = "force-dynamic";

export default async function SongsPage() {
  const songs = await getSongs();
  return (
    <div className="flex-1">
      <Header title="Songs" subtitle="Manage your music catalog" />
      <SongsClient songs={JSON.parse(JSON.stringify(songs))} />
    </div>
  );
}
