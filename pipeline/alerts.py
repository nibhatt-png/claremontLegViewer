"""Send email alerts: python -m pipeline.alerts [--dry-run] [--force-digest]

Runs after the sync. Two kinds of email, both only to confirmed subscribers:

- Topic alerts: upcoming agenda items that match a topic someone follows. Each item is sent to a
  person once (alerts_sent), bundled into one email per run.
- Weekly digest: every meeting in the next 8 days, sent once a week on Friday (Pacific), after
  Thursday's agendas are posted. Saturday's runs catch up if Friday's failed.

Mail goes through Gmail SMTP; see the README for GMAIL_USER, GMAIL_APP_PASSWORD and SITE_URL.
"""

import argparse
import html
import json
import logging
import os
import re
import smtplib
from dataclasses import dataclass, field
from datetime import date, datetime, timedelta
from email.message import EmailMessage
from email.utils import formataddr
from pathlib import Path

from pipeline import db
from pipeline.config import LOCAL_TZ

log = logging.getLogger("alerts")

TOPICS_FILE = Path(__file__).resolve().parent.parent / "web" / "lib" / "topics.json"
SITE_NAME = "Claremont Explained"
DIGEST_DAYS = 8  # Friday through the following Friday
FRIDAY, SATURDAY = 4, 5


# --- Topics (same rules as web/lib/topics.ts) ---------------------------------

@dataclass
class Topic:
    slug: str
    name: str
    match: re.Pattern


def load_topics() -> list[Topic]:
    data = json.loads(TOPICS_FILE.read_text())
    return [Topic(t["slug"], t["name"], re.compile(t["pattern"], re.I)) for t in data]


def is_minutes(title: str) -> bool:
    return re.search(r"\bminutes\b", title, re.I) is not None


def topics_for(topics: list[Topic], title: str, one_line: str | None) -> list[Topic]:
    if is_minutes(title):
        return []
    text = re.sub(r"\(\s*FUNDING SOURCES?:[^)]*\)?", "", title, flags=re.I) + " " + (one_line or "")
    return [t for t in topics if t.match.search(text)]


# --- Data ----------------------------------------------------------------------

@dataclass
class Item:
    id: int
    event_id: int
    date: date
    time_text: str | None
    body: str
    agenda_number: str | None
    title: str
    one_line: str | None
    topics: list[Topic] = field(default_factory=list)


@dataclass
class Subscriber:
    id: int
    email: str
    weekly: bool
    topics: list[str]
    token: str
    last_digest_on: date | None


def upcoming_items(conn, start: date, end: date, topics: list[Topic]) -> list[Item]:
    # Summaries held back by the fact check are hidden on the site, so they're left out here too.
    rows = conn.execute("""
        select i.id, e.id, e.date, e.time_text, b.name, i.agenda_number, i.title,
               case when jsonb_array_length(s.flags) = 0 or s.reviewed then s.one_line end
          from event_items i
          join events e on e.id = i.event_id
          join bodies b on b.id = e.body_id
          left join summaries s on s.event_item_id = i.id
         where i.matter_id is not null and e.date between %s and %s
         order by e.date, e.time_text, e.id, i.sort_order
    """, (start, end)).fetchall()
    items = [Item(*r) for r in rows]
    for it in items:
        it.topics = topics_for(topics, it.title or "", it.one_line)
    return items


def subscribers(conn) -> list[Subscriber]:
    rows = conn.execute("""
        select id, email, weekly, topics, token::text, last_digest_on
          from subscribers
         where confirmed_at is not null and unsubscribed_at is null
         order by id
    """).fetchall()
    return [Subscriber(*r) for r in rows]


# --- Email ---------------------------------------------------------------------

