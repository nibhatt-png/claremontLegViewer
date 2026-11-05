import Link from "next/link";
import type { ListedItem } from "@/lib/data";
import { readableTitle, shortDate } from "@/lib/format";

/** Agenda items from several meetings, each with its meeting and date. */
export function ItemList({ items }: { items: ListedItem[] }) {
  return (
    <ul className="list">
      {items.map((item) => (
        <li key={item.id}>
          <Link className="list-row dated" href={`/items/${item.id}`}>
            <span className="date-col">{shortDate(item.events.date)}</span>
            <span>
              <strong>{item.summaries?.one_line ?? readableTitle(item.title)}</strong>
              <span className="meta block">
                {item.events.bodies.name}
                {item.agenda_number && ` · Item ${item.agenda_number}`}
              </span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
