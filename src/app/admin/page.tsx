import Header from "@/components/layout/Header";
import { getUsers } from "./actions";
import AdminClient from "./AdminClient";
import { requireUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getAppSetting, SETTING_LOGIN_TAGLINE, DEFAULT_LOGIN_TAGLINE } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const userId = await requireUserId();
  const me = await prisma.user.findUnique({ where: { id: userId } });
  if (!me?.isAdmin) redirect("/");

  const users = await getUsers();
  const loginTagline = await getAppSetting(SETTING_LOGIN_TAGLINE, DEFAULT_LOGIN_TAGLINE);
  return (
    <div className="flex-1">
      <Header title="Admin" subtitle="Manage user accounts" />
      <AdminClient users={JSON.parse(JSON.stringify(users))} currentUserId={userId} loginTagline={loginTagline} defaultLoginTagline={DEFAULT_LOGIN_TAGLINE} />
    </div>
  );
}
