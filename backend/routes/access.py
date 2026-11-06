"""Caregiver-issued, one-time codes that link a patient account to a profile."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from uuid import UUID

from fastapi import APIRouter, HTTPException, Response

from backend.middleware.auth import CurrentUser
from backend.schema.api import ClaimElderProfileRequest
from backend.services.supabase import request_json
from backend.utils.claim_codes import generate_claim_code, hash_claim_code

router = APIRouter(tags=["elder profile access"])
CLAIM_CODE_TTL = timedelta(hours=24)


def issue_claim_code_rpc_payload(elder_id: UUID, code_hash: str, expires_at: datetime) -> dict[str, str]:
    """Build the trusted fields for the caregiver-only SQL function."""
    return {
        "p_elder_id": str(elder_id),
        "p_code_hash": code_hash,
        "p_expires_at": expires_at.isoformat(),
    }


def claim_profile_rpc_payload(body: ClaimElderProfileRequest) -> dict[str, str]:
    """Send only a one-way digest to Postgres; never store the submitted code."""
    return {"p_code_hash": hash_claim_code(body.code)}


@router.post(
    "/elders/{elder_id}/claim-code",
    status_code=201,
    summary="Create a one-time patient claim code",
)
async def issue_elder_claim_code(elder_id: UUID, user: CurrentUser) -> dict[str, str | int]:
    """Create a 24-hour claim code; database authorization requires caregiver access."""
    code = generate_claim_code()
    expires_at = datetime.now(timezone.utc) + CLAIM_CODE_TTL
    await request_json(
        "POST",
        "/rest/v1/rpc/issue_elder_claim_code",
        token=user["access_token"],
        payload=issue_claim_code_rpc_payload(elder_id, hash_claim_code(code), expires_at),
    )
    # This is the only response containing the raw code. Clients may display it
    # once or encode this exact string in a QR; do not put it in logs or URLs.
    return {
        "elder_id": str(elder_id),
        "claim_code": code,
        "expires_at": expires_at.isoformat(),
        "expires_in_seconds": int(CLAIM_CODE_TTL.total_seconds()),
    }


@router.post(
    "/users/me/elder-claim",
    summary="Claim a caregiver-prepared elder profile",
)
async def claim_elder_profile(body: ClaimElderProfileRequest, user: CurrentUser) -> dict:
    """Attach the authenticated patient account to the code's elder profile."""
    try:
        result = await request_json(
            "POST",
            "/rest/v1/rpc/claim_elder_profile",
            token=user["access_token"],
            payload=claim_profile_rpc_payload(body),
        )
    except HTTPException as exc:
        if exc.status_code in {400, 404, 409}:
            # Avoid revealing whether a code exists, has expired, or was used.
            raise HTTPException(
                status_code=400,
                detail="Claim code is invalid, expired, already used, or the profile is unavailable.",
            ) from None
        raise
    if not isinstance(result, dict) or not result.get("elder_id"):
        raise HTTPException(status_code=502, detail="The profile claim could not be confirmed.")
    return result


@router.delete(
    "/elders/{elder_id}/claim-code",
    status_code=204,
    summary="Revoke an unused patient claim code",
)
async def revoke_elder_claim_code(elder_id: UUID, user: CurrentUser) -> Response:
    """Revoke any active claim code; issuing another code also replaces it."""
    await request_json(
        "POST",
        "/rest/v1/rpc/revoke_elder_claim_code",
        token=user["access_token"],
        payload={"p_elder_id": str(elder_id)},
    )
    return Response(status_code=204)
