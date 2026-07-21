import type { CSSProperties } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import type { Show } from "@/app/website/site-fields";
import { unlockCookieName, unlockedIdsFromCookie } from "@/app/sites/unlock";
import { fontFor } from "@/lib/siteFonts";
import SiteMusic from "./SiteMusic";
import SiteMailingList from "./SiteMailingList";
import SiteAnalytics from "./SiteAnalytics";
import SitePixels from "./SitePixels";
import { getAppSetting, SETTING_AD_RETARGETING_GLOBAL } from "@/lib/settings";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ slug: string }> };

const SOCIAL_ORDER: { key: string; label: string }[] = [
  { key: "spotify", label: "Spotify" },
  { key: "appleMusic", label: "Apple Music" },
  { key: "youtube", label: "YouTube" },
  { key: "instagram", label: "Instagram" },
  { key: "facebook", label: "Facebook" },
  { key: "tiktok", label: "TikTok" },
  { key: "bandcamp", label: "Bandcamp" },
  { key: "website", label: "Website" },
];

const DEFAULT_ACCENT = "#e0a530";

function getSite(slug: string) {
  return prisma.artistSite.findUnique({ where: { slug } });
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const site = await getSite(slug);
  if (!site) return { title: "Site not found" };
  return {
    title: site.tagline ? `${site.displayName} — ${site.tagline}` : site.displayName,
    description: site.heroSubtext || site.bio || undefined,
  };
}

