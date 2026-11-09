"""Basic Supabase email/password sign-up endpoint."""

from fastapi import APIRouter, HTTPException

from backend.middleware.auth import CurrentUser
from backend.schema.api import LoginRequest, RefreshRequest, SignupRequest
from backend.services.supabase import request_json

router = APIRouter(prefix="/auth", tags=["authentication"])


def signup_payload(body: SignupRequest) -> dict:
    """Map the validated signup form to Supabase Auth's expected payload."""
    return {
        "email": body.email.strip(),
        "password": body.password,
        "data": {"display_name": body.display_name.strip(), "account_type": body.account_type},
    }


@router.post("/signup", status_code=201, summary="Create an account")
async def signup(body: SignupRequest) -> dict:
    """Create a separate caregiver or patient Auth account."""
    result = await request_json(
        "POST",
        "/auth/v1/signup",
        payload=signup_payload(body),
    )
    # Supabase may require email confirmation, in which case it returns a user
    # but no session. The client signs in after confirming the email.
    return result


@router.post("/login", summary="Sign in")
async def login(body: LoginRequest) -> dict:
    """Exchange caregiver email/password for a Supabase access and refresh token."""
    try:
        result = await request_json(
            "POST",
            "/auth/v1/token?grant_type=password",
            payload={"email": body.email.strip(), "password": body.password},
        )
    except HTTPException as exc:
        if exc.status_code == 422:
            raise HTTPException(status_code=401, detail="Sign-in failed. Check your email and password, create an account with /api/auth/signup if you have not registered, and confirm your email if required.") from exc
        raise
    user = result.get("user") if isinstance(result, dict) else None
    metadata = user.get("user_metadata") if isinstance(user, dict) else None
    if not isinstance(metadata, dict) or metadata.get("account_type") != "caregiver":
        raise HTTPException(status_code=403, detail="Only caregiver accounts can sign in. Patients use the device set up by their caregiver.")
    return result


@router.post("/refresh", summary="Refresh a Supabase session")
async def refresh(body: RefreshRequest) -> dict:
    """Exchange a refresh token for a new access/refresh token pair."""
    try:
        return await request_json(
            "POST",
            "/auth/v1/token?grant_type=refresh_token",
            payload={"refresh_token": body.refresh_token},
        )
    except HTTPException as exc:
        if exc.status_code == 422:
            raise HTTPException(status_code=401, detail="Refresh token is invalid or expired.") from exc
        raise


@router.post("/logout", status_code=204, summary="Sign out the current session")
async def logout(user: CurrentUser) -> None:
    await request_json("POST", "/auth/v1/logout", token=user["access_token"])
