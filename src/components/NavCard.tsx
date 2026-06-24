"use client";

import Link from "next/link";
import { useCallback } from "react";

interface NavCardProps {
  href: string;
  children: React.ReactNode;
  className?: string;
}

export default function NavCard({ href, children, className = "" }: NavCardProps) {
  const highlight = useCallback(() => {
    // Highlight matching sidebar link
    document.querySelectorAll("[data-navhref]").forEach((el) => {
      (el as HTMLElement).dataset.navhref === href
        ? el.classList.add("nav-hover-active")
        : el.classList.remove("nav-hover-active");
    });
  }, [href]);

  const unhighlight = useCallback(() => {
    document.querySelectorAll("[data-navhref]").forEach((el) =>
      el.classList.remove("nav-hover-active")
    );
  }, []);

  return (
    <Link
      href={href}
      onMouseEnter={highlight}
      onMouseLeave={unhighlight}
      className={`block group/navcard cursor-pointer transition-all duration-150 hover:border-indigo-500/60 hover:shadow-lg hover:shadow-indigo-500/10 ${className}`}
    >
      {children}
    </Link>
  );
}
