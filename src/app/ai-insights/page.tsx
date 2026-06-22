import Header from "@/components/layout/Header";
import { getInsights } from "./actions";
import AIInsightsClient from "./AIInsightsClient";

export const dynamic = "force-dynamic";

export default async function AIInsightsPage() {
  const insights = await getInsights();
  return (
    <div className="flex-1">
      <Header title="AI Insights" subtitle="Automated analysis of your music business" />
      <AIInsightsClient insights={insights} />
    </div>
  );
}
