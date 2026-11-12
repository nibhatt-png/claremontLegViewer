import type { Metadata } from "next";
import Link from "next/link";
import { MeetingList } from "@/components/MeetingList";
import { SearchForm } from "@/components/SearchForm";
import { Snippet } from "@/components/Snippet";
import { getMeetingsOn, search } from "@/lib/data";
import { fullDate, readableTitle, shortDate } from "@/lib/format";

type Props = { searchParams: Promise<{ q?: string; date?: string }> };

function parse(p: { q?: string; date?: string }) {
  const q = (p.q ?? "").trim().slice(0, 200);
  const date = /^\d{4}-\d{2}-\d{2}$/.test(p.date ?? "") ? p.date! : "";
  return { q, date };
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { q, date } = parse(await searchParams);
  const what = [q, date && fullDate(date)].filter(Boolean).join(", ");
  return { title: what ? `Search: ${what}` : "Search", robots: { index: false } };
}

export default async function SearchPage({ searchParams }: Props) {
  const { q, date } = parse(await searchParams);
  // A keyword searches the documents; a date narrows to that day's meetings. Either works alone.
  const [found, meetings] = await Promise.all([
    q ? search(q) : Promise.resolve([]),
    date && !q ? getMeetingsOn(date) : Promise.resolve([]),
  ]);
  const results = date ? found.filter((r) => r.event_date === date) : found;

  let heading = "Search";
  if (q && date) heading = `“${q}” on ${fullDate(date)}`;
  else if (q) heading = `Results for “${q}”`;
  else if (date) heading = `Meetings on ${fullDate(date)}`;

  return (
    <div className="wrap page">
      <div style={{ display: "grid", gap: 16 }}>
        <h1 style={{ fontSize: "clamp(2rem, 5vw, 3.25rem)" }}>{heading}</h1>
        <p className="lede">
          {q
            ? `${results.length} item${results.length === 1 ? "" : "s"} found. Searches titles, summaries, staff reports, and attached documents.`
            : date
              ? `${meetings.length} meeting${meetings.length === 1 ? "" : "s"} that day.`
              : "Search titles, summaries, staff reports, and attached documents, or pick a date. Put a phrase in quotes to match it exactly."}
        </p>
      </div>
      <SearchForm defaultValue={q} defaultDate={date} id="page-q" />

      {q && results.length === 0 && (
        <p>{date ? "Nothing on that date mentions that. Try clearing the date." : "No agenda items mention that. Try a different word, or check the spelling."}</p>
      )}
      {!q && date && meetings.length === 0 && <p>No city meetings were held on that date.</p>}
      {!q && meetings.length > 0 && <MeetingList meetings={meetings} />}

      {results.length > 0 && (
        <ol className="results">
          {results.map((r) => (
            <li key={r.event_item_id}>
              <Link href={`/items/${r.event_item_id}`}>
                <strong>{r.one_line ?? readableTitle(r.title)}</strong>
              </Link>
              <span className="meta">
                {r.body_name} · {shortDate(r.event_date)}{r.agenda_number && ` · Item ${r.agenda_number}`}
              </span>
              <Snippet text={r.snippet} />
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
