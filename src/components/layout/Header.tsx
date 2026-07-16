"use client";

import { Bell, Search } from "lucide-react";
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
        <button className="relative p-2 rounded-lg bg-[#1a1d27] border border-[#2a2d3a] text-[#8b8fa8] hover:text-white">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-indigo-500 rounded-full"></span>
        </button>
        <LogoutPill />
      </div>
    </div>
  );
}
