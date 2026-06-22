import { prisma } from "@/lib/prisma";

// Seeds a representative demo catalog owned by `userId`, using the artist's own name.
export async function seedSampleDataForUser(userId: string, artistName: string) {
  const d = (s: string) => new Date(s);
  const slugBase = (s: string) =>
    s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + "-" + Math.random().toString(36).slice(2, 6);

  // --- Songs ---
  const songsData = [
    { title: "Midnight Drive", isrc: "USRC1" + Math.random().toString().slice(2, 9), genre: "Pop", bpm: 128, key: "C Major", status: "MONETIZED", releaseDate: "2024-03-15", writers: [artistName, "Maya Chen"], splits: [{ name: artistName, percentage: 60 }, { name: "Maya Chen", percentage: 40 }] },
    { title: "Golden Hours", isrc: "USRC1" + Math.random().toString().slice(2, 9), genre: "R&B", bpm: 95, key: "F Minor", status: "RELEASED", releaseDate: "2024-05-20", writers: [artistName], splits: [{ name: artistName, percentage: 100 }] },
    { title: "Electric Soul", isrc: null, genre: "Electronic", bpm: 140, key: "A Minor", status: "MASTERED", releaseDate: null, writers: [artistName, "Jordan Blake"], splits: [{ name: artistName, percentage: 70 }, { name: "Jordan Blake", percentage: 30 }] },
  ];
  const songIds: Record<string, string> = {};
  for (const s of songsData) {
    const created = await prisma.song.create({
      data: {
        userId, title: s.title, artist: artistName, writers: s.writers,
        publishers: ["Independent"], splits: s.splits, isrc: s.isrc, upc: null,
        releaseDate: s.releaseDate ? d(s.releaseDate) : null, genre: s.genre, bpm: s.bpm, key: s.key,
        status: s.status as never,
      },
    });
    songIds[s.title] = created.id;
  }

  // --- Distributors ---
  const dk = await prisma.distributor.create({ data: { userId, name: "DistroKid", accountId: "DK-001", email: "support@distrokid.com", website: "https://distrokid.com", notes: "Primary distributor." } });
  await prisma.distributor.create({ data: { userId, name: "CD Baby", accountId: "CDB-002", email: "support@cdbaby.com", website: "https://cdbaby.com", notes: "Backup catalog." } });

  // --- Copyrights ---
  await prisma.copyright.create({ data: { userId, songId: songIds["Midnight Drive"], registrationNumber: "PAu004000001", filingDate: d("2024-01-20"), claimant: artistName, authors: ["Maya Chen", artistName], workType: "Musical Work", registeredWithUSCO: true, registeredWithPRO: true, registeredWithMLC: true, registeredWithSX: false, registeredWithDist: true, proName: "ASCAP" } });
  await prisma.copyright.create({ data: { userId, songId: songIds["Golden Hours"], registrationNumber: "PAu004000002", filingDate: d("2024-03-10"), claimant: artistName, authors: [artistName], workType: "Musical Work", registeredWithUSCO: true, registeredWithPRO: true, registeredWithMLC: true, registeredWithSX: true, registeredWithDist: true, proName: "ASCAP" } });

  // --- Distributions ---
  await prisma.distribution.create({ data: { userId, songId: songIds["Midnight Drive"], distributorId: dk.id, isrc: songsData[0].isrc, stores: ["Spotify", "Apple Music", "Amazon Music", "YouTube Music", "Tidal"], status: "ACTIVE", releaseDate: d("2024-03-15") } });
  await prisma.distribution.create({ data: { userId, songId: songIds["Golden Hours"], distributorId: dk.id, isrc: songsData[1].isrc, stores: ["Spotify", "Apple Music", "Amazon Music"], status: "ACTIVE", releaseDate: d("2024-05-20") } });

  // --- Revenue ---
  const rev = [
    ["Midnight Drive", "Spotify", "STREAMING", 1243.5, "2024-05-01"],
    ["Midnight Drive", "Apple Music", "STREAMING", 892.2, "2024-05-01"],
    ["Golden Hours", "Spotify", "STREAMING", 567.8, "2024-05-01"],
    ["Midnight Drive", "ASCAP", "PRO_ROYALTY", 420.0, "2024-04-01"],
    ["Golden Hours", "YouTube", "YOUTUBE_CONTENT_ID", 312.4, "2024-05-01"],
    ["Midnight Drive", "Sync License", "SYNC_LICENSE", 2500.0, "2024-02-01"],
  ] as const;
  for (const [title, platform, type, amount, period] of rev) {
    await prisma.revenue.create({ data: { userId, songId: songIds[title], platform, revenueType: type as never, amount, currency: "USD", period: d(period) } });
  }

  // --- Stream plays ---
  const plays = [
    ["Midnight Drive", "Spotify", 245320], ["Midnight Drive", "Apple Music", 89430], ["Midnight Drive", "TikTok", 892100],
    ["Golden Hours", "Spotify", 123450], ["Golden Hours", "Apple Music", 45670],
  ] as const;
  for (const [title, platform, n] of plays) {
    await prisma.streamPlay.create({ data: { userId, songId: songIds[title], platform, plays: n, period: d("2024-05-01"), isrc: songsData.find((s) => s.title === title)?.isrc ?? null } });
  }

  // --- Social posts ---
  await prisma.socialPost.create({ data: { userId, songId: songIds["Midnight Drive"], platform: "Instagram", status: "POSTED", caption: "New single out now! 🎵", hashtags: ["NewMusic", "Pop"], postedAt: d("2024-03-15"), campaign: "Release Campaign" } });
  await prisma.socialPost.create({ data: { userId, songId: songIds["Golden Hours"], platform: "TikTok", status: "SCHEDULED", caption: "Something golden is coming...", hashtags: ["ComingSoon"], scheduledAt: d("2024-05-18"), campaign: "Pre-Release" } });

  // --- Ad campaigns ---
  await prisma.adCampaign.create({ data: { userId, songId: songIds["Midnight Drive"], name: "Midnight Drive — Release Push", platform: "Meta", objective: "Stream Conversion", budget: 500, startDate: d("2024-03-15"), endDate: d("2024-03-31"), targetAudience: "18-34, Pop fans", status: "COMPLETED", impressions: 245000, clicks: 12300, ctr: 5.02, conversions: 892, revenueAttributed: 1240.5 } });

  // --- Contacts ---
  await prisma.contact.create({ data: { userId, name: "Marcus Thompson", role: "producer", email: "marcus@studiox.com", company: "Studio X", notes: "Produced your first singles.", tags: ["producer", "trusted"] } });
  await prisma.contact.create({ data: { userId, name: "David Park", role: "curator", email: "david@playlisthq.com", company: "PlaylistHQ", notes: "Spotify playlist curator.", tags: ["curator", "spotify"] } });

  // --- Smart links ---
  const sl = await prisma.smartLink.create({ data: { userId, slug: slugBase("Midnight Drive"), title: "Midnight Drive", artistName, platforms: [{ name: "Spotify", url: "https://open.spotify.com", priority: 1 }, { name: "Apple Music", url: "https://music.apple.com", priority: 2 }, { name: "YouTube Music", url: "https://music.youtube.com", priority: 3 }], isActive: true } });
  for (let i = 0; i < 12; i++) {
    await prisma.smartLinkClick.create({ data: { userId, smartLinkId: sl.id, platform: ["Spotify", "Apple Music", "YouTube Music"][i % 3], country: ["US", "GB", "CA"][i % 3], device: ["Mobile", "Desktop"][i % 2] } });
  }

  // --- Playlists ---
  const pl = await prisma.playlist.create({ data: { userId, name: "Indie Vibes", platform: "Spotify", type: "EDITORIAL", followerCount: 284000, isActive: true } });
  await prisma.playlistSong.create({ data: { userId, playlistId: pl.id, songId: songIds["Midnight Drive"], addedAt: d("2024-03-20"), streams: 42300, estimatedRevenue: 1680 } });

  // --- AI insights ---
  const insights = [
    { category: "revenue", title: "Sync placement drove your biggest payout", body: "Your sync license generated $2,500 — your highest single revenue event. Consider pitching more songs for sync.", confidence: 0.9, actionable: true },
    { category: "audience", title: "TikTok is your top discovery channel", body: "Midnight Drive has 892K TikTok plays — by far your largest reach. Keep posting short-form clips.", confidence: 0.82, actionable: true },
    { category: "revenue", title: "Register Electric Soul to avoid lost royalties", body: "Electric Soul isn't registered with a PRO or the MLC yet. Register it before release.", confidence: 0.95, actionable: true },
  ];
  for (const i of insights) await prisma.aIInsight.create({ data: { userId, ...i } as never });

  // --- Rights documents ---
  await prisma.rightsDocument.create({ data: { userId, songId: songIds["Midnight Drive"], type: "split_sheet", title: "Midnight Drive — Split Sheet", parties: [artistName, "Maya Chen"] } });
  await prisma.rightsDocument.create({ data: { userId, songId: songIds["Midnight Drive"], type: "license", title: "Sync License — TV Placement", parties: [artistName, "SyncBridge Agency"], expiresAt: d("2025-08-01") } });

  // --- Forecasts (6 months actual + 3 projected) ---
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
  for (const f of fc) {
    for (const metric of ["streams", "revenue", "followers"] as const) {
      await prisma.forecast.create({ data: { userId, metric, period: d(f.m), predicted: f[metric], actual: f.proj ? null : f[metric], model: "trend-v1" } });
    }
  }

  // --- Listener demographics ---
  const period = d("2024-05-01");
  const cities = [["Los Angeles", "US", 48200], ["New York", "US", 41300], ["London", "GB", 38900], ["Toronto", "CA", 22100], ["Sydney", "AU", 16200]] as const;
  for (const [city, country, streams] of cities) await prisma.listenerDemographic.create({ data: { userId, platform: "all", period, city, country, streams } });
  const countries = [["United States", 168400], ["United Kingdom", 61200], ["Canada", 43800], ["Australia", 31200], ["Germany", 19800]] as const;
  for (const [country, streams] of countries) await prisma.listenerDemographic.create({ data: { userId, platform: "all", period, country, streams } });
  const ag = [["18-24", "male", 22], ["18-24", "female", 26], ["25-34", "male", 18], ["25-34", "female", 19], ["35-44", "male", 9], ["35-44", "female", 12]] as const;
  for (const [ageGroup, gender, streams] of ag) await prisma.listenerDemographic.create({ data: { userId, platform: "all", period, ageGroup, gender, streams } });
  const plats = [["Spotify", 48], ["TikTok", 22], ["Apple Music", 16], ["YouTube Music", 8], ["Amazon Music", 4], ["Other", 2]] as const;
  for (const [platform, streams] of plats) await prisma.listenerDemographic.create({ data: { userId, platform, period, streams } });

  // --- Default settings ---
  await prisma.setting.create({ data: { userId, key: "proMembership", value: "ASCAP" } });
}
