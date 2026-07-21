import Header from "@/components/layout/Header";
import { getCurrentUser } from "@/lib/session";
import { getArtistSite, getSiteTracks } from "./actions";
import WebsiteClient from "./WebsiteClient";
import Onboarding from "./Onboarding";

export const dynamic = "force-dynamic";

export default async function WebsitePage() {
  const [site, user, siteTracks] = await Promise.all([
    getArtistSite(),
    getCurrentUser(),
    getSiteTracks(),
  ]);

  return (
    <div className="flex-1">
      <Header
        title="Website"
        subtitle="Manage your public website, social links, and player"
      />
      {site ? (
        <WebsiteClient
          site={site}
          isAdmin={!!user?.isAdmin}
          siteTracks={siteTracks}
        />
      ) : (
        <Onboarding />
      )}
    </div>
  );
}
