import Header from "@/components/layout/Header";
import { getCopyrights, getSongOptions } from "./actions";
import CopyrightsClient from "./CopyrightsClient";

export const dynamic = "force-dynamic";

export default async function CopyrightsPage() {
  const [copyrights, songs] = await Promise.all([getCopyrights(), getSongOptions()]);
  return (
    <div className="flex-1">
      <Header title="Copyrights" subtitle="Track copyright registrations" />
      <CopyrightsClient
        copyrights={JSON.parse(JSON.stringify(copyrights))}
        songs={JSON.parse(JSON.stringify(songs))}
      />
    </div>
  );
}
