import LoginView from "./LoginView";
import { getAppSetting, SETTING_LOGIN_TAGLINE, DEFAULT_LOGIN_TAGLINE } from "@/lib/settings";

// Read fresh each request so an admin edit to the tagline shows immediately.
export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const tagline = await getAppSetting(SETTING_LOGIN_TAGLINE, DEFAULT_LOGIN_TAGLINE);
  return <LoginView tagline={tagline} />;
}
