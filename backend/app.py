"""FastAPI application entry point for SmritiVani."""

from __future__ import annotations

import os
import sys
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from pathlib import Path

# Ensure project root is in sys.path so 'backend.*' imports resolve from any working directory
_ROOT = str(Path(__file__).resolve().parent.parent)
if _ROOT not in sys.path:
    sys.path.insert(0, _ROOT)

import uvicorn
from dotenv import load_dotenv
from fastapi import FastAPI

from backend.routes.health import router as health_router
from backend.routes.auth import router as auth_router
from backend.routes.access import router as access_router
from backend.routes.resources import router as resources_router
from backend.routes.users import router as users_router
from backend.services.database import close_database_pool, open_database_pool

load_dotenv(Path(__file__).with_name(".env"))


@asynccontextmanager
async def lifespan(application: FastAPI) -> AsyncIterator[None]:
    """Open PostgreSQL connections at startup and close them on shutdown."""
    application.state.database = await open_database_pool()
    try:
        yield
    finally:
        await close_database_pool(application.state.database)

app = FastAPI(
    title=os.getenv("APP_NAME", "SmritiVani API"),
    version="0.1.0",
    description="Backend API for the SmritiVani voice-first elder companion.",
    lifespan=lifespan,
)

app.include_router(health_router, prefix=os.getenv("API_PREFIX", "/api"))
app.include_router(auth_router, prefix=os.getenv("API_PREFIX", "/api"))
app.include_router(access_router, prefix=os.getenv("API_PREFIX", "/api"))
app.include_router(users_router, prefix=os.getenv("API_PREFIX", "/api"))
app.include_router(resources_router, prefix=os.getenv("API_PREFIX", "/api"))


if __name__ == "__main__":
    uvicorn.run(
        "backend.app:app",
        host=os.getenv("HOST", "127.0.0.1"),
        port=int(os.getenv("PORT", "8020")),
        reload=os.getenv("RELOAD", "false").lower() == "true",
        app_dir=_ROOT,
    )
