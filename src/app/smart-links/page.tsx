import Header from "@/components/layout/Header";
import { getSmartLinks, getSongOptions } from "./actions";
import SmartLinksClient from "./SmartLinksClient";

export const dynamic = "force-dynamic";

export default async function SmartLinksPage() {
  const [links, songs] = await Promise.all([getSmartLinks(), getSongOptions()]);
  return (
    <div className="flex-1">
      <Header title="Smart Links" subtitle="One link for all platforms" />
      <SmartLinksClient links={JSON.parse(JSON.stringify(links))} songs={JSON.parse(JSON.stringify(songs))} />
    </div>
  );
}
