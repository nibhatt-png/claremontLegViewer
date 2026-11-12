import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/Icon";
import { ItemList } from "@/components/ItemList";
import { getItemsBetween, getUpcomingMeetings } from "@/lib/data";
import { dateParts, todayInClaremont } from "@/lib/format";
import { topicForBody } from "@/lib/topics";

export const revalidate = 600;
export const metadata: Metadata = {
  title: "Have your say",
  description: "How to speak at a Claremont City Council or commission meeting, send written comments, and what's coming up.",
};

const LEGISTAR = "https://claremontca.legistar.com/Calendar.aspx";

const WAYS = [
  { h: "Speak up", when: "At the meeting", icon: "mic", bg: "#C2410C", tag: "#9A3412", text: "#FFEDD5", tick: "#FDBA74",
    points: ["In person, or on Zoom if offered", "On an item, or any other topic", "Usually a few minutes each"] },
  { h: "Write in", when: "Before the meeting", icon: "mail", bg: "#6D28D9", tag: "#4C1D95", text: "#EDE9FE", tick: "#C4B5FD",
    points: ["Email or mail the City Clerk", "Address and deadline are on the agenda", "Becomes part of the public record"] },
  { h: "Contact your reps", when: "Any time", icon: "people", bg: "#0F766E", tag: "#115E59", text: "#CCFBF1", tick: "#5EEAD4",
    points: ["Council members or commissioners", "Not just before a meeting", "Contact details on the City's website"] },
];

const TIPS = [["#C2410C", "Name the agenda item you're talking about"], ["#6D28D9", "Say what you'd like them to decide"], ["#0F766E", "Share how it affects you or your street"]];

export default async function HaveYourSay() {
  const today = todayInClaremont();
  const [meetings, items] = await Promise.all([getUpcomingMeetings(45), getItemsBetween(today)]);
  const hearings = items
    .filter((i) => i.summaries?.next_step === "public_hearing" || /HEARING/i.test(i.section ?? ""))
    .reverse(); // soonest first

  return (
    <div className="wrap">
      <section className="page-hero tight">
        <span className="badge success"><span className="dot" />All meetings are open to the public</span>
        <h1>Your voice counts at <span className="accent">City Hall</span></h1>
        <p className="lede">Anyone can comment. Pick the way that works for you.</p>
      </section>

      <section aria-label="Three ways to take part" style={{ paddingBlock: "24px 16px" }}>
        <div className="ways">
          {WAYS.map((w) => (
            <article key={w.h} className="way" style={{ background: w.bg }}>
              <div className="top">
                <span className="icon-box" style={{ color: w.bg }}><Icon name={w.icon} size={30} /></span>
                <span className="when" style={{ background: w.tag }}>{w.when}</span>
              </div>
              <h2>{w.h}</h2>
              <ul style={{ color: w.text }}>
                {w.points.map((p) => <li key={p}><Icon name="check" size={18} style={{ color: w.tick }} />{p}</li>)}
              </ul>
            </article>
          ))}
        </div>
        <div className="notice">
          <Icon name="info" />
          <span>Rules differ by meeting. Check the official agenda on <a href={LEGISTAR} target="_blank" rel="noopener">Legistar</a> for times, Zoom links and deadlines.</span>
        </div>
      </section>

      <section aria-labelledby="tips" style={{ paddingBlock: "40px 24px" }}>
        <h2 id="tips" style={{ marginBottom: 20 }}>Tips for a comment that lands</h2>
        <ol className="cards3" style={{ listStyle: "none", margin: 0, padding: 0 }}>
          {TIPS.map(([c, t], i) => <li key={t} className="tip"><b style={{ color: c }}>{i + 1}</b>{t}</li>)}
        </ol>
      </section>

      <section className="split" style={{ paddingBlock: "32px 64px" }}>
        <div>
          <h2 id="hearings">Public hearings</h2>
          <p className="meta">Where the City must ask for comment before deciding.</p>
          {hearings.length > 0 ? (
            <ItemList items={hearings} />
          ) : (
            <div className="empty-state center">
              <span className="icon-circle" style={{ background: "#EDE9FE", color: "#6D28D9" }}><Icon name="calendar" size={30} /></span>
              <strong style={{ fontSize: 18 }}>None posted yet</strong>
              <span className="meta">Agendas usually appear the Thursday before a meeting.</span>
              <Link className="button" href="/alerts" style={{ background: "#6D28D9" }}><Icon name="bell" size={18} />Tell me when one is posted</Link>
            </div>
          )}
        </div>

        <div>
          <h2 id="upcoming">Upcoming meetings</h2>
          <p className="meta">Your next chance to speak.</p>
          {meetings.length > 0 ? (
            <ul className="mrows">
              {meetings.map((m) => {
                const p = dateParts(m.date);
                const t = topicForBody(m.bodies.name);
                return (
                  <li key={m.id}>
                    <Link className="mrow" href={`/meetings/${m.id}`}>
                      <span className="mrow-date"><span>{p.mon.toUpperCase()}</span><span>{p.day}</span></span>
                      <span className="mrow-text">
                        <strong>{m.bodies.name}</strong>
                        <span className="mrow-tags">
                          {t && <span className="topic-chip" style={{ background: t.soft, color: t.color }}>{t.name}</span>}
                          <span className="plain-chip">{m.date === today ? "Today" : p.dow}{m.time_text && ` · ${m.time_text}`}</span>
                        </span>
                      </span>
                      <Icon name="arrow" size={22} />
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="empty-state">
              No meetings are on the calendar for the next six weeks yet. See the full calendar on{" "}
              <a href={LEGISTAR} target="_blank" rel="noopener">Legistar</a>.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
