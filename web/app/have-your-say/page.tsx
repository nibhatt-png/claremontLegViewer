import type { Metadata } from "next";
import { ItemList } from "@/components/ItemList";
import { MeetingList } from "@/components/MeetingList";
import { getItemsBetween, getUpcomingMeetings } from "@/lib/data";
import { todayInClaremont } from "@/lib/format";

export const revalidate = 600;
export const metadata: Metadata = {
  title: "Have your say",
  description: "How to speak at a Claremont City Council or commission meeting, send written comments, and what's coming up.",
};

const LEGISTAR = "https://claremontca.legistar.com/Calendar.aspx";

export default async function HaveYourSay() {
  const today = todayInClaremont();
  const [meetings, items] = await Promise.all([getUpcomingMeetings(45), getItemsBetween(today)]);
  const hearings = items
    .filter((i) => i.summaries?.next_step === "public_hearing" || /HEARING/i.test(i.section ?? ""))
    .reverse(); // soonest first

  return (
    <div className="wrap page">
      <div>
        <h1>Have your say</h1>
        <p className="lede">
          City Council and commission meetings are open to the public, and anyone can comment. Here&apos;s how, and
          what&apos;s coming up.
        </p>
      </div>

      <section className="stack" aria-labelledby="ways">
        <h2 id="ways">Three ways to take part</h2>
        <ul className="ways">
          <li>
            <h3>Speak at the meeting</h3>
            <p>
              Come in person, or join on Zoom if the agenda offers it. You can speak when an item comes up, or during
              general public comment on anything not on the agenda. Speakers usually get a few minutes each.
            </p>
          </li>
          <li>
            <h3>Send a written comment</h3>
            <p>
              Email or mail comments to the City Clerk before the meeting. Each agenda lists the address and the
              deadline. Written comments become part of the public record.
            </p>
          </li>
          <li>
            <h3>Contact your representatives</h3>
            <p>
              You can write to City Council members or commissioners at any time, not just before a meeting. Contact
              details are on the City&apos;s website.
            </p>
          </li>
        </ul>
        <p className="meta">
          Exact rules differ by meeting. Always check the official agenda on{" "}
          <a href={LEGISTAR} target="_blank" rel="noopener">Legistar</a> for times, locations, Zoom links and comment deadlines.
        </p>
      </section>

      <section className="stack" aria-labelledby="hearings">
        <h2 id="hearings">Upcoming public hearings</h2>
        <p className="meta">Public hearings are where the City must invite comment before it decides.</p>
        {hearings.length > 0 ? (
          <ItemList items={hearings} />
        ) : (
          <p className="empty-state">No public hearings have been posted yet. Agendas usually appear the Thursday before a meeting.</p>
        )}
      </section>

      <section className="stack" aria-labelledby="upcoming">
        <h2 id="upcoming">Upcoming meetings</h2>
        {meetings.length > 0 ? (
          <MeetingList meetings={meetings} />
        ) : (
          <p className="empty-state">
            No meetings are on the calendar for the next six weeks yet. See the full calendar on{" "}
            <a href={LEGISTAR} target="_blank" rel="noopener">Legistar</a>.
          </p>
        )}
      </section>
    </div>
  );
}