export default async function ArtistSitePage({ params }: Params) {
  const { slug } = await params;
  const [site, trackCount, cookieStore] = await Promise.all([
    getSite(slug),
    prisma.siteTrack.count({ where: { site: slug } }),
    cookies(),
  ]);
  if (!site) notFound();

  // Show the ad-use consent line on the signup form only when the artist opted in
  // AND the platform-wide master switch is on.
  const adGlobal = await getAppSetting(SETTING_AD_RETARGETING_GLOBAL, "off");
  const showAdConsent = adGlobal === "on" && !!site.adRetargetingEnabled;

  // The artist's ad pixels (Meta/TikTok/Google), so this hosted site can retarget
  // visitors and track gate-unlock conversions. Defensive: never block the page.
  const adPixels: { meta?: string; tiktok?: string; google?: string } = {};
  try {
    const rows = await prisma.adPixel.findMany({
      where: { userId: site.userId },
      select: { platform: true, pixelId: true },
    });
    for (const r of rows) {
      if (r.platform === "meta" || r.platform === "tiktok" || r.platform === "google") {
        adPixels[r.platform] = r.pixelId;
      }
    }
  } catch {
    // No pixels configured — the page still works.
  }

  // Album / campaign Smart Links (not tied to one song) → a "Releases" section.
  const albumLinks = await prisma.smartLink
    .findMany({ where: { userId: site.userId, songId: null, isActive: true }, orderBy: { createdAt: "desc" }, select: { slug: true, title: true } })
    .catch(() => [] as { slug: string; title: string }[]);

  const unlockedIds = unlockedIdsFromCookie(cookieStore.get(unlockCookieName(slug))?.value);

  const accent =
    site.themeColor && /^#[0-9a-fA-F]{6}$/.test(site.themeColor)
      ? site.themeColor
      : DEFAULT_ACCENT;
  const font = fontFor(site.fontFamily);
  const themeStyle = { "--accent": accent, "--site-heading": font.css } as CSSProperties;

  const social = (site.socialLinks as Record<string, string> | null) || {};
  const socialLinks = SOCIAL_ORDER.filter((s) => social[s.key]);
  const bioParagraphs = site.bio
    ? site.bio.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean)
    : [];
  const shows: Show[] = Array.isArray(site.shows) ? (site.shows as Show[]) : [];
  const hidden = site.hiddenSections ?? [];
  const showReleases = !hidden.includes("releases") && albumLinks.length > 0;
  const showShows = !hidden.includes("shows");
  const gallery = site.galleryImages ?? [];
  const showGallery = !hidden.includes("gallery") && gallery.length > 0;
  const hasMusic = trackCount > 0;
  const ctaPrimary = site.heroCtaPrimary?.trim() || "Listen";
  const ctaSecondary = site.heroCtaSecondary?.trim() || "Join the Mailing List";

  const nav = [
    hasMusic && { href: "#music", label: "Music" },
    showReleases && { href: "#releases", label: "Releases" },
    bioParagraphs.length && { href: "#about", label: "About" },
    showGallery && { href: "#gallery", label: "Gallery" },
    showShows && { href: "#shows", label: "Shows" },
    { href: "#mailing-list", label: "Mailing List" },
  ].filter(Boolean) as { href: string; label: string }[];

  return (
    <div style={themeStyle} className="min-h-screen bg-neutral-950 text-neutral-100">
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link rel="stylesheet" href={font.href} />
      <SiteAnalytics ownerId={site.userId} />
      <SitePixels adPixels={adPixels} />
      {/* Nav */}
      <header className="sticky top-0 z-30 border-b border-white/10 bg-neutral-950/85 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <a href="#top" className="text-lg font-semibold uppercase tracking-[0.15em]" style={{ color: accent, fontFamily: "var(--site-heading)" }}>
            {site.displayName}
          </a>
          <nav className="hidden gap-7 sm:flex">
            {nav.map((l) => (
              <a key={l.href} href={l.href} className="text-sm uppercase tracking-widest text-neutral-400 transition hover:text-neutral-100">
                {l.label}
              </a>
            ))}
          </nav>
        </div>
      </header>

      <main id="top">
        {/* Hero */}
        <section className="relative isolate overflow-hidden">
          {site.heroImageUrl ? (
            <>
              <div className="absolute inset-0 -z-10 bg-cover bg-center" style={{ backgroundImage: `url('${site.heroImageUrl}')` }} />
              <div className="absolute inset-0 -z-10 bg-gradient-to-b from-neutral-950/70 via-neutral-950/60 to-neutral-950" />
            </>
          ) : (
            <div
              className="absolute inset-0 -z-10"
              style={{ background: `radial-gradient(90% 80% at 20% 0%, ${accent}22, transparent 60%), #0a0a0a` }}
            />
          )}
          <div className="mx-auto flex min-h-[78vh] max-w-5xl flex-col justify-end px-6 pb-20 pt-40">
            {site.location && (
              <p className="mb-4 text-sm uppercase tracking-[0.35em]" style={{ color: accent }}>
                {site.location}
              </p>
            )}
            <h1 className="text-5xl font-bold uppercase leading-[0.95] tracking-tight sm:text-7xl" style={{ fontFamily: "var(--site-heading)" }}>
              {site.displayName}
            </h1>
            {site.heroSubtext && (
              <p className="mt-6 max-w-2xl text-lg leading-relaxed text-neutral-200">{site.heroSubtext}</p>
            )}
            <div className="mt-8 flex flex-wrap gap-4">
              {hasMusic && (
                <a href="#music" className="rounded-lg px-7 py-3 font-semibold text-neutral-950 transition" style={{ backgroundColor: accent }}>
                  {ctaPrimary}
                </a>
              )}
              <a href="#mailing-list" className="rounded-lg border border-white/20 px-7 py-3 font-semibold text-neutral-100 transition hover:border-white/50">
                {ctaSecondary}
              </a>
            </div>
          </div>
        </section>

        {/* Music */}
        {hasMusic && (
          <section id="music" className="scroll-mt-20 py-24">
            <div className="mx-auto max-w-3xl px-6">
              <SectionHeading kicker="Listen" title="Music" accent={accent} />
              <SiteMusic
                slug={slug}
                initiallyUnlockedIds={unlockedIds}
                previewSeconds={site.previewSeconds}
                followUrl={site.unlockFollowUrl}
                fbPageUrl={site.fbPageUrl}
                playerStyle={(site.playerStyle as "waveform" | "shade" | "simple" | "classic") ?? "waveform"}
                showStreamLinks={site.showStreamLinks}
                showMusicNotes={site.showMusicNotes}
                streamLinksAfterGate={site.streamLinksAfterGate}
              />
            </div>
          </section>
        )}

        {/* Releases — album / campaign smart links */}
        {showReleases && (
          <section id="releases" className="scroll-mt-20 border-y border-white/10 bg-white/[0.02] py-24">
            <div className="mx-auto max-w-3xl px-6">
              <SectionHeading kicker="Get It" title="Releases" accent={accent} />
              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                {albumLinks.map((a) => (
                  <a
                    key={a.slug}
                    href={`/listen/${a.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-5 py-4 transition hover:border-[var(--accent)]"
                    title="Listen on your favorite platform"
                  >
                    <span className="truncate font-semibold uppercase tracking-wide">{a.title}</span>
                    <span className="shrink-0 text-xs uppercase tracking-widest" style={{ color: accent }}>Listen →</span>
                  </a>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* About */}
        {bioParagraphs.length > 0 && (
          <section id="about" className="scroll-mt-20 border-y border-white/10 bg-white/[0.02] py-24">
            <div className="mx-auto max-w-3xl px-6">
              <SectionHeading kicker="About" title={`About ${site.displayName}`} accent={accent} />
              <div className="space-y-5 text-lg leading-relaxed text-neutral-200">
                {bioParagraphs.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Gallery */}
        {showGallery && (
          <section id="gallery" className="scroll-mt-20 py-24">
            <div className="mx-auto max-w-5xl px-6">
              <SectionHeading kicker="On Stage" title="Gallery" accent={accent} />
              <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3">
                {gallery.map((src, i) => (
                  <div
                    key={i}
                    className={`overflow-hidden rounded-lg border border-white/10 bg-white/[0.03] ${
                      i === 0 ? "col-span-2 row-span-2" : ""
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-500 hover:scale-105" />
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Shows */}
        {showShows && (
          <section id="shows" className="scroll-mt-20 py-24">
            <div className="mx-auto max-w-3xl px-6">
              <SectionHeading kicker="Live" title="Upcoming Shows" accent={accent} center />
              {shows.length > 0 ? (
                <ul className="space-y-3">
                  {shows.map((s, i) => (
                    <li key={i} className="flex flex-col gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-semibold uppercase tracking-wide" style={{ color: accent }}>{s.date}</p>
                        <p className="text-neutral-100">
                          {s.venue}
                          {s.city && <span className="text-neutral-400"> · {s.city}</span>}
                        </p>
                      </div>
                      {s.ticketUrl && (
                        <a href={s.ticketUrl} target="_blank" rel="noopener noreferrer" className="shrink-0 rounded-lg border px-5 py-2 text-center text-sm font-semibold uppercase tracking-widest transition hover:text-neutral-950" style={{ borderColor: accent, color: accent }}>
                          Tickets
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="rounded-xl border border-dashed border-white/15 bg-white/[0.02] px-8 py-14 text-center">
                  <p className="text-2xl font-semibold uppercase tracking-wide" style={{ color: accent }}>Dates to be announced</p>
                  <p className="mt-3 text-neutral-400">Join the list to hear about new shows first.</p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Mailing list */}
        <section id="mailing-list" className="scroll-mt-20 border-t border-white/10 bg-white/[0.02] py-24">
          <div className="mx-auto max-w-3xl px-6 text-center">
            <SectionHeading kicker="Stay in Touch" title="Join the Mailing List" accent={accent} center />
            <p className="mx-auto mb-8 max-w-xl text-neutral-400">
              First word on new music and show dates. No spam — just the good stuff.
            </p>
            <SiteMailingList slug={slug} showAdConsent={showAdConsent} />
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-10">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-5 px-6">
          {socialLinks.length > 0 && (
            <nav className="flex flex-wrap items-center justify-center gap-3">
              {socialLinks.map((s) => (
                <a key={s.key} href={social[s.key]} target="_blank" rel="noopener noreferrer" className="rounded-full border border-white/15 px-4 py-1.5 text-xs uppercase tracking-widest text-neutral-400 transition hover:text-neutral-100" style={{ borderColor: "rgba(255,255,255,0.15)" }}>
                  {s.label}
                </a>
              ))}
            </nav>
          )}
          {site.contactEmail && (
            <p className="text-xs uppercase tracking-widest text-neutral-500">
              Booking &amp; contact:{" "}
              <a href={`mailto:${site.contactEmail}`} className="transition hover:text-neutral-200" style={{ color: accent }}>
                {site.contactEmail}
              </a>
            </p>
          )}
          {site.footerText && (
            <p className="max-w-2xl whitespace-pre-line text-center text-sm text-neutral-400">{site.footerText}</p>
          )}
          <p className="text-sm text-neutral-500">
            &copy; {new Date().getFullYear()} {site.displayName}
          </p>
          <p className="text-xs text-neutral-600">
            Website created with{" "}
            <a href="https://artistops.net" target="_blank" rel="noopener noreferrer" className="transition hover:text-neutral-300" style={{ color: accent }}>
              ArtistOps.net
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}

function SectionHeading({ kicker, title, accent, center }: { kicker: string; title: string; accent: string; center?: boolean }) {
  return (
    <div className={`mb-8 ${center ? "text-center" : ""}`}>
      <p className="mb-2 text-sm uppercase tracking-[0.3em]" style={{ color: accent }}>{kicker}</p>
      <h2 className="text-4xl font-bold uppercase tracking-tight sm:text-5xl" style={{ fontFamily: "var(--site-heading)" }}>{title}</h2>
    </div>
  );
}
