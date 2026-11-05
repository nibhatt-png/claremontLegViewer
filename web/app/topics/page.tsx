import type { Metadata } from "next";
import Link from "next/link";
import { getItemsBetween } from "@/lib/data";
import { addDays, todayInClaremont } from "@/lib/format";
import { TOPICS, topicsFor } from "@/lib/topics";

export const revalidate = 600;
export const metadata: Metadata = { title: "Topics" };

export default async function TopicsPage() {
  const items = await getItemsBetween(addDays(todayInClaremont(), -365));
  const counts = new Map<string, number>();
  for (const item of items) {
    for (const t of topicsFor(item.title, item.summaries?.one_line)) counts.set(t.slug, (counts.get(t.slug) ?? 0) + 1);
  }

  return (
    <div className="wrap page">
      <div>
        <h1>Topics</h1>
        <p className="lede">
          Agenda items from the past year, grouped by subject. Topics are matched from each item&apos;s title and
          summary, so an item can appear under more than one.
        </p>
      </div>
      <ul className="topic-grid">
        {TOPICS.map((t) => {
          const n = counts.get(t.slug) ?? 0;
          return (
            <li key={t.slug}>
              <Link className="topic-card" href={`/topics/${t.slug}`}>
                <h2>{t.name}</h2>
                <p>{t.blurb}</p>
                <span className="count">{n} item{n === 1 ? "" : "s"}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
