import Header from "@/components/layout/Header";
import { getSocialPosts, getSongOptions } from "./actions";
import SocialClient from "./SocialClient";

export const dynamic = "force-dynamic";

export default async function SocialPage() {
  const [posts, songs] = await Promise.all([getSocialPosts(), getSongOptions()]);
  return (
    <div className="flex-1">
      <Header title="Social Media" subtitle="Manage posts and campaigns" />
      <SocialClient posts={JSON.parse(JSON.stringify(posts))} songs={JSON.parse(JSON.stringify(songs))} />
    </div>
  );
}
