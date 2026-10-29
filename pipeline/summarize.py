"""Plain-English summaries of agenda items.

Routine items (minutes, warrant registers) get a templated summary. Everything else
goes to a language model with the prompt in prompts/: a local Ollama model by default,
or Claude when SUMMARY_PROVIDER=anthropic. Every summary is then fact-checked:
each dollar amount and date it mentions must appear in the source text, or the
summary is flagged and stays hidden on the site until someone reviews it.
"""

import logging
import os
import re
from dataclasses import dataclass
from datetime import date
from decimal import Decimal, InvalidOperation
from pathlib import Path
from typing import Literal, Optional

import anthropic
import requests
from pydantic import BaseModel, Field, ValidationError

log = logging.getLogger(__name__)

MODEL = "claude-opus-5-5"  # used when SUMMARY_PROVIDER=anthropic
PROMPT_FILE = Path(__file__).parent / "prompts" / "summary_v1.md"
PROMPT_VERSION = PROMPT_FILE.stem.removeprefix("summary_")  # "v1"
TEMPLATE_MODEL = "template"

# Claude Opus 5.5 list prices, USD per million tokens (for the cost log only).
PRICE_IN, PRICE_OUT = 4.00, 20.00

MAX_REPORT_CHARS = 150_000      # ~40K tokens; longer reports are cut with a marker
THIN_REPORT_CHARS = 2_000       # below this, attachment text is added as context
MAX_ATTACHMENT_CHARS = 20_000   # per attachment, when attachments are included

NextStep = Literal["vote", "public_hearing", "discussion_only", "consent_calendar", "other"]


class ItemSummary(BaseModel):
    one_line: str = Field(description="At most 20 words.")
    summary: str = Field(description="2-3 plain-English sentences.")
    cost_text: Optional[str]
    affected_text: Optional[str]
    next_step: NextStep


@dataclass
class Item:
    id: int
    agenda_number: str | None
    title: str
    action_text: str | None
    section: str | None
    body: str
    date: date
    staff_report: str | None
    attachments: list[tuple[str, str | None]]  # (name, extracted text)


# --- Source text -------------------------------------------------------------

def build_source(item: Item, max_report_chars: int = MAX_REPORT_CHARS) -> str:
    """The text the model sees, and the text the fact check compares against."""
    report = item.staff_report or ""
    if len(report) > max_report_chars:
        report = report[:max_report_chars] + "\n\n[Staff report truncated here]"
    parts = [
        f"Meeting: {item.body}, {item.date:%B} {item.date.day}, {item.date.year}",
        f"Agenda section: {item.section or 'unknown'}",
        f"Item number: {item.agenda_number or 'none'}",
        f"Official title: {item.title}",
        f"Recommended action: {item.action_text or '(none given)'}",
        "",
        "Staff report:",
        report or "(no staff report text)",
    ]
    if item.attachments:
        parts += ["", "Attached documents:"]
        include_text = len(item.staff_report or "") < THIN_REPORT_CHARS
        for name, text in item.attachments:
            parts.append(f"- {name}")
            if include_text and text:
                excerpt = text[:MAX_ATTACHMENT_CHARS]
                if len(text) > MAX_ATTACHMENT_CHARS:
                    excerpt += "\n[Attachment truncated here]"
                parts.append(excerpt)
    return "\n".join(parts)


# --- Routine items -----------------------------------------------------------

MINUTES_RE = re.compile(r"\bMINUTES OF ([A-Z]+ \d{1,2}, \d{4})", re.I)
WARRANT_RE = re.compile(r"WARRANT REGISTER|CLAIMS AND DEMANDS", re.I)


def section_step(section: str | None) -> NextStep | None:
    """next_step implied by the agenda section, if any."""
    s = (section or "").upper()
    if "CONSENT" in s:
        return "consent_calendar"
    if "HEARING" in s:
        return "public_hearing"
    return None


