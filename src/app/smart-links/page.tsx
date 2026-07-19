import Header from "@/components/layout/Header";
import { getSmartLinks } from "./actions";
import SmartLinksClient from "./SmartLinksClient";

export const dynamic = "force-dynamic";

export default async function SmartLinksPage() {
  const links = await getSmartLinks();
  return (
    <div className="flex-1">
      <Header title="Smart Links" subtitle="One link for all platforms" subtitleTitle="One shareable link that sends fans to every streaming platform" />
      <SmartLinksClient links={JSON.parse(JSON.stringify(links))} />
    </div>
  );
}
