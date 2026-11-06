"""Authentication dependency for requests that require a signed-in user."""

from __future__ import annotations

import asyncio
import json
from typing import Annotated
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from backend.services.supabase import get_supabase_settings

bearer_scheme = HTTPBearer(auto_error=False)


async def require_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
) -> dict[str, str]:
    if credentials is None:
        raise HTTPException(status_code=401, detail="A Supabase access token is required.")

    url, key = get_supabase_settings()
    request = Request(
        f"{url}/auth/v1/user",
        headers={"apikey": key, "Authorization": f"Bearer {credentials.credentials}"},
    )

    def validate() -> tuple[int, bytes]:
        try:
            with urlopen(request, timeout=15) as response:
                return response.status, response.read()
        except HTTPError as exc:
            return exc.code, exc.read()
        except (URLError, TimeoutError) as exc:
            raise HTTPException(status_code=502, detail="Could not validate the access token.") from exc

    status_code, content = await asyncio.to_thread(validate)
    if status_code != 200:
        raise HTTPException(status_code=401, detail="The access token is invalid or expired.")
    user = json.loads(content)
    user_id = user.get("id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Supabase did not return a valid user.")
    return {"id": user_id, "access_token": credentials.credentials}


CurrentUser = Annotated[dict[str, str], Depends(require_user)]