def templated(item: Item) -> ItemSummary | None:
    step = section_step(item.section) or "consent_calendar"
    if m := MINUTES_RE.search(item.title):
        when = parse_date(m.group(1))
        when_text = f"{when:%B} {when.day}, {when.year}" if when else m.group(1).title()
        return ItemSummary(
            one_line=f"Approve the written record of the {when_text} meeting.",
            summary=f"This is a routine approval of the minutes (the official written record) "
                    f"of the {item.body} meeting on {when_text}. The draft minutes are attached.",
            cost_text=None, affected_text=None, next_step=step,
        )
    if WARRANT_RE.search(item.title):
        return ItemSummary(
            one_line="Approve the list of payments the City has made (warrant register).",
            summary="This is a routine approval of the City's warrant register, the list of payments "
                    "the City has made to vendors and others. The register is attached to the agenda item.",
            cost_text=None, affected_text=None, next_step=step,
        )
    return None


# --- Fact check --------------------------------------------------------------

MONTHS = "January|February|March|April|May|June|July|August|September|October|November|December"
DATE_RE = re.compile(rf"\b({MONTHS})\s+(\d{{1,2}}),?\s+(\d{{4}})\b", re.I)
NUMERIC_DATE_RE = re.compile(r"\b(\d{1,2})/(\d{1,2})/(\d{4})\b")
MONEY_RE = re.compile(r"\$\s?(\d{1,3}(?:,\d{3})+(?:\.\d+)?|\d+(?:\.\d+)?)(\s*(?:million|billion))?", re.I)


def parse_date(text: str) -> date | None:
    m = DATE_RE.search(text)
    if not m:
        return None
    try:
        month = [x.lower() for x in MONTHS.split("|")].index(m.group(1).lower()) + 1
        return date(int(m.group(3)), month, int(m.group(2)))
    except ValueError:
        return None


def dates_in(text: str) -> set[date]:
    found = set()
    for m in DATE_RE.finditer(text):
        if d := parse_date(m.group(0)):
            found.add(d)
    for m in NUMERIC_DATE_RE.finditer(text):
        try:
            found.add(date(int(m.group(3)), int(m.group(1)), int(m.group(2))))
        except ValueError:
            pass
    return found


def amounts_in(text: str) -> dict[Decimal, str]:
    """Dollar amounts as numbers, mapped to how they were written."""
    found = {}
    for m in MONEY_RE.finditer(text):
        try:
            value = Decimal(m.group(1).replace(",", "").rstrip("."))
        except InvalidOperation:
            continue
        scale = (m.group(2) or "").strip().lower()
        value *= {"million": 10**6, "billion": 10**9}.get(scale, 1)
        found[value] = m.group(0).strip()
    return found


def fact_check(s: ItemSummary, source: str) -> list[str]:
    """Problems found; an empty list means every amount and date is in the source."""
    written = " ".join(filter(None, [s.one_line, s.summary, s.cost_text, s.affected_text]))
    flags = []
    source_amounts = amounts_in(source)
    for value, text in amounts_in(written).items():
        if value not in source_amounts:
            flags.append(f"amount not in source: {text}")
    source_dates = dates_in(source)
    for d in sorted(dates_in(written) - source_dates):
        flags.append(f"date not in source: {d:%B} {d.day}, {d.year}")
    if len(s.one_line.split()) > 20:
        flags.append(f"one_line is {len(s.one_line.split())} words (limit 20)")
    return flags


# --- Summarizers -------------------------------------------------------------

class SummarizerUnavailable(Exception):
    """The configured model can't be used right now (no key, server not running, ...)."""


class SummaryFailed(Exception):
    """One item couldn't be summarized; the next run tries again."""


def make_summarizer():
    """The summarizer named by SUMMARY_PROVIDER: "ollama" (default) or "anthropic"."""
    provider = os.environ.get("SUMMARY_PROVIDER", "ollama").lower()
    if provider == "ollama":
        return OllamaSummarizer()
    if provider == "anthropic":
        return ClaudeSummarizer()
    raise SummarizerUnavailable(f"unknown SUMMARY_PROVIDER {provider!r} (use 'ollama' or 'anthropic')")


