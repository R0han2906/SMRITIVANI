"""Small user-scoped Supabase REST client.

Every database request carries the caller's access token. This lets Postgres RLS
enforce the elder membership and role rules from the SQL migration.
"""

from __future__ import annotations

import os
import asyncio
import json
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import quote, urlencode
from urllib.request import Request, urlopen

from fastapi import HTTPException


def get_supabase_settings() -> tuple[str, str]:
    url = os.getenv("SUPABASE_URL", "").strip().rstrip("/")
    key = os.getenv("SUPABASE_PUBLISHABLE_KEY", "").strip()
    if not url or not key:
        raise HTTPException(
            status_code=503,
            detail="Supabase is not configured. Set SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY.",
        )
    return url, key


def _headers(token: str | None = None, *, prefer: str | None = None) -> dict[str, str]:
    _, key = get_supabase_settings()
    headers = {"apikey": key, "Authorization": f"Bearer {token or key}"}
    if prefer:
        headers["Prefer"] = prefer
    return headers


async def request_json(
    method: str,
    path: str,
    *,
    token: str | None = None,
    params: dict[str, str] | None = None,
    payload: Any = None,
    prefer: str | None = None,
) -> Any:
    url, _ = get_supabase_settings()
    request_url = f"{url}{path}"
    if params:
        request_url += ("&" if "?" in request_url else "?") + urlencode(params)
    headers = _headers(token, prefer=prefer)
    body = json.dumps(payload).encode("utf-8") if payload is not None else None
    if body is not None:
        headers["Content-Type"] = "application/json"
    request = Request(request_url, data=body, headers=headers, method=method)

    def send() -> tuple[int, bytes]:
        try:
            with urlopen(request, timeout=20) as response:
                return response.status, response.read()
        except HTTPError as exc:
            return exc.code, exc.read()
        except TimeoutError as exc:
            raise HTTPException(status_code=504, detail="Supabase request timed out.") from exc
        except URLError as exc:
            if isinstance(exc.reason, TimeoutError):
                raise HTTPException(status_code=504, detail="Supabase request timed out.") from exc
            raise HTTPException(status_code=502, detail="Could not reach Supabase.") from exc

    status_code, content = await asyncio.to_thread(send)
    if not 200 <= status_code < 300:
        raw_error = content.decode("utf-8", errors="replace") if content else ""
        print(f"\n[SUPABASE ERROR] Status: {status_code}\n[SUPABASE ERROR] Body: {raw_error}\n")
        detail = "The Supabase data service returned an error."
        if content:
            try:
                err_data = json.loads(content)
                detail = (
                    err_data.get("msg")
                    or err_data.get("message")
                    or err_data.get("error_description")
                    or err_data.get("detail")
                    or str(err_data)
                )
            except Exception:
                detail = raw_error

        if status_code in (401, 403):
            raise HTTPException(status_code=status_code, detail=detail)
        if status_code == 404:
            raise HTTPException(status_code=404, detail=detail)
        if status_code == 409:
            raise HTTPException(status_code=409, detail=detail)
        if status_code in (400, 422):
            raise HTTPException(status_code=status_code, detail=detail)
        raise HTTPException(status_code=502, detail=detail)
    if not content:
        return None
    return json.loads(content)


def rest_table_path(table: str) -> str:
    return f"/rest/v1/{quote(table, safe='')}"
