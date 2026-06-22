import Header from "@/components/layout/Header";
import { getDistributors } from "./actions";
import DistributorsClient from "./DistributorsClient";

export const dynamic = "force-dynamic";

export default async function DistributorsPage() {
  const distributors = await getDistributors();
  return (
    <div className="flex-1">
      <Header title="Distributors" subtitle="Manage your distribution partners" />
      <DistributorsClient distributors={JSON.parse(JSON.stringify(distributors))} />
    </div>
  );
}
