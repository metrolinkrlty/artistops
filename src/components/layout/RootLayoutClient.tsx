"use client";
import { usePathname } from "next/navigation";
import { Suspense } from "react";
import Sidebar from "./Sidebar";
import InactivityTimeout from "@/components/InactivityTimeout";
import HelpTooltip from "@/components/HelpTooltip";
import WelcomeSplash from "@/components/WelcomeSplash";
import ImpersonationBanner from "@/components/ImpersonationBanner";
import { ArtistNameProvider } from "./ArtistNameContext";

export default function RootLayoutClient({
  children,
  artistName,
  isAdmin = false,
  viewingAs,
}: {
  children: React.ReactNode;
  artistName: string;
  isAdmin?: boolean;
  viewingAs?: { id: string; artistName: string } | null;
}) {
  const pathname = usePathname();
  // Artist-facing public pages render with the artist's own theme — no ArtistOps
  // chrome and no ArtistOps-styled tooltips.
  const isArtistSite =
    pathname.startsWith("/listen/") ||
    pathname.startsWith("/sites/") ||
    pathname.startsWith("/notify/");
  const isPublic =
    isArtistSite ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/reset-password") ||
    pathname.startsWith("/pending-approval") ||
    pathname.startsWith("/privacy");

  // ArtistOps-branded public pages (login, privacy, …) still get readable tooltips.
  if (isPublic) return <>{!isArtistSite && <HelpTooltip />}{children}</>;

  return (
    <div className="flex min-h-screen flex-col">
      <InactivityTimeout />
      <HelpTooltip />
      {viewingAs && <ImpersonationBanner artistName={viewingAs.artistName} />}
      <div className="flex flex-1">
        <Suspense fallback={null}>
          <WelcomeSplash />
        </Suspense>
        <Sidebar artistName={viewingAs ? viewingAs.artistName : artistName} isAdmin={isAdmin} isImpersonating={!!viewingAs} />
        <main className="flex-1 flex flex-col overflow-auto">
          <ArtistNameProvider value={viewingAs ? viewingAs.artistName : artistName}>
            {children}
          </ArtistNameProvider>
        </main>
      </div>
    </div>
  );
}
