import Link from "next/link";
import { AiLabel } from "@/components/AiLabel";
import { MeetingCard } from "@/components/MeetingCard";
import { MeetingList } from "@/components/MeetingList";
import { SearchForm } from "@/components/SearchForm";
import { getRecentMeetings, getThisWeek, type Meeting } from "@/lib/data";
import { fullDate, longDate, todayInClaremont } from "@/lib/format";
import { TOPICS } from "@/lib/topics";

export const revalidate = 600; // seconds

export default async function ThisWeek() {
  const [{ meetings, fallback }, recent] = await Promise.all([getThisWeek(), getRecentMeetings(6)]);
  const today = todayInClaremont();
  const byDate = new Map<string, Meeting[]>();
  for (const m of meetings) byDate.set(m.date, [...(byDate.get(m.date) ?? []), m]);
  const days = [...byDate];

  return (
    <>
      <section className="hero" aria-labelledby="hero-title">
        <div className="wrap">
          <p className="eyebrow">Week of {fullDate(today)}</p>
          <h1 id="hero-title">What&apos;s happening at City Hall this week</h1>
          <p className="lede">
            Claremont&apos;s city meetings, explained in plain English. See what&apos;s being decided, what it costs,
            and how to have your say.
          </p>
          <SearchForm id="hero-q" large />
        </div>
      </section>

      <div className="wrap">
        <section className="section" aria-labelledby="week">
          <div className="section-head">
            <h2 id="week">{fallback ? "Coming up next" : "This week's meetings"}</h2>
            {!fallback && meetings.length > 0 && (
              <span className="meta">{meetings.length} meeting{meetings.length === 1 ? "" : "s"}</span>
            )}
          </div>

          {fallback && (
            <div className="empty-state">
              <strong>No city meetings are scheduled in the next 7 days.</strong>
              <span className="meta">
                {meetings.length > 0
                  ? "Here is the next meeting on the calendar."
                  : "Agendas are usually posted the Thursday before a meeting. Check back soon, or look at recent meetings below."}
              </span>
            </div>
          )}

          {meetings.length > 0 && <AiLabel plural />}

          {days.map(([date, dayMeetings]) => (
            <section className="day" key={date} aria-labelledby={`d-${date}`}>
              <h3 id={`d-${date}`}>
                {longDate(date, fallback)}
                {date === today && <span className="today">Today</span>}
              </h3>
              {dayMeetings.map((m) => <MeetingCard key={m.id} meeting={m} headingLevel={4} />)}
            </section>
          ))}
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

        <section className="section" aria-labelledby="browse">
          <div className="section-head">
            <h2 id="browse">Browse by topic</h2>
            <Link href="/topics">All topics</Link>
          </div>
          <ul className="pills">
            {TOPICS.map((t) => (
              <li key={t.slug}><Link href={`/topics/${t.slug}`}>{t.name}</Link></li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
