"use server";

import { prisma } from "@/lib/prisma";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// A fan asking to be told when a release lands. Two things happen: they join the
// campaign's notify list (they get the release-day email), and they land in the
// artist's mailing list so the artist keeps the relationship afterwards.
export async function notifyMe(
  slug: string,
  emailRaw: string,
  alsoSubscribe: boolean
): Promise<{ ok: boolean; error?: string }> {
  const email = emailRaw.trim().toLowerCase();
  if (!EMAIL_RE.test(email)) {
    return { ok: false, error: "Please enter a valid email address." };
  }

  const campaign = await prisma.releaseCampaign.findUnique({
    where: { slug },
    select: { id: true, status: true, userId: true },
  });
  if (!campaign) return { ok: false, error: "This release wasn't found." };
  if (campaign.status !== "scheduled") {
    return { ok: false, error: "This release is already out." };
  }

  try {
    await prisma.releaseNotify.upsert({
      where: { campaignId_email: { campaignId: campaign.id, email } },
      create: { campaignId: campaign.id, email },
      update: {}, // re-submitting is a no-op, not an error
    });
  } catch {
    return { ok: false, error: "Couldn't save that. Please try again." };
  }

  // Mirror into the artist's mailing list. Their site slug is the list key, so
  // notify signups pool with website signups rather than forming a silo.
  const site = await prisma.artistSite.findFirst({
    where: { userId: campaign.userId },
    select: { slug: true },
  });
  if (site) {
    try {
      await prisma.mailingSubscriber.upsert({
        where: { site_email: { site: site.slug, email } },
        create: {
          site: site.slug,
          email,
          userId: campaign.userId,
          source: "release_notify",
          notifyOptIn: alsoSubscribe,
        },
        // Never downgrade an existing opt-in — same rule as the website form.
        update: alsoSubscribe ? { notifyOptIn: true } : {},
      });
    } catch {
      // The fan is on the notify list either way; don't fail their signup.
    }
  }

  return { ok: true };
}
