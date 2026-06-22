import Header from "@/components/layout/Header";
import { getAdCampaigns, getSongOptions } from "./actions";
import AdvertisingClient from "./AdvertisingClient";

export const dynamic = "force-dynamic";

export default async function AdvertisingPage() {
  const [campaigns, songs] = await Promise.all([getAdCampaigns(), getSongOptions()]);
  return (
    <div className="flex-1">
      <Header title="Advertising" subtitle="Manage ad campaigns" />
      <AdvertisingClient campaigns={JSON.parse(JSON.stringify(campaigns))} songs={JSON.parse(JSON.stringify(songs))} />
    </div>
  );
}
