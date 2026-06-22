import Header from "@/components/layout/Header";
import { getPixelEvents } from "./actions";
import PixelClient from "./PixelClient";

export const dynamic = "force-dynamic";

export default async function PixelTrackingPage() {
  const events = await getPixelEvents();
  return (
    <div className="flex-1">
      <Header title="Pixel Tracking" subtitle="Website visitor and conversion tracking" />
      <PixelClient events={events} />
    </div>
  );
}
