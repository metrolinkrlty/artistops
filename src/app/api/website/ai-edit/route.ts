import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { describeAiError } from "@/lib/webImport";
import type { SocialLinks } from "@/app/website/actions";
import type { Show } from "@/app/website/site-fields";

// Tier 1 "vibe editor": the artist chats in plain English and Claude edits
// their ArtistSite config through a small set of tools. The brain lives here in
// ArtistOps; the public website just re-reads the config and reflects it.

const MODEL = "claude-opus-4-8";
const MAX_TOOL_ITERATIONS = 6;

const SOCIAL_KEYS: (keyof SocialLinks)[] = [
  "spotify",
  "appleMusic",
  "youtube",
  "instagram",
  "facebook",
  "tiktok",
  "bandcamp",
  "website",
];

// Fields the AI is allowed to touch. Email routing is deliberately excluded —
// it's sensitive and has its own dropdown UI in the dashboard.
const tools: Anthropic.Tool[] = [
  {
    name: "update_profile",
    description:
      "Update the artist's core profile text. Only include the fields you are changing; omit the rest. Pass an empty string to clear an optional field (tagline, location, bio, heroSubtext).",
    input_schema: {
      type: "object",
      properties: {
        displayName: { type: "string", description: "The artist's public name, e.g. 'Luke Corliss'. Cannot be blank." },
        tagline: { type: "string", description: "Short genre/vibe line, e.g. 'Honky-tonk, rockabilly & western rock'." },
        location: { type: "string", description: "Home base, e.g. 'Greeley, Colorado'. Shown above the name in the hero and in the footer." },
        bio: { type: "string", description: "The About-section text. Separate paragraphs with a blank line (\\n\\n)." },
        heroSubtext: { type: "string", description: "The one-paragraph pitch under the artist's name at the very top of the site." },
        heroCtaPrimary: { type: "string", description: "Label for the primary hero button (default 'Listen Now')." },
        heroCtaSecondary: { type: "string", description: "Label for the secondary hero button (default 'Join the Mailing List')." },
      },
      additionalProperties: false,
    },
  },
  {
    name: "set_theme_color",
    description:
      "Set the site's accent/highlight color (buttons, links, section headings). Provide a 6-digit hex like '#e0a530'. When the artist describes a color in words, convert it to a fitting hex.",
    input_schema: {
      type: "object",
      properties: {
        hex: { type: "string", description: "A 6-digit hex color, e.g. '#c2452a'." },
      },
      required: ["hex"],
      additionalProperties: false,
    },
  },
  {
    name: "set_social_links",
    description:
      "Set or clear the artist's social & streaming links. Only include the platforms you are changing. Pass a full URL to set, or an empty string to remove that link.",
    input_schema: {
      type: "object",
      properties: Object.fromEntries(
        SOCIAL_KEYS.map((k) => [
          k,
          { type: "string", description: `URL for ${k}, or "" to remove.` },
        ])
      ),
      additionalProperties: false,
    },
  },
  {
    name: "add_show",
    description:
      "Add a single upcoming show/tour date to the Shows section. Use this for 'add a show' requests.",
    input_schema: {
      type: "object",
      properties: {
        date: { type: "string", description: "The date as it should appear, e.g. 'Aug 3, 2026' or 'Fri, Aug 3 · 8pm'." },
        venue: { type: "string", description: "Venue name, e.g. 'Moxi Theater'." },
        city: { type: "string", description: "City/state, e.g. 'Greeley, CO'. Optional." },
        ticketUrl: { type: "string", description: "Ticket link (http/https). Optional." },
      },
      required: ["date", "venue"],
      additionalProperties: false,
    },
  },
  {
    name: "set_shows",
    description:
      "Replace the entire list of upcoming shows. Use for editing, removing, reordering, or clearing shows. Pass an empty array to clear all shows (the section then reads 'dates to be announced').",
    input_schema: {
      type: "object",
      properties: {
        shows: {
          type: "array",
          items: {
            type: "object",
            properties: {
              date: { type: "string" },
              venue: { type: "string" },
              city: { type: "string" },
              ticketUrl: { type: "string" },
            },
            required: ["date", "venue"],
            additionalProperties: false,
          },
        },
      },
      required: ["shows"],
      additionalProperties: false,
    },
  },
  {
    name: "set_section_visibility",
    description:
      "Show or hide an optional section of the site. Sections you can toggle: 'gallery' and 'shows'.",
    input_schema: {
      type: "object",
      properties: {
        section: { type: "string", enum: ["gallery", "shows"], description: "Which section." },
        visible: { type: "boolean", description: "true to show it, false to hide it." },
      },
      required: ["section", "visible"],
      additionalProperties: false,
    },
  },
];

