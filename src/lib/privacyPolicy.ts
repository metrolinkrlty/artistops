// The privacy policy is one admin-maintained template (a global AppSetting)
// rendered per artist: {{artistName}} / {{contactEmail}} / {{updated}} are filled
// in from that artist's site record, so each artist's fans see a policy naming
// them rather than a generic one full of brackets.

export type PolicyVars = {
  artistName: string;
  contactEmail: string;
  updated: string;
};

// Legacy bracket placeholders are still substituted, so a policy an admin edited
// before templating existed keeps working.
export function fillPolicy(md: string, vars: PolicyVars): string {
  return md
    .replace(/\{\{\s*artistName\s*\}\}/gi, vars.artistName)
    .replace(/\{\{\s*contactEmail\s*\}\}/gi, vars.contactEmail)
    .replace(/\{\{\s*updated\s*\}\}/gi, vars.updated)
    .replace(/\[Artist \/ Company name\]/gi, vars.artistName)
    .replace(/\[contact email\]/gi, vars.contactEmail)
    .replace(/\[add date\]/gi, vars.updated);
}

// Minimal, safe markdown → HTML. Input is escaped first (admin-authored, but we
// never trust raw HTML), then a small set of block/inline rules is applied.
export function renderPolicyMarkdown(md: string): string {
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

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

// Formatted by hand rather than with toLocaleDateString, whose output depends on
// the runtime's ICU data — a legal document shouldn't read differently on the
// build server than it does locally.
export function formatUpdated(d: Date | null | undefined): string {
  const date = d ?? new Date();
  return `${MONTHS[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}
