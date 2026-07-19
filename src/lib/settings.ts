import { prisma } from "@/lib/prisma";

// Keys for global, app-wide settings (stored in the AppSetting table).
export const SETTING_LOGIN_TAGLINE = "login_tagline";

// The default sign-in tagline. Used as the fallback when nothing is saved yet,
// and as the "reset to default" value in the admin editor. Keep in sync with
// the copy shown on the sign-in page.
export const DEFAULT_LOGIN_TAGLINE =
  "Add your catalog — every song, ISRC, release, and who wrote and owns it. Then link each track to Spotify, Apple Music, and every other streaming platform to send fans there and track plays, royalties, and revenue across all of them — plus distribution and your website — in one place.";

// Read a global setting, falling back to `fallback` if unset. Wrapped in
// try/catch so a missing table (before `prisma db push` runs) can never crash a
// public page — it just returns the default.
export async function getAppSetting(key: string, fallback: string): Promise<string> {
  try {
    const row = await prisma.appSetting.findUnique({ where: { key } });
    return row?.value ?? fallback;
  } catch {
    return fallback;
  }
}

export async function setAppSetting(key: string, value: string): Promise<void> {
  await prisma.appSetting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });
}
