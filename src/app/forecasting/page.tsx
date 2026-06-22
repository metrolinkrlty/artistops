"use client";
import Header from "@/components/layout/Header";

const monthlyData = [
  { month: "Jul '23", streams: 18200, revenue: 728, followers: 12400, projected: false },
  { month: "Aug '23", streams: 22100, revenue: 885, followers: 13800, projected: false },
  { month: "Sep '23", streams: 28400, revenue: 1138, followers: 15200, projected: false },
  { month: "Oct '23", streams: 31200, revenue: 1249, followers: 17400, projected: false },
  { month: "Nov '23", streams: 38900, revenue: 1557, followers: 20100, projected: false },
  { month: "Dec '23", streams: 45200, revenue: 1810, followers: 23400, projected: false },
  { month: "Jan '24", streams: 42100, revenue: 1685, followers: 25800, projected: false },
  { month: "Feb '24", streams: 68400, revenue: 2738, followers: 31200, projected: false },
  { month: "Mar '24", streams: 89200, revenue: 3570, followers: 38900, projected: false },
  { month: "Apr '24", streams: 76400, revenue: 3057, followers: 44200, projected: false },
  { month: "May '24", streams: 98400, revenue: 3938, followers: 52100, projected: false },
  { month: "Jun '24", streams: 87200, revenue: 3490, followers: 58400, projected: false },
  { month: "Jul '24", streams: 101400, revenue: 4057, followers: 65200, projected: true },
  { month: "Aug '24", streams: 112800, revenue: 4513, followers: 73400, projected: true },
  { month: "Sep '24", streams: 128400, revenue: 5137, followers: 83800, projected: true },
];

const growingMarkets = [
  { market: "Texas, US", growth: "+34% MoM", streams: 18400, forecast: "22,000 next month" },
  { market: "Southeast UK", growth: "+28% MoM", streams: 12200, forecast: "15,600 next month" },
  { market: "Ontario, CA", growth: "+22% MoM", streams: 9800, forecast: "11,900 next month" },
  { market: "Bavaria, DE", growth: "+19% MoM", streams: 7200, forecast: "8,600 next month" },
  { market: "New South Wales, AU", growth: "+17% MoM", streams: 6800, forecast: "7,900 next month" },
];

const tourRecommendations = [
  { city: "Los Angeles, CA", listeners: 48200, growth: "+12%", suitability: 96 },
  { city: "New York, NY", listeners: 41300, growth: "+8%", suitability: 92 },
  { city: "London, UK", listeners: 38900, growth: "+15%", suitability: 89 },
  { city: "Toronto, CA", listeners: 22100, growth: "+22%", suitability: 84 },
  { city: "Chicago, IL", listeners: 18700, growth: "+11%", suitability: 78 },
];

function MiniChart({ data, key1, color, projected }: { data: typeof monthlyData; key1: keyof typeof monthlyData[0]; color: string; projected: boolean[] }) {
  const vals = data.map(d => Number(d[key1]));
  const max = Math.max(...vals);
  return (
    <div className="flex items-end gap-0.5 h-24">
      {data.map((d, i) => {
        const h = (vals[i] / max) * 100;
        return (
          <div key={i} className="flex-1 relative" style={{ height: "100%" }}>
            <div
              className={`absolute bottom-0 w-full rounded-t transition-all ${d.projected ? `${color} opacity-40 border border-dashed` : color}`}
              style={{ height: `${h}%` }}
            />
          </div>
        );
      })}
    </div>
  );
}

