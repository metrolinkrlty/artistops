"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

// Floating logout pill, anchored to the top-right of the app.
export default function LogoutPill({ topClass = "top-3" }: { topClass?: string }) {
  const router = useRouter();

  async function handleLogout() {
    try {
      await fetch("/api/logout", { method: "POST" });
    } catch {
      // ignore
    }
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      title="Sign out"
      className={`fixed ${topClass} right-4 z-50 flex items-center gap-1.5 rounded-full border border-[#2a2d3a] bg-[#1a1d27]/90 px-3.5 py-1.5 text-sm font-medium text-[#8b8fa8] shadow-lg backdrop-blur transition-colors hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-400`}
    >
      <LogOut className="h-4 w-4" />
      Log out
    </button>
  );
}
