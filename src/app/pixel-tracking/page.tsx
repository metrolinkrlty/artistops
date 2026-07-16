import Header from "@/components/layout/Header";
import { getPixels, getPixelEvents, getWebsitePixelId, getAdPixels } from "./actions";
import PixelClient from "./PixelClient";

export const dynamic = "force-dynamic";

export default async function PixelTrackingPage() {
  const [pixels, events, websitePixelId, adPixels] = await Promise.all([
    getPixels(),
    getPixelEvents(),
    getWebsitePixelId(),
    getAdPixels(),
  ]);
  return (
    <div className="flex-1">
      <Header title="Pixel Tracking" subtitle="Website visitor and conversion tracking" />
      <PixelClient pixels={pixels} events={events} websitePixelId={websitePixelId} adPixels={adPixels} />
    </div>
  );
}