EMPTY_VALUES = {"", "none", "null", "n/a", "not stated", "not applicable"}


def _finish(result: ItemSummary, item: Item) -> ItemSummary:
    # The agenda section is authoritative for consent and hearing items.
    result.next_step = section_step(item.section) or result.next_step
    # Smaller models sometimes write "None" instead of returning null.
    for field in ("cost_text", "affected_text"):
        value = getattr(result, field)
        if value is not None and value.strip().rstrip(".").lower() in EMPTY_VALUES:
            setattr(result, field, None)
    return result


class OllamaSummarizer:
    """A local model served by Ollama (https://ollama.com). Free, but runs only where Ollama does."""

    cost = 0.0

    def __init__(self):
        self.host = os.environ.get("OLLAMA_HOST", "http://localhost:11434").rstrip("/")
        self.model = os.environ.get("OLLAMA_MODEL", "qwen2.5:14b")
        # Ollama silently cuts prompts longer than its context window, so set it explicitly
        # and keep the source within it (about 3 characters per token, minus room for the
        # prompt and the answer).
        self.num_ctx = int(os.environ.get("OLLAMA_NUM_CTX", "16384"))
        self.max_report_chars = max(4_000, self.num_ctx * 3 - 8_000)
        self.system = PROMPT_FILE.read_text()
        try:
            tags = requests.get(f"{self.host}/api/tags", timeout=5).json()
        except requests.RequestException:
            raise SummarizerUnavailable(f"Ollama isn't running at {self.host} (start it with: ollama serve)") from None
        names = {m["name"] for m in tags.get("models", [])}
        if self.model not in names and f"{self.model}:latest" not in names:
            raise SummarizerUnavailable(f"Ollama model {self.model!r} isn't installed (run: ollama pull {self.model})")

    def summarize(self, item: Item, source: str) -> tuple[ItemSummary, str]:
        try:
            resp = requests.post(f"{self.host}/api/chat", timeout=900, json={
                "model": self.model,
                "messages": [
                    {"role": "system", "content": self.system},
                    {"role": "user", "content": source},
                ],
                "format": ItemSummary.model_json_schema(),  # constrain output to the schema
                "stream": False,
                "options": {"temperature": 0, "num_ctx": self.num_ctx},
            })
            resp.raise_for_status()
            result = ItemSummary.model_validate_json(resp.json()["message"]["content"])
        except (requests.RequestException, KeyError, ValidationError) as e:
            raise SummaryFailed(str(e)) from e
        return _finish(result, item), f"ollama/{self.model}"


class ClaudeSummarizer:
    """Claude through the Anthropic API (needs ANTHROPIC_API_KEY; billed per token)."""

    max_report_chars = MAX_REPORT_CHARS

    def __init__(self):
        if not os.environ.get("ANTHROPIC_API_KEY"):
            raise SummarizerUnavailable("ANTHROPIC_API_KEY is not set")
        self.client = anthropic.Anthropic()
        self.system = PROMPT_FILE.read_text()
        self.cost = 0.0

    def summarize(self, item: Item, source: str) -> tuple[ItemSummary, str]:
        """Returns (summary, model that wrote it)."""
        try:
            resp = self.client.beta.messages.parse(
                model=MODEL,
                max_tokens=16000,
                system=self.system,
                messages=[{"role": "user", "content": source}],
                output_format=ItemSummary,
                output_config={"effort": "medium"},
                # If a safety classifier declines, the API retries on a fallback model.
                betas=["server-side-fallback-2026-07-01"],
                fallbacks="default",
            )
        except anthropic.APIError as e:
            raise SummaryFailed(str(e)) from e
        self.cost += (resp.usage.input_tokens * PRICE_IN + resp.usage.output_tokens * PRICE_OUT) / 1e6
        if resp.stop_reason == "refusal" or resp.parsed_output is None:
            raise SummaryFailed(f"no summary returned (stop_reason={resp.stop_reason})")
        return _finish(resp.parsed_output, item), resp.model
