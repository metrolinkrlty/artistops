import Header from "@/components/layout/Header";
import { getUsers } from "./actions";
import AdminClient from "./AdminClient";
import { requireUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getAppSetting, SETTING_LOGIN_TAGLINE, DEFAULT_LOGIN_TAGLINE, SETTING_AD_RETARGETING_GLOBAL, SETTING_PRIVACY_POLICY, DEFAULT_PRIVACY_POLICY } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const userId = await requireUserId();
  const me = await prisma.user.findUnique({ where: { id: userId } });
  if (!me?.isAdmin) redirect("/");

  const users = await getUsers();
  const [loginTagline, adRetargetingGlobal, privacyPolicy] = await Promise.all([
    getAppSetting(SETTING_LOGIN_TAGLINE, DEFAULT_LOGIN_TAGLINE),
    getAppSetting(SETTING_AD_RETARGETING_GLOBAL, "off"),
    getAppSetting(SETTING_PRIVACY_POLICY, DEFAULT_PRIVACY_POLICY),
  ]);
  return (
    <div className="flex-1">
      <Header title="Admin" subtitle="Manage user accounts" />
      <AdminClient
        users={JSON.parse(JSON.stringify(users))}
        currentUserId={userId}
        loginTagline={loginTagline}
        defaultLoginTagline={DEFAULT_LOGIN_TAGLINE}
        adRetargetingGlobalOn={adRetargetingGlobal === "on"}
        privacyPolicy={privacyPolicy}
        defaultPrivacyPolicy={DEFAULT_PRIVACY_POLICY}
      />
    </div>
  );
}
