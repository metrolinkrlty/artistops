import Link from "next/link";
import Header from "@/components/layout/Header";
import { getCurrentUser } from "@/lib/session";
import { getArtistSite, getSubscribers, getMailingLists } from "../website/actions";
import EmailClient from "./EmailClient";

export const dynamic = "force-dynamic";

export default async function EmailPage() {
  const [site, subscribers, user, mailingLists] = await Promise.all([
    getArtistSite(),
    getSubscribers(),
    getCurrentUser(),
    getMailingLists(),
  ]);

  return (
    <div className="flex-1">
      <Header
        title="Fan Email"
        subtitle="Your subscribers, saved lists, and email broadcasts — all in one place"
      />
      {site ? (
        <EmailClient
          slug={site.slug}
          availableEmails={site.availableEmails ?? []}
          notifyEmail={site.notifyEmail ?? null}
          mailFromEmail={site.mailFromEmail ?? null}
          mailReplyTo={site.mailReplyTo ?? null}
          subscribers={subscribers}
          isAdmin={!!user?.isAdmin}
          mailingLists={JSON.parse(JSON.stringify(mailingLists))}
        />
      ) : (
        <div className="p-6">
          <div className="rounded-xl border border-border bg-card px-6 py-8 text-center">
            <p className="text-sm font-medium text-foreground">Set up your website first</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Your mailing list fills up from signups on your public website. Create it on the{" "}
              <Link href="/website" className="font-medium text-primary hover:underline">Website</Link> page, then your fans show up here.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
