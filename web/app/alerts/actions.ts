"use server";

import { adminDb, alertsConfigured, isUuid, sendConfirmation, siteUrl } from "@/lib/alerts";
import { TOPICS } from "@/lib/topics";

export type SubscribeState = { status: "idle" | "ok" | "error"; message: string };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RESEND_AFTER_MS = 2 * 60 * 1000; // don't let the form be used to flood someone's inbox

export async function subscribe(_prev: SubscribeState, form: FormData): Promise<SubscribeState> {
  if (!alertsConfigured()) return { status: "error", message: "Email alerts aren't set up yet." };

  const sent: SubscribeState = {
    status: "ok",
    message: "Almost done. We sent you an email: click the link in it to start your alerts.",
  };
  if (form.get("website")) return sent; // honeypot field that only bots fill in

  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const weekly = form.get("weekly") === "on";
  const slugs = new Set(TOPICS.map((t) => t.slug));
  const topics = form.getAll("topics").map(String).filter((s) => slugs.has(s));

  if (!EMAIL.test(email) || email.length > 254) {
    return { status: "error", message: "Please enter a valid email address." };
  }
  if (!weekly && topics.length === 0) {
    return { status: "error", message: "Choose the weekly email, at least one topic, or both." };
  }

  const db = adminDb();
  const { data: existing, error } = await db
    .from("subscribers").select("id, confirm_sent_at").eq("email", email).maybeSingle();
  if (error) return failed(error);
  if (existing?.confirm_sent_at && Date.now() - Date.parse(existing.confirm_sent_at) < RESEND_AFTER_MS) {
    return sent;
  }

  const confirmToken = crypto.randomUUID();
  const pending = {
    pending_weekly: weekly,
    pending_topics: topics,
    confirm_token: confirmToken,
    confirm_sent_at: new Date().toISOString(),
  };
  const write = existing
    ? await db.from("subscribers").update(pending).eq("id", existing.id)
    : await db.from("subscribers").insert({ email, ...pending });
  if (write.error) return failed(write.error);

  try {
    await sendConfirmation(email, `${await siteUrl()}/alerts/confirm?token=${confirmToken}`);
  } catch (e) {
    return failed(e);
  }
  return sent;
}

export async function unsubscribe(token: string): Promise<boolean> {
  if (!alertsConfigured() || !isUuid(token)) return false;
  const { data, error } = await adminDb()
    .from("subscribers")
    .update({ unsubscribed_at: new Date().toISOString() })
    .eq("token", token)
    .select("id");
  if (error) throw error;
  return data.length > 0;
}

function failed(e: unknown): SubscribeState {
  console.error("alerts sign-up failed:", e);
  return { status: "error", message: "Something went wrong on our end. Please try again in a few minutes." };
}
