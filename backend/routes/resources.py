"""RLS-backed CRUD for shared elder records.

Columns are explicitly allowlisted so callers cannot set audit fields, IDs,
timestamps, or fields owned by the assistant. Database RLS remains the final
authorization boundary for each signed-in family member.
"""

from __future__ import annotations

from typing import Any
from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, ConfigDict

from backend.middleware.auth import CurrentUser
from backend.schema.api import ElderCreate, ElderUpdate
from backend.services.supabase import request_json, rest_table_path

router = APIRouter(prefix="/elders", tags=["elder data"])

# API resource -> database table, writable fields, and allowed operations.
RESOURCES: dict[str, dict[str, Any]] = {
    "memberships": {"table": "elder_memberships", "create": {"user_id", "role", "relationship_to_elder"}, "update": {"role", "relationship_to_elder", "status"}, "delete": True},
    "contacts": {"table": "elder_contacts", "create": {"name", "relationship", "phone", "city", "is_emergency_contact"}, "update": {"name", "relationship", "phone", "city", "is_emergency_contact"}, "delete": True},
    "memories": {"table": "memories", "create": {"type", "name", "relationship", "info"}, "update": {"type", "name", "relationship", "info"}, "delete": True},
    "memory-assets": {"table": "memory_assets", "create": {"memory_id", "media_type", "storage_path", "mime_type", "byte_size", "caption"}, "update": set(), "delete": True},
    "events": {"table": "events", "create": {"title", "description", "starts_at", "ends_at", "recurrence_rule", "status"}, "update": {"title", "description", "starts_at", "ends_at", "recurrence_rule", "status"}, "delete": True},
    "medicines": {"table": "medicines", "create": {"name", "dosage", "instructions", "schedule_time", "days_of_week", "active"}, "update": {"name", "dosage", "instructions", "schedule_time", "days_of_week", "active"}, "delete": True},
    "medicine-logs": {"table": "medicine_logs", "order": "recorded_at.desc", "create": {"medicine_id", "scheduled_for", "status", "note"}, "update": {"status", "note"}, "delete": False},
    "daily-logs": {"table": "daily_logs", "create": set(), "update": set(), "delete": False},
    "voice-notes": {"table": "voice_notes", "create": {"storage_path", "mime_type", "transcript"}, "update": set(), "delete": False},
    "alerts": {"table": "alerts", "create": {"type", "transcript", "audio_storage_path"}, "update": {"status"}, "delete": False},
    "conversations": {"table": "conversations", "create": set(), "update": {"ended_at"}, "delete": False},
    "messages": {"table": "conversation_messages", "create": {"conversation_id", "turn_number", "speaker", "content", "intent", "audio_storage_path"}, "update": set(), "delete": False},
}


def elder_create_rpc_payload(body: ElderCreate) -> dict[str, Any]:
    """Map the validated form to the trusted create function's named args."""
    return {
        "p_name": body.name,
        "p_age": body.age,
        "p_language": body.language,
        "p_city": body.city,
        "p_timezone": body.timezone,
        "p_lives_alone": body.lives_alone,
        "p_doctor_name": body.doctor_name,
        "p_doctor_phone": body.doctor_phone,
    }


@router.get("", summary="List elders I can access")
async def list_elders(user: CurrentUser, limit: int = Query(100, ge=1, le=500), offset: int = Query(0, ge=0)):
    rows = await request_json(
        "GET", rest_table_path("elders"), token=user["access_token"],
        params={"select": "*", "order": "created_at.desc", "limit": str(limit), "offset": str(offset)},
    )
    return {"items": rows, "limit": limit, "offset": offset}


@router.post("", status_code=201, summary="Create an elder")
async def create_elder(body: ElderCreate, user: CurrentUser):
    rows = await request_json(
        "POST",
        "/rest/v1/rpc/create_elder_profile",
        token=user["access_token"],
        payload=elder_create_rpc_payload(body),
    )
    if not isinstance(rows, list) or not rows:
        raise HTTPException(status_code=502, detail="The elder profile could not be confirmed.")
    return rows[0]


@router.get("/{elder_id}", summary="Get an elder")
async def get_elder(elder_id: UUID, user: CurrentUser):
    rows = await request_json(
        "GET", rest_table_path("elders"), token=user["access_token"],
        params={"id": f"eq.{elder_id}", "select": "*"},
    )
    if not rows:
        raise HTTPException(status_code=404, detail="Elder not found or not accessible.")
    return rows[0]


@router.patch("/{elder_id}", summary="Update an elder")
async def update_elder(elder_id: UUID, body: ElderUpdate, user: CurrentUser):
    payload = body.model_dump(exclude_unset=True)
    if not payload:
        raise HTTPException(status_code=422, detail="Provide at least one elder field to update.")
    payload["updated_by_user_id"] = user["id"]
    rows = await request_json(
        "PATCH", rest_table_path("elders"), token=user["access_token"],
        params={"id": f"eq.{elder_id}", "select": "*"}, payload=payload, prefer="return=representation",
    )
    if not rows:
        raise HTTPException(status_code=404, detail="Elder not found or not accessible.")
    return rows[0]


@router.delete("/{elder_id}", status_code=204, summary="Delete an elder")
async def delete_elder(elder_id: UUID, user: CurrentUser):
    rows = await request_json(
        "DELETE", rest_table_path("elders"), token=user["access_token"],
        params={"id": f"eq.{elder_id}", "select": "id"}, prefer="return=representation",
    )
    if not rows:
        raise HTTPException(status_code=404, detail="Elder not found or not accessible.")
    return None


