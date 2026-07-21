"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { APP_VERSION } from "@/lib/version";
import {
  LayoutDashboard,
  Music,
  Shield,
  Package,
  Truck,
  DollarSign,
  BarChart2,
  Share2,
  Megaphone,
  Target,
  Globe,
  Users,
  Settings,
  Link2,
  ListMusic,
  Plug,
  FileLock,
  TrendingUp,
  Sparkles,
  ShieldCheck,
  MonitorSmartphone,
  BellRing,
  Mail,
} from "lucide-react";

const navGroups: { label: string; items: { href: string; label: string; icon: typeof LayoutDashboard }[] }[] = [
  {
    label: "Overview",
    items: [{ href: "/", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    label: "Catalog",
    items: [
      { href: "/songs", label: "Songs", icon: Music },
      { href: "/copyrights", label: "Copyrights", icon: Shield },
      { href: "/rights", label: "Rights", icon: FileLock },
      { href: "/releases", label: "Releases", icon: Package },
      { href: "/distributors", label: "Distributors", icon: Truck },
    ],
  },
  {
    label: "Money",
    items: [
      { href: "/revenue", label: "Revenue", icon: DollarSign },
      { href: "/forecasting", label: "Forecasting", icon: TrendingUp },
    ],
  },
  {
    label: "Insights",
    items: [
      { href: "/streaming", label: "Streaming Plays", icon: BarChart2 },
      { href: "/playlist-intelligence", label: "Playlist Intelligence", icon: ListMusic },
      { href: "/ai-insights", label: "AI Insights", icon: Sparkles },
    ],
  },
  {
    label: "Fans",
    items: [
      { href: "/audience", label: "Audience", icon: Users },
      { href: "/contacts", label: "Contacts", icon: Users },
      { href: "/email", label: "Fan Email", icon: Mail },
      { href: "/release-notify", label: "Release Notify", icon: BellRing },
    ],
  },
  {
    label: "Promote",
    items: [
      { href: "/social", label: "Social Media", icon: Share2 },
      { href: "/advertising", label: "Advertising", icon: Megaphone },
      { href: "/smart-links", label: "Smart Links", icon: Link2 },
      { href: "/pixel-tracking", label: "Pixel Tracking", icon: Target },
    ],
  },
  {
    label: "Your Site",
    items: [
      { href: "/website", label: "Website", icon: MonitorSmartphone },
      { href: "/analytics", label: "Website Analytics", icon: Globe },
    ],
  },
  {
    label: "Setup",
    items: [
      { href: "/integrations", label: "Integrations", icon: Plug },
      { href: "/settings", label: "Settings", icon: Settings },
    ],
  },
];

export default function Sidebar({ artistName = "Artist", isAdmin = false, isImpersonating = false }: { artistName?: string; isAdmin?: boolean; isImpersonating?: boolean }) {
  const pathname = usePathname();
  const initials = artistName.trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase() || "A";

  return (
    <aside className="w-64 min-h-screen bg-[#1a1d27] border-r border-[#2a2d3a] flex flex-col">
      <div className="p-6 border-b border-[#2a2d3a]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center">
            <Music className="w-5 h-5 text-white" />
          </div>
          <span className="text-white font-bold text-2xl">ArtistOps<sup className="text-base font-normal text-[#8b8fa8] ml-0.5">™</sup></span>
        </div>
        <p className="text-[#8b8fa8] text-sm mt-1">Music Business Manager</p>
        <p className="text-indigo-400 text-base font-semibold mt-1">v{APP_VERSION}</p>
      </div>
      <nav className="flex-1 p-4 overflow-y-auto">
        {navGroups.map((group) => (
          <div key={group.label} className="mb-4 last:mb-0">
            <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-[#5c6070]">
              {group.label}
            </p>
            <div className="space-y-1">
              {group.items.map(({ href, label, icon: Icon }) => {
                const active = pathname === href;
                return (
                  <Link
                    key={href}
                    href={href}
                    data-navhref={href}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                      active
                        ? "bg-indigo-600 text-white"
                        : "text-[#8b8fa8] hover:text-white hover:bg-[#2a2d3a]"
                    }`}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    {label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
        {isAdmin && (
          <Link
            href="/admin"
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors mt-2 border-t border-[#2a2d3a] pt-3 ${
              pathname === "/admin"
                ? "bg-amber-600 text-white"
                : "text-amber-400 hover:text-white hover:bg-amber-600/20"
            }`}
          >
            <ShieldCheck className="w-4 h-4 flex-shrink-0" />
            Admin
          </Link>
        )}
      </nav>
      <div className="p-4 border-t border-[#2a2d3a]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-bold">{initials}</div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">{artistName}</p>
            <p className="text-[#8b8fa8] text-xs">Artist</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
