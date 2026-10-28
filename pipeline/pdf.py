"""Extract text from attachment PDFs.

PyMuPDF first; pdfplumber as a fallback when PyMuPDF's text looks garbled.
Image-only (scanned) PDFs are marked needs_ocr; OCR is out of scope for now.
"""

import io
import logging
import re

import pdfplumber
import pymupdf

log = logging.getLogger(__name__)

# A page with fewer extracted characters than this is treated as having no text layer.
MIN_CHARS_PER_PAGE = 50
# Share of suspicious characters above which text counts as garbled.
GARBLED_THRESHOLD = 0.05


def garbled_ratio(text: str) -> float:
    """Share of characters that usually mean a broken font encoding."""
    if not text:
        return 0.0
    bad = sum(
        1 for c in text
        if c == "�"                      # replacement character
        or "" <= c <= ""          # private use area
        or (ord(c) < 32 and c not in "\n\t\r")  # control characters
    )
    return bad / len(text)


def clean(text: str) -> str:
    text = text.replace("\x00", "")  # Postgres text columns reject NUL
    text = re.sub(r"[ \t]+\n", "\n", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def _pymupdf_text(data: bytes) -> tuple[str, int, int]:
    """Returns (text, page count, pages with too little text)."""
    with pymupdf.open(stream=data, filetype="pdf") as doc:
        pages = [page.get_text() for page in doc]
    empty = sum(1 for p in pages if len(p.strip()) < MIN_CHARS_PER_PAGE)
    return "\n\n".join(pages), len(pages), empty


def _pdfplumber_text(data: bytes) -> str:
    with pdfplumber.open(io.BytesIO(data)) as pdf:
        return "\n\n".join(page.extract_text() or "" for page in pdf.pages)


def extract(data: bytes) -> tuple[str | None, str]:
    """Return (text, status) where status is 'ok', 'needs_ocr' or 'failed'."""
    if not data.startswith(b"%PDF"):
        return None, "failed"
    try:
        text, pages, empty = _pymupdf_text(data)
    except Exception as e:
        log.warning("PyMuPDF could not open PDF: %s", e)
        return None, "failed"

    if pages and empty / pages > 0.5:
        # Mostly image pages. Keep whatever text exists (often just headers) for search.
        return clean(text) or None, "needs_ocr"

    if garbled_ratio(text) > GARBLED_THRESHOLD:
        try:
            alt = _pdfplumber_text(data)
        except Exception as e:
            log.warning("pdfplumber fallback failed: %s", e)
            alt = ""
        if alt and garbled_ratio(alt) < garbled_ratio(text):
            text = alt
        if garbled_ratio(text) > GARBLED_THRESHOLD:
            return clean(text) or None, "failed"

    return clean(text), "ok"
