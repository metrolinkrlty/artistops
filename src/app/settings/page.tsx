import Header from "@/components/layout/Header";
import { getSettings } from "./actions";
import { getArtistSite } from "../website/actions";
import { getCurrentUser } from "@/lib/session";
import SettingsClient from "./SettingsClient";
import EmailAddressesCard from "./EmailAddressesCard";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const [settings, site, user] = await Promise.all([
    getSettings(),
    getArtistSite(),
    getCurrentUser(),
  ]);
  return (
    <div className="flex-1">
      <Header title="Settings" subtitle="Configure your ArtistOps account" />
      <SettingsClient settings={settings} />
      <div className="px-8 pb-8 max-w-2xl">
        <EmailAddressesCard
          hasSite={!!site}
          availableEmails={site?.availableEmails ?? []}
          notifyEmail={site?.notifyEmail ?? null}
          mailFromEmail={site?.mailFromEmail ?? null}
          mailReplyTo={site?.mailReplyTo ?? null}
          isAdmin={!!user?.isAdmin}
        />
      </div>
    </div>
  );
}
