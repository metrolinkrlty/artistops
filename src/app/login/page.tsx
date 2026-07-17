"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Music, DollarSign, Shield, BarChart2, Link2, Megaphone, Sparkles, Globe, Lock, Mail, User, Eye, EyeOff, CheckCircle2,
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
const plainInputClass = "w-full bg-[#0f1117] border border-[#2a2d3a] text-white px-4 py-2.5 rounded-lg text-sm placeholder:text-[#8b8fa8] focus:outline-none focus:border-indigo-500";

const ROLE_OPTIONS = [
  { value: "artist", label: "Artist" },
  { value: "band", label: "Band member" },
  { value: "manager", label: "Artist manager" },
  { value: "label", label: "Label / industry professional" },
  { value: "producer", label: "Producer / engineer" },
  { value: "educator", label: "Educator" },
  { value: "other", label: "Other" },
];
const GOAL_OPTIONS = [
  "Catalog & copyrights",
  "Royalties & revenue",
  "Distribution",
  "Marketing & ads",
  "Building a website",
  "Not sure yet",
];
const CATALOG_OPTIONS = [
  "Nothing released yet",
  "1–5 songs",
  "6–20 songs",
  "20+ songs",
];

function AuthForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [artistName, setArtistName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState("");
  const [referredBy, setReferredBy] = useState("");
  const [workLink, setWorkLink] = useState("");
  const [goals, setGoals] = useState<string[]>([]);
  const [catalogSize, setCatalogSize] = useState("");
  const [location, setLocation] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function toggleGoal(goal: string) {
    setGoals((g) => (g.includes(goal) ? g.filter((x) => x !== goal) : [...g, goal]));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (mode === "signup" && !agreedToTerms) {
      setError("Please agree to the beta terms to continue.");
      return;
    }
    setLoading(true);
    setError("");
    const endpoint = mode === "signup" ? "/api/signup" : "/api/login";
    const payload = mode === "signup"
      ? { artistName, email, password, role, referredBy, workLink, goals, catalogSize, location, agreedToTerms }
      : { email, password };
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (res.ok) {
      if (mode === "signup") {
        setSubmitted(true); // friendly thank-you, no redirect
      } else {
        router.push(params.get("from") || "/");
        router.refresh();
      }
    } else {
      setError(data.error || "Something went wrong");
    }
  }

  if (submitted) {
    return (
      <div className="text-center py-4">
        <div className="w-14 h-14 rounded-full bg-green-500/15 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-7 h-7 text-green-400" />
        </div>
        <h3 className="text-white text-lg font-semibold mb-2">Thanks for taking the time!</h3>
        <p className="text-[#8b8fa8] text-sm leading-relaxed max-w-xs mx-auto">
          Your request is in. We review each one personally — if you&rsquo;re approved,
          you&rsquo;ll be able to sign in and get started. Talk soon.
        </p>
        <button
          onClick={() => {
            setSubmitted(false);
            setMode("login");
            setPassword("");
          }}
          className="mt-6 text-indigo-400 text-sm hover:text-indigo-300"
        >
          Back to sign in
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex rounded-lg overflow-hidden border border-[#2a2d3a] mb-6">
        <button onClick={() => { setMode("login"); setError(""); }} className={`flex-1 py-2 text-sm font-medium ${mode === "login" ? "bg-indigo-600 text-white" : "text-[#8b8fa8] hover:text-white"}`}>Sign In</button>
        <button onClick={() => { setMode("signup"); setError(""); }} className={`flex-1 py-2 text-sm font-medium ${mode === "signup" ? "bg-indigo-600 text-white" : "text-[#8b8fa8] hover:text-white"}`}>Create Account</button>
      </div>

      {mode === "signup" && (
        <div className="bg-indigo-500/10 border border-indigo-500/25 rounded-lg p-3.5 mb-5">
          <p className="text-white text-sm font-medium">👋 Welcome — we&rsquo;re glad you&rsquo;re here.</p>
          <p className="text-[#c7cad8] text-xs leading-relaxed mt-1">
            ArtistOps is still growing, so we&rsquo;re onboarding new folks by invitation and
            referral for now. Tell us a bit about yourself and we&rsquo;ll take it from there.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === "signup" && (
          <div>
            <label className="block text-[#8b8fa8] text-sm mb-1.5">Artist / band / company name</label>
            <div className="relative">
              <User className="w-4 h-4 text-[#8b8fa8] absolute left-3 top-1/2 -translate-y-1/2" />
              <input value={artistName} onChange={(e) => setArtistName(e.target.value)} required placeholder="Your artist or company name" className={inputClass} />
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
            <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required placeholder={mode === "signup" ? "At least 6 characters" : "Your password"} className={`${inputClass} !pr-10`} />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              title={showPassword ? "Hide password" : "Show password"}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8b8fa8] hover:text-white"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {mode === "signup" && (
          <>
            <div>
              <label className="block text-[#8b8fa8] text-sm mb-1.5">I am a…</label>
              <select value={role} onChange={(e) => setRole(e.target.value)} required className={`${plainInputClass} [color-scheme:dark]`}>
                <option value="" disabled>Select one</option>
                {ROLE_OPTIONS.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[#8b8fa8] text-sm mb-1.5">Referred by</label>
              <input value={referredBy} onChange={(e) => setReferredBy(e.target.value)} required placeholder="Who invited you, or where you heard about us" className={plainInputClass} />
            </div>

            <div>
              <label className="block text-[#8b8fa8] text-sm mb-1.5">
                A link to your music or work <span className="text-[#5a5e72]">(recommended)</span>
              </label>
              <input value={workLink} onChange={(e) => setWorkLink(e.target.value)} placeholder="Spotify, website, or Instagram" className={plainInputClass} />
              <p className="text-[#5a5e72] text-xs mt-1">Helps us confirm your request faster.</p>
            </div>

            <div>
              <label className="block text-[#8b8fa8] text-sm mb-2">
                What do you most want help with? <span className="text-[#5a5e72]">(optional)</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {GOAL_OPTIONS.map((g) => {
                  const on = goals.includes(g);
                  return (
                    <button
                      type="button"
                      key={g}
                      onClick={() => toggleGoal(g)}
                      className={`text-left text-xs px-3 py-2 rounded-lg border transition-colors ${on ? "bg-indigo-600 border-indigo-600 text-white" : "bg-[#0f1117] border-[#2a2d3a] text-[#8b8fa8] hover:border-indigo-500"}`}
                    >
                      {g}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-[#8b8fa8] text-sm mb-1.5">
                How big is your catalog? <span className="text-[#5a5e72]">(optional)</span>
              </label>
              <select value={catalogSize} onChange={(e) => setCatalogSize(e.target.value)} className={`${plainInputClass} [color-scheme:dark]`}>
                <option value="">Prefer not to say</option>
                {CATALOG_OPTIONS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[#8b8fa8] text-sm mb-1.5">
                Where are you based? <span className="text-[#5a5e72]">(optional)</span>
              </label>
              <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="City, country" className={plainInputClass} />
            </div>

            <label className="flex items-start gap-2.5 pt-1 cursor-pointer">
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="mt-0.5 accent-indigo-500 flex-shrink-0"
              />
              <span className="text-[#8b8fa8] text-xs leading-relaxed">
                I understand ArtistOps is early-stage <span className="text-[#c7cad8]">beta software, provided
                &ldquo;as-is&rdquo; with no warranty</span>. Things may change or break, and I&rsquo;ll keep my own
                copies of anything important. I&rsquo;m using it at my own risk.
              </span>
            </label>
          </>
        )}

        {error && <p className="text-red-400 text-sm">{error}</p>}
        <button type="submit" disabled={loading} className="w-full px-4 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors">
          {loading ? (mode === "signup" ? "Sending request…" : "Signing in…") : mode === "signup" ? "Request access" : "Sign In"}
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
          <p className="text-center text-[#8b8fa8] text-xs mt-6">Add your catalog so you can track it · Sessions time out after 30 min of inactivity.</p>
          <p className="text-center text-[#5a5e72] text-xs mt-2">ArtistOps v{APP_VERSION}</p>
        </div>
      </div>
    </div>
  );
}
