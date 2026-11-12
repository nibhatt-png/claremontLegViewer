import type { Metadata } from "next";
import Link from "next/link";
import { adminDb, alertsConfigured, isUuid } from "@/lib/alerts";
import { TOPICS } from "@/lib/topics";

export const metadata: Metadata = { title: "Confirm your alerts", robots: { index: false } };

const LINK_DAYS = 7;

async function confirm(token: string) {
  if (!alertsConfigured() || !isUuid(token)) return null;
  const db = adminDb();
  const { data: sub, error } = await db
    .from("subscribers")
    .select("id, confirmed_at, confirm_sent_at, pending_weekly, pending_topics")
    .eq("confirm_token", token)
    .maybeSingle();
  if (error) throw error;
  if (!sub || Date.now() - Date.parse(sub.confirm_sent_at) > LINK_DAYS * 864e5) return null;

  const weekly: boolean = sub.pending_weekly ?? false;
  const topics: string[] = sub.pending_topics ?? [];
  const { error: upd } = await db.from("subscribers").update({
    weekly, topics,
    confirmed_at: sub.confirmed_at ?? new Date().toISOString(),
    unsubscribed_at: null,
    pending_weekly: null, pending_topics: null, confirm_token: null,
  }).eq("id", sub.id);
  if (upd) throw upd;
  return { weekly, topics };
}

export default async function Confirm({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token = "" } = await searchParams;
  const done = await confirm(token);

  if (!done) {
    return (
      <div className="wrap page narrow">
        <h1>That link didn&apos;t work</h1>
        <p className="lede">
          It may have expired or already been used. Links last {LINK_DAYS} days.{" "}
          <Link href="/alerts">Sign up again</Link> and we&apos;ll send a fresh one.
        </p>
      </div>
    );
  }

  const names = TOPICS.filter((t) => done.topics.includes(t.slug)).map((t) => t.name);
  return (
    <div className="wrap page narrow">
      <div>
        <p className="eyebrow">You&apos;re all set</p>
        <h1>Your alerts are on</h1>
      </div>
      <div className="callout success">
        <ul className="plain">
          {done.weekly && <li><strong>The weekly email</strong>, every Friday.</li>}
          {names.length > 0 && <li><strong>Topic alerts</strong> for {names.join(", ")}.</li>}
        </ul>
      </div>
      <p>
        Want something different? <Link href="/alerts">Sign up again</Link> with the same address. Your new
        choices replace the old ones once you confirm. <Link href="/">Back to this week&apos;s meetings</Link>.
      </p>
    </div>
  );
}