class Mailer:
    def __init__(self, dry_run: bool):
        self.dry_run = dry_run
        self.user = os.environ.get("GMAIL_USER", "").strip()
        self.password = os.environ.get("GMAIL_APP_PASSWORD", "").replace(" ", "")
        self.site = os.environ.get("SITE_URL", "").strip().rstrip("/")
        self.smtp: smtplib.SMTP_SSL | None = None

    def missing(self) -> list[str]:
        need = {"SITE_URL": self.site} if self.dry_run else {
            "GMAIL_USER": self.user, "GMAIL_APP_PASSWORD": self.password, "SITE_URL": self.site}
        return [k for k, v in need.items() if not v]

    def send(self, to: str, subject: str, text: str, html_body: str, unsubscribe_url: str) -> None:
        if self.dry_run:
            log.info("  [dry run] would email %s: %s", to, subject)
            return
        msg = EmailMessage()
        msg["From"] = formataddr((SITE_NAME, self.user))
        msg["To"] = to
        msg["Subject"] = subject
        msg["List-Unsubscribe"] = f"<{unsubscribe_url}>"
        msg["List-Unsubscribe-Post"] = "List-Unsubscribe=One-Click"
        msg.set_content(text)
        msg.add_alternative(html_body, subtype="html")
        if self.smtp is None:
            self.smtp = smtplib.SMTP_SSL("smtp.gmail.com", 465, timeout=30)
            self.smtp.login(self.user, self.password)
        self.smtp.send_message(msg)

    def close(self) -> None:
        if self.smtp is not None:
            try:
                self.smtp.quit()
            except smtplib.SMTPException:
                pass


def nice_date(d: date) -> str:
    return f"{d:%A}, {d:%B} {d.day}"


def item_line(it: Item) -> str:
    return it.one_line or it.title


def group_by_meeting(items: list[Item]) -> list[list[Item]]:
    groups: dict[int, list[Item]] = {}
    for it in items:
        groups.setdefault(it.event_id, []).append(it)
    return list(groups.values())


def render(site: str, intro: str, items: list[Item], token: str, why: str, empty: str = "") -> tuple[str, str]:
    """Plain-text and HTML bodies listing items grouped by meeting."""
    unsub = f"{site}/alerts/unsubscribe?token={token}"
    e = html.escape
    text = [intro, ""]
    parts = [
        '<div style="background:#fcf8f2;padding:24px 12px;font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:#2a211b">',
        '<div style="max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #eadfcf;border-radius:14px;overflow:hidden">',
        f'<div style="background:#a8471f;color:#ffffff;padding:16px 22px;font-weight:700;font-size:17px">{SITE_NAME}</div>',
        f'<div style="padding:20px 22px"><p style="margin:0 0 16px;font-size:16px;line-height:1.5">{e(intro)}</p>',
    ]
    if not items and empty:
        text.append(empty)
        parts.append(f'<p style="margin:0 0 16px;color:#6b5d52">{e(empty)}</p>')
    for group in group_by_meeting(items):
        first = group[0]
        when = nice_date(first.date) + (f" at {first.time_text}" if first.time_text else "")
        meeting_url = f"{site}/meetings/{first.event_id}"
        text += [f"{first.body}: {when}", meeting_url]
        parts.append(
            f'<h2 style="margin:20px 0 4px;font-size:17px;font-family:Georgia,serif">'
            f'<a href="{e(meeting_url)}" style="color:#2a211b;text-decoration:none">{e(first.body)}</a></h2>'
            f'<p style="margin:0 0 8px;color:#6b5d52;font-size:14px">{e(when)}</p><ul style="margin:0;padding-left:20px">'
        )
        for it in group:
            url = f"{site}/items/{it.id}"
            text.append(f"  - {item_line(it)}  {url}")
            tags = ", ".join(t.name for t in it.topics)
            parts.append(
                f'<li style="margin:0 0 8px;line-height:1.45"><a href="{e(url)}" style="color:#a8471f">{e(item_line(it))}</a>'
                + (f'<br><span style="color:#6b5d52;font-size:13px">{e(tags)}</span>' if tags else "")
                + "</li>"
            )
        parts.append("</ul>")
        text.append("")
    footer = (f"{why} Summaries are written by AI from the City's records; check the originals before acting. "
              f"Unsubscribe: {unsub}")
    text.append(footer)
    parts.append(
        '</div><div style="padding:14px 22px;background:#f5ede1;color:#6b5d52;font-size:13px;line-height:1.5">'
        f'{e(why)} Summaries are written by AI from the City&#39;s records; check the originals before acting.<br>'
        f'<a href="{e(unsub)}" style="color:#6b5d52">Unsubscribe</a> · '
        f'<a href="{e(site)}/alerts" style="color:#6b5d52">Change what you get</a></div></div></div>'
    )
    return "\n".join(text), "".join(parts)


