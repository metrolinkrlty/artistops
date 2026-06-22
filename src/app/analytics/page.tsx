import Header from "@/components/layout/Header";

const analyticsData = {
  pageViews: 4821,
  uniqueVisitors: 2341,
  avgSessionDuration: "2m 34s",
  bounceRate: "42%",
  topPages: [
    { page: "/midnight-drive", views: 2341, unique: 1892 },
    { page: "/golden-hours", views: 1203, unique: 987 },
    { page: "/", views: 892, unique: 783 },
    { page: "/merch", views: 385, unique: 312 },
  ],
  topSources: [
    { source: "Instagram", sessions: 1203, pct: 35 },
    { source: "TikTok", sessions: 892, pct: 26 },
    { source: "Direct", sessions: 445, pct: 13 },
    { source: "Google Organic", sessions: 312, pct: 9 },
    { source: "Facebook", sessions: 289, pct: 8 },
  ],
  conversions: [
    { type: "Email Signup", count: 234 },
    { type: "Pre-Save", count: 89 },
    { type: "Merch Click", count: 45 },
    { type: "Play Button", count: 412 },
  ],
};

export default function AnalyticsPage() {
  return (
    <div className="flex-1">
      <Header title="Website Analytics" subtitle="Visitor traffic and conversion data" />
      <div className="p-8 space-y-6">
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "Page Views", value: analyticsData.pageViews.toLocaleString() },
            { label: "Unique Visitors", value: analyticsData.uniqueVisitors.toLocaleString() },
            { label: "Avg Session", value: analyticsData.avgSessionDuration },
            { label: "Bounce Rate", value: analyticsData.bounceRate },
          ].map(s => (
            <div key={s.label} className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl p-4">
              <p className="text-[#8b8fa8] text-sm">{s.label}</p>
              <p className="text-white text-2xl font-bold mt-1">{s.value}</p>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl p-6">
            <h2 className="text-white font-semibold mb-4">Top Pages</h2>
            <table className="w-full">
              <thead>
                <tr className="text-[#8b8fa8] text-xs border-b border-[#2a2d3a]">
                  <th className="text-left pb-3">Page</th>
                  <th className="text-right pb-3">Views</th>
                  <th className="text-right pb-3">Unique</th>
                </tr>
              </thead>
              <tbody>
                {analyticsData.topPages.map(p => (
                  <tr key={p.page} className="border-b border-[#2a2d3a] last:border-0">
                    <td className="py-3 text-[#8b8fa8] text-sm font-mono">{p.page}</td>
                    <td className="py-3 text-right text-white text-sm">{p.views.toLocaleString()}</td>
                    <td className="py-3 text-right text-[#8b8fa8] text-sm">{p.unique.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl p-6">
            <h2 className="text-white font-semibold mb-4">Traffic Sources</h2>
            <div className="space-y-3">
              {analyticsData.topSources.map(s => (
                <div key={s.source}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-white">{s.source}</span>
                    <span className="text-[#8b8fa8]">{s.sessions.toLocaleString()}</span>
                  </div>
                  <div className="h-2 bg-[#2a2d3a] rounded-full">
                    <div className="h-2 bg-indigo-600 rounded-full" style={{ width: `${s.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl p-6">
          <h2 className="text-white font-semibold mb-4">Conversions</h2>
          <div className="grid grid-cols-4 gap-4">
            {analyticsData.conversions.map(c => (
              <div key={c.type} className="bg-[#0f1117] border border-[#2a2d3a] rounded-lg p-4 text-center">
                <p className="text-white text-2xl font-bold">{c.count}</p>
                <p className="text-[#8b8fa8] text-sm mt-1">{c.type}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
