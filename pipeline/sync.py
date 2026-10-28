"""Sync Claremont meetings from Legistar into Postgres: python -m pipeline.sync [--dry-run]

Steps: bodies -> events in the date window -> agenda items -> matters (staff report
text) and attachment records. Events whose EventLastModifiedUtc hasn't changed since
the last run are skipped unless --full is given.
"""

import argparse
import logging
import re
from collections import Counter
from datetime import datetime, timedelta

from pipeline import db
from pipeline.config import LOCAL_TZ
from pipeline.legistar import Legistar

log = logging.getLogger("sync")


def parse_ts(value: str | None) -> datetime | None:
    return datetime.fromisoformat(value) if value else None


def clean_text(value: str | None) -> str | None:
    if value is None:
        return None
    value = value.replace("\r\n", "\n").strip()
    return value or None


def clean_staff_report(text: str | None) -> str | None:
    """Drop Legistar's '..Title' / '..Body' section markers and squeeze blank lines."""
    if not text:
        return None
    text = text.replace("\r\n", "\n")
    text = re.sub(r"^\.\.[A-Za-z ]+[ \t]*$", "", text, flags=re.M)
    text = re.sub(r"[ \t]+\n", "\n", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip() or None


def section_header(item: dict) -> str | None:
    """Return the header text if this agenda row is a section header (e.g. 'CONSENT CALENDAR').

    Legistar's EventItemConsent flag is 0 even for consent items in Claremont, so the
    section has to be inferred from the header rows that precede each item.
    """
    if item["EventItemMatterId"]:
        return None
    title = (item["EventItemTitle"] or "").strip()
    if not title or len(title) > 80 or title == "PAGE BREAK":
        return None
    if title != title.upper() or not re.search(r"[A-Z]", title):
        return None
    return re.sub(r"\s*-\s*NONE$", "", title, flags=re.I).rstrip(":")


class Sync:
    def __init__(self, conn, api: Legistar, dry_run: bool, full: bool):
        self.conn = conn
        self.api = api
        self.dry_run = dry_run
        self.full = full
        self.stats: dict[str, Counter] = {}
        self.matters_done: set[int] = set()

    def record(self, table: str, outcome: str) -> str:
        self.stats.setdefault(table, Counter())[outcome] += 1
        return outcome

    def finish(self) -> None:
        if self.dry_run:
            self.conn.rollback()
        else:
            self.conn.commit()

    def sync_bodies(self) -> None:
        for b in self.api.bodies():
            self.record("bodies", db.upsert(self.conn, "bodies", {
                "id": b["BodyId"],
                "name": b["BodyName"].strip(),
                "active": bool(b["BodyActiveFlag"]),
            }))
        self.finish()

    def sync_events(self, start, end) -> None:
        events = self.api.events(start, end)
        log.info("Legistar has %d events from %s to %s", len(events), start, end)
        for e in events:
            label = f"{e['EventDate'][:10]} {e['EventBodyName'].strip()} (event {e['EventId']})"
            prev = self.conn.execute(
                "select last_modified_utc from events where id = %s", (e["EventId"],)
            ).fetchone()
            modified = parse_ts(e["EventLastModifiedUtc"])
            outcome = self.record("events", db.upsert(self.conn, "events", {
                "id": e["EventId"],
                "body_id": e["EventBodyId"],
                "date": e["EventDate"][:10],
                "time_text": clean_text(e["EventTime"]),
                "location": clean_text(e["EventLocation"]),
                "agenda_pdf_url": e["EventAgendaFile"],
                "legistar_url": e["EventInSiteURL"],
                "agenda_status": e["EventAgendaStatusName"],
                "last_modified_utc": modified,
            }))
            if prev is not None and prev[0] == modified and not self.full:
                log.info("%s: unchanged, skipping items", label)
                self.finish()
                continue
            item_counts = self.sync_items(e["EventId"])
            log.info("%s: event %s; items %s", label, outcome, dict(item_counts) or "none posted")
            self.finish()

    def sync_items(self, event_id: int) -> Counter:
        items = sorted(self.api.event_items(event_id), key=lambda i: i["EventItemAgendaSequence"])
        counts: Counter = Counter()
        section = None
        for item in items:
            section = section_header(item) or section
            matter_id = item["EventItemMatterId"]
            if matter_id:
                self.sync_matter(item)
            outcome = self.record("event_items", db.upsert(self.conn, "event_items", {
                "id": item["EventItemId"],
                "event_id": event_id,
                "matter_id": matter_id,
                "agenda_number": clean_text(item["EventItemAgendaNumber"]),
                "title": clean_text(item["EventItemTitle"]),
                "action_text": clean_text(item["EventItemActionText"]),
                "section": section if matter_id else None,
                "sort_order": item["EventItemAgendaSequence"],
            }))
            counts[outcome] += 1
        # Items dropped from a revised agenda (their summaries cascade).
        removed = self.conn.execute(
            "delete from event_items where event_id = %s and not (id = any(%s))",
            (event_id, [i["EventItemId"] for i in items]),
        ).rowcount
        if removed:
            self.stats.setdefault("event_items", Counter())["removed"] += removed
            counts["removed"] = removed
        return counts

    def sync_matter(self, item: dict) -> None:
        matter_id = item["EventItemMatterId"]
        if matter_id in self.matters_done:
            return
        self.matters_done.add(matter_id)
        text = self.api.matter_text(matter_id, item["EventItemVersion"]) or {}
        self.record("matters", db.upsert(self.conn, "matters", {
            "id": matter_id,
            "file_number": item["EventItemMatterFile"],
            "title": clean_text(item["EventItemTitle"]),
            "type_name": item["EventItemMatterType"],
            "staff_report_text": clean_staff_report(text.get("MatterTextPlain")),
            "text_last_modified_utc": parse_ts(text.get("MatterTextLastModifiedUtc")),
        }))
        for a in item["EventItemMatterAttachments"]:
            if not a["MatterAttachmentShowOnInternetPage"]:
                continue
            outcome = db.upsert(self.conn, "attachments", {
                "id": a["MatterAttachmentId"],
                "matter_id": matter_id,
                "name": clean_text(a["MatterAttachmentName"]),
                "url": a["MatterAttachmentHyperlink"],
                "last_modified_utc": parse_ts(a["MatterAttachmentLastModifiedUtc"]),
            })
            if outcome == "updated":
                # The file changed: clear old text so the PDF step re-extracts it.
                self.conn.execute(
                    "update attachments set extracted_text = null, text_status = null, fetched_at = null "
                    "where id = %s", (a["MatterAttachmentId"],),
                )
            self.record("attachments", outcome)

    def refresh_search(self) -> None:
        self.conn.execute("select refresh_item_search()")
        self.finish()


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--days-back", type=int, default=60)
    parser.add_argument("--days-ahead", type=int, default=30)
    parser.add_argument("--dry-run", action="store_true", help="fetch everything but roll back all database writes")
    parser.add_argument("--full", action="store_true", help="re-sync events even if they haven't changed")
    args = parser.parse_args()

    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s", datefmt="%H:%M:%S")
    today = datetime.now(LOCAL_TZ).date()
    api = Legistar()

    with db.connect() as conn:
        sync = Sync(conn, api, dry_run=args.dry_run, full=args.full)
        sync.sync_bodies()
        sync.sync_events(today - timedelta(days=args.days_back), today + timedelta(days=args.days_ahead))
        sync.refresh_search()

    prefix = "DRY RUN (nothing saved) - " if args.dry_run else ""
    log.info("%sDone. %d Legistar requests.", prefix, api.request_count)
    for table, counts in sync.stats.items():
        log.info("  %-12s %s", table, ", ".join(f"{k} {v}" for k, v in sorted(counts.items())))


if __name__ == "__main__":
    main()
