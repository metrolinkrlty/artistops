import type { Metadata } from "next";
import { getAppSetting, SETTING_PRIVACY_POLICY, DEFAULT_PRIVACY_POLICY } from "@/lib/settings";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Privacy Policy" };

// Minimal, safe markdown → HTML. Input is escaped first (admin-authored, but we
// never trust raw HTML), then a small set of block/inline rules is applied.
function renderMarkdown(md: string): string {
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const inline = (s: string) =>
    esc(s)
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/(^|[^_])_([^_]+)_/g, "$1<em>$2</em>")
      .replace(/\[([^\]]+)\]\((https?:[^)\s]+|\/[^)\s]*)\)/g, '<a href="$2" class="underline hover:text-white">$1</a>');

  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const out: string[] = [];
  let inList = false;
  const closeList = () => { if (inList) { out.push("</ul>"); inList = false; } };

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (/^###\s+/.test(line)) { closeList(); out.push(`<h3 class="mt-6 mb-2 text-lg font-semibold text-white">${inline(line.replace(/^###\s+/, ""))}</h3>`); }
    else if (/^##\s+/.test(line)) { closeList(); out.push(`<h2 class="mt-8 mb-3 text-xl font-bold text-white">${inline(line.replace(/^##\s+/, ""))}</h2>`); }
    else if (/^#\s+/.test(line)) { closeList(); out.push(`<h1 class="mb-4 text-3xl font-bold text-white">${inline(line.replace(/^#\s+/, ""))}</h1>`); }
    else if (/^[-*]\s+/.test(line)) { if (!inList) { out.push('<ul class="my-2 list-disc space-y-1 pl-6">'); inList = true; } out.push(`<li>${inline(line.replace(/^[-*]\s+/, ""))}</li>`); }
    else if (line.trim() === "") { closeList(); }
    else { closeList(); out.push(`<p class="my-3 leading-relaxed">${inline(line)}</p>`); }
  }
  closeList();
  return out.join("\n");
}

export default async function PrivacyPage() {
  const md = await getAppSetting(SETTING_PRIVACY_POLICY, DEFAULT_PRIVACY_POLICY);
  const html = renderMarkdown(md);
  return (
    <div className="min-h-screen bg-[#0f1117] text-[#c7cad8]">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <div dangerouslySetInnerHTML={{ __html: html }} />
        <p className="mt-12 border-t border-[#2a2d3a] pt-6 text-xs text-[#5a5e72]">
          Powered by ArtistOps.
        </p>
      </div>
    </div>
  );
}