type SiteRecord = {
  slug: string;
  displayName: string;
  tagline: string | null;
  location: string | null;
  bio: string | null;
  heroSubtext: string | null;
  themeColor: string | null;
  heroCtaPrimary: string | null;
  heroCtaSecondary: string | null;
  hiddenSections: string[];
  shows: Show[];
  socialLinks: unknown;
};

function siteSummary(site: SiteRecord): string {
  const social = (site.socialLinks as SocialLinks) || {};
  const socialLines =
    SOCIAL_KEYS.filter((k) => social[k])
      .map((k) => `  - ${k}: ${social[k]}`)
      .join("\n") || "  (none set)";
  const showLines =
    site.shows.length > 0
      ? site.shows
          .map((s, i) => `  ${i + 1}. ${s.date} — ${s.venue}${s.city ? `, ${s.city}` : ""}${s.ticketUrl ? ` (${s.ticketUrl})` : ""}`)
          .join("\n")
      : "  (none — section reads 'dates to be announced')";
  const hidden = site.hiddenSections.length ? site.hiddenSections.join(", ") : "(all sections visible)";
  return [
    `slug: ${site.slug}`,
    `displayName: ${site.displayName}`,
    `tagline: ${site.tagline ?? "(none)"}`,
    `location: ${site.location ?? "(none)"}`,
    `heroSubtext: ${site.heroSubtext ?? "(none)"}`,
    `bio: ${site.bio ?? "(none)"}`,
    `themeColor (accent): ${site.themeColor ?? "(default amber)"}`,
    `hero buttons: primary="${site.heroCtaPrimary ?? "Listen Now"}", secondary="${site.heroCtaSecondary ?? "Join the Mailing List"}"`,
    `hidden sections: ${hidden}`,
    `upcoming shows:`,
    showLines,
    `social links:`,
    socialLines,
  ].join("\n");
}

function systemPrompt(site: SiteRecord): string {
  return [
    "You are the friendly editing assistant built into the ArtistOps dashboard.",
    "You help a musician edit their own public website by chatting in plain English.",
    "Changes you make are saved immediately and the artist's live site updates to match.",
    "",
    "You can edit: display name, tagline, location, hero subtext, bio, hero button labels,",
    "the accent color, social/streaming links, upcoming shows, and which sections are shown,",
    "using update_profile, set_theme_color, set_social_links, add_show, set_shows, and",
    "set_section_visibility. Make the smallest change that",
    "satisfies the request. When the artist asks you to rewrite or improve copy, write it",
    "in their voice and genre; keep it concise and never invent facts (tour dates, awards,",
    "streaming numbers) they didn't give you.",
    "",
    "You CANNOT change email settings, the URL slug, uploaded photos, or the audio tracks —",
    "if asked, tell them to use the Email section / Site details form / their music library.",
    "",
    "After making edits, briefly confirm what you changed in one or two sentences. If a",
    "request is ambiguous (e.g. 'make it better'), propose a specific rewrite and apply it",
    "rather than asking a long list of questions.",
    "",
    "Here is the artist's current site configuration:",
    siteSummary(site),
  ].join("\n");
}

