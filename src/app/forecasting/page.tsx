import Header from "@/components/layout/Header";
import { getForecastData } from "./actions";

export const dynamic = "force-dynamic";

const growingMarkets = [
  { market: "Texas, US", growth: "+34% MoM", forecast: "22,000 next month" },
  { market: "Southeast UK", growth: "+28% MoM", forecast: "15,600 next month" },
  { market: "Ontario, CA", growth: "+22% MoM", forecast: "11,900 next month" },
  { market: "Bavaria, DE", growth: "+19% MoM", forecast: "8,600 next month" },
  { market: "New South Wales, AU", growth: "+17% MoM", forecast: "7,900 next month" },
];
const tourRecommendations = [
  { city: "Los Angeles, CA", growth: "+12%", suitability: 96 },
  { city: "New York, NY", growth: "+8%", suitability: 92 },
  { city: "London, UK", growth: "+15%", suitability: 89 },
  { city: "Toronto, CA", growth: "+22%", suitability: 84 },
  { city: "Chicago, IL", growth: "+11%", suitability: 78 },
];
const merch = [
  { item: "T-Shirts", demand: "High", score: 84, note: "Growing in US + UK" },
  { item: "Vinyl Records", demand: "Medium", score: 62, note: "Strong in Germany and Japan" },
  { item: "Hoodies", demand: "Medium", score: 58, note: "Fall/winter seasonality up" },
  { item: "Posters", demand: "Low", score: 34, note: "Declining demand overall" },
  { item: "Digital Downloads", demand: "Low", score: 28, note: "Streaming cannibalizes" },
  { item: "Hat/Cap", demand: "High", score: 76, note: "TikTok-driven demand spike" },
];

type Row = { month: string; streams: number; revenue: number; followers: number; projected: boolean };

function MiniChart({ data, metric, color }: { data: Row[]; metric: "streams" | "revenue" | "followers"; color: string }) {
  const vals = data.map((d) => d[metric]);
  const max = Math.max(...vals, 1);
  return (
    <div className="flex items-end gap-0.5 h-24">
      {data.map((d, i) => (
        <div key={i} className="flex-1 relative" style={{ height: "100%" }}>
          <div className={`absolute bottom-0 w-full rounded-t transition-all ${d.projected ? `${color} opacity-40 border border-dashed` : color}`} style={{ height: `${(vals[i] / max) * 100}%` }} />
        </div>
      ))}
    </div>
  );
}

