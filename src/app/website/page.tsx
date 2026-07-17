import Header from "@/components/layout/Header";
import { getCurrentUser } from "@/lib/session";
import { getArtistSite, getSubscribers, getSiteTracks } from "./actions";
import WebsiteClient from "./WebsiteClient";
import Onboarding from "./Onboarding";

export const dynamic = "force-dynamic";

export default async function WebsitePage() {
  const [site, subscribers, user, siteTracks] = await Promise.all([
    getArtistSite(),
    getSubscribers(),
    getCurrentUser(),
    getSiteTracks(),
  ]);

  return (
    <div className="flex-1">
      <Header
        title="Website"
        subtitle="Manage your public website, social links, and mailing list"
      />
      {site ? (
        <WebsiteClient
          site={site}
          subscribers={subscribers}
          isAdmin={!!user?.isAdmin}
          siteTracks={siteTracks}
        />
      ) : (
        <Onboarding />
      )}
    </div>
  );
}
