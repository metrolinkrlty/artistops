import Header from "@/components/layout/Header";
import { getMyThread } from "./actions";
import MessagesClient from "./MessagesClient";

export const dynamic = "force-dynamic";

export default async function MessagesPage() {
  const thread = await getMyThread();
  return (
    <div className="flex-1">
      <Header title="Messages" subtitle="Talk directly with the ArtistOps team" />
      <MessagesClient initialThread={thread} />
    </div>
  );
}
