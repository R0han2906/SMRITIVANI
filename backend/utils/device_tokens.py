"""Opaque device-token helpers. Only SHA-256 digests are persisted."""

from __future__ import annotations

import hashlib
import hmac
import os
import secrets


def generate_device_token() -> str:
    return secrets.token_urlsafe(32)


def hash_device_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def hash_pairing_code(code: str) -> str:
    """Pepper the low-entropy human code before storing its digest."""
    pepper = os.getenv("DEVICE_PAIRING_PEPPER", "").strip()
    if len(pepper) < 32:
        raise RuntimeError("DEVICE_PAIRING_PEPPER must be set to a random value of at least 32 characters.")
    return hmac.new(pepper.encode("utf-8"), code.encode("ascii"), hashlib.sha256).hexdigest()
