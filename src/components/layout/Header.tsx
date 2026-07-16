"use client";

import { Search } from "lucide-react";
import ChecklistBell from "./ChecklistBell";
import LogoutPill from "./LogoutPill";

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export default function Header({ title, subtitle }: HeaderProps) {
  return (
    <div className="flex items-center justify-between px-8 py-4 border-b border-[#2a2d3a] bg-[#0f1117]">
      <div>
        <h1 className="text-white text-xl font-semibold">{title}</h1>
        {subtitle && <p className="text-[#8b8fa8] text-sm">{subtitle}</p>}
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
        <ChecklistBell />
        <LogoutPill />
      </div>
    </div>
  );
}
