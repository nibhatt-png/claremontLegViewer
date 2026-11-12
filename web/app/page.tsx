import Link from "next/link";
import { AlertsSignup } from "@/components/AlertsSignup";
import { MeetingList } from "@/components/MeetingList";
import { SearchForm } from "@/components/SearchForm";
import { TopicTiles, topicCounts } from "@/components/TopicTiles";
import { alertsConfigured } from "@/lib/alerts";
import { getItemsBetween, getRecentMeetings, getThisWeek, type Meeting } from "@/lib/data";
import { addDays, dateParts, fullDate, locationLines, todayInClaremont } from "@/lib/format";
import { topicBySlug, topicForBody } from "@/lib/topics";

export const revalidate = 600; // seconds

const REPORT_EMAIL = process.env.NEXT_PUBLIC_REPORT_EMAIL;
const JUMP = ["housing", "parks", "budget", "utilities"].map((s) => topicBySlug(s)!);

function topicStyle(bodyName: string) {
  const t = topicForBody(bodyName);
  return { topic: t, style: (t ? { "--topic": t.color } : {}) as React.CSSProperties };
}

export default async function ThisWeek() {
  const today = todayInClaremont();
  const [{ meetings, fallback }, recent, pastYear] = await Promise.all([
    getThisWeek(), getRecentMeetings(5), getItemsBetween(addDays(today, -365)),
  ]);
  const byDate = new Map<string, Meeting[]>();
  for (const m of meetings) byDate.set(m.date, [...(byDate.get(m.date) ?? []), m]);
  const next = meetings[0];

  return (
    <>
      <div className="wrap">
        <section className="home-hero" aria-labelledby="hero-title">
          <div className="home-hero-main">
            <p className="eyebrow">Week of {fullDate(today)}</p>
            <h1 id="hero-title">What&apos;s happening at City Hall this week</h1>
            <SearchForm id="hero-q" />
            <div className="jump">
              <span>Jump to</span>
              {JUMP.map((t) => (
                <Link key={t.slug} href={`/topics/${t.slug}`}>
                  <span className="swatch" style={{ background: t.color }} />{t.name}
                </Link>
              ))}
            </div>
            <Link className="guide-link" href="/guide">First time here? Read the 2-minute guide →</Link>
          </div>

          {next && <NextMeeting meeting={next} today={today} />}
        </section>

        <section className="section" id="meetings" aria-labelledby="week">
          <div className="section-head">
            <h2 id="week">{fallback ? "Coming up next" : "This week's meetings"}</h2>
            {!fallback && meetings.length > 0 && (
              <span className="meta">{meetings.length} meeting{meetings.length === 1 ? "" : "s"}</span>
            )}
          </div>

          {fallback && (
            <div className="empty-state" style={{ marginBottom: 24 }}>
              <strong>No city meetings are scheduled in the next 7 days.</strong>
              <span className="meta">
                {meetings.length > 0
                  ? "Here is the next meeting on the calendar."
                  : "Agendas are usually posted the Thursday before a meeting. Check back soon."}
              </span>
            </div>
          )}

          {[...byDate].map(([date, dayMeetings]) => {
            const p = dateParts(date);
            return (
              <div className="day-row" key={date}>
                <div className="date-block">
                  <span className="dow">{p.dow}</span>
                  <span className="dnum">{p.day}</span>
                  <span className="mon">{p.month}</span>
                </div>
                <div className="day-cards">
                  {dayMeetings.map((m) => <MeetingSummaryCard key={m.id} meeting={m} isToday={date === today} />)}
                </div>
              </div>
            );
          })}

          {meetings.length > 0 && (
            <p className="ai-note">
              Summaries are written by AI and can be wrong. The official documents are the record.{" "}
              {REPORT_EMAIL && <a href={`mailto:${REPORT_EMAIL}?subject=${encodeURIComponent("Error in a summary")}`}>Report an error</a>}
            </p>
          )}
        </section>

        <section className="section" id="topics" aria-labelledby="browse">
          <div className="section-head">
            <h2 id="browse">Browse by topic</h2>
            <span className="meta">Agenda items from the past year</span>
          </div>
          <TopicTiles counts={topicCounts(pastYear)} />
        </section>

        {recent.length > 0 && (
          <section className="section" aria-labelledby="recent">
            <div className="section-head">
              <h2 id="recent">Recent meetings</h2>
              <span className="meta">What was on the agenda</span>
            </div>
            <MeetingList meetings={recent} />
          </section>
        )}
      </div>

      <section className="alerts-band" id="alerts" aria-labelledby="alerts-title">
        <div className="wrap">
          <div style={{ flex: "1 1 360px" }}>
            <h2 id="alerts-title">Know before they vote</h2>
            <p>A weekly email every Friday with next week&apos;s meetings. <Link href="/alerts" style={{ color: "#FFFFFF" }}>Or follow topics</Link>.</p>
          </div>
          {alertsConfigured() ? (
            <AlertsSignup id="band-email" dark />
          ) : (
            <Link className="button dark" href="/alerts">Get alerts</Link>
          )}
        </div>
      </section>
    </>
  );
}

function NextMeeting({ meeting: m, today }: { meeting: Meeting; today: string }) {
  const { topic } = topicStyle(m.bodies.name);
  const isToday = m.date === today;
  const p = dateParts(m.date);
  return (
    <aside className="today-card" aria-label={isToday ? "Today at City Hall" : "Next meeting"}>
      <div className="top">
        <span className="when">{isToday ? "TODAY" : "NEXT UP"}</span>
        <span className="date">{p.dow}, {p.mon} {p.day}</span>
      </div>
      <div>
        {topic && <div className="kind" style={{ color: topic.soft }}>{topic.name}</div>}
        <h2>{m.bodies.name}</h2>
      </div>
      <dl>
        {m.time_text && <><dt>Time</dt><dd>{m.time_text}</dd></>}
        {m.location && <><dt>Where</dt><dd>{locationLines(m.location).join(", ")}</dd></>}
      </dl>
      <div className="actions">
        <Link className="button light" href={`/meetings/${m.id}`}>See the agenda</Link>
        <Link className="button ghost" href="/have-your-say">How to comment</Link>
      </div>
    </aside>
  );
}

function MeetingSummaryCard({ meeting: m, isToday }: { meeting: Meeting; isToday: boolean }) {
  const { topic, style } = topicStyle(m.bodies.name);
  const n = m.event_items.length;
  const kind = [topic?.name, n ? `${n} agenda item${n === 1 ? "" : "s"}` : "Agenda not posted yet"].filter(Boolean).join(" · ");
  return (
    <article className="mcard" style={style} aria-labelledby={`m-${m.id}`}>
      <div className="mcard-head">
        <div>
          <div className="kind">{kind}{isToday && <> · <span className="today-tag">TODAY</span></>}</div>
          <h3 id={`m-${m.id}`}><Link href={`/meetings/${m.id}`}>{m.bodies.name}</Link></h3>
          <div className="where">{[m.time_text, locationLines(m.location).join(", ")].filter(Boolean).join(" · ")}</div>
        </div>
        {n > 0 && <Link className="button" href={`/meetings/${m.id}`}>Read the summaries →</Link>}
      </div>
      <div className="mcard-links">
        {m.agenda_pdf_url && <a href={m.agenda_pdf_url} target="_blank" rel="noopener">Official agenda</a>}
        <Link href="/have-your-say">Send a comment</Link>
        <a href={`/meetings/${m.id}/calendar`}>Add to calendar</a>
      </div>
    </article>
  );
}
