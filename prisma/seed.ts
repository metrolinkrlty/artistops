import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  mockSongs,
  mockCopyrights,
  mockDistributors,
  mockDistributions,
  mockRevenue,
  mockStreamPlays,
  mockSocialPosts,
  mockAdCampaigns,
  mockPixelEvents,
  mockContacts,
} from "../src/lib/mock-data";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const d = (s: string | null | undefined) => (s ? new Date(s) : null);

async function main() {
  console.log("Clearing existing data...");
  await prisma.pixelEvent.deleteMany();
  await prisma.adCampaign.deleteMany();
  await prisma.socialPost.deleteMany();
  await prisma.streamPlay.deleteMany();
  await prisma.revenue.deleteMany();
  await prisma.distribution.deleteMany();
  await prisma.copyright.deleteMany();
  await prisma.distributor.deleteMany();
  await prisma.contact.deleteMany();
  await prisma.song.deleteMany();

  console.log("Seeding songs...");
  const songIdByTitle = new Map<string, string>();
  for (const s of mockSongs) {
    const created = await prisma.song.create({
      data: {
        title: s.title,
        artist: s.artist,
        writers: s.writers,
        publishers: s.publishers,
        splits: s.splits,
        isrc: s.isrc ?? null,
        upc: s.upc ?? null,
        releaseDate: d(s.releaseDate),
        genre: s.genre ?? null,
        bpm: s.bpm ?? null,
        key: s.key ?? null,
        status: s.status as never,
      },
    });
    songIdByTitle.set(s.title, created.id);
  }

  console.log("Seeding distributors...");
  const distIdByName = new Map<string, string>();
  for (const dist of mockDistributors) {
    const created = await prisma.distributor.create({
      data: {
        name: dist.name,
        accountId: dist.accountId,
        email: dist.email,
        website: dist.website,
        notes: dist.notes,
      },
    });
    distIdByName.set(dist.name, created.id);
  }

  console.log("Seeding copyrights...");
  for (const c of mockCopyrights) {
    const songId = songIdByTitle.get(c.songTitle);
    if (!songId) continue;
    await prisma.copyright.create({
      data: {
        songId,
        registrationNumber: c.registrationNumber ?? null,
        filingDate: d(c.filingDate),
        claimant: c.claimant ?? null,
        authors: c.authors,
        workType: c.workType ?? null,
        registeredWithUSCO: c.registeredWithUSCO,
        registeredWithPRO: c.registeredWithPRO,
        registeredWithMLC: c.registeredWithMLC,
        registeredWithSX: c.registeredWithSX,
        registeredWithDist: c.registeredWithDist,
        proName: c.proName ?? null,
      },
    });
  }

  console.log("Seeding distributions...");
  for (const dist of mockDistributions) {
    const songId = songIdByTitle.get(dist.songTitle);
    const distributorId = distIdByName.get(dist.distributorName);
    if (!songId || !distributorId) continue;
    await prisma.distribution.create({
      data: {
        songId,
        distributorId,
        upc: dist.upc ?? null,
        isrc: dist.isrc ?? null,
        stores: dist.stores,
        status: dist.status as never,
        releaseDate: d(dist.releaseDate),
        takedownDate: d((dist as { takedownDate?: string }).takedownDate),
      },
    });
  }

  console.log("Seeding revenue...");
  for (const r of mockRevenue) {
    await prisma.revenue.create({
      data: {
        songId: songIdByTitle.get(r.songTitle) ?? null,
        platform: r.platform,
        revenueType: r.revenueType as never,
        amount: r.amount,
        currency: r.currency,
        period: new Date(r.period),
      },
    });
  }

  console.log("Seeding stream plays...");
  for (const p of mockStreamPlays) {
    const songId = songIdByTitle.get(p.songTitle);
    if (!songId) continue;
    await prisma.streamPlay.create({
      data: {
        songId,
        platform: p.platform,
        plays: p.plays,
        period: new Date(p.period),
        isrc: p.isrc ?? null,
      },
    });
  }

  console.log("Seeding social posts...");
  for (const sp of mockSocialPosts) {
    await prisma.socialPost.create({
      data: {
        songId: songIdByTitle.get(sp.songTitle) ?? null,
        platform: sp.platform,
        status: sp.status as never,
        caption: sp.caption ?? null,
        hashtags: sp.hashtags,
        scheduledAt: d(sp.scheduledAt),
        postedAt: d(sp.postedAt),
        campaign: sp.campaign ?? null,
      },
    });
  }

  console.log("Seeding ad campaigns...");
  for (const a of mockAdCampaigns) {
    await prisma.adCampaign.create({
      data: {
        songId: songIdByTitle.get(a.songTitle) ?? null,
        name: a.name,
        platform: a.platform,
        objective: a.objective ?? null,
        budget: a.budget ?? null,
        startDate: d(a.startDate),
        endDate: d(a.endDate),
        targetAudience: a.targetAudience ?? null,
        status: a.status as never,
        impressions: a.impressions ?? null,
        clicks: a.clicks ?? null,
        ctr: a.ctr ?? null,
        cpc: a.cpc ?? null,
        conversions: a.conversions ?? null,
        costPerConv: a.costPerConv ?? null,
        revenueAttributed: a.revenueAttributed ?? null,
      },
    });
  }

  console.log("Seeding pixel events...");
  for (const e of mockPixelEvents) {
    await prisma.pixelEvent.create({
      data: {
        songId: songIdByTitle.get(e.songTitle) ?? null,
        visitorId: e.visitorId,
        pageUrl: e.pageUrl,
        referrer: e.referrer ?? null,
        eventType: e.eventType,
        utmSource: e.utmSource ?? null,
        utmMedium: e.utmMedium ?? null,
        utmCampaign: e.utmCampaign ?? null,
        createdAt: new Date(e.createdAt),
      },
    });
  }

  console.log("Seeding contacts...");
  for (const c of mockContacts) {
    await prisma.contact.create({
      data: {
        name: c.name,
        role: c.role,
        email: c.email ?? null,
        phone: c.phone ?? null,
        company: c.company ?? null,
        website: c.website ?? null,
        notes: c.notes ?? null,
        tags: c.tags,
      },
    });
  }

  console.log("✅ Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
