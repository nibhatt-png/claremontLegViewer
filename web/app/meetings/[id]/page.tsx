import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AiLabel } from "@/components/AiLabel";
import { MeetingCard } from "@/components/MeetingCard";
import { getMeeting } from "@/lib/data";
import { locationLines, longDate } from "@/lib/format";
import { topicForBody } from "@/lib/topics";

export const revalidate = 600;

type Props = { params: Promise<{ id: string }> };

async function load(params: Props["params"]) {
  const id = Number((await params).id);
  return Number.isInteger(id) ? getMeeting(id) : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const m = await load(params);
  return { title: m ? `${m.bodies.name}, ${longDate(m.date, true)}` : "Meeting not found" };
}

export default async function MeetingPage({ params }: Props) {
  const meeting = await load(params);
  if (!meeting) notFound();
  const topic = topicForBody(meeting.bodies.name);

  return (
    <div className="wrap page">
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link href="/">This week</Link> <span aria-hidden="true">›</span> <span>{meeting.bodies.name}</span>
      </nav>
      <div>
        <p className="eyebrow" style={topic ? { color: topic.color } : undefined}>{longDate(meeting.date, true)}</p>
        <h1 style={{ marginTop: 16 }}>{meeting.bodies.name}</h1>
        <p className="lede" style={{ marginTop: 12 }}>{[meeting.time_text, ...locationLines(meeting.location)].filter(Boolean).join(" · ")}</p>
      </div>
      <ul className="docs">
        {meeting.agenda_pdf_url && (
          <li><a href={meeting.agenda_pdf_url} target="_blank" rel="noopener">Agenda (PDF)</a></li>
        )}
        {meeting.legistar_url && (
          <li><a href={meeting.legistar_url} target="_blank" rel="noopener">Official meeting page on Legistar</a></li>
        )}
        <li><a href={`/meetings/${meeting.id}/calendar`}>Add to calendar</a></li>
      </ul>
      {meeting.event_items.length > 0 && <AiLabel plural />}
      <div style={topic ? ({ "--topic": topic.color } as React.CSSProperties) : undefined}>
        <MeetingCard meeting={meeting} showTitles headingLevel={2} />
      </div>
    </div>
  );
}
