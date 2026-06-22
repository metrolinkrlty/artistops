import Header from "@/components/layout/Header";
import { getSettings } from "./actions";
import SettingsClient from "./SettingsClient";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const settings = await getSettings();
  return (
    <div className="flex-1">
      <Header title="Settings" subtitle="Configure your ArtistOps account" />
      <SettingsClient settings={settings} />
    </div>
  );
}
