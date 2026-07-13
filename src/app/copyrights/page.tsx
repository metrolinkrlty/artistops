import Header from "@/components/layout/Header";
import { getCopyrights, getSongOptions } from "./actions";
import CopyrightsClient from "./CopyrightsClient";
import { ExternalLink } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function CopyrightsPage() {
  const [copyrights, songs] = await Promise.all([getCopyrights(), getSongOptions()]);
  return (
    <div className="flex-1">
      <div className="flex items-center justify-between px-8 py-4 border-b border-[#2a2d3a] bg-[#0f1117]">
        <div>
          <h1 className="text-white text-xl font-semibold">Copyrights</h1>
          <p className="text-[#8b8fa8] text-sm">Track copyright registrations</p>
        </div>
        <div className="flex gap-2">
          <a
            href="https://eservice.eco.loc.gov/eService_enu?SWECmd=Start"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-[#1a1d27] border border-[#2a2d3a] text-[#8b8fa8] hover:text-white hover:border-indigo-500 rounded-lg text-sm transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            eCO Login
          </a>
          <a
            href="https://publicrecords.copyright.gov/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-[#1a1d27] border border-[#2a2d3a] text-[#8b8fa8] hover:text-white hover:border-indigo-500 rounded-lg text-sm transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Search Copyright Records
          </a>
        </div>
      </div>
      <CopyrightsClient
        copyrights={JSON.parse(JSON.stringify(copyrights))}
        songs={JSON.parse(JSON.stringify(songs))}
      />
    </div>
  );
}
