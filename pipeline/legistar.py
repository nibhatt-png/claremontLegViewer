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

    def _request(self, url: str, params: dict | None = None, read=lambda r: r.json()):
        """GET a URL and return read(response), retrying with exponential backoff on
        network errors, timeouts, 429s and 5xx. Returns None on 404.
        """
        for attempt in range(self.max_retries):
            time.sleep(self.delay)
            self.request_count += 1
            try:
                with self.session.get(url, params=params, timeout=30, stream=True) as resp:
                    if resp.status_code == 404:
                        return None
                    if resp.status_code != 429 and resp.status_code < 500:
                        resp.raise_for_status()
                        return read(resp)
                    problem = f"HTTP {resp.status_code}"
            except (requests.ConnectionError, requests.Timeout, requests.exceptions.ChunkedEncodingError, TimeoutError) as e:
                problem = str(e)
            wait = 2 ** attempt
            log.warning("GET %s failed (%s); retrying in %ss", url, problem, wait)
            time.sleep(wait)
        raise RuntimeError(f"GET {url} failed after {self.max_retries} attempts")

    def get(self, path: str, params: dict | None = None):
        """GET a Web API path and return the parsed JSON (None on 404)."""
        return self._request(f"{self.base}/{path.lstrip('/')}", params)

    def download(self, url: str) -> bytes | None:
        """Download a document (e.g. an attachment PDF). Returns None on 404."""
        return self._request(url, read=_read_body)

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


DOWNLOAD_DEADLINE = 120  # seconds for a whole file; a stalled server otherwise trickles forever
MAX_DOWNLOAD_BYTES = 100 * 1024 * 1024


class FileTooLarge(Exception):
    pass


def _read_body(resp: requests.Response) -> bytes:
    deadline = time.monotonic() + DOWNLOAD_DEADLINE
    chunks, size = [], 0
    for chunk in resp.iter_content(64 * 1024):
        size += len(chunk)
        if size > MAX_DOWNLOAD_BYTES:
            raise FileTooLarge(f"{resp.url} is over {MAX_DOWNLOAD_BYTES // 1024 // 1024} MB")
        if time.monotonic() > deadline:
            raise TimeoutError(f"download took longer than {DOWNLOAD_DEADLINE}s")
        chunks.append(chunk)
    return b"".join(chunks)
