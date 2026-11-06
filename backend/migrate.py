"""Run all pending SQL migrations against the Supabase database.

Usage (from the backend/ directory):
    python migrate.py

The script reads DATABASE_URL from backend/.env, connects directly with
psycopg, and runs every *.sql file under schema/migrations/ in filename order.
Each migration is wrapped in a single transaction — if anything fails the whole
migration rolls back and the error is printed.
"""

from __future__ import annotations

import os
import sys
from pathlib import Path

from dotenv import load_dotenv

# Load .env from the same directory as this script
load_dotenv(Path(__file__).with_name(".env"))

DATABASE_URL = os.getenv("DATABASE_URL", "").strip()
if not DATABASE_URL:
    print("ERROR: DATABASE_URL is not set in backend/.env")
    sys.exit(1)

MIGRATIONS_DIR = Path(__file__).parent / "schema" / "migrations"


def run_migrations() -> None:
    try:
        import psycopg
    except ImportError:
        print("ERROR: psycopg is not installed. Run: pip install psycopg[binary]")
        sys.exit(1)

    sql_files = sorted(MIGRATIONS_DIR.glob("*.sql"))
    if not sql_files:
        print(f"No .sql files found in {MIGRATIONS_DIR}")
        return

    print(f"Found {len(sql_files)} migration file(s):\n")

    with psycopg.connect(DATABASE_URL, autocommit=False) as conn:
        for sql_file in sql_files:
            print(f"  Running: {sql_file.name} ...", end=" ", flush=True)
            sql = sql_file.read_text(encoding="utf-8")
            try:
                conn.execute(sql)
                conn.commit()
                print("✅ done")
            except Exception as exc:
                conn.rollback()
                print(f"\n\n❌ FAILED on {sql_file.name}")
                print(f"   Error: {exc}")
                print("\n   The migration was rolled back. Fix the error and re-run.")
                sys.exit(1)

    print("\nAll migrations applied successfully.")


if __name__ == "__main__":
    run_migrations()

