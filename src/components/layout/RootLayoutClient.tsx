"use client";
import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import InactivityTimeout from "@/components/InactivityTimeout";

export default function RootLayoutClient({ children, artistName }: { children: React.ReactNode; artistName: string }) {
  const pathname = usePathname();
  const isPublic = pathname.startsWith("/listen/") || pathname.startsWith("/login");

  if (isPublic) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen">
      <InactivityTimeout />
      <Sidebar artistName={artistName} />
      <main className="flex-1 flex flex-col overflow-auto">
        {children}
      </main>
    </div>
  );
}
