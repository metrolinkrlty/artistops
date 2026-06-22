"use client";
import Header from "@/components/layout/Header";
import { useState } from "react";
import { Sparkles, X, ChevronRight, TrendingUp, DollarSign, Users, Megaphone, BarChart2 } from "lucide-react";

const allInsights = [
  {
    id: "1",
    category: "Campaign",
    title: "Instagram campaign drove +23% Spotify streams last week",
    body: "Your 'Summer Drop' Instagram campaign (Jun 14–20) correlated with a 23% spike in Spotify streams for Midnight Drive — 4,200 more plays than the prior 7-day average. ROAS on this campaign was 3.2×, the highest of any campaign this year.",
    confidence: 0.91,
    actionable: true,
    timestamp: "2 hours ago",
    icon: Megaphone,
    color: "text-pink-400",
    bg: "bg-pink-500/10 border-pink-500/20",
  },
  {
    id: "2",
    category: "Revenue",
    title: "Apple Music generates 2.1× more revenue per stream than Spotify",
    body: "Across your catalog, Apple Music listeners generate $0.0084/stream compared to $0.0040/stream on Spotify. Your current audience skews Spotify (48%), but growing Apple Music exposure could significantly increase revenue per stream. Consider Apple Music-specific promotional content.",
    confidence: 0.97,
    actionable: true,
    timestamp: "5 hours ago",
    icon: DollarSign,
    color: "text-green-400",
    bg: "bg-green-500/10 border-green-500/20",
  },
  {
    id: "3",
    category: "Audience",
    title: "Texas is your fastest-growing audience state (+34% MoM)",
    body: "Texas listeners grew 34% month-over-month, primarily driven by Houston and Austin. This is 2.8× faster than your average state growth. A targeted Texas tour or regional ad campaign could capitalize on this momentum.",
    confidence: 0.88,
    actionable: true,
    timestamp: "1 day ago",
    icon: Users,
    color: "text-blue-400",
    bg: "bg-blue-500/10 border-blue-500/20",
  },
  {
    id: "4",
    category: "Streaming",
    title: "'Indie Vibes' playlist accounts for 18% of monthly revenue",
    body: "The Spotify editorial playlist 'Indie Vibes' (284K followers) generated an estimated $1,680 in revenue last month — 18.3% of your total. This is your single highest-performing revenue source. Request re-pitching to the curator for upcoming releases.",
    confidence: 0.94,
    actionable: true,
    timestamp: "1 day ago",
    icon: BarChart2,
    color: "text-indigo-400",
    bg: "bg-indigo-500/10 border-indigo-500/20",
  },
  {
    id: "5",
    category: "Revenue",
    title: "Revenue per stream is declining — India listener share +41%",
    body: "Average revenue per stream dropped from $0.0062 to $0.0051 over the last 90 days. The primary driver is India's listener share growing 41% (from 1.2% to 2.1% of total streams). Indian streaming rates average $0.0012/stream. This does not require action, but explains the revenue efficiency trend.",
    confidence: 0.85,
    actionable: false,
    timestamp: "2 days ago",
    icon: DollarSign,
    color: "text-amber-400",
    bg: "bg-amber-500/10 border-amber-500/20",
  },
  {
    id: "6",
    category: "Audience",
    title: "Best release time: Thursday 7–9 PM EST",
    body: "Based on 6 months of listener activity data, your audience is most active on Thursday evenings (7–9 PM EST). Posts and releases on this window see 34% higher engagement than your Monday morning average. Your next 2 releases are scheduled for Friday noon — consider adjusting.",
    confidence: 0.82,
    actionable: true,
    timestamp: "3 days ago",
    icon: Users,
    color: "text-purple-400",
    bg: "bg-purple-500/10 border-purple-500/20",
  },
  {
    id: "7",
    category: "Campaign",
    title: "'Summer Drop' campaign achieved 3.2× ROAS — best campaign of the year",
    body: "The Summer Drop Meta campaign (Jun 14–20, $312 spend) generated $997 in attributed revenue — a 3.2× return on ad spend. Key winning creative: the 15-second Reel with lyrics overlay. Replicating this creative format for future campaigns is recommended.",
    confidence: 0.89,
    actionable: true,
    timestamp: "4 days ago",
    icon: Megaphone,
    color: "text-pink-400",
    bg: "bg-pink-500/10 border-pink-500/20",
  },
  {
    id: "8",
    category: "Revenue",
    title: "3 songs not registered with MLC — estimated $240 uncollected",
    body: "Electric Soul, Sunrise Boulevard, and Neon Nights have not been registered with The MLC (Mechanical Licensing Collective). Based on streaming activity from digital services, estimated uncollected mechanical royalties stand at approximately $240. Registration is free and backdated claims may be possible.",
    confidence: 0.99,
    actionable: true,
    timestamp: "5 days ago",
    icon: DollarSign,
    color: "text-red-400",
    bg: "bg-red-500/10 border-red-500/20",
  },
  {
    id: "9",
    category: "Forecast",
    title: "On track to cross 100K monthly listeners in ~6 weeks",
    body: "At your current 12.3% month-over-month growth rate, you will reach 100,000 monthly Spotify listeners by approximately August 3, 2024. At that threshold, you become eligible for additional editorial consideration and increased algorithmic playlist exposure.",
    confidence: 0.78,
    actionable: false,
    timestamp: "1 week ago",
    icon: TrendingUp,
    color: "text-green-400",
    bg: "bg-green-500/10 border-green-500/20",
  },
];

