import Link from "next/link";
import type { Meeting } from "@/lib/data";
import { locationLines, readableTitle, sectionLabel } from "@/lib/format";

export function MeetingCard({
  meeting,
  showTitles = false,
  headingLevel = 3,
}: {
  meeting: Meeting;
  showTitles?: boolean;
  headingLevel?: 2 | 3 | 4;
}) {
  const Heading = `h${headingLevel}` as const;
  const SectionHeading = `h${headingLevel + 1}` as "h3" | "h4" | "h5";
  const [place, street] = locationLines(meeting.location);
  const groups: { label: string; items: Meeting["event_items"] }[] = [];
  for (const item of meeting.event_items) {
    const label = sectionLabel(item.section);
    const last = groups[groups.length - 1];
    if (last?.label === label) last.items.push(item);
    else groups.push({ label, items: [item] });
  }

  return (
    <article className="meeting" aria-labelledby={`m-${meeting.id}`}>
      <div className="meeting-head">
        <Heading id={`m-${meeting.id}`}>
          <Link href={`/meetings/${meeting.id}`}>{meeting.bodies.name}</Link>
        </Heading>
        <p className="meta">
          {[meeting.time_text, place, street].filter(Boolean).join(" · ")}
        </p>
      </div>

      {groups.length === 0 ? (
        <p className="empty">The agenda hasn&apos;t been posted yet. Agendas usually appear the Thursday before the meeting.</p>
      ) : (
        groups.map((g) => (
          <section key={g.label} aria-label={g.label}>
            <SectionHeading className="section-label">{g.label}</SectionHeading>
            <ol className="items">
              {g.items.map((item) => (
                <li key={item.id}>
                  <Link className="row" href={`/items/${item.id}`}>
                    <span className="num">{item.agenda_number}</span>
                    <span className="row-text">
                      <span>{item.summaries?.one_line ?? readableTitle(item.title)}</span>
                      {showTitles && item.summaries && <span className="official">{item.title}</span>}
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          </section>
        ))
      )}

      {meeting.legistar_url && (
        <p className="howto">
          <strong>How to comment:</strong> speak in person or on Zoom when the item comes up, or send written
          comments to the City Clerk before the meeting. Details are on the{" "}
          <a href={meeting.legistar_url} target="_blank" rel="noopener">official meeting page</a>.
        </p>
      )}
    </article>
  );
}
