import "server-only";

// Sends transactional email via Resend's REST API (no SDK dependency).
// Requires env RESEND_API_KEY. Optional RESEND_FROM (defaults to Resend's
// shared onboarding sender, which can only deliver to the account owner until
// you verify your own domain in Resend).
export async function sendEmail(to: string, subject: string, html: string): Promise<{ ok: boolean; error?: string; skipped?: boolean }> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM || "ArtistOps <onboarding@resend.dev>";

  if (!apiKey) {
    console.warn("[email] RESEND_API_KEY not set — email not sent.");
    return { ok: false, skipped: true, error: "Email is not configured yet." };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to, subject, html }),
    });
    if (!res.ok) {
      const body = await res.text();
      console.error("[email] Resend error:", res.status, body);
      return { ok: false, error: "Failed to send email." };
    }
    return { ok: true };
  } catch (e) {
    console.error("[email] send failed:", e);
    return { ok: false, error: "Failed to send email." };
  }
}

export function passwordResetEmailHtml(artistName: string, link: string): string {
  return `
  <div style="font-family:Inter,Arial,sans-serif;background:#0f1117;color:#fff;padding:32px;border-radius:12px;max-width:480px;margin:0 auto">
    <h2 style="margin:0 0 8px">Reset your ArtistOps password</h2>
    <p style="color:#8b8fa8;margin:0 0 20px">Hi ${artistName || "there"}, we received a request to reset your password.</p>
    <a href="${link}" style="display:inline-block;background:#6366f1;color:#fff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:600">Reset Password</a>
    <p style="color:#8b8fa8;font-size:13px;margin:20px 0 0">This link expires in 1 hour. If you didn't request this, you can safely ignore this email.</p>
    <p style="color:#5a5e72;font-size:12px;margin:16px 0 0">Or paste this link into your browser:<br>${link}</p>
  </div>`;
}
