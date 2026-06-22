import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import RootLayoutClient from "@/components/layout/RootLayoutClient";
import { getSettings } from "@/app/settings/actions";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ArtistOps - Music Business Manager",
  description: "Professional music business management platform",
};

export const dynamic = "force-dynamic";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const settings = await getSettings();
  const artistName = settings.artistName || "Artist";
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-[#0f1117] text-white`}>
        <RootLayoutClient artistName={artistName}>{children}</RootLayoutClient>
      </body>
    </html>
  );
}
