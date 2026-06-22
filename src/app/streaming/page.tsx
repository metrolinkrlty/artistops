import Header from "@/components/layout/Header";
import { getStreamingData } from "./actions";
import StreamingClient from "./StreamingClient";

export const dynamic = "force-dynamic";

export default async function StreamingPage() {
  const data = await getStreamingData();
  return (
    <div className="flex-1">
      <Header title="Streaming Plays" subtitle="Track plays across all platforms" />
      <StreamingClient
        rows={data.rows}
        songs={JSON.parse(JSON.stringify(data.songs))}
        isrcData={data.isrcData}
        platformComparison={data.platformComparison}
      />
    </div>
  );
}
