"use client";
import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";

export default function RootLayoutClient({ children, artistName }: { children: React.ReactNode; artistName: string }) {
  const pathname = usePathname();
  const isPublic = pathname.startsWith("/listen/");

  if (isPublic) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar artistName={artistName} />
      <main className="flex-1 flex flex-col overflow-auto">
        {children}
      </main>
    </div>
  );
}
