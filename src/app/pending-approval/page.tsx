"use client";
import { Music, Clock } from "lucide-react";

export default function PendingApprovalPage() {
  return (
    <div className="min-h-screen bg-[#0f1117] text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center">
            <Music className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold">ArtistOps</span>
        </div>
        <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-2xl p-10">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto mb-5">
            <Clock className="w-8 h-8 text-amber-400" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Account Pending Approval</h2>
          <p className="text-[#8b8fa8] mb-6">
            Thank you for signing up! Your account is being reviewed by our team.
            You&apos;ll receive an email at the address you registered with once you&apos;re approved.
          </p>
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 text-left mb-6">
            <p className="text-amber-400 text-sm font-medium mb-1">⏳ What to expect</p>
            <p className="text-[#8b8fa8] text-sm">Accounts are typically reviewed within 24 hours. We&apos;ll send you an email when your access is ready.</p>
          </div>
          <p className="text-[#8b8fa8] text-sm">
            Questions? Email us at{" "}
            <a href="mailto:admin@artistops.net" className="text-indigo-400 hover:text-indigo-300">
              admin@artistops.net
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
