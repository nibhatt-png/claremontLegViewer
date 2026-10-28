"""Apply SQL files in migrations/ that haven't been applied yet: python -m pipeline.migrate"""

from pathlib import Path

from pipeline import db

MIGRATIONS_DIR = Path(__file__).resolve().parent.parent / "migrations"


def main() -> None:
    with db.connect() as conn:
        conn.execute(
            "create table if not exists schema_migrations "
            "(name text primary key, applied_at timestamptz not null default now())"
        )
        conn.execute("alter table schema_migrations enable row level security")
        conn.commit()
        applied = {r[0] for r in conn.execute("select name from schema_migrations")}
        pending = [p for p in sorted(MIGRATIONS_DIR.glob("*.sql")) if p.name not in applied]
        if not pending:
            print("Database is up to date.")
        for path in pending:
            with conn.transaction():
                conn.execute(path.read_text())
                conn.execute("insert into schema_migrations (name) values (%s)", (path.name,))
            print(f"Applied {path.name}")


if __name__ == "__main__":
    main()
