import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAppSetting, SETTING_PRIVACY_POLICY, DEFAULT_PRIVACY_POLICY } from "@/lib/settings";
import { fillPolicy, renderPolicyMarkdown, formatUpdated } from "@/lib/privacyPolicy";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ slug: string }> };

function getSite(slug: string) {
  return prisma.artistSite.findUnique({
    where: { slug },
    select: { displayName: true, privacyEmail: true, contactEmail: true, mailReplyTo: true, notifyEmail: true },
  });
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const site = await getSite(slug);
  return { title: site ? `Privacy Policy — ${site.displayName}` : "Privacy Policy" };
}

export default async function ArtistPrivacyPage({ params }: Params) {
  const { slug } = await params;
  const site = await getSite(slug);
  if (!site) notFound();

  // The admin maintains one template; it's filled in with this artist's details.
  const row = await prisma.appSetting.findUnique({ where: { key: SETTING_PRIVACY_POLICY } }).catch(() => null);
  const md = await getAppSetting(SETTING_PRIVACY_POLICY, DEFAULT_PRIVACY_POLICY);

  const html = renderPolicyMarkdown(
    fillPolicy(md, {
      artistName: site.displayName,
      // Prefer the dedicated privacy/legal contact; fall back to booking, then
      // reply-to / notify, then a generic phrase.
      contactEmail: site.privacyEmail || site.contactEmail || site.mailReplyTo || site.notifyEmail || "the contact address on our website",
      updated: formatUpdated(row?.updatedAt ?? null),
    })
  );

  return (
    <div className="min-h-screen bg-[#0f1117] text-[#c7cad8]">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <div dangerouslySetInnerHTML={{ __html: html }} />
        <p className="mt-12 border-t border-[#2a2d3a] pt-6 text-xs text-[#5a5e72]">
          Powered by ArtistOps.
        </p>
      </div>
    </div>
  );
}
