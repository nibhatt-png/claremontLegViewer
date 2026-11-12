import type { Metadata } from "next";
import { TopicTiles, topicCounts } from "@/components/TopicTiles";
import { getItemsBetween } from "@/lib/data";
import { addDays, todayInClaremont } from "@/lib/format";

export const revalidate = 600;
export const metadata: Metadata = { title: "Topics" };

export default async function TopicsPage() {
  const items = await getItemsBetween(addDays(todayInClaremont(), -365));
  return (
    <div className="wrap">
      <section className="page-hero tight">
        <p className="eyebrow">Browse</p>
        <h1>Topics</h1>
        <p className="lede">
          Agenda items from the past year, grouped by subject. Topics are matched from each item&apos;s title and
          summary, so an item can appear under more than one.
        </p>
      </section>
      <section style={{ paddingBlock: "16px 64px" }}>
        <TopicTiles counts={topicCounts(items)} />
      </section>
    </div>
  );
}
