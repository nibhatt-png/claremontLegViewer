import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AiLabel } from "@/components/AiLabel";
import { Icon } from "@/components/Icon";
import { ItemList } from "@/components/ItemList";
import { getItemsBetween } from "@/lib/data";
import { addDays, todayInClaremont } from "@/lib/format";
import { TOPICS, topicBySlug, topicsFor } from "@/lib/topics";

export const revalidate = 600;

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return TOPICS.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const topic = topicBySlug((await params).slug);
  return { title: topic?.name ?? "Topic not found", description: topic?.blurb };
}

export default async function TopicPage({ params }: Props) {
  const topic = topicBySlug((await params).slug);
  if (!topic) notFound();

  const today = todayInClaremont();
  const all = await getItemsBetween(addDays(today, -365));
  const items = all.filter((i) => topicsFor(i.title, i.summaries?.one_line).some((t) => t.slug === topic.slug));
  const upcoming = items.filter((i) => i.events.date >= today).reverse(); // soonest first
  const past = items.filter((i) => i.events.date < today);

  return (
    <>
      <section className="topic-hero" style={{ "--topic": topic.color } as React.CSSProperties}>
        <div className="wrap">
          <nav className="crumbs" aria-label="Breadcrumb">
            <Link href="/topics">Topics</Link> <span aria-hidden="true">›</span> <span>{topic.name}</span>
          </nav>
          <Icon name={topic.slug} size={40} />
          <h1>{topic.name}</h1>
          <p className="lede">{topic.blurb}</p>
        </div>
      </section>
      <div className="wrap page">
        {items.length === 0 ? (
          <p className="empty-state">No agenda items on this topic in the past year.</p>
        ) : (
          <>
            <AiLabel plural />
            {upcoming.length > 0 && (
              <section className="stack" aria-labelledby="upcoming">
                <h2 id="upcoming">Coming up</h2>
                <ItemList items={upcoming} />
              </section>
            )}
            {past.length > 0 && (
              <section className="stack" aria-labelledby="past">
                <h2 id="past">Recent</h2>
                <ItemList items={past} />
              </section>
            )}
          </>
        )}
      </div>
    </>
  );
}