function isValidUrl(v: string): boolean {
  try {
    const u = new URL(v);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  const userId = await requireUserId();

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "The AI editor isn't configured yet (missing ANTHROPIC_API_KEY)." },
      { status: 503 }
    );
  }

  let body: { messages?: { role: "user" | "assistant"; content: string }[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const history = (body.messages ?? [])
    .filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && m.content.trim())
    .slice(-20);
  if (!history.length || history[history.length - 1].role !== "user") {
    return NextResponse.json({ error: "Send a message to the editor." }, { status: 400 });
  }

  const site = await prisma.artistSite.findUnique({ where: { userId } });
  if (!site) {
    return NextResponse.json({
      reply:
        "Let's set up your site first — fill in your display name and slug in the Site details form above and hit Save. Then I can help you edit everything by chat.",
      changed: [],
    });
  }

  const anthropic = new Anthropic();
  const messages: Anthropic.MessageParam[] = history.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  const changed: string[] = [];
  const pending: {
    profile: {
      displayName?: string;
      tagline?: string | null;
      location?: string | null;
      bio?: string | null;
      heroSubtext?: string | null;
      heroCtaPrimary?: string | null;
      heroCtaSecondary?: string | null;
    };
    themeColor?: string;
    shows?: Show[];
    hiddenSections?: string[];
    social: SocialLinks | null;
  } = { profile: {}, social: null };

  // Work against a live snapshot so the tools always report against fresh state.
  const current: SiteRecord = {
    slug: site.slug,
    displayName: site.displayName,
    tagline: site.tagline,
    location: site.location,
    bio: site.bio,
    heroSubtext: site.heroSubtext,
    themeColor: site.themeColor,
    heroCtaPrimary: site.heroCtaPrimary,
    heroCtaSecondary: site.heroCtaSecondary,
    hiddenSections: site.hiddenSections ?? [],
    shows: Array.isArray(site.shows) ? (site.shows as Show[]) : [],
    socialLinks: site.socialLinks,
  };

  function runTool(name: string, input: Record<string, unknown>): string {
    if (name === "update_profile") {
      const results: string[] = [];
      if (typeof input.displayName === "string") {
        const v = input.displayName.trim();
        if (!v) return "Error: display name can't be blank.";
        pending.profile.displayName = v;
        current.displayName = v;
        results.push(`display name → "${v}"`);
      }
      for (const key of ["tagline", "location", "bio", "heroSubtext", "heroCtaPrimary", "heroCtaSecondary"] as const) {
        if (typeof input[key] === "string") {
          const v = (input[key] as string).trim();
          pending.profile[key] = v || null;
          current[key] = v || null;
          results.push(v ? `${key} updated` : `${key} cleared`);
        }
      }
      if (!results.length) return "No profile fields were provided.";
      for (const r of results) if (!changed.includes(r)) changed.push(r);
      return "Applied: " + results.join(", ") + ".";
    }
    if (name === "set_theme_color") {
      const v = typeof input.hex === "string" ? input.hex.trim().toLowerCase() : "";
      if (!/^#[0-9a-f]{6}$/.test(v)) {
        return `Error: "${input.hex}" is not a 6-digit hex color (e.g. "#c2452a").`;
      }
      pending.themeColor = v;
      current.themeColor = v;
      if (!changed.includes("accent color")) changed.push("accent color");
      return `Applied: accent color → ${v}.`;
    }
    if (name === "add_show" || name === "set_shows") {
      const normalize = (raw: unknown): Show | string => {
        const o = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
        const date = typeof o.date === "string" ? o.date.trim() : "";
        const venue = typeof o.venue === "string" ? o.venue.trim() : "";
        const city = typeof o.city === "string" ? o.city.trim() : "";
        const ticketUrl = typeof o.ticketUrl === "string" ? o.ticketUrl.trim() : "";
        if (!date || !venue) return "each show needs a date and a venue";
        if (ticketUrl && !isValidUrl(ticketUrl)) return `"${ticketUrl}" is not a valid http(s) ticket URL`;
        return { date, venue, city, ticketUrl };
      };
      if (name === "add_show") {
        const s = normalize(input);
        if (typeof s === "string") return `Error: ${s}.`;
        current.shows = [...current.shows, s];
        pending.shows = current.shows;
        if (!changed.includes("shows updated")) changed.push("shows updated");
        return `Applied: added ${s.date} — ${s.venue}. Now ${current.shows.length} show(s).`;
      }
      const raw = Array.isArray(input.shows) ? input.shows : null;
      if (!raw) return "Error: set_shows needs a 'shows' array.";
      const out: Show[] = [];
      for (const item of raw) {
        const s = normalize(item);
        if (typeof s === "string") return `Error: ${s}.`;
        out.push(s);
      }
      current.shows = out;
      pending.shows = out;
      if (!changed.includes("shows updated")) changed.push("shows updated");
      return `Applied: shows set to ${out.length} show(s).`;
    }
    if (name === "set_section_visibility") {
      const section = typeof input.section === "string" ? input.section : "";
      const visible = input.visible;
      if (section !== "gallery" && section !== "shows") return `Error: unknown section "${section}".`;
      if (typeof visible !== "boolean") return "Error: 'visible' must be true or false.";
      const set = new Set(current.hiddenSections);
      if (visible) set.delete(section);
      else set.add(section);
      current.hiddenSections = Array.from(set);
      pending.hiddenSections = current.hiddenSections;
      const label = `${section} ${visible ? "shown" : "hidden"}`;
      if (!changed.includes(label)) changed.push(label);
      return `Applied: ${label}.`;
    }
    if (name === "set_social_links") {
      const social: SocialLinks = { ...((current.socialLinks as SocialLinks) || {}) };
      const results: string[] = [];
      for (const key of SOCIAL_KEYS) {
        if (typeof input[key] === "string") {
          const v = (input[key] as string).trim();
          if (!v) {
            delete social[key];
            results.push(`${key} removed`);
          } else if (isValidUrl(v)) {
            social[key] = v;
            results.push(`${key} set`);
          } else {
            return `Error: "${v}" is not a valid http(s) URL for ${key}.`;
          }
        }
      }
      if (!results.length) return "No social links were provided.";
      pending.social = social;
      current.socialLinks = social;
      for (const r of results) if (!changed.includes(r)) changed.push(r);
      return "Applied: " + results.join(", ") + ".";
    }
    return `Unknown tool: ${name}`;
  }

  let reply = "";
  try {
    for (let i = 0; i < MAX_TOOL_ITERATIONS; i++) {
      const res = await anthropic.messages.create({
        model: MODEL,
        max_tokens: 1500,
        system: systemPrompt(current),
        tools,
        messages,
      });

      const textPart = res.content
        .filter((b): b is Anthropic.TextBlock => b.type === "text")
        .map((b) => b.text)
        .join("\n")
        .trim();
      if (textPart) reply = textPart;

      if (res.stop_reason !== "tool_use") break;

      messages.push({ role: "assistant", content: res.content });
      const toolResults: Anthropic.ToolResultBlockParam[] = [];
      for (const block of res.content) {
        if (block.type === "tool_use") {
          const out = runTool(block.name, (block.input as Record<string, unknown>) ?? {});
          toolResults.push({ type: "tool_result", tool_use_id: block.id, content: out });
        }
      }
      messages.push({ role: "user", content: toolResults });
    }
  } catch (err) {
    console.error("[ai-edit] Anthropic error", err);
    return NextResponse.json(
      { error: describeAiError(err, "The editor hit a snag. Please try again.") },
      { status: 502 }
    );
  }

  // Persist any accumulated edits in one write.
  if (
    Object.keys(pending.profile).length ||
    pending.social ||
    pending.themeColor ||
    pending.shows ||
    pending.hiddenSections
  ) {
    await prisma.artistSite.update({
      where: { userId },
      data: {
        ...pending.profile,
        ...(pending.themeColor ? { themeColor: pending.themeColor } : {}),
        ...(pending.shows ? { shows: pending.shows } : {}),
        ...(pending.hiddenSections ? { hiddenSections: pending.hiddenSections } : {}),
        ...(pending.social ? { socialLinks: pending.social } : {}),
      },
    });
    revalidatePath("/website");
  }

  return NextResponse.json({
    reply: reply || "Done.",
    changed,
  });
}
