"use client";
import { usePathname } from "next/navigation";
import { Suspense } from "react";
import Sidebar from "./Sidebar";
import InactivityTimeout from "@/components/InactivityTimeout";
import WelcomeSplash from "@/components/WelcomeSplash";
import ImpersonationBanner from "@/components/ImpersonationBanner";

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
  const isPublic =
    pathname.startsWith("/listen/") ||
    pathname.startsWith("/sites/") ||
    pathname.startsWith("/notify/") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/reset-password") ||
    pathname.startsWith("/pending-approval");

  if (isPublic) return <>{children}</>;

  return (
    <div className="flex min-h-screen flex-col">
      <InactivityTimeout />
      {viewingAs && <ImpersonationBanner artistName={viewingAs.artistName} />}
      <div className="flex flex-1">
        <Suspense fallback={null}>
          <WelcomeSplash />
        </Suspense>
        <Sidebar artistName={viewingAs ? viewingAs.artistName : artistName} isAdmin={isAdmin} isImpersonating={!!viewingAs} />
        <main className="flex-1 flex flex-col overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
