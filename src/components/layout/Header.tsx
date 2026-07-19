"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, MessageSquare } from "lucide-react";
import ChecklistBell from "./ChecklistBell";
import LogoutPill from "./LogoutPill";
import { getHeaderUnread } from "@/app/messages/actions";

interface HeaderProps {
  title: string;
  subtitle?: string;
  subtitleTitle?: string; // hover explanation shown on the subtitle
}

export default function Header({ title, subtitle, subtitleTitle }: HeaderProps) {
  const pathname = usePathname();
  const [unread, setUnread] = useState(0);

  // Poll lightly so a new message shows up without a manual refresh. Re-checks
  // on navigation too (pathname dep), e.g. right after leaving /messages.
  useEffect(() => {
    let alive = true;
    const load = () => getHeaderUnread().then((n) => { if (alive) setUnread(n); }).catch(() => {});
    load();
    const t = setInterval(load, 30000);
    return () => { alive = false; clearInterval(t); };
  }, [pathname]);

  return (
    <div className="flex items-center justify-between px-8 py-4 border-b border-[#2a2d3a] bg-[#0f1117]">
      <div>
        <h1 className="text-white text-xl font-semibold">{title}</h1>
        {subtitle && (
          <p
            className={`text-[#8b8fa8] text-sm ${subtitleTitle ? "cursor-help underline decoration-dotted decoration-[#3a3d4a] underline-offset-4" : ""}`}
            title={subtitleTitle}
          >
            {subtitle}
          </p>
        )}
      </div>
      <div className="flex items-center gap-4">
        <div className="relative">
          <Search className="w-4 h-4 text-[#8b8fa8] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search..."
            className="bg-[#1a1d27] border border-[#2a2d3a] text-white pl-10 pr-4 py-2 rounded-lg text-sm placeholder:text-[#8b8fa8] focus:outline-none focus:border-indigo-500 w-64"
          />
        </div>
        <Link
          href="/messages"
          title="Messages"
          aria-label={unread > 0 ? `Messages, ${unread} unread` : "Messages"}
          className="relative flex items-center justify-center w-9 h-9 rounded-lg bg-[#1a1d27] border border-[#2a2d3a] text-[#8b8fa8] hover:text-white hover:border-indigo-500 transition-colors"
        >
          <MessageSquare className="w-4 h-4" />
          {unread > 0 && (
            <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
              {unread > 99 ? "99+" : unread}
            </span>
          )}
        </Link>
        <ChecklistBell />
        <LogoutPill />
      </div>
    </div>
  );
}
