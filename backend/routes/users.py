"""Authenticated user profile endpoints."""

from fastapi import APIRouter, HTTPException

from backend.middleware.auth import CurrentUser
from backend.schema.api import ProfileUpdate
from backend.services.supabase import request_json, rest_table_path

router = APIRouter(prefix="/users", tags=["users"])
TABLE = rest_table_path("user_profiles")


@router.get("/me", summary="Get my profile")
async def get_profile(user: CurrentUser):
    rows = await request_json("GET", TABLE, token=user["access_token"], params={"user_id": f"eq.{user['id']}", "select": "*"})
    if not rows:
        raise HTTPException(status_code=404, detail="Profile not found. Check the signup profile trigger in the database.")
    return rows[0]


@router.patch("/me", summary="Update my profile")
async def update_profile(body: ProfileUpdate, user: CurrentUser):
    payload = body.model_dump(exclude_unset=True)
    if not payload:
        raise HTTPException(status_code=422, detail="Provide at least one profile field to update.")
    rows = await request_json("PATCH", TABLE, token=user["access_token"], params={"user_id": f"eq.{user['id']}", "select": "*"}, payload=payload, prefer="return=representation")
    if not rows:
        raise HTTPException(status_code=404, detail="Profile not found.")
    return rows[0]
