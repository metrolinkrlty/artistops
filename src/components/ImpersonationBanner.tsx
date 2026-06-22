"use client";

import { useRouter } from "next/navigation";
import { ShieldCheck, X } from "lucide-react";

export default function ImpersonationBanner({ artistName }: { artistName: string }) {
  const router = useRouter();

  async function exitImpersonation() {
    await fetch("/api/admin/impersonate", { method: "DELETE" });
    router.push("/admin");
    router.refresh();
  }

  return (
    <div className="bg-amber-500 text-black px-4 py-2 flex items-center justify-between text-sm font-medium z-50 sticky top-0">
      <div className="flex items-center gap-2">
        <ShieldCheck className="w-4 h-4" />
        <span>Admin view — you are viewing as <strong>{artistName}</strong>. All changes affect their real account.</span>
      </div>
      <button onClick={exitImpersonation} className="flex items-center gap-1 bg-black/20 hover:bg-black/30 px-3 py-1 rounded-lg transition-colors">
        <X className="w-3 h-3" /> Exit
      </button>
    </div>
  );
}
