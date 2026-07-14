import Header from "@/components/layout/Header";
import { getArtistSite, getSubscribers } from "./actions";
import WebsiteClient from "./WebsiteClient";

export const dynamic = "force-dynamic";

export default async function WebsitePage() {
  const [site, subscribers] = await Promise.all([
    getArtistSite(),
    getSubscribers(),
  ]);

  return (
    <div className="flex-1">
      <Header
        title="Website"
        subtitle="Manage your public website, social links, and mailing list"
      />
      <WebsiteClient site={site} subscribers={subscribers} />
    </div>
  );
}
