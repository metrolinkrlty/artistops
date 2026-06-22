"use client";

import { useState } from "react";
import Link from "next/link";
import { Music, Mail } from "lucide-react";

const inputClass = "w-full bg-[#0f1117] border border-[#2a2d3a] text-white pl-10 pr-4 py-2.5 rounded-lg text-sm placeholder:text-[#8b8fa8] focus:outline-none focus:border-indigo-500";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await fetch("/api/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setLoading(false);
    setSent(true);
  }

  return (
    <div className="min-h-screen bg-[#0f1117] text-white flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-3 mb-6 justify-center">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center"><Music className="w-5 h-5 text-white" /></div>
          <span className="text-xl font-bold">ArtistOps</span>
        </div>
        <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-2xl p-8">
          {sent ? (
            <div className="text-center">
              <h2 className="text-xl font-bold mb-2">Check your email</h2>
              <p className="text-[#8b8fa8] text-sm mb-6">If an account exists for <span className="text-white">{email}</span>, we&apos;ve sent a link to reset your password. It expires in 1 hour.</p>
              <Link href="/login" className="text-indigo-400 text-sm hover:text-indigo-300">← Back to sign in</Link>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-bold mb-1">Reset your password</h2>
              <p className="text-[#8b8fa8] text-sm mb-6">Enter your email and we&apos;ll send you a reset link.</p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#8b8fa8] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className={inputClass} />
                </div>
                <button type="submit" disabled={loading} className="w-full px-4 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
                  {loading ? "Sending…" : "Send reset link"}
                </button>
              </form>
              <p className="text-center mt-6"><Link href="/login" className="text-indigo-400 text-sm hover:text-indigo-300">← Back to sign in</Link></p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
