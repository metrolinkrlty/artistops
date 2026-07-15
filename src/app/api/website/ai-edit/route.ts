import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import type { SocialLinks } from "@/app/website/actions";

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
      "Update the artist's core profile text. Only include the fields you are changing; omit the rest. Pass an empty string to clear an optional field (tagline, location, bio).",
    input_schema: {
      type: "object",
      properties: {
        displayName: { type: "string", description: "The artist's public name, e.g. 'Luke Corliss'. Cannot be blank." },
        tagline: { type: "string", description: "Short genre/vibe line, e.g. 'Honky-tonk, rockabilly & western rock'." },
        location: { type: "string", description: "Home base, e.g. 'Greeley, Colorado'." },
        bio: { type: "string", description: "The artist bio paragraph(s)." },
      },
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
];

type SiteRecord = {
  slug: string;
  displayName: string;
  tagline: string | null;
  location: string | null;
  bio: string | null;
  socialLinks: unknown;
};

function siteSummary(site: SiteRecord): string {
  const social = (site.socialLinks as SocialLinks) || {};
  const socialLines =
    SOCIAL_KEYS.filter((k) => social[k])
      .map((k) => `  - ${k}: ${social[k]}`)
      .join("\n") || "  (none set)";
  return [
    `slug: ${site.slug}`,
    `displayName: ${site.displayName}`,
    `tagline: ${site.tagline ?? "(none)"}`,
    `location: ${site.location ?? "(none)"}`,
    `bio: ${site.bio ?? "(none)"}`,
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
    "You can edit: display name, tagline, location, bio, and social/streaming links,",
    "using the update_profile and set_social_links tools. Make the smallest change that",
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
    profile: { displayName?: string; tagline?: string | null; location?: string | null; bio?: string | null };
    social: SocialLinks | null;
  } = { profile: {}, social: null };

  // Work against a live snapshot so the tools always report against fresh state.
  const current: SiteRecord = {
    slug: site.slug,
    displayName: site.displayName,
    tagline: site.tagline,
    location: site.location,
    bio: site.bio,
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
      for (const key of ["tagline", "location", "bio"] as const) {
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
      { error: "The editor hit a snag. Please try again." },
      { status: 502 }
    );
  }

  // Persist any accumulated edits in one write.
  if (Object.keys(pending.profile).length || pending.social) {
    await prisma.artistSite.update({
      where: { userId },
      data: {
        ...pending.profile,
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
