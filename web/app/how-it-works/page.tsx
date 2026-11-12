import type { Metadata } from "next";
import Link from "next/link";
import { Fragment } from "react";
import { Icon } from "@/components/Icon";

export const metadata: Metadata = {
  title: "How it works",
  description: "Where Claremont Explained gets its information, and how the plain-English summaries are written and checked.",
};

const REPORT_EMAIL = process.env.NEXT_PUBLIC_REPORT_EMAIL;
const LEGISTAR = "https://claremontca.legistar.com/Calendar.aspx";

const FLOW = [
  { icon: "inbox", bg: "#E0F2FE", solid: "#0369A1", num: "#7DD3FC", title: "#0C4A6E", text: "#164E63", h: "We collect",
    p: <>Every night, and more often when agendas post, we copy agendas, staff reports and attachments from the City&apos;s <a href={LEGISTAR} target="_blank" rel="noopener" style={{ color: "inherit" }}>Legistar</a> system.</> },
  { icon: "lines", bg: "#EDE9FE", solid: "#6D28D9", num: "#C4B5FD", title: "#3B0764", text: "#4C1D95", h: "AI summarizes",
    p: <>An AI model reads each item and writes a short summary. Routine items like minutes get a standard note.</> },
  { icon: "shieldCheck", bg: "#DCFCE7", solid: "#15803D", num: "#86EFAC", title: "#14532D", text: "#166534", h: "We fact-check",
    p: <>Every dollar amount and date must match the originals. If not, a person reviews it before it&apos;s shown.</> },
  { icon: "external", bg: "#FFEDD5", solid: "#C2410C", num: "#FDBA74", title: "#7C2D12", text: "#9A3412", h: "You check the source",
    p: <>Every item links to the original staff report, attachments and agenda.</> },
];

const KEYS = [["A", "#6D28D9", "What's being decided"], ["B", "#15803D", "What it costs"], ["C", "#0369A1", "Who's affected"], ["D", "#C2410C", "What happens next"]];

const TIMELINE = [
  ["#0369A1", "#0369A1", "Usually Thursday", "City posts the agenda"],
  ["#6D28D9", "#6D28D9", "Soon after", "Summaries appear here"],
  ["#CA8A04", "#854D0E", "Before the deadline", "Send a written comment"],
  ["#C2410C", "#C2410C", "Meeting day", "Speak in person or on Zoom"],
  ["#15803D", "#15803D", "Then", "Council or commission decides"],
];

