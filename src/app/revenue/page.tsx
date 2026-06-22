import Header from "@/components/layout/Header";
import { getRevenueData } from "./actions";
import RevenueClient from "./RevenueClient";

export const dynamic = "force-dynamic";

export default async function RevenuePage() {
  const data = await getRevenueData();
  return (
    <div className="flex-1">
      <Header title="Revenue" subtitle="Track all income streams" />
      <RevenueClient
        rows={data.rows}
        songs={JSON.parse(JSON.stringify(data.songs))}
        totalStreams={data.totalStreams}
        campaigns={data.campaigns}
      />
    </div>
  );
}
