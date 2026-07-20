import "server-only";
import nodemailer from "nodemailer";

// Sends transactional email. Prefers Resend (RESEND_API_KEY + RESEND_FROM);
// falls back to InMotion SMTP (SMTP_HOST/PORT/USER/PASS) if Resend isn't set.
// If neither is configured, it skips gracefully instead of throwing.
export async function sendEmail(to: string, subject: string, html: string, replyTo?: string, from?: string): Promise<{ ok: boolean; error?: string; skipped?: boolean }> {
  // Prefer the artist's own SMTP mail server (InMotion) when configured.
  // Only fall back to Resend if SMTP isn't set up.
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const port = parseInt(process.env.SMTP_PORT || "465", 10);

  if (host && user && pass) {
    try {
      const transporter = nodemailer.createTransport({
        host, port, secure: port === 465,
        auth: { user, pass },
      });

      await transporter.sendMail({
        from: from || `ArtistOps <${user}>`,
        to, subject, html,
        ...(replyTo ? { replyTo } : {}),
      });

      return { ok: true };
    } catch (e) {
      console.error("[email] SMTP send failed:", e);
      return { ok: false, error: "Failed to send email." };
    }
  }

  // Fallback: Resend REST API.
  const resendKey = process.env.RESEND_API_KEY;
  const resendFrom = process.env.RESEND_FROM;

  if (resendKey && resendFrom) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: from || resendFrom,
          to: [to],
          subject,
          html,
          ...(replyTo ? { reply_to: replyTo } : {}),
        }),
      });
      if (!res.ok) {
        const body = await res.text().catch(() => "");
        console.error("[email] Resend send failed:", res.status, body);
        return { ok: false, error: "Failed to send email." };
      }
      return { ok: true };
    } catch (e) {
      console.error("[email] Resend error:", e);
      return { ok: false, error: "Failed to send email." };
    }
  }

  console.warn("[email] No SMTP or Resend config — email not sent.");
  return { ok: false, skipped: true, error: "Email is not configured yet." };
}

export function adminSignupNotificationHtml(artistName: string, email: string): string {
  return `
  <div style="font-family:Inter,Arial,sans-serif;background:#0f1117;color:#fff;padding:32px;border-radius:12px;max-width:480px;margin:0 auto">
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:24px">
      <div style="width:40px;height:40px;background:#6366f1;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:20px">🎵</div>
      <span style="font-size:20px;font-weight:700">ArtistOps</span>
    </div>
    <h2 style="margin:0 0 8px">New access request</h2>
    <p style="color:#8b8fa8;margin:0 0 20px">Someone wants to join ArtistOps and is waiting for your approval.</p>
    <div style="background:#1a1d27;border:1px solid #334155;border-radius:10px;padding:16px;margin-bottom:20px">
      <p style="margin:0 0 6px"><strong>Name:</strong> ${artistName}</p>
      <p style="margin:0"><strong>Email:</strong> ${email}</p>
    </div>
    <a href="https://artistops.net/admin" style="display:inline-block;background:#6366f1;color:#fff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:600">Review in Admin Dashboard</a>
    <p style="color:#5a5e72;font-size:12px;margin:20px 0 0">Reply to this email to contact the applicant directly.</p>
  </div>`;
}

export function pendingApprovalEmailHtml(artistName: string): string {
  return `
  <div style="font-family:Inter,Arial,sans-serif;background:#0f1117;color:#fff;padding:32px;border-radius:12px;max-width:480px;margin:0 auto">
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:24px">
      <div style="width:40px;height:40px;background:#6366f1;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:20px">🎵</div>
      <span style="font-size:20px;font-weight:700">ArtistOps</span>
    </div>
    <h2 style="margin:0 0 8px">Thanks for signing up, ${artistName}!</h2>
    <p style="color:#8b8fa8;margin:0 0 20px">Your account has been created and is <strong style="color:#f59e0b">pending approval</strong>.</p>
    <div style="background:#1a1d27;border:1px solid #f59e0b33;border-radius:10px;padding:16px;margin-bottom:20px">
      <p style="color:#f59e0b;margin:0 0 8px;font-weight:600">⏳ What happens next?</p>
      <p style="color:#8b8fa8;margin:0;font-size:14px">Our team reviews each new account before granting access. You'll receive another email once your account is approved — usually within 24 hours.</p>
    </div>
    <p style="color:#8b8fa8;font-size:13px;margin:0">Questions? Reply to this email or contact us at <a href="mailto:admin@artistops.net" style="color:#6366f1">admin@artistops.net</a>.</p>
  </div>`;
}

export function approvedEmailHtml(artistName: string): string {
  return `
  <div style="font-family:Inter,Arial,sans-serif;background:#0f1117;color:#fff;padding:32px;border-radius:12px;max-width:480px;margin:0 auto">
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:24px">
      <div style="width:40px;height:40px;background:#6366f1;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:20px">🎵</div>
      <span style="font-size:20px;font-weight:700">ArtistOps</span>
    </div>
    <h2 style="margin:0 0 8px">You're approved, ${artistName}! 🎉</h2>
    <p style="color:#8b8fa8;margin:0 0 20px">Your ArtistOps account has been approved. You can now sign in and start managing your music business.</p>
    <a href="https://artistops.net/login" style="display:inline-block;background:#6366f1;color:#fff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:600">Sign in to ArtistOps</a>
    <p style="color:#8b8fa8;font-size:13px;margin:20px 0 0">Welcome aboard! Questions as you get started? You can message us anytime — it&rsquo;s built right into ArtistOps, no need to leave the app.</p>
  </div>`;
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
