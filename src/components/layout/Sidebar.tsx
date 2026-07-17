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
  MessageSquare,
} from "lucide-react";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/songs", label: "Songs", icon: Music },
  { href: "/copyrights", label: "Copyrights", icon: Shield },
  { href: "/rights", label: "Rights", icon: FileLock },
  { href: "/releases", label: "Releases", icon: Package },
  { href: "/distributors", label: "Distributors", icon: Truck },
  { href: "/revenue", label: "Revenue", icon: DollarSign },
  { href: "/streaming", label: "Streaming Plays", icon: BarChart2 },
  { href: "/playlist-intelligence", label: "Playlist Intelligence", icon: ListMusic },
  { href: "/audience", label: "Audience", icon: Users },
  { href: "/social", label: "Social Media", icon: Share2 },
  { href: "/advertising", label: "Advertising", icon: Megaphone },
  { href: "/pixel-tracking", label: "Pixel Tracking", icon: Target },
  { href: "/smart-links", label: "Smart Links", icon: Link2 },
  { href: "/release-notify", label: "Release Notify", icon: BellRing },
  { href: "/website", label: "Website", icon: MonitorSmartphone },
  { href: "/analytics", label: "Website Analytics", icon: Globe },
  { href: "/integrations", label: "Integrations", icon: Plug },
  { href: "/forecasting", label: "Forecasting", icon: TrendingUp },
  { href: "/ai-insights", label: "AI Insights", icon: Sparkles },
  { href: "/contacts", label: "Contacts", icon: Users },
  { href: "/messages", label: "Messages", icon: MessageSquare },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function Sidebar({ artistName = "Artist", isAdmin = false, isImpersonating = false }: { artistName?: string; isAdmin?: boolean; isImpersonating?: boolean }) {
  const pathname = usePathname();
  const initials = artistName.trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase() || "A";

  return (
    <aside className="w-64 min-h-screen bg-[#1a1d27] border-r border-[#2a2d3a] flex flex-col">
      <div className="p-6 border-b border-[#2a2d3a]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
            <Music className="w-4 h-4 text-white" />
          </div>
          <span className="text-white font-bold text-lg">ArtistOps<sup className="text-[10px] font-normal text-[#8b8fa8] ml-0.5">™</sup></span>
        </div>
        <p className="text-[#8b8fa8] text-xs mt-1">Music Business Manager</p>
        <p className="text-indigo-400 text-sm font-semibold mt-1">v{APP_VERSION}</p>
      </div>
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon }) => {
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
