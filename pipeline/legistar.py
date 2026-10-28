"""Small client for the Legistar Web API (https://webapi.legistar.com)."""

import logging
import time

import requests

from pipeline.config import LEGISTAR_CLIENT, REQUEST_DELAY

log = logging.getLogger(__name__)

PAGE_SIZE = 1000  # Legistar caps every response at 1000 rows


class Legistar:
    def __init__(self, client: str = LEGISTAR_CLIENT, delay: float = REQUEST_DELAY, max_retries: int = 5):
        self.base = f"https://webapi.legistar.com/v1/{client}"
        self.delay = delay
        self.max_retries = max_retries
        self.session = requests.Session()
        self.session.headers["User-Agent"] = "claremont-legislation-explorer (civic data sync)"
        self.request_count = 0

    def get(self, path: str, params: dict | None = None):
        """GET a path, retrying with exponential backoff on network errors, 429s and 5xx.

        Returns None on 404.
        """
        url = f"{self.base}/{path.lstrip('/')}"
        for attempt in range(self.max_retries):
            time.sleep(self.delay)
            self.request_count += 1
            try:
                resp = self.session.get(url, params=params, timeout=30)
            except requests.RequestException as e:
                problem = str(e)
            else:
                if resp.status_code == 404:
                    return None
                if resp.status_code != 429 and resp.status_code < 500:
                    resp.raise_for_status()
                    return resp.json()
                problem = f"HTTP {resp.status_code}"
            wait = 2 ** attempt
            log.warning("GET %s failed (%s); retrying in %ss", path, problem, wait)
            time.sleep(wait)
        raise RuntimeError(f"GET {path} failed after {self.max_retries} attempts")

    def get_all(self, path: str, params: dict | None = None) -> list:
        """GET every page of a list endpoint using $top/$skip."""
        rows: list = []
        while True:
            page = self.get(path, {**(params or {}), "$top": PAGE_SIZE, "$skip": len(rows)}) or []
            rows.extend(page)
            if len(page) < PAGE_SIZE:
                return rows

    def bodies(self) -> list:
        return self.get_all("bodies")

    def events(self, start, end) -> list:
        """Events with start <= EventDate <= end (dates)."""
        return self.get_all("events", {
            "$filter": f"EventDate ge datetime'{start.isoformat()}' and EventDate le datetime'{end.isoformat()}'",
            "$orderby": "EventDate",
        })

    def event_items(self, event_id: int) -> list:
        """Agenda items, with each matter's attachments inline (EventItemMatterAttachments)."""
        return self.get(f"events/{event_id}/eventitems", {"Attachments": 1}) or []

    def matter_text(self, matter_id: int, version: str | None = None) -> dict | None:
        """The matter's text record (staff report): MatterTextPlain, MatterTextLastModifiedUtc, ...

        Uses the given matter version when it exists, otherwise the latest.
        """
        versions = self.get(f"matters/{matter_id}/versions") or []
        if not versions:
            return None
        match = [v for v in versions if v["Value"] == version]
        text_id = (match or versions)[-1]["Key"]
        return self.get(f"matters/{matter_id}/texts/{text_id}")
