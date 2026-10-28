# Claremont Legislation Explorer

A small website that makes City of Claremont, CA council and commission meetings easier to follow:

- **This week** (`/`): every meeting in the next 7 days, each agenda item in one line.
- **Item pages** (`/items/[id]`): a plain-English summary, cost, who's affected, next step, and links to the original documents.
- **Meeting pages** (`/meetings/[id]`): every item on one agenda.
- **Search** (`/search?q=`): full-text search across item titles, summaries, staff reports, and attached PDFs.

Summaries are AI-generated and labeled as unofficial on every page.

## How it works

```
Legistar Web API ──> pipeline/ (Python) ──> Postgres on Supabase <── web/ (Next.js)
                        │
                        └── Claude (summaries)
```

`python -m pipeline.sync` does everything in one run:

1. Upserts bodies (City Council, commissions).
2. Fetches meetings from 60 days ago to 30 days ahead and upserts them. Meetings whose
   `EventLastModifiedUtc` hasn't changed since the last run are skipped.
3. Upserts each changed meeting's agenda items, staff report text, and attachment records.
   Items removed from a revised agenda are deleted.
4. Downloads attachment PDFs that are new or changed and extracts their text (PyMuPDF,
   with pdfplumber as a fallback for garbled text). Scanned PDFs are marked `needs_ocr`.
5. Writes summaries for items that don't have one. Minutes and warrant registers get a
   template; everything else goes to Claude using [pipeline/prompts/summary_v1.md](pipeline/prompts/summary_v1.md).
   Each summary is fact-checked: every dollar amount and date must appear in the source.
   Summaries that fail are saved with `flags` and stay hidden on the site until someone
   sets `reviewed = true`.
6. Rebuilds the search index.

Re-running is safe: Legistar IDs are the primary keys, and rows are only written when something changed.

### Things to know about Claremont's Legistar data

- **Staff reports are not PDFs.** They're stored as Legistar "matter text" and fetched from
  `/matters/{id}/versions` + `/matters/{id}/texts/{id}`. Attachments are supporting documents
  (resolutions, minutes, plans, public comments). Tables in staff reports don't survive in the plain text.
- Most rows in `/events/{id}/eventitems` are boilerplate (headers, Zoom instructions, page breaks).
  Real agenda items are the ones with a `EventItemMatterId`.
- `EventItemConsent` is 0 even for consent items, so the agenda section comes from the header
  row above each item.

## Setup

You need Python 3.11+, Node.js 20+, a [Supabase](https://supabase.com) project (the free tier is enough),
and an [Anthropic API key](https://console.anthropic.com) for summaries.

### 1. Database

1. Create a Supabase project.
2. Click **Connect** → **Direct – Connection string**, set the method to **Session pooler**, and copy
   the string. (The "Direct connection" host is IPv6-only and fails on most home networks.)
3. Copy `.env.example` to `.env` and fill in `DATABASE_URL`. Replace `[YOUR-PASSWORD]` with your
   password, without the brackets. If the password contains `@`, `:`, `/` or `#`, write it URL-encoded
   (for example `@` becomes `%40`).
4. Add `ANTHROPIC_API_KEY` to `.env`.

### 2. Sync

```bash
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
.venv/bin/python -m pipeline.migrate      # create or update tables
.venv/bin/python -m pipeline.sync         # load meetings, PDFs, and summaries
```

Useful flags:

| Flag | What it does |
|---|---|
| `--dry-run` | Fetch everything but save nothing, and make no Claude calls |
| `--full` | Re-sync every meeting even if Legistar says it hasn't changed |
| `--days-back N`, `--days-ahead N` | Change the date window (default 60 and 30) |
| `--skip-summaries` | Don't write summaries |
| `--summary-limit N` | Make at most N Claude calls this run |

The first run takes about 25 minutes, mostly downloading PDFs. Later runs take seconds unless agendas changed.

**Cost:** summaries use Claude Opus 5.5 at roughly 3–5 cents per agenda item, about $1 a month
at Claremont's meeting volume. Each run logs its estimated cost.

### 3. Website

```bash
cd web
cp .env.example .env.local   # fill in the three values
npm install
npm run dev                  # http://localhost:3000
```

`NEXT_PUBLIC_SUPABASE_URL` is `https://<project-ref>.supabase.co`. `NEXT_PUBLIC_SUPABASE_ANON_KEY` is the
public anon (publishable) key from **Project Settings → API**. It is safe to expose: row-level security
only allows reading. `NEXT_PUBLIC_REPORT_EMAIL` is where "Report an error" links go.

Pages are cached and refreshed every 10 minutes.

### 4. Scheduled sync

[.github/workflows/sync.yml](.github/workflows/sync.yml) runs the sync nightly, plus Thursday and Friday
afternoons (Pacific time) when agendas are posted. Add two repository secrets under
**Settings → Secrets and variables → Actions**: `DATABASE_URL` and `ANTHROPIC_API_KEY`. You can also run it
by hand from the **Actions** tab, optionally with flags like `--full`.

## Reviewing flagged summaries

In the Supabase SQL editor:

```sql
-- Summaries held back by the fact check
select s.event_item_id, i.title, s.summary, s.flags
  from summaries s join event_items i on i.id = s.event_item_id
 where jsonb_array_length(s.flags) > 0 and not s.reviewed;

-- After checking one against the PDF, publish it
update summaries set reviewed = true where event_item_id = 12345;

-- Or delete it so the next sync writes a new one
delete from summaries where event_item_id = 12345;
```

To change the prompt, copy `summary_v1.md` to `summary_v2.md`, edit it, and point `PROMPT_FILE` in
[pipeline/summarize.py](pipeline/summarize.py) at the new file. Each summary records the prompt version
that wrote it.

## Layout

```
migrations/      SQL migrations, applied in order by pipeline.migrate
pipeline/
  sync.py        the CLI entry point
  legistar.py    Legistar API client (request delay, retries, download limits)
  pdf.py         PDF text extraction
  summarize.py   templates, Claude call, fact check
  prompts/       the summary prompt
web/             Next.js site (App Router)
```