export default function ForecastingPage() {
  const histMonths = monthlyData.filter(d => !d.projected);
  const projMonths = monthlyData.filter(d => d.projected);

  return (
    <div className="flex-1">
      <Header title="Forecasting" subtitle="Predicted vs actual performance" />
      <div className="p-8 space-y-6">
        {/* Forecast cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#1a1d27] border border-indigo-500/40 rounded-xl p-4">
            <p className="text-[#8b8fa8] text-sm">Next Month Streams</p>
            <p className="text-white text-2xl font-bold mt-1">112,800</p>
            <p className="text-indigo-400 text-xs mt-1">±8% confidence interval</p>
          </div>
          <div className="bg-[#1a1d27] border border-green-500/40 rounded-xl p-4">
            <p className="text-[#8b8fa8] text-sm">Next Month Revenue</p>
            <p className="text-white text-2xl font-bold mt-1">$4,513</p>
            <p className="text-green-400 text-xs mt-1">±12% confidence interval</p>
          </div>
          <div className="bg-[#1a1d27] border border-amber-500/40 rounded-xl p-4">
            <p className="text-[#8b8fa8] text-sm">Expected Q3 Royalty</p>
            <p className="text-white text-2xl font-bold mt-1">$1,240</p>
            <p className="text-amber-400 text-xs mt-1">PRO + MLC combined</p>
          </div>
          <div className="bg-[#1a1d27] border border-purple-500/40 rounded-xl p-4">
            <p className="text-[#8b8fa8] text-sm">Advertising ROI</p>
            <p className="text-white text-2xl font-bold mt-1">2.4×</p>
            <p className="text-purple-400 text-xs mt-1">Projected ROAS</p>
          </div>
        </div>

        {/* Milestone */}
        <div className="bg-indigo-600/10 border border-indigo-500/30 rounded-xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xl">🎯</div>
          <div>
            <p className="text-white font-medium">100K Monthly Listeners Milestone</p>
            <p className="text-[#8b8fa8] text-sm">At current growth rate, you'll cross 100K monthly listeners in approximately <span className="text-indigo-400 font-medium">6 weeks</span> (early August 2024).</p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl p-6">
            <h3 className="text-white font-medium mb-1">Monthly Streams</h3>
            <p className="text-[#8b8fa8] text-xs mb-4">Actual (solid) + Projected (faded)</p>
            <MiniChart data={monthlyData} key1="streams" color="bg-indigo-600" projected={monthlyData.map(d => d.projected)} />
            <div className="flex justify-between text-xs text-[#8b8fa8] mt-2">
              <span>Jul '23</span><span>Sep '24</span>
            </div>
          </div>
          <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl p-6">
            <h3 className="text-white font-medium mb-1">Monthly Revenue</h3>
            <p className="text-[#8b8fa8] text-xs mb-4">Actual (solid) + Projected (faded)</p>
            <MiniChart data={monthlyData} key1="revenue" color="bg-green-600" projected={monthlyData.map(d => d.projected)} />
            <div className="flex justify-between text-xs text-[#8b8fa8] mt-2">
              <span>Jul '23</span><span>Sep '24</span>
            </div>
          </div>
          <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl p-6">
            <h3 className="text-white font-medium mb-1">Follower Growth</h3>
            <p className="text-[#8b8fa8] text-xs mb-4">Actual (solid) + Projected (faded)</p>
            <MiniChart data={monthlyData} key1="followers" color="bg-purple-600" projected={monthlyData.map(d => d.projected)} />
            <div className="flex justify-between text-xs text-[#8b8fa8] mt-2">
              <span>Jul '23</span><span>Sep '24</span>
            </div>
          </div>
        </div>

        {/* Growing markets + Tour */}
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl p-6">
            <h2 className="text-white font-semibold mb-4">Top Growing Markets</h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[#8b8fa8] border-b border-[#2a2d3a]">
                  <th className="text-left pb-2">Market</th>
                  <th className="text-right pb-2">Growth</th>
                  <th className="text-right pb-2">Forecast</th>
                </tr>
              </thead>
              <tbody>
                {growingMarkets.map(m => (
                  <tr key={m.market} className="border-b border-[#2a2d3a] last:border-0">
                    <td className="py-2 text-white">{m.market}</td>
                    <td className="py-2 text-right text-green-400 font-medium">{m.growth}</td>
                    <td className="py-2 text-right text-[#8b8fa8]">{m.forecast}</td>
                  </tr>
                ))}
              </tbody>
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
                    <div className="flex justify-between mb-0.5">
                      <span className="text-white text-sm">{r.city}</span>
                      <span className="text-green-400 text-xs">{r.growth}</span>
                    </div>
                    <div className="h-1.5 bg-[#2a2d3a] rounded-full">
                      <div className="h-1.5 bg-indigo-500 rounded-full" style={{ width: `${r.suitability}%` }} />
                    </div>
                  </div>
                  <span className="text-indigo-400 text-sm font-medium">{r.suitability}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Merch indicators */}
        <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl p-6">
          <h2 className="text-white font-semibold mb-4">Merchandise Demand Indicators</h2>
          <div className="grid grid-cols-3 gap-4">
            {[
              { item: "T-Shirts", demand: "High", score: 84, note: "Growing in US + UK" },
              { item: "Vinyl Records", demand: "Medium", score: 62, note: "Strong in Germany and Japan" },
              { item: "Hoodies", demand: "Medium", score: 58, note: "Fall/winter seasonality up" },
              { item: "Posters", demand: "Low", score: 34, note: "Declining demand overall" },
              { item: "Digital Downloads", demand: "Low", score: 28, note: "Streaming cannibalizes" },
              { item: "Hat/Cap", demand: "High", score: 76, note: "TikTok-driven demand spike" },
            ].map(item => (
              <div key={item.item} className="bg-[#0f1117] rounded-lg p-3">
                <div className="flex justify-between mb-1">
                  <span className="text-white text-sm font-medium">{item.item}</span>
                  <span className={`text-xs ${item.demand === "High" ? "text-green-400" : item.demand === "Medium" ? "text-amber-400" : "text-gray-400"}`}>{item.demand}</span>
                </div>
                <div className="h-1.5 bg-[#2a2d3a] rounded-full mb-1">
                  <div className={`h-1.5 rounded-full ${item.demand === "High" ? "bg-green-500" : item.demand === "Medium" ? "bg-amber-500" : "bg-gray-500"}`} style={{ width: `${item.score}%` }} />
                </div>
                <p className="text-[#8b8fa8] text-xs">{item.note}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
