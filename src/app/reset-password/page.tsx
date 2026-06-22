"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Music, Lock } from "lucide-react";

const inputClass = "w-full bg-[#0f1117] border border-[#2a2d3a] text-white pl-10 pr-4 py-2.5 rounded-lg text-sm placeholder:text-[#8b8fa8] focus:outline-none focus:border-indigo-500";

function ResetForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password !== confirm) { setError("Passwords don't match"); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters"); return; }
    setLoading(true);
    const res = await fetch("/api/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (res.ok) {
      router.push("/");
      router.refresh();
    } else {
      setError(data.error || "Something went wrong");
    }
  }

  if (!token) {
    return (
      <div className="text-center">
        <h2 className="text-xl font-bold mb-2">Invalid link</h2>
        <p className="text-[#8b8fa8] text-sm mb-6">This reset link is missing or malformed.</p>
        <Link href="/forgot-password" className="text-indigo-400 text-sm hover:text-indigo-300">Request a new link</Link>
      </div>
    );
  }

  return (
    <>
      <h2 className="text-xl font-bold mb-1">Set a new password</h2>
      <p className="text-[#8b8fa8] text-sm mb-6">Choose a new password for your account.</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <Lock className="w-4 h-4 text-[#8b8fa8] absolute left-3 top-1/2 -translate-y-1/2" />
          <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="New password" className={inputClass} />
        </div>
        <div className="relative">
          <Lock className="w-4 h-4 text-[#8b8fa8] absolute left-3 top-1/2 -translate-y-1/2" />
          <input type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Confirm new password" className={inputClass} />
        </div>
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <button type="submit" disabled={loading} className="w-full px-4 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
          {loading ? "Updating…" : "Update password"}
        </button>
      </form>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-[#0f1117] text-white flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-3 mb-6 justify-center">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center"><Music className="w-5 h-5 text-white" /></div>
          <span className="text-xl font-bold">ArtistOps</span>
        </div>
        <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-2xl p-8">
          <Suspense fallback={null}>
            <ResetForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
