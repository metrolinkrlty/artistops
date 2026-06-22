import Header from "@/components/layout/Header";
import { getUsers } from "./actions";
import AdminClient from "./AdminClient";
import { requireUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const userId = await requireUserId();
  const me = await prisma.user.findUnique({ where: { id: userId } });
  if (!me?.isAdmin) redirect("/");

  const users = await getUsers();
  return (
    <div className="flex-1">
      <Header title="Admin" subtitle="Manage user accounts" />
      <AdminClient users={JSON.parse(JSON.stringify(users))} currentUserId={userId} />
    </div>
  );
}
