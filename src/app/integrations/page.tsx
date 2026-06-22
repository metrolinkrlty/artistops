import Header from "@/components/layout/Header";
import { getConnectorStatuses } from "./actions";
import IntegrationsClient from "./IntegrationsClient";

export const dynamic = "force-dynamic";

export default async function IntegrationsPage() {
  const overrides = await getConnectorStatuses();
  return (
    <div className="flex-1">
      <Header title="Integrations" subtitle="Connect your music business tools" />
      <IntegrationsClient overrides={overrides} />
    </div>
  );
}
