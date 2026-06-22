"use client";
import Header from "@/components/layout/Header";
import { useState } from "react";
import { CheckCircle2, XCircle, Upload, Plug } from "lucide-react";

type ConnectorStatus = "CONNECTED" | "DISCONNECTED" | "CSV_ONLY";

interface Connector {
  id: string;
  name: string;
  description: string;
  status: ConnectorStatus;
  lastSync?: string;
  color: string;
  initials: string;
}

const connectorGroups: { label: string; connectors: Connector[] }[] = [
  {
    label: "Streaming",
    connectors: [
      { id: "spotify-artists", name: "Spotify for Artists", description: "Sync streams, listeners, and playlist data", status: "CONNECTED", lastSync: "2 hours ago", color: "bg-[#1DB954]", initials: "SP" },
      { id: "apple-music", name: "Apple Music for Artists", description: "Import Apple Music analytics and revenue", status: "CSV_ONLY", color: "bg-red-500", initials: "AM" },
      { id: "amazon-music", name: "Amazon Music", description: "Track Amazon Music streams and revenue", status: "DISCONNECTED", color: "bg-blue-500", initials: "AZ" },
      { id: "youtube-studio", name: "YouTube Studio", description: "Sync Content ID revenue and view counts", status: "DISCONNECTED", color: "bg-red-600", initials: "YT" },
      { id: "pandora", name: "Pandora AMP", description: "Pandora listener analytics and royalties", status: "DISCONNECTED", color: "bg-blue-700", initials: "PA" },
      { id: "deezer", name: "Deezer", description: "Deezer streams and revenue data", status: "DISCONNECTED", color: "bg-purple-500", initials: "DZ" },
      { id: "tidal", name: "TIDAL", description: "TIDAL HiFi streams and artist analytics", status: "DISCONNECTED", color: "bg-cyan-400", initials: "TD" },
      { id: "soundcloud", name: "SoundCloud", description: "SoundCloud plays and fan data", status: "DISCONNECTED", color: "bg-orange-500", initials: "SC" },
      { id: "audiomack", name: "Audiomack", description: "Audiomack streams from artist dashboard", status: "CSV_ONLY", color: "bg-yellow-500", initials: "AU" },
      { id: "tiktok", name: "TikTok", description: "TikTok sound usage and video metrics", status: "DISCONNECTED", color: "bg-pink-600", initials: "TK" },
      { id: "instagram-music", name: "Instagram Music", description: "Instagram Reels sound performance", status: "DISCONNECTED", color: "bg-gradient-to-br from-purple-500 to-pink-500", initials: "IG" },
      { id: "facebook-music", name: "Facebook Music", description: "Facebook video and sound royalties", status: "DISCONNECTED", color: "bg-blue-600", initials: "FB" },
    ],
  },
  {
    label: "Distributors",
    connectors: [
      { id: "distrokid", name: "DistroKid", description: "Auto-sync streaming revenue and statements", status: "CONNECTED", lastSync: "1 day ago", color: "bg-indigo-500", initials: "DK" },
      { id: "cdbaby", name: "CD Baby", description: "Import CD Baby sales reports", status: "CSV_ONLY", color: "bg-green-700", initials: "CD" },
      { id: "tunecore", name: "TuneCore", description: "TuneCore distribution and revenue sync", status: "DISCONNECTED", color: "bg-orange-600", initials: "TC" },
      { id: "amuse", name: "Amuse", description: "Amuse distribution statements", status: "DISCONNECTED", color: "bg-yellow-600", initials: "AM" },
      { id: "stem", name: "Stem", description: "Stem revenue splits and payouts", status: "DISCONNECTED", color: "bg-green-500", initials: "ST" },
      { id: "onerpm", name: "ONErpm", description: "ONErpm analytics and revenue data", status: "DISCONNECTED", color: "bg-red-700", initials: "OR" },
    ],
  },
  {
    label: "PROs",
    connectors: [
      { id: "ascap", name: "ASCAP", description: "ASCAP performing rights royalty statements", status: "CONNECTED", lastSync: "3 days ago", color: "bg-blue-800", initials: "AS" },
      { id: "bmi", name: "BMI", description: "BMI royalty statements and work registration", status: "CSV_ONLY", color: "bg-indigo-700", initials: "BM" },
      { id: "sesac", name: "SESAC", description: "SESAC affiliate royalties", status: "DISCONNECTED", color: "bg-purple-700", initials: "SE" },
      { id: "socan", name: "SOCAN", description: "Canadian performing rights royalties", status: "DISCONNECTED", color: "bg-red-800", initials: "SO" },
      { id: "prs", name: "PRS for Music", description: "UK performing rights organization", status: "DISCONNECTED", color: "bg-blue-900", initials: "PR" },
    ],
  },
  {
    label: "Royalties",
    connectors: [
      { id: "mlc", name: "The MLC", description: "Mechanical licensing collective royalties", status: "CSV_ONLY", color: "bg-teal-600", initials: "ML" },
      { id: "soundexchange", name: "SoundExchange", description: "Digital performance royalties", status: "DISCONNECTED", color: "bg-cyan-700", initials: "SX" },
      { id: "songtrust", name: "Songtrust", description: "Global royalty collection administration", status: "DISCONNECTED", color: "bg-green-800", initials: "SG" },
    ],
  },
  {
    label: "Advertising",
    connectors: [
      { id: "meta-ads", name: "Meta Ads", description: "Facebook & Instagram ad campaign data", status: "CONNECTED", lastSync: "6 hours ago", color: "bg-blue-600", initials: "MT" },
      { id: "google-ads", name: "Google Ads", description: "Google & YouTube ad campaign metrics", status: "DISCONNECTED", color: "bg-yellow-500", initials: "GA" },
      { id: "tiktok-ads", name: "TikTok Ads", description: "TikTok advertising performance", status: "DISCONNECTED", color: "bg-pink-600", initials: "TA" },
    ],
  },
  {
    label: "Analytics",
    connectors: [
      { id: "ga4", name: "Google Analytics 4", description: "Website traffic and conversion tracking", status: "CONNECTED", lastSync: "1 hour ago", color: "bg-orange-500", initials: "GA" },
      { id: "gtm", name: "Google Tag Manager", description: "Tag and pixel management", status: "DISCONNECTED", color: "bg-blue-400", initials: "GT" },
    ],
  },
  {
    label: "Merch",
    connectors: [
      { id: "shopify", name: "Shopify", description: "Merchandise store sales and inventory", status: "DISCONNECTED", color: "bg-green-600", initials: "SH" },
      { id: "printful", name: "Printful", description: "Print-on-demand merch fulfillment", status: "DISCONNECTED", color: "bg-yellow-600", initials: "PF" },
      { id: "bandcamp", name: "Bandcamp", description: "Direct-to-fan sales data", status: "DISCONNECTED", color: "bg-blue-500", initials: "BC" },
    ],
  },
  {
    label: "Email",
    connectors: [
      { id: "mailchimp", name: "Mailchimp", description: "Fan email list and campaign metrics", status: "DISCONNECTED", color: "bg-yellow-400", initials: "MC" },
      { id: "klaviyo", name: "Klaviyo", description: "Advanced email marketing and segmentation", status: "DISCONNECTED", color: "bg-green-500", initials: "KL" },
    ],
  },
];