const categories = ["All", "Revenue", "Streaming", "Audience", "Campaign", "Forecast"];
const categoryIcons: Record<string, React.ElementType> = {
  Revenue: DollarSign,
  Streaming: BarChart2,
  Audience: Users,
  Campaign: Megaphone,
  Forecast: TrendingUp,
};

export default function AIInsightsPage() {
  const [filter, setFilter] = useState("All");
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const visible = allInsights.filter(
    i => !dismissed.has(i.id) && (filter === "All" || i.category === filter)
  );

  const actionable = visible.filter(i => i.actionable);

  return (
    <div className="flex-1">
      <Header title="AI Insights" subtitle="Data-driven recommendations for your music career" />
      <div className="p-8 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl p-4">
            <p className="text-[#8b8fa8] text-sm">Total Insights</p>
            <p className="text-white text-2xl font-bold mt-1">{visible.length}</p>
          </div>
          <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl p-4">
            <p className="text-[#8b8fa8] text-sm">Actionable</p>
            <p className="text-white text-2xl font-bold mt-1">{actionable.length}</p>
          </div>
          <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl p-4">
            <p className="text-[#8b8fa8] text-sm">Dismissed</p>
            <p className="text-white text-2xl font-bold mt-1">{dismissed.size}</p>
          </div>
          <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl p-4">
            <p className="text-[#8b8fa8] text-sm">Avg Confidence</p>
            <p className="text-white text-2xl font-bold mt-1">
              {visible.length ? Math.round(visible.reduce((s, i) => s + (i.confidence ?? 0), 0) / visible.length * 100) : 0}%
            </p>
          </div>
        </div>

        {/* Filter */}
        <div className="flex gap-2">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm transition-colors ${filter === cat ? "bg-indigo-600 text-white" : "border border-[#2a2d3a] text-[#8b8fa8] hover:text-white"}`}
            >
              {cat !== "All" && categoryIcons[cat] && (() => { const I = categoryIcons[cat]; return <I className="w-3 h-3" />; })()}
              {cat}
            </button>
          ))}
        </div>

        {/* Actionable section */}
        {actionable.length > 0 && filter === "All" && (
          <div>
            <h2 className="text-white font-semibold mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" /> Actionable Recommendations
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
              {actionable.slice(0, 4).map(insight => {
                const Icon = insight.icon;
                return (
                  <div key={insight.id} className={`border rounded-xl p-4 ${insight.bg}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-3">
                        <div className={`p-1.5 rounded-lg bg-white/5 ${insight.color} flex-shrink-0`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <span className={`text-xs font-medium ${insight.color}`}>{insight.category}</span>
                          <p className="text-white text-sm font-medium mt-0.5">{insight.title}</p>
                        </div>
                      </div>
                    </div>
                    <button className={`mt-3 flex items-center gap-1 text-xs ${insight.color} hover:opacity-80`}>
                      View Details <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Full feed */}
        <div>
          <h2 className="text-white font-semibold mb-4">All Insights</h2>
          <div className="space-y-4">
            {visible.map(insight => {
              const Icon = insight.icon;
              const confidencePct = Math.round((insight.confidence ?? 0) * 100);
              return (
                <div key={insight.id} className={`border rounded-xl p-5 ${insight.bg}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div className={`p-2 rounded-lg bg-white/5 ${insight.color} flex-shrink-0`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium bg-white/10 ${insight.color}`}>{insight.category}</span>
                          {insight.actionable && (
                            <span className="px-2 py-0.5 rounded text-xs font-medium bg-indigo-500/20 text-indigo-400">Actionable</span>
                          )}
                          <span className="text-[#8b8fa8] text-xs">{insight.timestamp}</span>
                        </div>
                        <h3 className="text-white font-semibold mb-2">{insight.title}</h3>
                        <p className="text-[#8b8fa8] text-sm leading-relaxed">{insight.body}</p>
                        <div className="flex items-center gap-4 mt-3">
                          <div className="flex items-center gap-2">
                            <span className="text-[#8b8fa8] text-xs">Confidence</span>
                            <div className="w-20 h-1.5 bg-[#2a2d3a] rounded-full">
                              <div
                                className={`h-1.5 rounded-full ${confidencePct >= 90 ? "bg-green-500" : confidencePct >= 75 ? "bg-amber-500" : "bg-gray-500"}`}
                                style={{ width: `${confidencePct}%` }}
                              />
                            </div>
                            <span className={`text-xs font-medium ${confidencePct >= 90 ? "text-green-400" : confidencePct >= 75 ? "text-amber-400" : "text-gray-400"}`}>
                              {confidencePct >= 90 ? "High" : confidencePct >= 75 ? "Medium" : "Low"} ({confidencePct}%)
                            </span>
                          </div>
                          <button className={`flex items-center gap-1 text-xs ${insight.color} hover:opacity-80`}>
                            View Details <ChevronRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setDismissed(d => new Set([...d, insight.id]))}
                      className="text-[#8b8fa8] hover:text-white flex-shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
            {visible.length === 0 && (
              <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl p-12 text-center">
                <Sparkles className="w-8 h-8 text-[#8b8fa8] mx-auto mb-3" />
                <p className="text-white font-medium">No insights to show</p>
                <p className="text-[#8b8fa8] text-sm mt-1">All caught up — check back soon for new recommendations.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
