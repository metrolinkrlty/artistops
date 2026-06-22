import Header from "@/components/layout/Header";
import { getReleases, getReleaseOptions } from "./actions";
import ReleasesClient from "./ReleasesClient";

export const dynamic = "force-dynamic";

export default async function ReleasesPage() {
  const [releases, options] = await Promise.all([getReleases(), getReleaseOptions()]);
  return (
    <div className="flex-1">
      <Header title="Releases" subtitle="Distribution and release management" />
      <ReleasesClient
        releases={JSON.parse(JSON.stringify(releases))}
        songs={JSON.parse(JSON.stringify(options.songs))}
        distributors={JSON.parse(JSON.stringify(options.distributors))}
      />
    </div>
  );
}
