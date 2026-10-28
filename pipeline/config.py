import os
from zoneinfo import ZoneInfo

from dotenv import load_dotenv

load_dotenv()

LEGISTAR_CLIENT = os.environ.get("LEGISTAR_CLIENT", "claremontca")
LOCAL_TZ = ZoneInfo("America/Los_Angeles")

# Seconds to wait before every Legistar request.
REQUEST_DELAY = float(os.environ.get("LEGISTAR_REQUEST_DELAY", "0.25"))


def database_url() -> str:
    url = os.environ.get("DATABASE_URL")
    if not url:
        raise SystemExit("DATABASE_URL is not set. Copy .env.example to .env and fill it in.")
    return url
