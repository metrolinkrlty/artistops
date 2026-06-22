import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";

const id = () => randomUUID();
const d = (s: string) => new Date(s);

// Seeds a representative demo catalog owned by `userId`, using the artist's own name.
// Uses batched createMany calls (with pre-generated ids) to stay fast on serverless.
export async function seedSampleDataForUser(userId: string, artistName: string) {
  const slug = artistName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 20) + "-" + Math.random().toString(36).slice(2, 6);

  // --- Songs ---
  const sMidnight = id(), sGolden = id(), sElectric = id();
  const isrc1 = "USRC1" + Math.random().toString().slice(2, 9);
  const isrc2 = "USRC1" + Math.random().toString().slice(2, 9);
  await prisma.song.createMany({
    data: [
      { id: sMidnight, userId, title: "Midnight Drive", artist: artistName, writers: [artistName, "Maya Chen"], publishers: ["Independent"], splits: [{ name: artistName, percentage: 60 }, { name: "Maya Chen", percentage: 40 }], isrc: isrc1, releaseDate: d("2024-03-15"), genre: "Pop", bpm: 128, key: "C Major", status: "MONETIZED" },
      { id: sGolden, userId, title: "Golden Hours", artist: artistName, writers: [artistName], publishers: ["Independent"], splits: [{ name: artistName, percentage: 100 }], isrc: isrc2, releaseDate: d("2024-05-20"), genre: "R&B", bpm: 95, key: "F Minor", status: "RELEASED" },
      { id: sElectric, userId, title: "Electric Soul", artist: artistName, writers: [artistName, "Jordan Blake"], publishers: ["Independent"], splits: [{ name: artistName, percentage: 70 }, { name: "Jordan Blake", percentage: 30 }], isrc: null, releaseDate: null, genre: "Electronic", bpm: 140, key: "A Minor", status: "MASTERED" },
    ] as never,
  });

  // --- Distributors ---
  const dDistroKid = id(), dCdBaby = id();
  await prisma.distributor.createMany({
    data: [
      { id: dDistroKid, userId, name: "DistroKid", accountId: "DK-001", email: "support@distrokid.com", website: "https://distrokid.com", notes: "Primary distributor." },
      { id: dCdBaby, userId, name: "CD Baby", accountId: "CDB-002", email: "support@cdbaby.com", website: "https://cdbaby.com", notes: "Backup catalog." },
    ],
  });

  // --- Copyrights ---
  await prisma.copyright.createMany({
    data: [
      { userId, songId: sMidnight, registrationNumber: "PAu004000001", filingDate: d("2024-01-20"), claimant: artistName, authors: ["Maya Chen", artistName], workType: "Musical Work", registeredWithUSCO: true, registeredWithPRO: true, registeredWithMLC: true, registeredWithSX: false, registeredWithDist: true, proName: "ASCAP" },
      { userId, songId: sGolden, registrationNumber: "PAu004000002", filingDate: d("2024-03-10"), claimant: artistName, authors: [artistName], workType: "Musical Work", registeredWithUSCO: true, registeredWithPRO: true, registeredWithMLC: true, registeredWithSX: true, registeredWithDist: true, proName: "ASCAP" },
    ],
  });

  // --- Distributions ---
  await prisma.distribution.createMany({
    data: [
      { userId, songId: sMidnight, distributorId: dDistroKid, isrc: isrc1, stores: ["Spotify", "Apple Music", "Amazon Music", "YouTube Music", "Tidal"], status: "ACTIVE", releaseDate: d("2024-03-15") },
      { userId, songId: sGolden, distributorId: dDistroKid, isrc: isrc2, stores: ["Spotify", "Apple Music", "Amazon Music"], status: "ACTIVE", releaseDate: d("2024-05-20") },
    ] as never,
  });

  // --- Revenue ---
  await prisma.revenue.createMany({
    data: [
      { userId, songId: sMidnight, platform: "Spotify", revenueType: "STREAMING", amount: 1243.5, currency: "USD", period: d("2024-05-01") },
      { userId, songId: sMidnight, platform: "Apple Music", revenueType: "STREAMING", amount: 892.2, currency: "USD", period: d("2024-05-01") },
      { userId, songId: sGolden, platform: "Spotify", revenueType: "STREAMING", amount: 567.8, currency: "USD", period: d("2024-05-01") },
      { userId, songId: sMidnight, platform: "ASCAP", revenueType: "PRO_ROYALTY", amount: 420.0, currency: "USD", period: d("2024-04-01") },
      { userId, songId: sGolden, platform: "YouTube", revenueType: "YOUTUBE_CONTENT_ID", amount: 312.4, currency: "USD", period: d("2024-05-01") },
      { userId, songId: sMidnight, platform: "Sync License", revenueType: "SYNC_LICENSE", amount: 2500.0, currency: "USD", period: d("2024-02-01") },
    ] as never,
  });

  // --- Stream plays ---
  await prisma.streamPlay.createMany({
    data: [
      { userId, songId: sMidnight, platform: "Spotify", plays: 245320, period: d("2024-05-01"), isrc: isrc1 },
      { userId, songId: sMidnight, platform: "Apple Music", plays: 89430, period: d("2024-05-01"), isrc: isrc1 },
      { userId, songId: sMidnight, platform: "TikTok", plays: 892100, period: d("2024-05-01"), isrc: isrc1 },
      { userId, songId: sGolden, platform: "Spotify", plays: 123450, period: d("2024-05-01"), isrc: isrc2 },
      { userId, songId: sGolden, platform: "Apple Music", plays: 45670, period: d("2024-05-01"), isrc: isrc2 },
    ],
  });

  // --- Social posts ---
  await prisma.socialPost.createMany({
    data: [
      { userId, songId: sMidnight, platform: "Instagram", status: "POSTED", caption: "New single out now! 🎵", hashtags: ["NewMusic", "Pop"], postedAt: d("2024-03-15"), campaign: "Release Campaign" },
      { userId, songId: sGolden, platform: "TikTok", status: "SCHEDULED", caption: "Something golden is coming...", hashtags: ["ComingSoon"], scheduledAt: d("2024-05-18"), campaign: "Pre-Release" },
    ] as never,
  });

  // --- Ad campaign ---
  await prisma.adCampaign.create({
    data: { userId, songId: sMidnight, name: "Midnight Drive — Release Push", platform: "Meta", objective: "Stream Conversion", budget: 500, startDate: d("2024-03-15"), endDate: d("2024-03-31"), targetAudience: "18-34, Pop fans", status: "COMPLETED", impressions: 245000, clicks: 12300, ctr: 5.02, conversions: 892, revenueAttributed: 1240.5 } as never,
  });

  // --- Contacts ---
  await prisma.contact.createMany({
    data: [
      { userId, name: "Marcus Thompson", role: "producer", email: "marcus@studiox.com", company: "Studio X", notes: "Produced your first singles.", tags: ["producer", "trusted"] },
      { userId, name: "David Park", role: "curator", email: "david@playlisthq.com", company: "PlaylistHQ", notes: "Spotify playlist curator.", tags: ["curator", "spotify"] },
    ],
  });

  // --- Smart link + clicks ---
  const slId = id();
  await prisma.smartLink.create({
    data: { id: slId, userId, slug, title: "Midnight Drive", artistName, platforms: [{ name: "Spotify", url: "https://open.spotify.com", priority: 1 }, { name: "Apple Music", url: "https://music.apple.com", priority: 2 }, { name: "YouTube Music", url: "https://music.youtube.com", priority: 3 }], isActive: true } as never,
  });
  await prisma.smartLinkClick.createMany({
    data: Array.from({ length: 12 }, (_, i) => ({ userId, smartLinkId: slId, platform: ["Spotify", "Apple Music", "YouTube Music"][i % 3], country: ["US", "GB", "CA"][i % 3], device: ["Mobile", "Desktop"][i % 2] })),
  });

  // --- Playlist + placement ---
  const plId = id();
  await prisma.playlist.create({ data: { id: plId, userId, name: "Indie Vibes", platform: "Spotify", type: "EDITORIAL", followerCount: 284000, isActive: true } as never });
  await prisma.playlistSong.create({ data: { userId, playlistId: plId, songId: sMidnight, addedAt: d("2024-03-20"), streams: 42300, estimatedRevenue: 1680 } });

  // --- AI insights ---
  await prisma.aIInsight.createMany({
    data: [
      { userId, category: "revenue", title: "Sync placement drove your biggest payout", body: "Your sync license generated $2,500 — your highest single revenue event. Consider pitching more songs for sync.", confidence: 0.9, actionable: true },
      { userId, category: "audience", title: "TikTok is your top discovery channel", body: "Midnight Drive has 892K TikTok plays — by far your largest reach. Keep posting short-form clips.", confidence: 0.82, actionable: true },
      { userId, category: "revenue", title: "Register Electric Soul to avoid lost royalties", body: "Electric Soul isn't registered with a PRO or the MLC yet. Register it before release.", confidence: 0.95, actionable: true },
    ] as never,
  });

  // --- Rights documents ---
  await prisma.rightsDocument.createMany({
    data: [
      { userId, songId: sMidnight, type: "split_sheet", title: "Midnight Drive — Split Sheet", parties: [artistName, "Maya Chen"] },
      { userId, songId: sMidnight, type: "license", title: "Sync License — TV Placement", parties: [artistName, "SyncBridge Agency"], expiresAt: d("2025-08-01") },
    ],
  });

  // --- Forecasts ---
  const fc = [
    { m: "2024-01-01", streams: 42100, revenue: 1685, followers: 25800, proj: false },
    { m: "2024-02-01", streams: 68400, revenue: 2738, followers: 31200, proj: false },
    { m: "2024-03-01", streams: 89200, revenue: 3570, followers: 38900, proj: false },
    { m: "2024-04-01", streams: 76400, revenue: 3057, followers: 44200, proj: false },
    { m: "2024-05-01", streams: 98400, revenue: 3938, followers: 52100, proj: false },
    { m: "2024-06-01", streams: 87200, revenue: 3490, followers: 58400, proj: false },
    { m: "2024-07-01", streams: 101400, revenue: 4057, followers: 65200, proj: true },
    { m: "2024-08-01", streams: 112800, revenue: 4513, followers: 73400, proj: true },
    { m: "2024-09-01", streams: 128400, revenue: 5137, followers: 83800, proj: true },
  ];
  await prisma.forecast.createMany({
    data: fc.flatMap((f) => (["streams", "revenue", "followers"] as const).map((metric) => ({ userId, metric, period: d(f.m), predicted: f[metric], actual: f.proj ? null : f[metric], model: "trend-v1" }))),
  });

  // --- Listener demographics ---
  const period = d("2024-05-01");
  const demo: { userId: string; platform: string; period: Date; streams: number; city?: string; country?: string; ageGroup?: string; gender?: string }[] = [];
  ([["Los Angeles", "US", 48200], ["New York", "US", 41300], ["London", "GB", 38900], ["Toronto", "CA", 22100], ["Sydney", "AU", 16200]] as const).forEach(([city, country, streams]) => demo.push({ userId, platform: "all", period, city, country, streams }));
  ([["United States", 168400], ["United Kingdom", 61200], ["Canada", 43800], ["Australia", 31200], ["Germany", 19800]] as const).forEach(([country, streams]) => demo.push({ userId, platform: "all", period, country, streams }));
  ([["18-24", "male", 22], ["18-24", "female", 26], ["25-34", "male", 18], ["25-34", "female", 19], ["35-44", "male", 9], ["35-44", "female", 12]] as const).forEach(([ageGroup, gender, streams]) => demo.push({ userId, platform: "all", period, ageGroup, gender, streams }));
  ([["Spotify", 48], ["TikTok", 22], ["Apple Music", 16], ["YouTube Music", 8], ["Amazon Music", 4], ["Other", 2]] as const).forEach(([platform, streams]) => demo.push({ userId, platform, period, streams }));
  await prisma.listenerDemographic.createMany({ data: demo });

  // --- Default settings ---
  await prisma.setting.createMany({ data: [{ userId, key: "proMembership", value: "ASCAP" }] });
}
