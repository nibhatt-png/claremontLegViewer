-- Email alerts: a weekly agenda digest and notes when a followed topic comes up.
--
-- Sign-up is double opt-in. A sign-up stores the requested choices in pending_* and emails a
-- confirm link; the choices take effect only when that link is opened. Re-subscribing with the
-- same address works the same way, so nobody can change someone else's alerts.

create table subscribers (
  id               bigint generated always as identity primary key,
  email            text not null unique check (email = lower(email)),
  weekly           boolean not null default false,
  topics           text[]  not null default '{}',   -- topic slugs from web/lib/topics.json
  pending_weekly   boolean,
  pending_topics   text[],
  confirm_token    uuid,                            -- set while a confirmation is outstanding
  confirm_sent_at  timestamptz,
  token            uuid not null unique default gen_random_uuid(), -- unsubscribe links
  confirmed_at     timestamptz,
  unsubscribed_at  timestamptz,
  last_digest_on   date,                            -- Pacific date of the last weekly email
  created_at       timestamptz not null default now()
);
create unique index subscribers_confirm_token_idx on subscribers (confirm_token);

-- Agenda items already sent to a subscriber as topic alerts, so each item is sent once.
create table alerts_sent (
  subscriber_id bigint  not null references subscribers(id) on delete cascade,
  event_item_id integer not null references event_items(id) on delete cascade,
  sent_at       timestamptz not null default now(),
  primary key (subscriber_id, event_item_id)
);

-- No policies: the public key can't read or write these. The website's server code uses the
-- secret key, and the sync connects as postgres; both bypass row-level security.
alter table subscribers enable row level security;
alter table alerts_sent enable row level security;