const statusConfig: Record<ConnectorStatus, { label: string; color: string }> = {
  CONNECTED: { label: "Connected", color: "bg-green-500/20 text-green-400" },
  DISCONNECTED: { label: "Disconnected", color: "bg-gray-500/20 text-gray-400" },
  CSV_ONLY: { label: "CSV Import Only", color: "bg-amber-500/20 text-amber-400" },
};

export default function IntegrationsPage() {
  const [statuses, setStatuses] = useState<Record<string, ConnectorStatus>>(
    Object.fromEntries(
      connectorGroups.flatMap(g => g.connectors.map(c => [c.id, c.status]))
    )
  );

  const connectedCount = Object.values(statuses).filter(s => s === "CONNECTED").length;
  const totalCount = Object.values(statuses).length;

  return (
    <div className="flex-1">
      <Header title="Integrations" subtitle="Connect your music business tools" />
      <div className="p-8 space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl p-4">
            <p className="text-[#8b8fa8] text-sm">Connected</p>
            <p className="text-white text-2xl font-bold mt-1">{connectedCount} / {totalCount}</p>
          </div>
          <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl p-4">
            <p className="text-[#8b8fa8] text-sm">CSV Import Available</p>
            <p className="text-white text-2xl font-bold mt-1">{Object.values(statuses).filter(s => s === "CSV_ONLY").length}</p>
          </div>
          <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl p-4">
            <p className="text-[#8b8fa8] text-sm">Categories</p>
            <p className="text-white text-2xl font-bold mt-1">{connectorGroups.length}</p>
          </div>
        </div>

        {/* Connector groups */}
        {connectorGroups.map(group => (
          <div key={group.label}>
            <h2 className="text-white font-semibold mb-4">{group.label}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {group.connectors.map(connector => {
                const status = statuses[connector.id];
                const sc = statusConfig[status];
                return (
                  <div key={connector.id} className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl p-4 flex flex-col gap-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg ${connector.color} flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}>
                          {connector.initials}
                        </div>
                        <div>
                          <p className="text-white font-medium text-sm">{connector.name}</p>
                          {connector.lastSync && status === "CONNECTED" && (
                            <p className="text-[#8b8fa8] text-xs">Last sync: {connector.lastSync}</p>
                          )}
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap ${sc.color}`}>
                        {sc.label}
                      </span>
                    </div>
                    <p className="text-[#8b8fa8] text-xs">{connector.description}</p>
                    <div className="flex gap-2 mt-auto">
                      {status === "CONNECTED" ? (
                        <button
                          onClick={() => setStatuses(s => ({ ...s, [connector.id]: "DISCONNECTED" }))}
                          className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 border border-[#2a2d3a] text-[#8b8fa8] rounded-lg text-xs hover:text-red-400 hover:border-red-500/50"
                        >
                          <XCircle className="w-3 h-3" /> Disconnect
                        </button>
                      ) : status === "CSV_ONLY" ? (
                        <button className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 border border-amber-500/40 text-amber-400 rounded-lg text-xs hover:bg-amber-500/10">
                          <Upload className="w-3 h-3" /> Import CSV
                        </button>
                      ) : (
                        <button
                          onClick={() => setStatuses(s => ({ ...s, [connector.id]: "CONNECTED" }))}
                          className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs hover:bg-indigo-700"
                        >
                          <Plug className="w-3 h-3" /> Connect
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