export default async function ForecastingPage() {
  const { monthlyData, nextMonth } = await getForecastData();
  const first = monthlyData[0]?.month || "";
  const last = monthlyData[monthlyData.length - 1]?.month || "";

  return (
    <div className="flex-1">
      <Header title="Forecasting" subtitle="Predicted vs actual performance" />
      <div className="p-8 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#1a1d27] border border-indigo-500/40 rounded-xl p-4"><p className="text-[#8b8fa8] text-sm">Next Month Streams</p><p className="text-white text-2xl font-bold mt-1">{nextMonth?.streams.toLocaleString()}</p><p className="text-indigo-400 text-xs mt-1">±8% confidence interval</p></div>
          <div className="bg-[#1a1d27] border border-green-500/40 rounded-xl p-4"><p className="text-[#8b8fa8] text-sm">Next Month Revenue</p><p className="text-white text-2xl font-bold mt-1">${nextMonth?.revenue.toLocaleString()}</p><p className="text-green-400 text-xs mt-1">±12% confidence interval</p></div>
          <div className="bg-[#1a1d27] border border-amber-500/40 rounded-xl p-4"><p className="text-[#8b8fa8] text-sm">Projected Followers</p><p className="text-white text-2xl font-bold mt-1">{nextMonth?.followers.toLocaleString()}</p><p className="text-amber-400 text-xs mt-1">End of next month</p></div>
          <div className="bg-[#1a1d27] border border-purple-500/40 rounded-xl p-4"><p className="text-[#8b8fa8] text-sm">Advertising ROI</p><p className="text-white text-2xl font-bold mt-1">2.4×</p><p className="text-purple-400 text-xs mt-1">Projected ROAS</p></div>
        </div>

        <div className="bg-indigo-600/10 border border-indigo-500/30 rounded-xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xl">🎯</div>
          <div>
            <p className="text-white font-medium">100K Monthly Listeners Milestone</p>
            <p className="text-[#8b8fa8] text-sm">At current growth rate, you&apos;ll cross 100K monthly listeners in approximately <span className="text-indigo-400 font-medium">6 weeks</span>.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {([
            { title: "Monthly Streams", metric: "streams" as const, color: "bg-indigo-600" },
            { title: "Monthly Revenue", metric: "revenue" as const, color: "bg-green-600" },
            { title: "Follower Growth", metric: "followers" as const, color: "bg-purple-600" },
          ]).map((c) => (
            <div key={c.metric} className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl p-6">
              <h3 className="text-white font-medium mb-1">{c.title}</h3>
              <p className="text-[#8b8fa8] text-xs mb-4">Actual (solid) + Projected (faded)</p>
              <MiniChart data={monthlyData} metric={c.metric} color={c.color} />
              <div className="flex justify-between text-xs text-[#8b8fa8] mt-2"><span>{first}</span><span>{last}</span></div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl p-6">
            <h2 className="text-white font-semibold mb-4">Top Growing Markets</h2>
            <table className="w-full text-sm">
              <thead><tr className="text-[#8b8fa8] border-b border-[#2a2d3a]"><th className="text-left pb-2">Market</th><th className="text-right pb-2">Growth</th><th className="text-right pb-2">Forecast</th></tr></thead>
              <tbody>{growingMarkets.map((m) => (<tr key={m.market} className="border-b border-[#2a2d3a] last:border-0"><td className="py-2 text-white">{m.market}</td><td className="py-2 text-right text-green-400 font-medium">{m.growth}</td><td className="py-2 text-right text-[#8b8fa8]">{m.forecast}</td></tr>))}</tbody>
            </table>
          </div>
          <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl p-6">
            <h2 className="text-white font-semibold mb-4">Tour Market Recommendations</h2>
            <p className="text-[#8b8fa8] text-xs mb-4">Based on listener density and growth</p>
            <div className="space-y-3">
              {tourRecommendations.map((r, i) => (
                <div key={r.city} className="flex items-center gap-3">
                  <span className="text-[#8b8fa8] text-sm w-4">#{i + 1}</span>
                  <div className="flex-1">
                    <div className="flex justify-between mb-0.5"><span className="text-white text-sm">{r.city}</span><span className="text-green-400 text-xs">{r.growth}</span></div>
                    <div className="h-1.5 bg-[#2a2d3a] rounded-full"><div className="h-1.5 bg-indigo-500 rounded-full" style={{ width: `${r.suitability}%` }} /></div>
                  </div>
                  <span className="text-indigo-400 text-sm font-medium">{r.suitability}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl p-6">
          <h2 className="text-white font-semibold mb-4">Merchandise Demand Indicators</h2>
          <div className="grid grid-cols-3 gap-4">
            {merch.map((item) => (
              <div key={item.item} className="bg-[#0f1117] rounded-lg p-3">
                <div className="flex justify-between mb-1"><span className="text-white text-sm font-medium">{item.item}</span><span className={`text-xs ${item.demand === "High" ? "text-green-400" : item.demand === "Medium" ? "text-amber-400" : "text-gray-400"}`}>{item.demand}</span></div>
                <div className="h-1.5 bg-[#2a2d3a] rounded-full mb-1"><div className={`h-1.5 rounded-full ${item.demand === "High" ? "bg-green-500" : item.demand === "Medium" ? "bg-amber-500" : "bg-gray-500"}`} style={{ width: `${item.score}%` }} /></div>
                <p className="text-[#8b8fa8] text-xs">{item.note}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
