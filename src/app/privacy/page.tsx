import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getAppSetting, SETTING_PRIVACY_POLICY, DEFAULT_PRIVACY_POLICY } from "@/lib/settings";
import { fillPolicy, renderPolicyMarkdown, formatUpdated } from "@/lib/privacyPolicy";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Privacy Policy" };

// Platform-level policy. Each artist's fans get /privacy/<slug>, which fills the
// same template in with that artist's name and contact address.
export default async function PrivacyPage() {
  const row = await prisma.appSetting.findUnique({ where: { key: SETTING_PRIVACY_POLICY } }).catch(() => null);
  const md = await getAppSetting(SETTING_PRIVACY_POLICY, DEFAULT_PRIVACY_POLICY);

  const html = renderPolicyMarkdown(
    fillPolicy(md, {
      artistName: "ArtistOps",
      contactEmail: "hello@artistops.net",
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
