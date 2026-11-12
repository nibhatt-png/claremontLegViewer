/**
 * Server-only helpers for email alerts. Never import this from a client component: it reads the
 * Supabase secret key and the Gmail app password.
 */
import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";
import { headers } from "next/headers";

const SITE_NAME = "Claremont Explained";

export function alertsConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SECRET_KEY &&
    process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD,
  );
}

export function isUuid(s: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
}

/** Bypasses row-level security, so it can read and write the subscribers table. */
export function adminDb() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!, {
    auth: { persistSession: false },
  });
}

/** The site's public address, for links in emails. SITE_URL wins; otherwise the request's host. */
export async function siteUrl(): Promise<string> {
  if (process.env.SITE_URL) return process.env.SITE_URL.replace(/\/$/, "");
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export async function sendConfirmation(to: string, confirmUrl: string): Promise<void> {
  const transport = nodemailer.createTransport({
    service: "gmail",
    auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD!.replace(/\s/g, "") },
  });
  await transport.sendMail({
    from: { name: SITE_NAME, address: process.env.GMAIL_USER! },
    to,
    subject: "Confirm your Claremont Explained alerts",
    text:
      `Someone (hopefully you) asked for email alerts from ${SITE_NAME}.\n\n` +
      `Confirm here: ${confirmUrl}\n\n` +
      `If this wasn't you, ignore this email and you won't hear from us.`,
    html:
      `<div style="background:#fcf8f2;padding:24px 12px;font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:#2a211b">` +
      `<div style="max-width:520px;margin:0 auto;background:#fff;border:1px solid #eadfcf;border-radius:14px;padding:24px">` +
      `<p style="margin:0 0 16px;font-size:16px;line-height:1.5">Someone (hopefully you) asked for email alerts from ${SITE_NAME}.</p>` +
      `<p style="margin:0 0 20px"><a href="${confirmUrl}" style="display:inline-block;background:#a8471f;color:#fff;` +
      `padding:12px 20px;border-radius:10px;font-weight:700;text-decoration:none">Confirm my alerts</a></p>` +
      `<p style="margin:0;color:#6b5d52;font-size:14px">If this wasn't you, ignore this email and you won't hear from us.</p>` +
      `</div></div>`,
  });
}
