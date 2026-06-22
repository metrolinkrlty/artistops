import Header from "@/components/layout/Header";
import { dashboardStats } from "@/lib/mock-data";
import { Music, Shield, DollarSign, TrendingUp, Megaphone, Target, Sparkles, ListMusic, Link2, Users } from "lucide-react";
import Link from "next/link";

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
        <div className={`p-2 rounded-lg ${colors[color]}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <p className="text-white text-2xl font-bold">{value}</p>
    </div>
  );
}

const aiInsightsPrev = [
  { category: "Campaign", text: "Instagram campaign drove +23% Spotify streams last week.", color: "text-pink-400", bg: "bg-pink-500/10 border-pink-500/20" },
  { category: "Revenue", text: "3 songs not registered with MLC — est. $240 uncollected.", color: "text-red-400", bg: "bg-red-500/10 border-red-500/20" },
  { category: "Audience", text: "Texas is your fastest-growing audience state (+34% MoM).", color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
];

export default function Dashboard() {
  const stats = dashboardStats;

  return (
    <div className="flex-1">
      <Header title="Dashboard" subtitle="Welcome back, Alex Rivera" />
      <div className="p-8 space-y-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Songs" value={stats.totalSongs.toString()} icon={Music} color="indigo" />
          <StatCard title="Released Songs" value={stats.releasedSongs.toString()} icon={TrendingUp} color="green" />
          <StatCard title="Registered Copyrights" value={stats.registeredCopyrights.toString()} icon={Shield} color="amber" />
          <StatCard title="Total Revenue" value={`$${stats.totalRevenue.toLocaleString()}`} icon={DollarSign} color="green" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Monthly Revenue" value={`$${stats.monthlyRevenue.toLocaleString()}`} icon={DollarSign} color="blue" />
          <StatCard title="Active Campaigns" value={stats.activeCampaigns.toString()} icon={Megaphone} color="amber" />
          <StatCard title="Website Conversions" value={stats.websiteConversions.toString()} icon={Target} color="indigo" />
          <StatCard title="Total Streams" value="1.86M" icon={TrendingUp} color="green" />
        </div>

        {/* New summary cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <Link2 className="w-4 h-4 text-indigo-400" />
              <span className="text-[#8b8fa8] text-sm">Smart Link Clicks</span>
            </div>
            <p className="text-white text-2xl font-bold">3,687</p>
            <p className="text-[#8b8fa8] text-xs mt-1">This month · 3 active links</p>
          </div>
          <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <ListMusic className="w-4 h-4 text-green-400" />
              <span className="text-[#8b8fa8] text-sm">Playlist Placements</span>
            </div>
            <p className="text-white text-2xl font-bold">8</p>
            <p className="text-[#8b8fa8] text-xs mt-1">3 editorial · 2 algorithmic</p>
          </div>
          <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-blue-400" />
              <span className="text-[#8b8fa8] text-sm">Monthly Listeners</span>
            </div>
            <p className="text-white text-2xl font-bold">87,400</p>
            <p className="text-green-400 text-xs mt-1">+12.3% MoM</p>
          </div>
          <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">🇺🇸</span>
              <span className="text-[#8b8fa8] text-sm">Top Territory</span>
            </div>
            <p className="text-white text-2xl font-bold">United States</p>
            <p className="text-[#8b8fa8] text-xs mt-1">42.3% of total streams</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl p-6">
            <h2 className="text-white font-semibold mb-4">Monthly Revenue</h2>
            <div className="flex items-end gap-2 h-32">
              {stats.monthlyData.map((d) => {
                const maxRevenue = Math.max(...stats.monthlyData.map(x => x.revenue));
                const height = (d.revenue / maxRevenue) * 100;
                return (
                  <div key={d.month} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className="w-full bg-indigo-600 rounded-t"
                      style={{ height: `${height}%` }}
                    />
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
                const maxPlays = Math.max(...stats.topPlatformsByPlays.map(x => x.plays));
                const pct = (p.plays / maxPlays) * 100;
                return (
                  <div key={p.platform}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-white">{p.platform}</span>
                      <span className="text-[#8b8fa8]">{p.plays.toLocaleString()}</span>
                    </div>
                    <div className="h-2 bg-[#2a2d3a] rounded-full">
                      <div className="h-2 bg-indigo-600 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* AI Insights Preview */}
        <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-semibold flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" /> AI Insights
            </h2>
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
            <thead>
              <tr className="text-[#8b8fa8] text-sm border-b border-[#2a2d3a]">
                <th className="text-left pb-3">Song</th>
                <th className="text-right pb-3">Revenue</th>
                <th className="text-right pb-3">Streams</th>
              </tr>
            </thead>
            <tbody>
              {stats.topSongsByRevenue.map((s) => (
                <tr key={s.title} className="border-b border-[#2a2d3a] last:border-0">
                  <td className="py-3 text-white">{s.title}</td>
                  <td className="py-3 text-right text-green-400">${s.revenue.toLocaleString()}</td>
                  <td className="py-3 text-right text-[#8b8fa8]">{s.streams.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
