"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Music, DollarSign, Shield, BarChart2, Link2, Megaphone, Sparkles, Globe, Lock, Mail, User,
} from "lucide-react";
import { APP_VERSION } from "@/lib/version";

const highlights = [
  { icon: Music, title: "Song Catalog & ISRC", desc: "Every release tracked by ISRC — writers, splits, metadata, and status." },
  { icon: DollarSign, title: "Revenue Intelligence", desc: "Streams, royalties, and net revenue by platform, song, territory & playlist." },
  { icon: Shield, title: "Rights & Copyright", desc: "Splits, PRO/MLC/SoundExchange registrations, contracts & renewal reminders." },
  { icon: BarChart2, title: "Streaming Analytics", desc: "ISRC-centric play tracking across every platform with CSV import." },
  { icon: Link2, title: "Smart Links", desc: "One shareable link for all platforms with click & conversion analytics." },
  { icon: Megaphone, title: "Campaigns & Ads", desc: "Social posts, ad performance, ROAS, and pixel-based attribution." },
  { icon: Sparkles, title: "AI Insights & Forecasting", desc: "Actionable insights and predictions for streams, revenue & growth." },
  { icon: Globe, title: "Audience & Pixels", desc: "Listener demographics, website analytics, and conversion tracking." },
];

const inputClass = "w-full bg-[#0f1117] border border-[#2a2d3a] text-white pl-10 pr-4 py-2.5 rounded-lg text-sm placeholder:text-[#8b8fa8] focus:outline-none focus:border-indigo-500";

function AuthForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [artistName, setArtistName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const endpoint = mode === "signup" ? "/api/signup" : "/api/login";
    const payload = mode === "signup" ? { artistName, email, password } : { email, password };
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (res.ok) {
      if (mode === "signup") {
        router.push("/pending-approval");
      } else {
        router.push(params.get("from") || "/");
      }
      router.refresh();
    } else {
      setError(data.error || "Something went wrong");
    }
  }

  return (
    <div>
      <div className="flex rounded-lg overflow-hidden border border-[#2a2d3a] mb-6">
        <button onClick={() => { setMode("login"); setError(""); }} className={`flex-1 py-2 text-sm font-medium ${mode === "login" ? "bg-indigo-600 text-white" : "text-[#8b8fa8] hover:text-white"}`}>Sign In</button>
        <button onClick={() => { setMode("signup"); setError(""); }} className={`flex-1 py-2 text-sm font-medium ${mode === "signup" ? "bg-indigo-600 text-white" : "text-[#8b8fa8] hover:text-white"}`}>Create Account</button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === "signup" && (
          <div>
            <label className="block text-[#8b8fa8] text-sm mb-1.5">Artist / Band Name</label>
            <div className="relative">
              <User className="w-4 h-4 text-[#8b8fa8] absolute left-3 top-1/2 -translate-y-1/2" />
              <input value={artistName} onChange={(e) => setArtistName(e.target.value)} required placeholder="Your artist name" className={inputClass} />
            </div>
          </div>
        )}
        <div>
          <label className="block text-[#8b8fa8] text-sm mb-1.5">Email</label>
          <div className="relative">
            <Mail className="w-4 h-4 text-[#8b8fa8] absolute left-3 top-1/2 -translate-y-1/2" />
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com" className={inputClass} />
          </div>
        </div>
        <div>
          <label className="block text-[#8b8fa8] text-sm mb-1.5">Password</label>
          <div className="relative">
            <Lock className="w-4 h-4 text-[#8b8fa8] absolute left-3 top-1/2 -translate-y-1/2" />
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder={mode === "signup" ? "At least 6 characters" : "Your password"} className={inputClass} />
          </div>
        </div>
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <button type="submit" disabled={loading} className="w-full px-4 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors">
          {loading ? (mode === "signup" ? "Creating account…" : "Signing in…") : mode === "signup" ? "Create Account" : "Sign In"}
        </button>
        {mode === "login" && (
          <p className="text-center">
            <a href="/forgot-password" className="text-indigo-400 text-sm hover:text-indigo-300">Forgot your password?</a>
          </p>
        )}
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#0f1117] text-white flex flex-col lg:flex-row">
      <div className="lg:w-3/5 p-8 lg:p-14 flex flex-col justify-center border-b lg:border-b-0 lg:border-r border-[#2a2d3a]">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center"><Music className="w-5 h-5 text-white" /></div>
          <div>
            <h1 className="text-2xl font-bold">ArtistOps<sup className="text-[10px] font-normal text-[#8b8fa8] ml-0.5">™</sup></h1>
            <p className="text-[#8b8fa8] text-xs">Music Business Manager</p>
          </div>
        </div>
        <h2 className="text-3xl lg:text-4xl font-bold leading-tight mb-3 max-w-xl">Run the entire business side of your music in one place.</h2>
        <p className="text-[#8b8fa8] max-w-xl mb-8">A private command center for independent artists — catalog, copyrights, distribution, royalties, streaming analytics, marketing, and website tracking, all linked by ISRC.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl">
          {highlights.map((h) => (
            <div key={h.title} className="flex items-start gap-3 bg-[#1a1d27] border border-[#2a2d3a] rounded-xl p-3">
              <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 flex-shrink-0"><h.icon className="w-4 h-4" /></div>
              <div>
                <p className="text-white text-sm font-medium">{h.title}</p>
                <p className="text-[#8b8fa8] text-xs leading-snug">{h.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="lg:w-2/5 p-8 lg:p-14 flex items-center justify-center">
        <div className="w-full max-w-sm">
          <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-2xl p-8">
            <Suspense fallback={null}>
              <AuthForm />
            </Suspense>
          </div>
          <p className="text-center text-[#8b8fa8] text-xs mt-6">New accounts include sample data to explore · Sessions time out after 30 min of inactivity.</p>
          <p className="text-center text-[#5a5e72] text-xs mt-2">ArtistOps v{APP_VERSION}</p>
        </div>
      </div>
    </div>
  );
}
