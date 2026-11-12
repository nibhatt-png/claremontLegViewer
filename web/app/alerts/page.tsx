import type { Metadata } from "next";
import Link from "next/link";
import { alertsConfigured } from "@/lib/alerts";
import { TOPICS } from "@/lib/topics";
import { AlertsForm } from "./AlertsForm";

export const metadata: Metadata = { title: "Email alerts" };

export default function Alerts() {
  const topics = TOPICS.map(({ slug, name, blurb, color, soft }) => ({ slug, name, blurb, color, soft }));
  return (
    <div className="wrap page narrow">
      <div>
        <p className="eyebrow">Free · Unsubscribe any time</p>
        <h1 style={{ margin: "16px 0 12px" }}>Email alerts</h1>
        <p className="lede">
          Get a weekly note about what&apos;s coming up at City Hall, or a heads-up when something you care about
          is on the agenda.
        </p>
      </div>
      {alertsConfigured() ? (
        <AlertsForm topics={topics} />
      ) : (
        <section className="prose" aria-labelledby="meanwhile">
          <p className="callout">Email alerts aren&apos;t switched on yet. Check back soon.</p>
          <h2 id="meanwhile">In the meantime</h2>
          <ul>
            <li><Link href="/">This week</Link> lists every meeting in the next 7 days. It updates nightly.</li>
            <li><Link href="/topics">Topics</Link> groups past and upcoming items by subject.</li>
          </ul>
        </section>
      )}
    </div>
  );
}
