import Header from "@/components/layout/Header";
import { prisma } from "@/lib/prisma";
import { Music, Shield, DollarSign, TrendingUp, Megaphone, Target, Sparkles, ListMusic, Link2, Users } from "lucide-react";
import Link from "next/link";
import { getSettings } from "@/app/settings/actions";
import { requireUserId } from "@/lib/session";

export const dynamic = "force-dynamic";

function StatCard({ title, value, icon: Icon, color = "indigo" }: { title: string; value: string; icon: React.ElementType; color?: string }) {
  const colors: Record<string, string> = {
    indigo: "bg-indigo-500/10 text-indigo-400",
    green: "bg-green-500/10 text-green-400",
    amber: "bg-amber-500/10 text-amber-400",
    blue: "bg-blue-500/10 text-blue-400",
  };
  return (
    <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <span className="text-[#8b8fa8] text-sm">{title}</span>
        <div className={`p-2 rounded-lg ${colors[color]}`}><Icon className="w-4 h-4" /></div>
      </div>
      <p className="text-white text-2xl font-bold">{value}</p>
    </div>
  );
}

const aiInsightsPrev = [
  { category: "Campaign", text: "Instagram campaign drove +23% Spotify streams last week.", color: "text-pink-400", bg: "bg-pink-500/10 border-pink-500/20" },
  { category: "Revenue", text: "Songs not registered with MLC may have uncollected royalties.", color: "text-red-400", bg: "bg-red-500/10 border-red-500/20" },
  { category: "Audience", text: "Texas is your fastest-growing audience state (+34% MoM).", color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
];

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

async function getStats() {
  const userId = await requireUserId();
  const [songs, revenues, copyrights, campaigns, streamPlays, conversions, smartClicks, playlistCount] = await Promise.all([
    prisma.song.findMany({ where: { userId }, select: { id: true, title: true, status: true } }),
    prisma.revenue.findMany({ where: { userId }, select: { amount: true, period: true, songId: true } }),
    prisma.copyright.count({ where: { userId, registeredWithUSCO: true } }),
    prisma.adCampaign.count({ where: { userId, status: "ACTIVE" } }),
    prisma.streamPlay.findMany({ where: { userId }, select: { platform: true, plays: true, songId: true } }),
    prisma.pixelEvent.count({ where: { userId, eventType: { in: ["email_signup", "pre_save", "merch_click"] } } }),
    prisma.smartLinkClick.count({ where: { userId } }).catch(() => 0),
    prisma.playlistSong.count({ where: { userId } }).catch(() => 0),
  ]);

  const totalSongs = songs.length;
  const releasedSongs = songs.filter((s) => ["RELEASED", "MONETIZED", "REGISTERED"].includes(s.status)).length;
  const totalRevenue = revenues.reduce((sum, r) => sum + r.amount, 0);
  const totalStreams = streamPlays.reduce((sum, p) => sum + p.plays, 0);

  // monthly revenue (last up to 6 months present in data)
  const byMonth = new Map<string, number>();
  for (const r of revenues) {
    const key = `${r.period.getFullYear()}-${r.period.getMonth()}`;
    byMonth.set(key, (byMonth.get(key) || 0) + r.amount);
  }
  const sortedMonths = Array.from(byMonth.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-6)
    .map(([k, v]) => ({ month: MONTHS[Number(k.split("-")[1])], revenue: Math.round(v) }));
  const monthlyRevenue = sortedMonths.length ? sortedMonths[sortedMonths.length - 1].revenue : 0;

  // top platforms by plays
  const platMap = new Map<string, number>();
  for (const p of streamPlays) platMap.set(p.platform, (platMap.get(p.platform) || 0) + p.plays);
  const topPlatformsByPlays = Array.from(platMap.entries()).map(([platform, plays]) => ({ platform, plays })).sort((a, b) => b.plays - a.plays).slice(0, 5);

  // top songs by revenue
  const songTitle = new Map(songs.map((s) => [s.id, s.title]));
  const revBySong = new Map<string, number>();
  for (const r of revenues) if (r.songId) revBySong.set(r.songId, (revBySong.get(r.songId) || 0) + r.amount);
  const streamsBySong = new Map<string, number>();
  for (const p of streamPlays) if (p.songId) streamsBySong.set(p.songId, (streamsBySong.get(p.songId) || 0) + p.plays);
  const topSongsByRevenue = Array.from(revBySong.entries())
    .map(([id, revenue]) => ({ title: songTitle.get(id) || "—", revenue, streams: streamsBySong.get(id) || 0 }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  return {
    totalSongs, releasedSongs, registeredCopyrights: copyrights, totalRevenue, totalStreams,
    monthlyRevenue, activeCampaigns: campaigns, websiteConversions: conversions,
    smartClicks, playlistCount,
    monthlyData: sortedMonths.length ? sortedMonths : [{ month: "—", revenue: 0 }],
    topPlatformsByPlays, topSongsByRevenue,
  };
}

function fmtCompact(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

export default async function Dashboard() {
  const [stats, settings] = await Promise.all([getStats(), getSettings()]);
  const artistName = settings.artistName || "Artist";

  return (
    <div className="flex-1">
      <Header title="Dashboard" subtitle={`Welcome back, ${artistName}`} />
      <div className="p-8 space-y-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Songs" value={stats.totalSongs.toString()} icon={Music} color="indigo" />
          <StatCard title="Released Songs" value={stats.releasedSongs.toString()} icon={TrendingUp} color="green" />
          <StatCard title="Registered Copyrights" value={stats.registeredCopyrights.toString()} icon={Shield} color="amber" />
          <StatCard title="Total Revenue" value={`$${stats.totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} icon={DollarSign} color="green" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Monthly Revenue" value={`$${stats.monthlyRevenue.toLocaleString()}`} icon={DollarSign} color="blue" />
          <StatCard title="Active Campaigns" value={stats.activeCampaigns.toString()} icon={Megaphone} color="amber" />
          <StatCard title="Website Conversions" value={stats.websiteConversions.toString()} icon={Target} color="indigo" />
          <StatCard title="Total Streams" value={fmtCompact(stats.totalStreams)} icon={TrendingUp} color="green" />
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl p-5">
            <div className="flex items-center gap-2 mb-2"><Link2 className="w-4 h-4 text-indigo-400" /><span className="text-[#8b8fa8] text-sm">Smart Link Clicks</span></div>
            <p className="text-white text-2xl font-bold">{stats.smartClicks.toLocaleString()}</p>
            <p className="text-[#8b8fa8] text-xs mt-1">All-time</p>
          </div>
          <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl p-5">
            <div className="flex items-center gap-2 mb-2"><ListMusic className="w-4 h-4 text-green-400" /><span className="text-[#8b8fa8] text-sm">Playlist Placements</span></div>
            <p className="text-white text-2xl font-bold">{stats.playlistCount}</p>
            <p className="text-[#8b8fa8] text-xs mt-1">Tracked placements</p>
          </div>
          <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl p-5">
            <div className="flex items-center gap-2 mb-2"><Users className="w-4 h-4 text-blue-400" /><span className="text-[#8b8fa8] text-sm">Monthly Listeners</span></div>
            <p className="text-white text-2xl font-bold">87,400</p>
            <p className="text-green-400 text-xs mt-1">+12.3% MoM</p>
          </div>
          <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl p-5">
            <div className="flex items-center gap-2 mb-2"><span className="text-xl">🇺🇸</span><span className="text-[#8b8fa8] text-sm">Top Territory</span></div>
            <p className="text-white text-2xl font-bold">United States</p>
            <p className="text-[#8b8fa8] text-xs mt-1">42.3% of total streams</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl p-6">
            <h2 className="text-white font-semibold mb-4">Monthly Revenue</h2>
            <div className="flex items-end gap-2 h-32">
              {stats.monthlyData.map((d, i) => {
                const maxRevenue = Math.max(...stats.monthlyData.map((x) => x.revenue), 1);
                const height = (d.revenue / maxRevenue) * 100;
                return (
                  <div key={`${d.month}-${i}`} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full bg-indigo-600 rounded-t" style={{ height: `${height}%` }} />
                    <span className="text-[#8b8fa8] text-xs">{d.month}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl p-6">
            <h2 className="text-white font-semibold mb-4">Top Platforms by Plays</h2>
            <div className="space-y-3">
              {stats.topPlatformsByPlays.map((p) => {
                const maxPlays = Math.max(...stats.topPlatformsByPlays.map((x) => x.plays), 1);
                const pct = (p.plays / maxPlays) * 100;
                return (
                  <div key={p.platform}>
                    <div className="flex justify-between text-sm mb-1"><span className="text-white">{p.platform}</span><span className="text-[#8b8fa8]">{p.plays.toLocaleString()}</span></div>
                    <div className="h-2 bg-[#2a2d3a] rounded-full"><div className="h-2 bg-indigo-600 rounded-full" style={{ width: `${pct}%` }} /></div>
                  </div>
                );
              })}
              {stats.topPlatformsByPlays.length === 0 && <p className="text-[#8b8fa8] text-sm">No play data yet.</p>}
            </div>
          </div>
        </div>

        <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-semibold flex items-center gap-2"><Sparkles className="w-4 h-4 text-indigo-400" /> AI Insights</h2>
            <Link href="/ai-insights" className="text-indigo-400 text-sm hover:text-indigo-300">View all →</Link>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            {aiInsightsPrev.map((i, idx) => (
              <div key={idx} className={`border rounded-xl p-4 ${i.bg}`}>
                <span className={`text-xs font-medium ${i.color}`}>{i.category}</span>
                <p className="text-white text-sm mt-1">{i.text}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl p-6">
          <h2 className="text-white font-semibold mb-4">Top Songs by Revenue</h2>
          <table className="w-full">
            <thead><tr className="text-[#8b8fa8] text-sm border-b border-[#2a2d3a]"><th className="text-left pb-3">Song</th><th className="text-right pb-3">Revenue</th><th className="text-right pb-3">Streams</th></tr></thead>
            <tbody>
              {stats.topSongsByRevenue.map((s) => (
                <tr key={s.title} className="border-b border-[#2a2d3a] last:border-0">
                  <td className="py-3 text-white">{s.title}</td>
                  <td className="py-3 text-right text-green-400">${s.revenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  <td className="py-3 text-right text-[#8b8fa8]">{s.streams.toLocaleString()}</td>
                </tr>
              ))}
              {stats.topSongsByRevenue.length === 0 && <tr><td colSpan={3} className="py-6 text-center text-[#8b8fa8] text-sm">No revenue data yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
