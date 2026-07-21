"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { saveWebsiteUrl } from "./actions";

const inputClass = "w-full bg-[#0f1117] border border-[#2a2d3a] text-white px-4 py-2 rounded-lg text-sm focus:outline-none focus:border-indigo-500";

export default function PixelDomainCard({ websiteUrl }: { websiteUrl: string }) {
  const router = useRouter();
  const [url, setUrl] = useState(websiteUrl);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save() {
    setSaving(true);
    await saveWebsiteUrl(url);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
    router.refresh();
  }

  return (
    <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl p-6">
      <h2 className="text-white font-semibold mb-2">Pixel Tracking Domain</h2>
      <p className="text-[#8b8fa8] text-sm mb-4">Set your website domain for the tracking snippet — the pixel reports visits from this site.</p>
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-64 flex-1">
          <label className="block text-[#8b8fa8] text-sm mb-1">Website URL</label>
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://yourdomain.com"
            className={inputClass}
          />
        </div>
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save"}
        </button>
        {saved && <span className="flex items-center gap-1 pb-2 text-green-400 text-sm"><CheckCircle2 className="w-4 h-4" /> Saved</span>}
      </div>
    </div>
  );
}
