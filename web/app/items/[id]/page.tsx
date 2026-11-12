import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AiLabel } from "@/components/AiLabel";
import { getItem } from "@/lib/data";
import { NEXT_STEP, longDate, readableTitle, sectionLabel } from "@/lib/format";

export const revalidate = 600;

type Props = { params: Promise<{ id: string }> };

async function load(params: Props["params"]) {
  const id = Number((await params).id);
  return Number.isInteger(id) ? getItem(id) : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const item = await load(params);
  if (!item) return { title: "Item not found" };
  return {
    title: item.summaries?.one_line ?? readableTitle(item.title),
    description: item.summaries?.summary,
  };
}

export default async function ItemPage({ params }: Props) {
  const item = await load(params);
  if (!item) notFound();
  const { summaries: s, events: ev, matters: m } = item;
  const notStated = "Not stated in the staff report";

  return (
    <div className="wrap page">
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link href="/">This week</Link> <span aria-hidden="true">›</span>{" "}
        <Link href={`/meetings/${ev.id}`}>{ev.bodies.name}, {longDate(ev.date)}</Link>{" "}
        <span aria-hidden="true">›</span> <span>Item {item.agenda_number}</span>
      </nav>

      <div>
        <p className="eyebrow plain">
          {[item.agenda_number && `Item ${item.agenda_number}`, sectionLabel(item.section), m.file_number && `File ${m.file_number}`]
            .filter(Boolean).join(" · ")}
        </p>
        <h1 className="item-title">{s?.one_line ?? readableTitle(item.title)}</h1>
        {s && <p className="official">Official title: {item.title}</p>}
      </div>

      {s ? (
        <>
          <AiLabel itemId={item.id} />
          <p className="summary">{s.summary}</p>
          <dl className="facts">
            <div className="fact" style={{ background: "#DCFCE7" }}>
              <dt style={{ color: "#166534" }}>Cost</dt>
              <dd>{s.cost_text ?? notStated}</dd>
            </div>
            <div className="fact" style={{ background: "#E0F2FE" }}>
              <dt style={{ color: "#075985" }}>Who&apos;s affected</dt>
              <dd>{s.affected_text ?? notStated}</dd>
            </div>
            <div className="fact" style={{ background: "#FFEDD5" }}>
              <dt style={{ color: "#9A3412" }}>Next step</dt>
              <dd>
                <strong>{NEXT_STEP[s.next_step].label}</strong>
                <span className="block">{NEXT_STEP[s.next_step].help}</span>
              </dd>
            </div>
            <div className="fact" style={{ background: "#F6F1EA" }}>
              <dt style={{ color: "var(--fg-2)" }}>Meeting</dt>
              <dd>
                <Link href={`/meetings/${ev.id}`}>{ev.bodies.name}</Link>
                <span className="block">{longDate(ev.date, true)}{ev.time_text && `, ${ev.time_text}`}</span>
              </dd>
            </div>
          </dl>
        </>
      ) : (
        <p className="note">
          A plain-English summary isn&apos;t available for this item yet. The original documents are below.
        </p>
      )}

      {item.action_text && (
        <section className="stack" aria-labelledby="rec">
          <h2 id="rec">Staff recommendation</h2>
          <p className="quote">{item.action_text}</p>
        </section>
      )}

      <section className="stack" aria-labelledby="docs">
        <h2 id="docs">Original documents</h2>
        <ul className="docs">
          {m.attachments.map((a) => (
            <li key={a.id}>
              <a href={a.url} target="_blank" rel="noopener">{a.name ?? "Attachment"}</a>
              <span className="kind">PDF</span>
            </li>
          ))}
          {ev.agenda_pdf_url && (
            <li>
              <a href={ev.agenda_pdf_url} target="_blank" rel="noopener">Meeting agenda</a>
              <span className="kind">PDF</span>
            </li>
          )}
          {ev.legistar_url && (
            <li><a href={ev.legistar_url} target="_blank" rel="noopener">Official meeting page on Legistar</a></li>
          )}
        </ul>
      </section>

      {m.staff_report_text && (
        <details className="report">
          <summary>Read the full staff report text</summary>
          <pre>{m.staff_report_text}</pre>
        </details>
      )}
    </div>
  );
}
