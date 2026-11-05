import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "How it works",
  description: "Where Claremont Explained gets its information, and how the plain-English summaries are written and checked.",
};

const REPORT_EMAIL = process.env.NEXT_PUBLIC_REPORT_EMAIL;

export default function HowItWorks() {
  return (
    <div className="wrap page">
      <div>
        <h1>How it works</h1>
        <p className="lede">
          Claremont Explained is an unofficial site that turns the City&apos;s meeting agendas into plain English.
          It is not run by the City of Claremont.
        </p>
      </div>

      <ol className="steps">
        <li>
          <div>
            <h2>We collect the official agendas</h2>
            <p>
              Every night, and more often on Thursdays and Fridays when agendas are posted, we copy City Council and
              commission meetings from the City&apos;s public{" "}
              <a href="https://claremontca.legistar.com/Calendar.aspx" target="_blank" rel="noopener">Legistar</a>{" "}
              system: the agenda, each item&apos;s staff report, and the attached documents.
            </p>
          </div>
        </li>
        <li>
          <div>
            <h2>AI writes a plain-English summary</h2>
            <p>
              For each agenda item, an AI language model reads the staff report and attachments and writes a short
              summary: what&apos;s being decided, what it costs, who&apos;s affected, and what happens next. Routine
              items like minutes get a standard description instead.
            </p>
          </div>
        </li>
        <li>
          <div>
            <h2>Every summary is fact-checked</h2>
            <p>
              Before a summary is shown, every dollar amount and date in it must appear in the original documents. If
              anything doesn&apos;t match, the summary is held back until a person reviews it, and the item shows only
              its official title.
            </p>
          </div>
        </li>
        <li>
          <div>
            <h2>You can always check the source</h2>
            <p>
              Every item page links to the original staff report, attachments and agenda, so you can read exactly
              what the City published.
            </p>
          </div>
        </li>
      </ol>

      <section className="prose" aria-labelledby="limits">
        <h2 id="limits">What to keep in mind</h2>
        <ul>
          <li>Summaries are AI-generated and can be wrong or leave things out. The official documents are the record.</li>
          <li>Tables and charts in staff reports don&apos;t always come through, so cost details may be incomplete.</li>
          <li>Agendas can change up to the day of the meeting. Updates appear here within a day.</li>
          <li>This site shows what&apos;s on the agenda, not what was decided. Check the minutes for outcomes.</li>
        </ul>
        <h2>Found a mistake?</h2>
        <p>
          {REPORT_EMAIL ? (
            <>Use the &ldquo;Report an error&rdquo; link on any summary, or email <a href={`mailto:${REPORT_EMAIL}`}>{REPORT_EMAIL}</a>.</>
          ) : (
            <>Use the &ldquo;Report an error&rdquo; link on any summary.</>
          )}{" "}
          To take part in a decision, see <Link href="/have-your-say">Have your say</Link>.
        </p>
      </section>
    </div>
  );
}
