import Header from "@/components/layout/Header";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const CONVERSION_LABELS: Record<string, string> = {
  email_signup: "Email Signup",
  pre_save: "Pre-Save",
  merch_click: "Merch Click",
  play_button: "Play Button",
};

async function getAnalytics() {
  const events = await prisma.pixelEvent.findMany({
    select: { visitorId: true, pageUrl: true, eventType: true, utmSource: true },
  });

  const pageViews = events.filter((e) => e.eventType === "page_view").length;
  const uniqueVisitors = new Set(events.map((e) => e.visitorId)).size;

  const pageMap = new Map<string, { views: number; visitors: Set<string> }>();
  for (const e of events) {
    if (e.eventType !== "page_view") continue;
    if (!pageMap.has(e.pageUrl)) pageMap.set(e.pageUrl, { views: 0, visitors: new Set() });
    const p = pageMap.get(e.pageUrl)!;
    p.views++;
    p.visitors.add(e.visitorId);
  }
  const topPages = Array.from(pageMap.entries())
    .map(([page, v]) => ({ page, views: v.views, unique: v.visitors.size }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 8);

  const sourceMap = new Map<string, number>();
  for (const e of events) {
    const src = e.utmSource || "direct";
    sourceMap.set(src, (sourceMap.get(src) || 0) + 1);
  }
  const totalSrc = Array.from(sourceMap.values()).reduce((a, b) => a + b, 0) || 1;
  const topSources = Array.from(sourceMap.entries())
    .map(([source, sessions]) => ({ source, sessions, pct: Math.round((sessions / totalSrc) * 100) }))
    .sort((a, b) => b.sessions - a.sessions)
    .slice(0, 6);

  const convMap = new Map<string, number>();
  for (const e of events) {
    if (CONVERSION_LABELS[e.eventType]) convMap.set(e.eventType, (convMap.get(e.eventType) || 0) + 1);
  }
  const conversions = Object.keys(CONVERSION_LABELS).map((k) => ({ type: CONVERSION_LABELS[k], count: convMap.get(k) || 0 }));

  return { pageViews, uniqueVisitors, topPages, topSources, conversions };
}

export default async function AnalyticsPage() {
  const a = await getAnalytics();
  return (
    <div className="flex-1">
      <Header title="Website Analytics" subtitle="Visitor traffic and conversion data" />
      <div className="p-8 space-y-6">
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "Page Views", value: a.pageViews.toLocaleString() },
            { label: "Unique Visitors", value: a.uniqueVisitors.toLocaleString() },
            { label: "Tracked Events", value: (a.topSources.reduce((s, x) => s + x.sessions, 0)).toLocaleString() },
            { label: "Conversions", value: a.conversions.reduce((s, c) => s + c.count, 0).toLocaleString() },
          ].map((s) => (
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
              <thead><tr className="text-[#8b8fa8] text-xs border-b border-[#2a2d3a]"><th className="text-left pb-3">Page</th><th className="text-right pb-3">Views</th><th className="text-right pb-3">Unique</th></tr></thead>
              <tbody>
                {a.topPages.map((p) => (
                  <tr key={p.page} className="border-b border-[#2a2d3a] last:border-0"><td className="py-3 text-[#8b8fa8] text-sm font-mono">{p.page}</td><td className="py-3 text-right text-white text-sm">{p.views.toLocaleString()}</td><td className="py-3 text-right text-[#8b8fa8] text-sm">{p.unique.toLocaleString()}</td></tr>
                ))}
                {a.topPages.length === 0 && <tr><td colSpan={3} className="py-6 text-center text-[#8b8fa8] text-sm">No page views yet — install the tracking pixel.</td></tr>}
              </tbody>
            </table>
          </div>
          <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl p-6">
            <h2 className="text-white font-semibold mb-4">Traffic Sources</h2>
            <div className="space-y-3">
              {a.topSources.map((s) => (
                <div key={s.source}>
                  <div className="flex justify-between text-sm mb-1"><span className="text-white capitalize">{s.source}</span><span className="text-[#8b8fa8]">{s.sessions.toLocaleString()}</span></div>
                  <div className="h-2 bg-[#2a2d3a] rounded-full"><div className="h-2 bg-indigo-600 rounded-full" style={{ width: `${s.pct}%` }} /></div>
                </div>
              ))}
              {a.topSources.length === 0 && <p className="text-[#8b8fa8] text-sm">No traffic data yet.</p>}
            </div>
          </div>
        </div>
        <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl p-6">
          <h2 className="text-white font-semibold mb-4">Conversions</h2>
          <div className="grid grid-cols-4 gap-4">
            {a.conversions.map((c) => (
              <div key={c.type} className="bg-[#0f1117] border border-[#2a2d3a] rounded-lg p-4 text-center"><p className="text-white text-2xl font-bold">{c.count}</p><p className="text-[#8b8fa8] text-sm mt-1">{c.type}</p></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
