"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, AlertTriangle } from "lucide-react";
import { saveSettings } from "./actions";

const inputClass = "w-full bg-[#0f1117] border border-[#2a2d3a] text-white px-4 py-2 rounded-lg text-sm focus:outline-none focus:border-indigo-500";

export default function SettingsClient({ settings }: { settings: Record<string, string> }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [contactUnlocked, setContactUnlocked] = useState(false);
  const roClass = contactUnlocked ? inputClass : `${inputClass} opacity-60 cursor-not-allowed`;

  async function handleSubmit(formData: FormData) {
    setSaving(true);
    await saveSettings(formData);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
    router.refresh();
  }

  return (
    <div className="p-8 space-y-6 max-w-2xl">
      <form action={handleSubmit} className="space-y-6">
        <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl p-6">
          <h2 className="text-white font-semibold mb-4">Artist Profile</h2>
          <div className="space-y-4">
            {[
              { name: "artistName", label: "Artist Name" },
              { name: "email", label: "Email" },
              { name: "proMembership", label: "PRO Membership" },
              { name: "ipiNumber", label: "IPI Number" },
            ].map((f) => (
              <div key={f.name}>
                <label className="block text-[#8b8fa8] text-sm mb-1">{f.label}</label>
                <input name={f.name} defaultValue={settings[f.name] || ""} className={inputClass} />
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-white font-semibold">Contact Information</h2>
            <button
              type="button"
              onClick={() => setContactUnlocked((v) => !v)}
              className={`text-xs px-2.5 py-1 rounded-md border transition-colors ${contactUnlocked ? "border-indigo-500/50 text-indigo-300 hover:bg-indigo-500/10" : "border-amber-500/40 text-amber-300 hover:bg-amber-500/10"}`}
            >
              {contactUnlocked ? "Lock" : "Edit anyway"}
            </button>
          </div>
          <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2 mb-4">
            <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-amber-300/90 text-xs leading-relaxed">
              This information is on file with the U.S. Copyright Office and is locked to prevent accidental edits. Changing it here updates ArtistOps only — it does <span className="font-semibold">not</span> change your official Copyright Office record. To change the registration record, update it on the <a href="https://eservice.eco.loc.gov/eService_enu?SWECmd=Start" target="_blank" rel="noopener noreferrer" className="underline hover:text-amber-200">eCO website</a>. Click <span className="font-semibold">Edit anyway</span> to override.
            </p>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {[
                { name: "legalName", label: "Legal Name" },
                { name: "businessName", label: "Business / Entity" },
                { name: "correspondentEmail", label: "Correspondent Email" },
                { name: "phone", label: "Phone" },
                { name: "altPhone", label: "Alt. Phone" },
              ].map((f) => (
                <div key={f.name}>
                  <label className="block text-[#8b8fa8] text-sm mb-1">{f.label}</label>
                  <input name={f.name} defaultValue={settings[f.name] || ""} readOnly={!contactUnlocked} className={roClass} />
                </div>
              ))}
            </div>
            <div>
              <label className="block text-[#8b8fa8] text-sm mb-1">Address</label>
              <input name="addressLine" defaultValue={settings.addressLine || ""} readOnly={!contactUnlocked} className={roClass} />
            </div>
            <div className="grid grid-cols-4 gap-4">
              {[
                { name: "city", label: "City" },
                { name: "state", label: "State" },
                { name: "zip", label: "ZIP" },
                { name: "country", label: "Country" },
              ].map((f) => (
                <div key={f.name}>
                  <label className="block text-[#8b8fa8] text-sm mb-1">{f.label}</label>
                  <input name={f.name} defaultValue={settings[f.name] || ""} readOnly={!contactUnlocked} className={roClass} />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button type="submit" disabled={saving} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-50">{saving ? "Saving..." : "Save Changes"}</button>
          {saved && <span className="flex items-center gap-1 text-green-400 text-sm"><CheckCircle2 className="w-4 h-4" /> Saved</span>}
        </div>
      </form>

      <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl p-6">
        <h2 className="text-white font-semibold mb-2 flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-400" /> Database</h2>
        <p className="text-[#8b8fa8] text-sm">Connected to Supabase PostgreSQL. Your catalog, revenue, rights, and analytics are saved and synced across devices.</p>
      </div>
    </div>
  );
}
