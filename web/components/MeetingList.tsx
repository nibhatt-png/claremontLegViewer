import Link from "next/link";
import type { MeetingListing } from "@/lib/data";
import { shortDate } from "@/lib/format";

export function MeetingList({ meetings }: { meetings: MeetingListing[] }) {
  return (
    <ul className="list">
      {meetings.map((m) => {
        const n = m.event_items.length;
        return (
          <li key={m.id}>
            <Link className="list-row dated" href={`/meetings/${m.id}`}>
              <span className="date-col">{shortDate(m.date)}</span>
              <span>
                <strong>{m.bodies.name}</strong>
                <span className="meta block">
                  {[m.time_text, n ? `${n} agenda item${n === 1 ? "" : "s"}` : "Agenda not posted yet"]
                    .filter(Boolean).join(" · ")}
                </span>
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
