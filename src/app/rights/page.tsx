import Header from "@/components/layout/Header";
import { getRightsData } from "./actions";
import RightsClient from "./RightsClient";

export const dynamic = "force-dynamic";

export default async function RightsPage() {
  const { songRights, documents } = await getRightsData();
  return (
    <div className="flex-1">
      <Header title="Rights & Ownership" subtitle="Manage splits, registrations, and documents" />
      <RightsClient songRights={JSON.parse(JSON.stringify(songRights))} documents={JSON.parse(JSON.stringify(documents))} />
    </div>
  );
}
