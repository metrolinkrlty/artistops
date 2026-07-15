import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

// TEMPORARY diagnostic: verifies the SMTP connection + auth from the deployed
// app and returns the raw error, so we can see exactly why mail isn't sending.
// Gated by SITE_INGEST_KEY. Does NOT send an email and never exposes the
// password. Remove after debugging.
export async function GET(req: NextRequest) {
  if (req.nextUrl.searchParams.get("key") !== process.env.SITE_INGEST_KEY) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const port = parseInt(process.env.SMTP_PORT || "465", 10);
  const cfg = {
    host: host || null,
    port,
    user: user || null,
    hasPass: !!pass,
    secure: port === 465,
    resendFallbackConfigured: !!(process.env.RESEND_API_KEY && process.env.RESEND_FROM),
  };

  if (!host || !user || !pass) {
    return NextResponse.json({ ok: false, stage: "config", cfg, error: "SMTP not fully configured" });
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
    });
    await transporter.verify();
    return NextResponse.json({ ok: true, stage: "verify", cfg, result: "SMTP connection + auth OK" });
  } catch (e: unknown) {
    const err = e as { message?: string; code?: string; command?: string; response?: string };
    return NextResponse.json({
      ok: false,
      stage: "verify",
      cfg,
      error: err?.message ?? String(e),
      code: err?.code ?? null,
      command: err?.command ?? null,
      response: err?.response ?? null,
    });
  }
}
