import Header from "@/components/layout/Header";

export default function SettingsPage() {
  return (
    <div className="flex-1">
      <Header title="Settings" subtitle="Configure your ArtistOps account" />
      <div className="p-8 space-y-6 max-w-2xl">
        <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl p-6">
          <h2 className="text-white font-semibold mb-4">Artist Profile</h2>
          <div className="space-y-4">
            {[
              { label: "Artist Name", value: "Alex Rivera" },
              { label: "Email", value: "alex@alexrivera.com" },
              { label: "PRO Membership", value: "ASCAP" },
              { label: "IPI Number", value: "012345678" },
            ].map(f => (
              <div key={f.label}>
                <label className="block text-[#8b8fa8] text-sm mb-1">{f.label}</label>
                <input defaultValue={f.value}
                  className="w-full bg-[#0f1117] border border-[#2a2d3a] text-white px-4 py-2 rounded-lg text-sm focus:outline-none focus:border-indigo-500" />
              </div>
            ))}
            <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700">Save Changes</button>
          </div>
        </div>
        <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl p-6">
          <h2 className="text-white font-semibold mb-4">Database</h2>
          <p className="text-[#8b8fa8] text-sm mb-4">Connect a PostgreSQL database to persist your data.</p>
          <div>
            <label className="block text-[#8b8fa8] text-sm mb-1">DATABASE_URL</label>
            <input placeholder="postgresql://user:password@localhost:5432/artistops"
              className="w-full bg-[#0f1117] border border-[#2a2d3a] text-white px-4 py-2 rounded-lg text-sm focus:outline-none focus:border-indigo-500" />
          </div>
        </div>
        <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl p-6">
          <h2 className="text-white font-semibold mb-2">Pixel Tracking Domain</h2>
          <p className="text-[#8b8fa8] text-sm mb-4">Set your website domain for the tracking snippet.</p>
          <div>
            <label className="block text-[#8b8fa8] text-sm mb-1">Website URL</label>
            <input placeholder="https://alexrivera.com"
              className="w-full bg-[#0f1117] border border-[#2a2d3a] text-white px-4 py-2 rounded-lg text-sm focus:outline-none focus:border-indigo-500" />
          </div>
        </div>
      </div>
    </div>
  );
}
