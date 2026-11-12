import Link from "next/link";
import type { ListedItem } from "@/lib/data";
import { TOPICS, topicsFor } from "@/lib/topics";
import { Icon } from "./Icon";

export function topicCounts(items: ListedItem[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const item of items) {
    for (const t of topicsFor(item.title, item.summaries?.one_line)) counts.set(t.slug, (counts.get(t.slug) ?? 0) + 1);
  }
  return counts;
}

export function TopicTiles({ counts }: { counts: Map<string, number> }) {
  return (
    <ul className="tiles">
      {TOPICS.map((t) => {
        const n = counts.get(t.slug) ?? 0;
        return (
          <li key={t.slug}>
            <Link className="tile" href={`/topics/${t.slug}`} style={{ "--topic": t.color } as React.CSSProperties}>
              <span className="tile-top">
                <Icon name={t.slug} size={28} />
                <span className="tile-count" aria-label={`${n} item${n === 1 ? "" : "s"}`}>{n}</span>
              </span>
              <span>
                <span className="tile-name">{t.name}</span>
                <span className="tile-sub block">{t.short}</span>
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
