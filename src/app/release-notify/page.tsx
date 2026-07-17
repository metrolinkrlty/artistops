import Header from "@/components/layout/Header";
import { getReleaseCampaigns, hasArtistSite } from "./actions";
import ReleaseNotifyClient from "./ReleaseNotifyClient";

export const dynamic = "force-dynamic";

export default async function ReleaseNotifyPage() {
  const [campaigns, hasSite] = await Promise.all([
    getReleaseCampaigns(),
    hasArtistSite(),
  ]);

  return (
    <div className="flex-1">
      <Header
        title="Release Notify"
        subtitle="Collect fan emails before a release, then notify everyone the day it drops"
      />
      <ReleaseNotifyClient campaigns={campaigns} hasSite={hasSite} />
    </div>
  );
}
