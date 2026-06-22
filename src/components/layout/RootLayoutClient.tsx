"use client";
import { usePathname } from "next/navigation";
import { Suspense } from "react";
import Sidebar from "./Sidebar";
import InactivityTimeout from "@/components/InactivityTimeout";
import WelcomeSplash from "@/components/WelcomeSplash";

export default function RootLayoutClient({ children, artistName, isAdmin = false }: { children: React.ReactNode; artistName: string; isAdmin?: boolean }) {
  const pathname = usePathname();
  const isPublic = pathname.startsWith("/listen/") || pathname.startsWith("/login") || pathname.startsWith("/forgot-password") || pathname.startsWith("/reset-password");

  if (isPublic) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen">
      <InactivityTimeout />
      <Suspense fallback={null}>
        <WelcomeSplash />
      </Suspense>
      <Sidebar artistName={artistName} isAdmin={isAdmin} />
      <main className="flex-1 flex flex-col overflow-auto">
        {children}
      </main>
    </div>
  );
}