# --- Main ----------------------------------------------------------------------

def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--dry-run", action="store_true", help="log what would be sent; send nothing, record nothing")
    ap.add_argument("--force-digest", action="store_true", help="send the weekly digest even if it isn't Friday")
    args = ap.parse_args()
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)-6s %(message)s", datefmt="%H:%M:%S")

    mailer = Mailer(args.dry_run)
    if missing := mailer.missing():
        log.warning("Email alerts are off: set %s to turn them on.", ", ".join(missing))
        return

    today = datetime.now(LOCAL_TZ).date()
    topics = load_topics()
    sent = {"topic": 0, "digest": 0, "failed": 0}

    with db.connect() as conn:
        # Record each send as soon as it happens, so a crash partway through doesn't resend.
        conn.autocommit = True
        subs = subscribers(conn)
        log.info("%d confirmed subscribers", len(subs))
        if not subs:
            return
        items = upcoming_items(conn, today, today + timedelta(days=60), topics)
        digest_items = [it for it in items if it.date <= today + timedelta(days=DIGEST_DAYS - 1)]
        digest_day = args.force_digest or today.weekday() in (FRIDAY, SATURDAY)

        try:
            for sub in subs:
                try:
                    # Topic alerts
                    if sub.topics:
                        done = {r[0] for r in conn.execute(
                            "select event_item_id from alerts_sent where subscriber_id = %s", (sub.id,))}
                        new = [it for it in items if it.id not in done and any(t.slug in sub.topics for t in it.topics)]
                        if new:
                            names = sorted({t.name for it in new for t in it.topics if t.slug in sub.topics})
                            subject = (f"{names[0]} is on an upcoming agenda" if len(names) == 1
                                       else "Topics you follow are on upcoming agendas")
                            text, body = render(
                                mailer.site,
                                f"{len(new)} upcoming item{'s' if len(new) != 1 else ''} about "
                                f"{', '.join(names)}:", new, sub.token,
                                "You get this because you follow these topics.")
                            mailer.send(sub.email, subject, text, body,
                                        f"{mailer.site}/api/unsubscribe?token={sub.token}")
                            if not args.dry_run:
                                with conn.transaction():
                                    with conn.cursor() as cur:
                                        cur.executemany(
                                            "insert into alerts_sent (subscriber_id, event_item_id) values (%s, %s) "
                                            "on conflict do nothing", [(sub.id, it.id) for it in new])
                            sent["topic"] += 1

                    # Weekly digest
                    due = sub.last_digest_on is None or sub.last_digest_on <= today - timedelta(days=6)
                    if sub.weekly and digest_day and (due or args.force_digest):
                        n = len(group_by_meeting(digest_items))
                        subject = (f"This week at City Hall: {n} meeting{'s' if n != 1 else ''}" if n
                                   else "This week at City Hall: no meetings scheduled")
                        text, body = render(
                            mailer.site, f"Claremont city meetings from {nice_date(today)} through "
                            f"{nice_date(today + timedelta(days=DIGEST_DAYS - 1))}.", digest_items, sub.token,
                            "You get this weekly email because you signed up for it.",
                            empty="No city meetings are on the calendar. Agendas usually post on Thursdays.")
                        mailer.send(sub.email, subject, text, body,
                                    f"{mailer.site}/api/unsubscribe?token={sub.token}")
                        if not args.dry_run:
                            with conn.transaction():
                                conn.execute("update subscribers set last_digest_on = %s where id = %s",
                                             (today, sub.id))
                        sent["digest"] += 1
                except (smtplib.SMTPRecipientsRefused, smtplib.SMTPDataError) as ex:
                    # One bad address shouldn't stop everyone else's email.
                    log.warning("  couldn't email subscriber %d: %s", sub.id, ex)
                    sent["failed"] += 1
        finally:
            mailer.close()

    log.info("Done. %d topic alerts, %d weekly emails, %d failed%s", sent["topic"], sent["digest"],
             sent["failed"], " (dry run)" if args.dry_run else "")


if __name__ == "__main__":
    main()
