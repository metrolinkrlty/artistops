import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hashPassword } from "../src/lib/auth";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = "sirlukelot.llc@gmail.com";
  const artistName = "Luke Corliss";
  const password = process.env.SITE_PASSWORD || "ArtistOps2026!";

  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    user = await prisma.user.create({
      data: { email, artistName, passwordHash: await hashPassword(password) },
    });
    console.log("Created user:", email);
  } else {
    console.log("User already exists:", email);
  }
  const userId = user.id;

  const tables = [
    "song", "copyright", "distributor", "distribution", "revenue", "streamPlay",
    "socialPost", "adCampaign", "pixelEvent", "contact", "smartLink", "smartLinkClick",
    "playlist", "playlistSong", "listenerDemographic", "connector", "rightsDocument",
    "aIInsight", "forecast",
  ] as const;

  for (const t of tables) {
    // @ts-expect-error dynamic model access
    const res = await prisma[t].updateMany({ where: { userId: null }, data: { userId } });
    console.log(`  ${t}: assigned ${res.count}`);
  }

  // seed Luke's settings from prior known values
  await prisma.setting.upsert({ where: { userId_key: { userId, key: "proMembership" } }, update: { value: "ASCAP" }, create: { userId, key: "proMembership", value: "ASCAP" } });
  await prisma.setting.upsert({ where: { userId_key: { userId, key: "websiteUrl" } }, update: { value: "lukecorliss.com" }, create: { userId, key: "websiteUrl", value: "lukecorliss.com" } });

  console.log("✅ Backfill complete. Owner:", artistName, userId);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
