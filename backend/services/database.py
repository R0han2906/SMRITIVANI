"""Application-owned async PostgreSQL connection pool."""

from __future__ import annotations

import asyncio
import os


async def open_database_pool():
    dsn = os.getenv("DATABASE_URL", "").strip()
    if not dsn:
        raise RuntimeError("DATABASE_URL is missing. Set it in backend/.env before starting the API.")

    try:
        from psycopg import connect
        from psycopg_pool import ConnectionPool
    except ImportError as exc:
        raise RuntimeError("Psycopg is missing. Install backend/requirements.txt before starting the API.") from exc

    def verify_credentials() -> None:
        with connect(dsn, connect_timeout=8) as connection:
            cursor = connection.execute("SELECT 1")
            cursor.fetchone()

    try:
        # Check credentials before starting pool workers. Invalid passwords
        # otherwise cause repeated background reconnects during pool startup.
        await asyncio.to_thread(verify_credentials)
    except Exception as exc:
        if getattr(exc, "sqlstate", None) == "28P01":
            raise RuntimeError(
                "PostgreSQL rejected the DATABASE_URL credentials (SQLSTATE 28P01). "
                "Update the URI with the current Supabase database password."
            ) from None
        raise RuntimeError("Could not connect to PostgreSQL. Check DATABASE_URL, SSL, and network reachability.") from None

    # Psycopg async connections require SelectorEventLoop on Windows, while
    # Uvicorn uses ProactorEventLoop by default. Run sync pool work in threads.
    pool = ConnectionPool(
        conninfo=dsn,
        min_size=1,
        max_size=5,
        timeout=10,
        open=False,
    )
    def check_connection() -> None:
        with pool.connection() as connection:
            cursor = connection.execute("SELECT 1")
            cursor.fetchone()

    try:
        await asyncio.to_thread(pool.open, wait=True)
        await asyncio.to_thread(check_connection)
    except Exception:
        await asyncio.to_thread(pool.close)
        # Driver exceptions can include connection details; never log the DSN.
        raise RuntimeError("Could not connect to PostgreSQL. Check DATABASE_URL, SSL, and network reachability.") from None
    return pool


async def close_database_pool(pool) -> None:
    await asyncio.to_thread(pool.close)


async def check_database_pool(pool) -> None:
    def check() -> None:
        with pool.connection() as connection:
            cursor = connection.execute("SELECT 1")
            cursor.fetchone()

    await asyncio.to_thread(check)
