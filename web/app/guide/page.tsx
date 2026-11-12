import type { Metadata } from "next";
import Link from "next/link";
import { AlertsSignup } from "@/components/AlertsSignup";
import { Icon } from "@/components/Icon";
import { alertsConfigured } from "@/lib/alerts";

export const metadata: Metadata = {
  title: "How to use this site",
  description: "A two-minute guide to finding meetings, searching, browsing topics, reading summaries and speaking up.",
};

const STEPS = [
  { n: 1, color: "#C2410C", label: "Find a meeting" },
  { n: 2, color: "#0369A1", label: "Search" },
  { n: 3, color: "#7E22CE", label: "Browse topics" },
  { n: 4, color: "#15803D", label: "Read a summary" },
  { n: 5, color: "#B91C1C", label: "Speak up" },
  { n: 6, color: "#A16207", label: "Get alerts" },
];

function StepText({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div className="gstep-text">
      <span className="gstep-num" style={{ color: STEPS[n - 1].color }} aria-hidden="true">{n}</span>
      <div><h2>{title}</h2>{children}</div>
    </div>
  );
}

export default function Guide() {
  return (
    <div className="wrap">
      <section className="page-hero" style={{ paddingBottom: 24 }}>
        <p className="eyebrow">Guide · 2-minute read</p>
        <h1>How to use this site</h1>
        <nav className="step-nav" aria-label="Steps">
          {STEPS.map((s) => (
            <a key={s.n} className="button secondary" href={`#s${s.n}`}>
              <b style={{ color: s.color }}>{s.n}</b> {s.label}
            </a>
          ))}
        </nav>
      </section>

      <section style={{ paddingBlock: "24px 40px" }}>
        <div id="s1" className="gstep">
          <StepText n={1} title="Find this week's meetings">
            <p>The home page lists every City meeting this week, by day. Today&apos;s is marked in yellow.</p>
            <Link href="/">Go to This week →</Link>
          </StepText>
          <div className="demo" aria-hidden="true" style={{ display: "flex", gap: 16, alignItems: "center" }}>
            <div className="date-block" style={{ flex: "0 0 auto" }}>
              <span className="dow">Thu</span><span className="dnum" style={{ fontSize: 40 }}>12</span>
            </div>
            <div className="mcard" style={{ flex: 1, padding: "14px 16px", gap: 4, borderTopWidth: 5, "--topic": "#B91C1C" } as React.CSSProperties}>
              <div className="kind" style={{ fontSize: 11 }}>Public safety · <span className="today-tag">TODAY</span></div>
              <div style={{ font: "700 20px var(--display)" }}>Police Commission</div>
              <div className="meta">7:00 PM · City Council Chambers</div>
            </div>
          </div>
        </div>

        <div id="s2" className="gstep">
          <StepText n={2} title="Search by topic or date">
            <p>Type a topic, street or business. Or pick a date to see what was on the agenda that day. Use both to narrow it down.</p>
          </StepText>
          <div className="demo" aria-hidden="true">
            <div className="searchbar" style={{ maxWidth: "none" }}>
              <div className="field q" style={{ minHeight: 48 }}><Icon name="search" size={16} />parks</div>
              <div className="field d" style={{ minHeight: 48 }}><Icon name="calendar" size={16} />Any date</div>
              <span style={{ background: "var(--accent)", color: "#fff", padding: "14px 18px", fontWeight: 700 }}>Search</span>
            </div>
            <div className="try"><span>Try:</span><span>Foothill Blvd</span><span>trash rates</span><span>Mills Act</span></div>
          </div>
        </div>

        <div id="s3" className="gstep">
          <StepText n={3} title="Browse by topic">
            <p>Every item is sorted into color-coded topics. The color follows it around the site, so you can spot what you care about at a glance.</p>
            <Link href="/topics">See all topics →</Link>
          </StepText>
          <div className="demo demo-grid" aria-hidden="true">
            {[["Housing", "#C2410C"], ["Parks", "#047857"], ["Budget", "#15803D"], ["Water", "#0369A1"], ["Safety", "#B91C1C"], ["Planning", "#7E22CE"]].map(([name, c]) => (
              <div key={name} className="demo-tile" style={{ background: c }}>{name}</div>
            ))}
          </div>
        </div>

        <div id="s4" className="gstep">
          <StepText n={4} title="Read a summary">
            <p>Each agenda item answers four questions. Want the full detail? Every summary links to the City&apos;s original documents.</p>
            <Link href="/how-it-works">How summaries are made →</Link>
          </StepText>
          <div className="demo demo-grid two" aria-hidden="true">
            <div className="qa" style={{ background: "#F3E8FF" }}><b style={{ color: "#6B21A8" }}>WHAT</b><span>is being decided</span></div>
            <div className="qa" style={{ background: "#DCFCE7" }}><b style={{ color: "#166534" }}>COST</b><span>what it costs</span></div>
            <div className="qa" style={{ background: "#E0F2FE" }}><b style={{ color: "#075985" }}>WHO</b><span>is affected</span></div>
            <div className="qa" style={{ background: "#FFEDD5" }}><b style={{ color: "#9A3412" }}>NEXT</b><span>what happens after</span></div>
            <p className="meta" style={{ gridColumn: "1 / -1", borderTop: "1px solid var(--line-soft)", paddingTop: 10 }}>
              Only a title showing? That summary is waiting for a person to check it.
            </p>
          </div>
        </div>

        <div id="s5" className="gstep">
          <StepText n={5} title="Speak up">
            <p>Care about an item? Speak at the meeting, write to the City Clerk before it, or contact your representatives any time.</p>
            <Link href="/have-your-say">Ways to take part →</Link>
          </StepText>
          <div className="demo" aria-hidden="true" style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {[["mic", "Speak", "#C2410C"], ["mail", "Write in", "#6D28D9"], ["people", "Contact reps", "#0F766E"]].map(([icon, label, c]) => (
              <div key={label} style={{ flex: "1 1 120px", background: c, color: "#fff", borderRadius: 6, padding: 16 }}>
                <Icon name={icon} size={22} /><div style={{ fontWeight: 700, marginTop: 10 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        <div id="s6" className="gstep">
          <StepText n={6} title="Get alerts">
            <p>Leave your email and we&apos;ll send next week&apos;s meetings every Friday, after agendas are posted. You can also follow topics.</p>
            <Link href="/alerts">All alert options →</Link>
          </StepText>
          <div className="demo">
            {alertsConfigured() ? <AlertsSignup id="guide-email" /> : <Link className="button" href="/alerts">Get alerts</Link>}
          </div>
        </div>
      </section>

      <section style={{ paddingBottom: 64 }}>
        <div className="cta">
          <div className="cta-title">Ready? See what&apos;s on this week.</div>
          <Link className="button yellow" href="/">Go to This week →</Link>
        </div>
      </section>
    </div>
  );
}
