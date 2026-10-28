import psycopg
from psycopg import sql

from pipeline.config import database_url


def connect() -> psycopg.Connection:
    try:
        return psycopg.connect(database_url(), connect_timeout=15)
    except psycopg.OperationalError as e:
        msg = str(e)
        if "failed to resolve host 'db." in msg and ".supabase.co'" in msg:
            raise SystemExit(
                "Can't reach Supabase's direct connection (it is IPv6-only). In the Supabase "
                "dashboard click Connect and use the 'Session pooler' string as DATABASE_URL."
            ) from None
        raise


def upsert(conn: psycopg.Connection, table: str, row: dict, key: str = "id") -> str:
    """Insert or update one row. Returns 'added', 'updated', or 'unchanged'.

    Rows whose values already match are left untouched, so re-running the sync
    reports only real changes.
    """
    cols = list(row)
    others = [c for c in cols if c != key]
    t = sql.Identifier(table)
    query = sql.SQL(
        "insert into {t} ({cols}) values ({vals}) "
        "on conflict ({key}) do update set {sets} "
        "where ({old}) is distinct from ({new}) "
        "returning (xmax = 0)"
    ).format(
        t=t,
        cols=sql.SQL(", ").join(map(sql.Identifier, cols)),
        vals=sql.SQL(", ").join(sql.Placeholder(c) for c in cols),
        key=sql.Identifier(key),
        sets=sql.SQL(", ").join(
            sql.SQL("{c} = excluded.{c}").format(c=sql.Identifier(c)) for c in others
        ),
        old=sql.SQL(", ").join(sql.Identifier(table, c) for c in others),
        new=sql.SQL(", ").join(sql.Identifier("excluded", c) for c in others),
    )
    result = conn.execute(query, row).fetchone()
    if result is None:
        return "unchanged"
    return "added" if result[0] else "updated"
