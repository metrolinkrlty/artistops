import { prisma } from "@/lib/prisma";

// Keys for global, app-wide settings (stored in the AppSetting table).
export const SETTING_LOGIN_TAGLINE = "login_tagline";

// Global master switch for social ad retargeting (Meta Custom Audience program).
// "on" | "off". When "off", no artist can retarget regardless of their own toggle,
// and the ad-use consent line never shows on any signup form.
export const SETTING_AD_RETARGETING_GLOBAL = "ad_retargeting_global";

// The admin-editable public privacy policy (markdown). Falls back to the draft below.
export const SETTING_PRIVACY_POLICY = "privacy_policy";

// Draft privacy policy — written to be a reasonable starting point for US (incl.
// California/CCPA-CPRA) and EU/UK (GDPR) audiences. It is a TEMPLATE, not legal
// advice; have counsel review before relying on it. Admins can edit it in /admin.
export const DEFAULT_PRIVACY_POLICY = `# Privacy Policy

_Last updated: {{updated}}. This is a template — review with a qualified attorney before publishing._

This Privacy Policy explains how **{{artistName}}** ("we", "us") collects, uses, and shares personal information when you visit our website or join our mailing list, and the choices you have. Our sites are operated with **ArtistOps** as our service provider.

## Information we collect
- **You give us:** your email address, and your name if you choose to provide it, when you join our mailing list or unlock a song.
- **Collected automatically:** basic usage and device data through cookies and tracking pixels (including the Meta Pixel) — pages viewed, referring source, and similar analytics.

## How we use your information
- To send you email updates about new music, releases, and shows (when you opt in).
- To unlock songs you requested and remember you on future visits.
- To measure site traffic and improve our content.
- To market to you, including by **matching a hashed version of your email to your accounts on advertising platforms such as Meta (Facebook and Instagram)** so we can show you our updates and promotions there, and reach similar audiences. **This social-media/advertising use is optional and separate from our emails: if you opt out of it (by ticking the box when you join, or using the "Opt out of ads" link in any email), we will not match your address to any advertising platform — and you will still receive our email updates as usual.** We only do the ad matching for people who did not opt out.

## How we share information
- **Advertising platforms (e.g., Meta):** we upload a **hashed** (irreversible) form of your email so the platform can match it to accounts and show you our ads. We do not send your raw email for this purpose.
- **Service providers:** email delivery, hosting/database (Supabase), and analytics vendors who process data on our behalf under contract.
- We **do not sell** your personal information for money.

## Your choices and rights
- **Unsubscribe** from emails at any time using the link in any message.
- **Opt out of the social-media/advertising part while keeping the emails:** this is a separate choice from unsubscribing. Tick the opt-out box when you join the list, or use the **"Opt out of ads"** link in any email we send. Either one stops us from matching your address to Meta or any other advertising platform, and **your email subscription is completely unaffected — you keep getting our updates.** You can also contact us and we'll remove you from our advertising audiences. (Unsubscribing, by contrast, stops the emails too.)
- **Cookies/pixels:** you can control cookies in your browser and opt out of interest-based ads via your ad platform settings (e.g., Facebook Ad Preferences).

### If you are in the EU/UK (GDPR)
Our legal bases are your **consent** (for marketing emails and ad matching) and our **legitimate interests** (for basic analytics and running the site). You have the right to **access, correct, delete, restrict, or object to** processing of your data, and to **data portability** and to **withdraw consent** at any time. You may also lodge a complaint with your local data protection authority.

### If you are in California (CCPA/CPRA)
You have the right to **know** what personal information we collect and how we use it, to **delete** it, to **correct** it, and to **opt out of "sharing"** of personal information for cross-context behavioral advertising (which our ad-platform matching may constitute). We do not "sell" personal information. To exercise these rights, contact us using the details below; we will not discriminate against you for doing so.

## Data retention
We keep your information for as long as you remain subscribed or as needed for the purposes above, then delete or anonymize it.

## Children
Our sites are not directed to children under 16, and we do not knowingly collect their information.

## Contact
Questions or requests: **{{contactEmail}}**.

## Changes
We may update this policy; material changes will be posted here with a new "Last updated" date.
`;

// The default sign-in tagline. Used as the fallback when nothing is saved yet,
// and as the "reset to default" value in the admin editor. Keep in sync with
// the copy shown on the sign-in page.
export const DEFAULT_LOGIN_TAGLINE =
  "Add your catalog — every song, ISRC, release, and who wrote and owns it. Then link each track to Spotify, Apple Music, and every other streaming platform to send fans there and track plays, royalties, and revenue across all of them — plus distribution and your website — in one place.";

// Read a global setting, falling back to `fallback` if unset. Wrapped in
// try/catch so a missing table (before `prisma db push` runs) can never crash a
// public page — it just returns the default.
export async function getAppSetting(key: string, fallback: string): Promise<string> {
  try {
    const row = await prisma.appSetting.findUnique({ where: { key } });
    return row?.value ?? fallback;
  } catch {
    return fallback;
  }
}

export async function setAppSetting(key: string, value: string): Promise<void> {
  await prisma.appSetting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });
}
