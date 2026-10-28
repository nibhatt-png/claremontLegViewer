import { AiLabel } from "@/components/AiLabel";
import { MeetingCard } from "@/components/MeetingCard";
import { getThisWeek, type Meeting } from "@/lib/data";
import { longDate, todayInClaremont } from "@/lib/format";

export const revalidate = 600; // seconds

export default async function ThisWeek() {
  const { meetings, fallback } = await getThisWeek();
  const today = todayInClaremont();
  const byDate = new Map<string, Meeting[]>();
  for (const m of meetings) byDate.set(m.date, [...(byDate.get(m.date) ?? []), m]);

  return (
    <>
      <div>
        <h1>What&apos;s happening this week</h1>
        <p className="lede">
          {fallback
            ? "No City meetings are scheduled in the next 7 days. Here is the next one."
            : `Every City of Claremont meeting from ${longDate(today)} through the next 7 days, with each agenda item in one line.`}
        </p>
      </div>
      {meetings.length > 0 && <AiLabel plural />}
      {meetings.length === 0 && <p>No upcoming meetings have been posted yet.</p>}
      {[...byDate].map(([date, dayMeetings]) => (
        <section className="day" key={date} aria-labelledby={`d-${date}`}>
          <h2 id={`d-${date}`}>
            {longDate(date, fallback)}
            {date === today && <span className="today">Today</span>}
          </h2>
          {dayMeetings.map((m) => <MeetingCard key={m.id} meeting={m} />)}
        </section>
      ))}
    </>
  );
}
