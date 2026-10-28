-- Full-text search for the website: python -m pipeline.migrate applies this.
-- Runs with the caller's permissions, so the anon key only sees published summaries.
-- Snippets mark matched words with [[[ and ]]] instead of HTML; the site escapes the
-- text and turns the markers into <mark> elements.

create or replace function search_items(q text, max_results integer default 30)
returns table (
  event_item_id integer,
  event_id      integer,
  event_date    date,
  body_name     text,
  agenda_number text,
  title         text,
  one_line      text,
  snippet       text,
  rank          real
)
language sql stable as $$
  with query as (
    select websearch_to_tsquery('english', q) as tsq
  ),
  hits as (
    select i.id, i.event_id, i.matter_id, i.agenda_number, i.title,
           ts_rank(i.search, query.tsq) as rank, query.tsq
      from event_items i, query
     where i.search @@ query.tsq
     order by rank desc
     limit max_results
  )
  select h.id, h.event_id, e.date, b.name, h.agenda_number, h.title, s.one_line,
         ts_headline('english',
           left(concat_ws(' … ',
                  h.title,
                  m.staff_report_text,
                  (select string_agg(a.extracted_text, ' … ' order by a.id)
                     from attachments a
                    where a.matter_id = h.matter_id and a.text_status = 'ok')),
                200000),
           h.tsq,
           'StartSel=[[[, StopSel=]]], MaxWords=30, MinWords=12, MaxFragments=2, FragmentDelimiter=" … "'),
         h.rank
    from hits h
    join events e on e.id = h.event_id
    join bodies b on b.id = e.body_id
    left join matters m on m.id = h.matter_id
    left join summaries s on s.event_item_id = h.id
   order by h.rank desc, e.date desc;
$$;
