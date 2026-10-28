-- Core tables for Claremont Legislation Explorer.
-- Primary keys are Legistar IDs so the sync can upsert idempotently.

create table bodies (
  id     integer primary key,          -- Legistar BodyId
  name   text    not null,             -- trimmed BodyName
  active boolean not null default true
);

create table events (
  id                integer primary key, -- Legistar EventId
  body_id           integer not null references bodies(id),
  date              date    not null,
  time_text         text,                -- e.g. "6:30 PM"
  location          text,
  agenda_pdf_url    text,
  legistar_url      text,                -- EventInSiteURL (official meeting page)
  agenda_status     text,                -- e.g. "Final", "Draft"
  last_modified_utc timestamp
);
create index events_date_idx on events (date);

-- Claremont keeps staff reports as Legistar matter text, not as PDF attachments,
-- so the report body lives here.
create table matters (
  id                     integer primary key, -- Legistar MatterId
  file_number            text,                -- e.g. "26-254"
  title                  text,
  type_name              text,
  staff_report_text      text,
  text_last_modified_utc timestamp
);

create table event_items (
  id            integer primary key, -- Legistar EventItemId
  event_id      integer not null references events(id) on delete cascade,
  matter_id     integer references matters(id), -- null for procedural rows (headers, boilerplate)
  agenda_number text,                -- e.g. "4."
  title         text,
  action_text   text,                -- recommended action
  section       text,                -- nearest agenda header, e.g. "CONSENT CALENDAR"
  sort_order    integer not null,    -- EventItemAgendaSequence
  -- Covers item title + summary + staff report + attachment text. Postgres generated
  -- columns can't read other tables, so refresh_item_search() maintains it.
  search        tsvector
);
create index event_items_event_idx  on event_items (event_id, sort_order);
create index event_items_matter_idx on event_items (matter_id);
create index event_items_search_idx on event_items using gin (search);

create table attachments (
  id                integer primary key, -- Legistar MatterAttachmentId
  matter_id         integer not null references matters(id),
  name              text,
  url               text not null,
  last_modified_utc timestamp,
  extracted_text    text,
  text_status       text check (text_status in ('ok', 'needs_ocr', 'failed')), -- null = not processed yet
  fetched_at        timestamptz
);
create index attachments_matter_idx on attachments (matter_id);

create table summaries (
  event_item_id  integer primary key references event_items(id) on delete cascade,
  one_line       text    not null,
  summary        text    not null,
  cost_text      text,
  affected_text  text,
  next_step      text    not null
                 check (next_step in ('vote', 'public_hearing', 'discussion_only', 'consent_calendar', 'other')),
  flags          jsonb   not null default '[]', -- fact-check problems; non-empty means hold for review
  model          text    not null,
  prompt_version text    not null,
  created_at     timestamptz not null default now(),
  reviewed       boolean not null default false
);

create or replace function refresh_item_search(p_event_id integer default null)
returns void language sql as $$
  update event_items i set search =
       setweight(to_tsvector('english', coalesce(i.title, '')), 'A')
    || setweight(to_tsvector('english', coalesce(
         (select s.one_line || ' ' || s.summary from summaries s where s.event_item_id = i.id), '')), 'B')
    || setweight(to_tsvector('english', left(coalesce(
         (select m.staff_report_text from matters m where m.id = i.matter_id), ''), 300000)), 'C')
    || setweight(to_tsvector('english', left(coalesce(
         (select string_agg(a.extracted_text, ' ' order by a.id)
            from attachments a
           where a.matter_id = i.matter_id and a.text_status = 'ok'), ''), 300000)), 'D')
  where i.matter_id is not null
    and (p_event_id is null or i.event_id = p_event_id);
$$;

-- The website reads with Supabase's public anon key: allow reads only, never writes.
-- The sync connects as the postgres role, which bypasses RLS.
alter table bodies      enable row level security;
alter table events      enable row level security;
alter table matters     enable row level security;
alter table event_items enable row level security;
alter table attachments enable row level security;
alter table summaries   enable row level security;

create policy "public read" on bodies      for select using (true);
create policy "public read" on events      for select using (true);
create policy "public read" on matters     for select using (true);
create policy "public read" on event_items for select using (true);
create policy "public read" on attachments for select using (true);
-- Summaries that failed the fact check stay hidden until someone reviews them.
create policy "public read" on summaries   for select using (jsonb_array_length(flags) = 0 or reviewed);
