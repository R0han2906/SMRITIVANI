"""Generation and normalization for one-time patient profile claim codes."""

from __future__ import annotations

import hashlib
import secrets

# Exclude characters that are easy to confuse when a code is read aloud.
_ALPHABET = "ABCDEFGHJKMNPQRSTVWXYZ23456789"
_CODE_LENGTH = 26


def generate_claim_code() -> str:
    """Generate a printable 26-character code with about 127 bits of entropy."""
    raw = "".join(secrets.choice(_ALPHABET) for _ in range(_CODE_LENGTH))
    return "-".join(raw[index : index + 5] for index in range(0, 20, 5)) + "-" + raw[20:]


def normalize_claim_code(value: str) -> str:
    """Normalize grouped/spaced input and reject characters outside the alphabet."""
    normalized = "".join(character for character in value.upper() if character not in "- \t\r\n")
    if len(normalized) != _CODE_LENGTH or any(character not in _ALPHABET for character in normalized):
        raise ValueError("Enter a valid 26-character elder claim code.")
    return normalized


def hash_claim_code(value: str) -> str:
    """Return the SHA-256 digest stored by the database instead of the raw code."""
    normalized = normalize_claim_code(value)
    return hashlib.sha256(normalized.encode("ascii")).hexdigest()
