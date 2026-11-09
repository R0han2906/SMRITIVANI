"""Request models for authentication and the current user's profile."""

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator

from backend.utils.claim_codes import normalize_claim_code


class SignupRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    email: str = Field(pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$", max_length=320)
    password: str = Field(min_length=8, max_length=128)
    display_name: str = Field(min_length=1, max_length=160)
    account_type: Literal["caregiver"]


class LoginRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    email: str = Field(pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$", max_length=320)
    password: str = Field(min_length=1, max_length=128)


class RefreshRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    refresh_token: str = Field(min_length=20, max_length=4096)


class ClaimElderProfileRequest(BaseModel):
    """One-time caregiver-issued code used by a patient to claim a profile."""

    model_config = ConfigDict(extra="forbid")

    code: str = Field(min_length=26, max_length=34)

    @field_validator("code")
    @classmethod
    def validate_and_normalize_code(cls, value: str) -> str:
        return normalize_claim_code(value)


class ElderCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str = Field(min_length=1, max_length=200)
    age: int | None = Field(default=None, ge=0, le=125)
    language: str = Field(default="english", min_length=2, max_length=40)
    city: str | None = Field(default=None, max_length=160)
    timezone: str = Field(default="Asia/Kolkata", max_length=80)
    lives_alone: bool = True
    doctor_name: str | None = Field(default=None, max_length=200)
    doctor_phone: str | None = Field(default=None, max_length=40)


class ElderUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str | None = Field(default=None, min_length=1, max_length=200)
    age: int | None = Field(default=None, ge=0, le=125)
    language: str | None = Field(default=None, min_length=2, max_length=40)
    city: str | None = Field(default=None, max_length=160)
    timezone: str | None = Field(default=None, max_length=80)
    lives_alone: bool | None = None
    doctor_name: str | None = Field(default=None, max_length=200)
    doctor_phone: str | None = Field(default=None, max_length=40)


class ProfileUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    display_name: str | None = Field(default=None, min_length=1, max_length=160)
    phone: str | None = Field(default=None, max_length=40)
    city: str | None = Field(default=None, max_length=160)
