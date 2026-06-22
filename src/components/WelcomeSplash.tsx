"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Sparkles, X } from "lucide-react";

export default function WelcomeSplash() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (params.get("welcome") === "1") setOpen(true);
  }, [params]);

  function dismiss() {
    setOpen(false);
    // remove the ?welcome=1 from the URL
    router.replace(pathname);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4">
      <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-2xl w-full max-w-md p-8 text-center relative">
        <button onClick={dismiss} className="absolute top-4 right-4 text-[#8b8fa8] hover:text-white"><X className="w-5 h-5" /></button>
        <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center mx-auto mb-4">
          <Sparkles className="w-7 h-7 text-white" />
        </div>
        <h2 className="text-white text-xl font-bold mb-2">Welcome to ArtistOps!</h2>
        <p className="text-[#8b8fa8] text-sm mb-4">
          Your account is ready. We&apos;ve pre-loaded your dashboard with a{" "}
          <span className="text-white font-medium">sample catalog</span> — songs, revenue, rights,
          playlists, and analytics — so you can explore every feature right away.
        </p>
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 mb-6">
          <p className="text-amber-400 text-xs">
            ⚠️ This sample data is for <span className="font-semibold">demonstration purposes only</span>.
            Edit or delete it anytime and start adding your own music.
          </p>
        </div>
        <button onClick={dismiss} className="w-full px-4 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
          Explore my dashboard
        </button>
      </div>
    </div>
  );
}