export default function HowItWorks() {
  return (
    <>
      <div className="wrap">
        <section className="page-hero tight">
          <span className="badge note"><Icon name="info" size={16} />Unofficial site · not run by the City of Claremont</span>
          <h1>From City paperwork to <span className="accent">plain English</span> in four steps</h1>
          <p className="lede">We take the City&apos;s official meeting documents and turn each agenda item into a short summary you can actually read.</p>
        </section>

        <section aria-label="The four steps" style={{ paddingBlock: "24px 56px" }}>
          <ol className="flow">
            {FLOW.map((s, i) => (
              <Fragment key={s.h}>
                {i > 0 && <li className="flow-arrow" aria-hidden="true"><Icon name="arrow" size={24} /></li>}
                <li className="flow-step" style={{ background: s.bg }}>
                  <div className="top">
                    <span className="flow-icon" style={{ background: s.solid }}><Icon name={s.icon} size={28} /></span>
                    <span className="flow-num" style={{ color: s.num }} aria-hidden="true">{i + 1}</span>
                  </div>
                  <h2 style={{ color: s.title }}>{s.h}</h2>
                  <p style={{ color: s.text }}>{s.p}</p>
                </li>
              </Fragment>
            ))}
          </ol>
        </section>
      </div>

      <section className="white-band" aria-labelledby="anatomy">
        <div className="wrap">
          <div className="anatomy-text">
            <h2 id="anatomy">What every summary tells you</h2>
            <p className="lede" style={{ fontSize: "1.05rem" }}>Each agenda item answers the same four questions, so you can skim fast.</p>
            <div className="anatomy-keys">
              {KEYS.map(([l, c, t]) => <div key={l}><span className="letter" style={{ background: c }}>{l}</span>{t}</div>)}
            </div>
          </div>
          <figure className="example" aria-label="Example of an agenda item summary">
            <div className="example-card">
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "space-between" }}>
                <span className="topic-chip" style={{ background: "#D1FAE5", color: "#065F46" }}>Parks and trees</span>
                <span className="topic-chip" style={{ background: "#F3E8FF", color: "#6B21A8" }}>Example</span>
              </div>
              <div style={{ font: "700 22px var(--display)" }}>Replace the playground at a city park</div>
              <div className="example-row"><span className="letter" style={{ background: "#6D28D9" }}>A</span><p>The Council will vote on a contract to remove and replace worn-out play equipment.</p></div>
              <div className="example-row" style={{ alignItems: "center" }}><span className="letter" style={{ background: "#15803D" }}>B</span>
                <span style={{ background: "#DCFCE7", color: "#166534", fontWeight: 800, borderRadius: 10, padding: "6px 12px" }}>The cost from the staff report</span></div>
              <div className="example-row"><span className="letter" style={{ background: "#0369A1" }}>C</span><p>Families who use the park.</p></div>
              <div className="example-row"><span className="letter" style={{ background: "#C2410C" }}>D</span><p>A vote at the next Council meeting.</p></div>
              <div style={{ borderTop: "1px solid var(--line-soft)", paddingTop: 14, display: "flex", gap: 16, flexWrap: "wrap", fontSize: 14, fontWeight: 600, color: "var(--accent)" }}>
                <span style={{ display: "inline-flex", gap: 6, alignItems: "center" }}><Icon name="external" size={16} />Staff report</span>
                <span style={{ display: "inline-flex", gap: 6, alignItems: "center" }}><Icon name="external" size={16} />Attachments</span>
              </div>
            </div>
          </figure>
        </div>
      </section>

      <div className="wrap">
        <section aria-labelledby="timeline" style={{ paddingBlock: 56 }}>
          <h2 id="timeline">The life of a meeting</h2>
          <p className="lede" style={{ margin: "8px 0 32px", fontSize: "1.05rem" }}>When things show up here, and when you can weigh in.</p>
          <ol className="timeline">
            {TIMELINE.map(([bar, fg, when, what]) => (
              <li key={what}>
                <div className="bar" style={{ background: bar }} />
                <span className="when" style={{ color: fg }}>{when}</span>
                <span className="what">{what}</span>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="gtk" style={{ paddingBlock: "8px 56px" }}>
          <h2 id="gtk" style={{ marginBottom: 20 }}>Good to know</h2>
          <div className="cards3">
            <div className="icard"><span className="icon-box" style={{ background: "#F3E8FF", color: "#7E22CE" }}><Icon name="lines" size={22} /></span>
              <div><strong>AI can get it wrong</strong><p>Summaries can be wrong or leave things out. The official documents are the record.</p></div></div>
            <div className="icard"><span className="icon-box" style={{ background: "#DCFCE7", color: "#15803D" }}><Icon name="table" size={22} /></span>
              <div><strong>Tables can get lost</strong><p>Charts in staff reports don&apos;t always come through, so costs may be incomplete.</p></div></div>
            <div className="icard"><span className="icon-box" style={{ background: "#FEF9C3", color: "#A16207" }}><Icon name="clock" size={22} /></span>
              <div><strong>Title only? It&apos;s in review</strong><p>A summary that failed the fact-check waits for a person.</p></div></div>
            <div className="icard"><span className="icon-box" style={{ background: "#E0F2FE", color: "#0369A1" }}><Icon name="calendar" size={22} /></span>
              <div><strong>Agendas can change</strong><p>Up to the day of the meeting. Updates show up here within a day.</p></div></div>
            <div className="icard"><span className="icon-box" style={{ background: "#FFEDD5", color: "#C2410C" }}><Icon name="info" size={22} /></span>
              <div><strong>On the agenda, not decided</strong><p>This site shows what&apos;s coming up. Check the minutes for what was decided.</p></div></div>
          </div>
        </section>

        <section style={{ paddingBottom: 56 }}>
          <div className="cta">
            <div>
              <div className="cta-title">Spotted a mistake?</div>
              <div className="cta-sub">Tell us and we&apos;ll fix it.</div>
            </div>
            <div className="actions">
              {REPORT_EMAIL && <a className="button yellow" href={`mailto:${REPORT_EMAIL}?subject=${encodeURIComponent("Error in a summary")}`}>Report an error</a>}
              <Link className="button ghost" href="/">See this week</Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
