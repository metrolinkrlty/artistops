import Header from "@/components/layout/Header";
import { getCurrentUser } from "@/lib/session";
import { getMyThread, getConversations } from "./actions";
import MessagesClient from "./MessagesClient";
import AdminInbox from "./AdminInbox";

export const dynamic = "force-dynamic";

export default async function MessagesPage() {
  const user = await getCurrentUser();

  if (user?.isAdmin) {
    const conversations = await getConversations();
    return (
      <div className="flex-1">
        <Header title="Messages" subtitle="Conversations with your artists" />
        <AdminInbox conversations={conversations} />
      </div>
    );
  }

  const thread = await getMyThread();
  return (
    <div className="flex-1">
      <Header title="Messages" subtitle="Talk directly with the ArtistOps team" />
      <MessagesClient initialThread={thread} />
    </div>
  );
}
