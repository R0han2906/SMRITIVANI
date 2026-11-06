"""Operational health route."""

from fastapi import APIRouter, HTTPException, Request

from backend.services.database import check_database_pool

router = APIRouter(tags=["health"])


@router.get("/health", summary="Check API availability")
async def health_check(request: Request) -> dict[str, str]:
    """Report API and PostgreSQL connection health without exposing secrets."""
    pool = getattr(request.app.state, "database", None)
    if pool is None:
        raise HTTPException(status_code=503, detail="PostgreSQL connection pool is not available.")
    try:
        await check_database_pool(pool)
    except Exception:
        raise HTTPException(status_code=503, detail="PostgreSQL is unavailable.") from None
    return {"status": "ok", "database": "connected"}