class RecordBody(BaseModel):
    model_config = ConfigDict(extra="forbid")

    data: dict[str, Any]


def resource_config(resource: str) -> dict[str, Any]:
    config = RESOURCES.get(resource)
    if not config:
        raise HTTPException(status_code=404, detail="Unknown elder resource.")
    return config


def clean_data(data: dict[str, Any], allowed: set[str]) -> dict[str, Any]:
    if not data:
        raise HTTPException(status_code=422, detail="Request data cannot be empty.")
    invalid = set(data) - allowed
    if invalid:
        raise HTTPException(status_code=422, detail=f"Fields cannot be written: {', '.join(sorted(invalid))}.")
    return data


@router.get("/{elder_id}/{resource}", summary="List records for an elder")
async def list_records(elder_id: UUID, resource: str, user: CurrentUser, limit: int = Query(100, ge=1, le=500), offset: int = Query(0, ge=0)):
    config = resource_config(resource)
    rows = await request_json(
        "GET", rest_table_path(config["table"]), token=user["access_token"],
        params={"elder_id": f"eq.{elder_id}", "select": "*", "limit": str(limit), "offset": str(offset), "order": config.get("order", "created_at.desc")},
    )
    return {"items": rows, "limit": limit, "offset": offset}


@router.get("/{elder_id}/{resource}/{record_id}", summary="Get one elder record")
async def get_record(elder_id: UUID, resource: str, record_id: UUID, user: CurrentUser):
    config = resource_config(resource)
    rows = await request_json(
        "GET", rest_table_path(config["table"]), token=user["access_token"],
        params={"id": f"eq.{record_id}", "elder_id": f"eq.{elder_id}", "select": "*"},
    )
    if not rows:
        raise HTTPException(status_code=404, detail="Record not found or not accessible.")
    return rows[0]


@router.post("/{elder_id}/{resource}", status_code=201, summary="Create a shared elder record")
async def create_record(elder_id: UUID, resource: str, body: RecordBody, user: CurrentUser):
    config = resource_config(resource)
    if config["table"] in {"daily_logs", "conversations"}:
        raise HTTPException(status_code=405, detail="This resource is written by trusted backend workflows.")
    data = clean_data(body.data, config["create"])
    data["elder_id"] = str(elder_id)
    # Only explicit audit/actor columns are supplied by the authenticated user.
    if config["table"] in {"elder_contacts", "memories", "events", "medicines", "alerts", "conversation_messages"}:
        data["created_by_user_id"] = user["id"]
    if config["table"] == "elder_memberships":
        data["added_by_user_id"] = user["id"]
    if config["table"] == "medicine_logs":
        data["recorded_by_user_id"] = user["id"]
    if config["table"] == "voice_notes":
        data["sender_user_id"] = user["id"]
    if config["table"] == "conversations":
        data["started_by_user_id"] = user["id"]
    if config["table"] == "memory_assets":
        data["bucket_name"] = "elder-media"
    if config["table"] == "conversation_messages":
        data["speaker"] = "caregiver" if data.get("speaker") != "patient" else "patient"
    rows = await request_json("POST", rest_table_path(config["table"]), token=user["access_token"], params={"select": "*"}, payload=data, prefer="return=representation")
    return rows[0]


@router.patch("/{elder_id}/{resource}/{record_id}", summary="Update a shared elder record")
async def update_record(elder_id: UUID, resource: str, record_id: UUID, body: RecordBody, user: CurrentUser):
    config = resource_config(resource)
    if not config["update"]:
        raise HTTPException(status_code=405, detail="This resource cannot be updated through this endpoint.")
    data = clean_data(body.data, config["update"])
    if config["table"] in {"elder_contacts", "memories", "events", "medicines", "alerts"}:
        data["updated_by_user_id"] = user["id"]
    if config["table"] == "elder_memberships":
        data["updated_by_user_id"] = user["id"]
    if config["table"] == "alerts" and "status" in data:
        if data["status"] in {"resolved", "false_alarm"}:
            data["resolved_at"] = datetime.now(timezone.utc).isoformat()
            data["resolved_by_user_id"] = user["id"]
        else:
            data["resolved_at"] = None
            data["resolved_by_user_id"] = None
    rows = await request_json("PATCH", rest_table_path(config["table"]), token=user["access_token"], params={"id": f"eq.{record_id}", "elder_id": f"eq.{elder_id}", "select": "*"}, payload=data, prefer="return=representation")
    if not rows:
        raise HTTPException(status_code=404, detail="Record not found or not accessible.")
    return rows[0]


@router.delete("/{elder_id}/{resource}/{record_id}", status_code=204, summary="Delete a shared elder record")
async def delete_record(elder_id: UUID, resource: str, record_id: UUID, user: CurrentUser):
    config = resource_config(resource)
    if not config["delete"]:
        raise HTTPException(status_code=405, detail="This resource cannot be deleted through this endpoint.")
    rows = await request_json("DELETE", rest_table_path(config["table"]), token=user["access_token"], params={"id": f"eq.{record_id}", "elder_id": f"eq.{elder_id}", "select": "id"}, prefer="return=representation")
    if not rows:
        raise HTTPException(status_code=404, detail="Record not found or not accessible.")
    return None
