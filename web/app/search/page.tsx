import type { Metadata } from "next";
import Link from "next/link";
import { SearchForm } from "@/components/SearchForm";
import { Snippet } from "@/components/Snippet";
import { search } from "@/lib/data";
import { readableTitle, shortDate } from "@/lib/format";

type Props = { searchParams: Promise<{ q?: string }> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const q = ((await searchParams).q ?? "").trim();
  return { title: q ? `Search: ${q}` : "Search", robots: { index: false } };
}

export default async function SearchPage({ searchParams }: Props) {
  const q = ((await searchParams).q ?? "").trim().slice(0, 200);
  const results = q ? await search(q) : [];

  return (
    <>
      <div>
        <h1>{q ? <>Results for &ldquo;{q}&rdquo;</> : "Search"}</h1>
        <p className="lede">
          {q
            ? `${results.length} item${results.length === 1 ? "" : "s"} found. Searches titles, summaries, staff reports, and attached documents.`
            : "Search titles, summaries, staff reports, and attached documents. Put a phrase in quotes to match it exactly."}
        </p>
      </div>
      <SearchForm defaultValue={q} id="page-q" />
      {q && results.length === 0 && <p>No agenda items mention that. Try a different word, or check the spelling.</p>}
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
    </>
  );
}
