"use client";
import Header from "@/components/layout/Header";

const topCities = [
  { city: "Los Angeles", country: "US", streams: 48200, pct: 12.1 },
  { city: "New York", country: "US", streams: 41300, pct: 10.4 },
  { city: "London", country: "GB", streams: 38900, pct: 9.8 },
  { city: "Toronto", country: "CA", streams: 22100, pct: 5.6 },
  { city: "Chicago", country: "US", streams: 18700, pct: 4.7 },
  { city: "Sydney", country: "AU", streams: 16200, pct: 4.1 },
  { city: "Houston", country: "US", streams: 14800, pct: 3.7 },
  { city: "Melbourne", country: "AU", streams: 12400, pct: 3.1 },
  { city: "Berlin", country: "DE", streams: 11200, pct: 2.8 },
  { city: "São Paulo", country: "BR", streams: 9800, pct: 2.5 },
];

const topCountries = [
  { country: "United States", flag: "🇺🇸", streams: 168400, pct: 42.3 },
  { country: "United Kingdom", flag: "🇬🇧", streams: 61200, pct: 15.4 },
  { country: "Canada", flag: "🇨🇦", streams: 43800, pct: 11.0 },
  { country: "Australia", flag: "🇦🇺", streams: 31200, pct: 7.8 },
  { country: "Germany", flag: "🇩🇪", streams: 19800, pct: 5.0 },
  { country: "Brazil", flag: "🇧🇷", streams: 14200, pct: 3.6 },
  { country: "France", flag: "🇫🇷", streams: 11800, pct: 3.0 },
  { country: "Japan", flag: "🇯🇵", streams: 9400, pct: 2.4 },
  { country: "India", flag: "🇮🇳", streams: 8200, pct: 2.1 },
  { country: "Other", flag: "🌍", streams: 29200, pct: 7.3 },
];

const ageGender = [
  { group: "13-17", male: 8, female: 11 },
  { group: "18-24", male: 22, female: 26 },
  { group: "25-34", male: 18, female: 19 },
  { group: "35-44", male: 9, female: 12 },
  { group: "45-54", male: 5, female: 6 },
  { group: "55+", male: 2, female: 3 },
];

const platforms = [
  { name: "Spotify", pct: 48 },
  { name: "TikTok", pct: 22 },
  { name: "Apple Music", pct: 16 },
  { name: "YouTube Music", pct: 8 },
  { name: "Amazon Music", pct: 4 },
  { name: "Other", pct: 2 },
];

const timeHeatmap = [
  { period: "Morning (6–12)", mon: 12, tue: 14, wed: 13, thu: 16, fri: 18, sat: 22, sun: 24 },
  { period: "Afternoon (12–18)", mon: 18, tue: 20, wed: 19, thu: 21, fri: 24, sat: 28, sun: 26 },
  { period: "Evening (18–22)", mon: 28, tue: 31, wed: 30, thu: 42, fri: 38, sat: 35, sun: 32 },
  { period: "Night (22–6)", mon: 14, tue: 12, wed: 13, thu: 15, fri: 20, sat: 18, sun: 14 },
];

function heatColor(val: number) {
  if (val >= 40) return "bg-indigo-600 text-white";
  if (val >= 30) return "bg-indigo-500/70 text-white";
  if (val >= 20) return "bg-indigo-400/40 text-indigo-300";
  if (val >= 15) return "bg-indigo-400/20 text-indigo-400";
  return "bg-[#2a2d3a] text-[#8b8fa8]";
}

