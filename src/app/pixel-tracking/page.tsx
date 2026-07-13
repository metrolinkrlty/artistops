import Header from "@/components/layout/Header";
import { requireUserId } from "@/lib/session";
import { getPixelEvents } from "./actions";
import PixelClient from "./PixelClient";

export const dynamic = "force-dynamic";

export default async function PixelTrackingPage() {
  const [pixelId, events] = await Promise.all([requireUserId(), getPixelEvents()]);
  return (
    <div className="flex-1">
      <Header title="Pixel Tracking" subtitle="Website visitor and conversion tracking" />
      <PixelClient events={events} pixelId={pixelId} />
    </div>
  );
}
