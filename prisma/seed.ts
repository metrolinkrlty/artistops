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

  console.log("Seeding smart links...");
  await prisma.smartLinkClick.deleteMany();
  await prisma.smartLink.deleteMany();
  const smartLinks = [
    {
      slug: "midnight-drive", title: "Midnight Drive", artistName: "Alex Rivera",
      platforms: [
        { name: "Spotify", url: "https://open.spotify.com", priority: 1 },
        { name: "Apple Music", url: "https://music.apple.com", priority: 2 },
        { name: "YouTube Music", url: "https://music.youtube.com", priority: 3 },
        { name: "Amazon Music", url: "https://music.amazon.com", priority: 4 },
        { name: "Tidal", url: "https://tidal.com", priority: 5 },
      ],
    },
    {
      slug: "golden-hours", title: "Golden Hours", artistName: "Alex Rivera",
      platforms: [
        { name: "Spotify", url: "https://open.spotify.com", priority: 1 },
        { name: "Apple Music", url: "https://music.apple.com", priority: 2 },
        { name: "YouTube Music", url: "https://music.youtube.com", priority: 3 },
        { name: "Amazon Music", url: "https://music.amazon.com", priority: 4 },
      ],
    },
    {
      slug: "electric-soul-preview", title: "Electric Soul (Preview)", artistName: "Alex Rivera",
      platforms: [
        { name: "Spotify", url: "https://open.spotify.com", priority: 1 },
        { name: "SoundCloud", url: "https://soundcloud.com", priority: 2 },
      ],
    },
  ];
  for (const sl of smartLinks) {
    const created = await prisma.smartLink.create({
      data: { slug: sl.slug, title: sl.title, artistName: sl.artistName, platforms: sl.platforms, isActive: true },
    });
    // seed a handful of clicks
    const platforms = sl.platforms.map((p) => p.name);
    const countries = ["US", "GB", "CA", "AU", "DE"];
    const devices = ["Mobile", "Desktop", "Tablet"];
    const n = sl.slug === "midnight-drive" ? 40 : sl.slug === "golden-hours" ? 22 : 8;
    for (let i = 0; i < n; i++) {
      await prisma.smartLinkClick.create({
        data: {
          smartLinkId: created.id,
          platform: platforms[i % platforms.length],
          country: countries[i % countries.length],
          device: devices[i % devices.length],
        },
      });
    }
  }

  console.log("Seeding playlists...");
  await prisma.playlistSong.deleteMany();
  await prisma.playlist.deleteMany();
  const playlists = [
    { name: "Indie Vibes", platform: "Spotify", type: "EDITORIAL", followerCount: 284000, song: "Midnight Drive", streams: 42300, revenue: 1680, addedAt: "2024-03-20" },
    { name: "Late Night Drives", platform: "Spotify", type: "EDITORIAL", followerCount: 156000, song: "Midnight Drive", streams: 28400, revenue: 1130, addedAt: "2024-04-02" },
    { name: "Discover Weekly", platform: "Spotify", type: "ALGORITHMIC", followerCount: 0, song: "Golden Hours", streams: 18200, revenue: 725, addedAt: "2024-05-06" },
    { name: "Release Radar", platform: "Spotify", type: "ALGORITHMIC", followerCount: 0, song: "Golden Hours", streams: 12100, revenue: 484, addedAt: "2024-05-21" },
    { name: "R&B Essentials", platform: "Apple Music", type: "EDITORIAL", followerCount: 198000, song: "Golden Hours", streams: 19800, revenue: 2134, addedAt: "2024-05-18" },
    { name: "Pop Hits", platform: "Apple Music", type: "EDITORIAL", followerCount: 412000, song: "Midnight Drive", streams: 9200, revenue: 992, addedAt: "2024-04-10" },
    { name: "Chill Mix", platform: "Amazon Music", type: "ALGORITHMIC", followerCount: 0, song: "Midnight Drive", streams: 7400, revenue: 296, addedAt: "2024-05-01" },
    { name: "Fan Faves Mix", platform: "Spotify", type: "USER", followerCount: 2300, song: "Midnight Drive", streams: 4100, revenue: 164, addedAt: "2024-03-28" },
  ];
  for (const pl of playlists) {
    const created = await prisma.playlist.create({
      data: { name: pl.name, platform: pl.platform, type: pl.type as never, followerCount: pl.followerCount, isActive: true },
    });
    const songId = songIdByTitle.get(pl.song);
    if (songId) {
      await prisma.playlistSong.create({
        data: { playlistId: created.id, songId, addedAt: new Date(pl.addedAt), streams: pl.streams, estimatedRevenue: pl.revenue },
      });
    }
  }

  console.log("Seeding AI insights...");
  await prisma.aIInsight.deleteMany();
  const insights = [
    { category: "campaign", title: "Instagram campaign lifted Spotify streams", body: "Your Instagram campaign drove a +23% increase in Spotify streams last week.", confidence: 0.86, actionable: true },
    { category: "revenue", title: "Apple Music listeners are more valuable", body: "Apple Music listeners generate 2.1× higher revenue per stream than Spotify listeners. Consider prioritizing Apple Music in smart links.", confidence: 0.91, actionable: true },
    { category: "audience", title: "Texas is your fastest-growing market", body: "Texas has become your fastest growing audience state, up 34% month-over-month.", confidence: 0.78, actionable: false },
    { category: "revenue", title: "Playlist 'Indie Vibes' drives revenue", body: "Playlist 'Indie Vibes' is responsible for 18% of monthly revenue.", confidence: 0.83, actionable: false },
    { category: "revenue", title: "Revenue per stream is declining", body: "Revenue per stream is declining because more listeners are coming from lower-paying territories (India +41%).", confidence: 0.74, actionable: true },
    { category: "streaming", title: "Best release window identified", body: "Your best release time based on listener activity is Thursday 7-9 PM EST.", confidence: 0.69, actionable: true },
    { category: "campaign", title: "'Summer Drop' had top ROAS", body: "Ad campaign 'Summer Drop' achieved 3.2× ROAS — your highest performing campaign this year.", confidence: 0.88, actionable: false },
    { category: "revenue", title: "Unregistered songs may lose royalties", body: "Some songs are not registered with the MLC. Register them to avoid uncollected mechanical royalties.", confidence: 0.95, actionable: true },
    { category: "forecast", title: "On track to cross 100K monthly listeners", body: "If current growth holds, you will cross 100K monthly listeners in about 6 weeks.", confidence: 0.72, actionable: false },
  ];
  for (const ins of insights) await prisma.aIInsight.create({ data: ins as never });

  console.log("Seeding rights documents...");
  await prisma.rightsDocument.deleteMany();
  const docs = [
    { song: "Midnight Drive", type: "split_sheet", title: "Midnight Drive — Split Sheet", parties: ["Alex Rivera", "Maya Chen"], expiresAt: null },
    { song: "Midnight Drive", type: "recording_contract", title: "Midnight Drive — Master Recording Agreement", parties: ["Alex Rivera", "Sunset Music Publishing"], expiresAt: "2027-03-15" },
    { song: "Midnight Drive", type: "license", title: "Sync License — TV Placement", parties: ["Alex Rivera", "SyncBridge Agency"], expiresAt: "2025-08-01" },
    { song: "Golden Hours", type: "split_sheet", title: "Golden Hours — Split Sheet", parties: ["Alex Rivera"], expiresAt: null },
    { song: "Golden Hours", type: "distribution_agreement", title: "Golden Hours — DistroKid Distribution", parties: ["Alex Rivera", "DistroKid"], expiresAt: "2026-05-20" },
    { song: "Electric Soul", type: "split_sheet", title: "Electric Soul — Split Sheet", parties: ["Alex Rivera", "Jordan Blake", "Sam Torres"], expiresAt: null },
    { song: "Electric Soul", type: "license", title: "Sample Clearance — Electric Soul", parties: ["Alex Rivera", "Nova Sound"], expiresAt: "2025-07-15" },
    { song: "Sunrise Boulevard", type: "split_sheet", title: "Sunrise Boulevard — Split Sheet", parties: ["Alex Rivera", "Maya Chen"], expiresAt: null },
  ];
  for (const doc of docs) {
    const songId = songIdByTitle.get(doc.song);
    if (!songId) continue;
    await prisma.rightsDocument.create({
      data: { songId, type: doc.type, title: doc.title, parties: doc.parties, expiresAt: doc.expiresAt ? new Date(doc.expiresAt) : null },
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
