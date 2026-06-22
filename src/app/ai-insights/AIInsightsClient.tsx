"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, X, DollarSign, Users, Megaphone, BarChart2, TrendingUp } from "lucide-react";
import { dismissInsight } from "./actions";

type Insight = { id: string; category: string; title: string; body: string; confidence: number; actionable: boolean; createdAt: string };

const styleByCategory: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  campaign: { icon: Megaphone, color: "text-pink-400", bg: "bg-pink-500/10 border-pink-500/20" },
  revenue: { icon: DollarSign, color: "text-green-400", bg: "bg-green-500/10 border-green-500/20" },
  audience: { icon: Users, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
  streaming: { icon: BarChart2, color: "text-indigo-400", bg: "bg-indigo-500/10 border-indigo-500/20" },
  forecast: { icon: TrendingUp, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
};

const CATEGORIES = ["All", "Campaign", "Revenue", "Audience", "Streaming", "Forecast"];

export default function AIInsightsClient({ insights }: { insights: Insight[] }) {
  const router = useRouter();
  const [filter, setFilter] = useState("All");
  const [busy, setBusy] = useState<string | null>(null);

  const filtered = filter === "All" ? insights : insights.filter((i) => i.category.toLowerCase() === filter.toLowerCase());
  const actionable = filtered.filter((i) => i.actionable);

  async function handleDismiss(id: string) {
    setBusy(id);
    await dismissInsight(id);
    setBusy(null);
    router.refresh();
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center gap-2 flex-wrap">
        {CATEGORIES.map((c) => (
          <button key={c} onClick={() => setFilter(c)} className={`px-3 py-1.5 rounded-lg text-sm ${filter === c ? "bg-indigo-600 text-white" : "bg-[#1a1d27] border border-[#2a2d3a] text-[#8b8fa8] hover:text-white"}`}>{c}</button>
        ))}
      </div>

      {actionable.length > 0 && (
        <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4">
          <p className="text-indigo-300 text-sm flex items-center gap-2"><Sparkles className="w-4 h-4" /> {actionable.length} actionable {actionable.length === 1 ? "insight" : "insights"} need your attention.</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filtered.map((i) => {
          const s = styleByCategory[i.category.toLowerCase()] || styleByCategory.streaming;
          const Icon = s.icon;
          const conf = i.confidence >= 0.85 ? "High" : i.confidence >= 0.7 ? "Medium" : "Low";
          return (
            <div key={i.id} className={`border rounded-xl p-5 ${s.bg}`}>
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg bg-black/20 ${s.color}`}><Icon className="w-4 h-4" /></div>
                  <span className={`text-xs font-medium uppercase tracking-wide ${s.color}`}>{i.category}</span>
                  {i.actionable && <span className="text-xs bg-white/10 text-white px-2 py-0.5 rounded">Actionable</span>}
                </div>
                <button disabled={busy === i.id} onClick={() => handleDismiss(i.id)} className="text-[#8b8fa8] hover:text-white disabled:opacity-50"><X className="w-4 h-4" /></button>
              </div>
              <h3 className="text-white font-semibold mb-1">{i.title}</h3>
              <p className="text-[#8b8fa8] text-sm">{i.body}</p>
              <div className="flex items-center gap-3 mt-3 text-xs text-[#8b8fa8]">
                <span>Confidence: <span className="text-white">{conf}</span></span>
                <div className="flex-1 h-1.5 bg-[#2a2d3a] rounded-full"><div className={`h-1.5 rounded-full ${i.confidence >= 0.85 ? "bg-green-500" : i.confidence >= 0.7 ? "bg-amber-500" : "bg-red-500"}`} style={{ width: `${i.confidence * 100}%` }} /></div>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && <div className="col-span-full text-center text-[#8b8fa8] text-sm py-10">No insights in this category.</div>}
      </div>
    </div>
  );
}