export default function AudiencePage() {
  return (
    <div className="flex-1">
      <Header title="Audience" subtitle="Listener intelligence and demographics" />
      <div className="p-8 space-y-6">
        {/* Top metrics */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl p-4">
            <p className="text-[#8b8fa8] text-sm">Monthly Listeners</p>
            <p className="text-white text-2xl font-bold mt-1">87,400</p>
            <p className="text-green-400 text-xs mt-1">+12.3% MoM</p>
          </div>
          <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl p-4">
            <p className="text-[#8b8fa8] text-sm">Follower Growth</p>
            <p className="text-white text-2xl font-bold mt-1">+2,840</p>
            <p className="text-green-400 text-xs mt-1">This month</p>
          </div>
          <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl p-4">
            <p className="text-[#8b8fa8] text-sm">Returning Listeners</p>
            <p className="text-white text-2xl font-bold mt-1">64%</p>
            <p className="text-[#8b8fa8] text-xs mt-1">36% new</p>
          </div>
          <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl p-4">
            <p className="text-[#8b8fa8] text-sm">Avg Streams/Listener</p>
            <p className="text-white text-2xl font-bold mt-1">4.6</p>
            <p className="text-green-400 text-xs mt-1">+0.4 MoM</p>
          </div>
        </div>

        {/* Cities + Countries */}
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl p-6">
            <h2 className="text-white font-semibold mb-4">Top Cities</h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[#8b8fa8] border-b border-[#2a2d3a]">
                  <th className="text-left pb-2">City</th>
                  <th className="text-right pb-2">Streams</th>
                  <th className="text-right pb-2">%</th>
                </tr>
              </thead>
              <tbody>
                {topCities.map(c => (
                  <tr key={c.city} className="border-b border-[#2a2d3a] last:border-0">
                    <td className="py-2 text-white">{c.city} <span className="text-[#8b8fa8]">{c.country}</span></td>
                    <td className="py-2 text-right text-[#8b8fa8]">{c.streams.toLocaleString()}</td>
                    <td className="py-2 text-right text-indigo-400">{c.pct}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl p-6">
            <h2 className="text-white font-semibold mb-4">Top Countries</h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[#8b8fa8] border-b border-[#2a2d3a]">
                  <th className="text-left pb-2">Country</th>
                  <th className="text-right pb-2">Streams</th>
                  <th className="text-right pb-2">%</th>
                </tr>
              </thead>
              <tbody>
                {topCountries.map(c => (
                  <tr key={c.country} className="border-b border-[#2a2d3a] last:border-0">
                    <td className="py-2 text-white">{c.flag} {c.country}</td>
                    <td className="py-2 text-right text-[#8b8fa8]">{c.streams.toLocaleString()}</td>
                    <td className="py-2 text-right text-indigo-400">{c.pct}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Age & Gender + Platforms */}
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl p-6">
            <h2 className="text-white font-semibold mb-4">Age & Gender Breakdown</h2>
            <div className="flex items-center gap-4 mb-3 text-xs text-[#8b8fa8]">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-indigo-500 inline-block" /> Male</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-pink-500 inline-block" /> Female</span>
            </div>
            <div className="space-y-3">
              {ageGender.map(ag => (
                <div key={ag.group}>
                  <div className="flex justify-between text-xs text-[#8b8fa8] mb-1">
                    <span>{ag.group}</span>
                    <span>{ag.male + ag.female}%</span>
                  </div>
                  <div className="flex gap-1 h-4">
                    <div className="bg-indigo-500 rounded-l" style={{ width: `${ag.male * 2}%` }} />
                    <div className="bg-pink-500 rounded-r" style={{ width: `${ag.female * 2}%` }} />
                  </div>
                  <div className="flex justify-between text-xs text-[#8b8fa8] mt-0.5">
                    <span>{ag.male}%</span>
                    <span>{ag.female}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl p-6">
            <h2 className="text-white font-semibold mb-4">Platform Breakdown</h2>
            <div className="space-y-3">
              {platforms.map(p => (
                <div key={p.name}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-white">{p.name}</span>
                    <span className="text-[#8b8fa8]">{p.pct}%</span>
                  </div>
                  <div className="h-2 bg-[#2a2d3a] rounded-full">
                    <div className="h-2 bg-indigo-600 rounded-full" style={{ width: `${p.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Time Heatmap */}
        <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl p-6">
          <h2 className="text-white font-semibold mb-4">Listening Time Heatmap (% of daily plays)</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[#8b8fa8]">
                  <th className="text-left pb-3 pr-4">Period</th>
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(d => (
                    <th key={d} className="text-center pb-3 px-2">{d}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {timeHeatmap.map(row => (
                  <tr key={row.period}>
                    <td className="py-1 pr-4 text-[#8b8fa8] whitespace-nowrap">{row.period}</td>
                    {[row.mon, row.tue, row.wed, row.thu, row.fri, row.sat, row.sun].map((val, i) => (
                      <td key={i} className="py-1 px-2 text-center">
                        <span className={`inline-block w-12 py-1 rounded text-xs font-medium ${heatColor(val)}`}>
                          {val}%
                        </span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
