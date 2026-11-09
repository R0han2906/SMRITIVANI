"""Focused Pydantic and route-payload tests for caregiver-only sign-in."""

from __future__ import annotations

import unittest
from uuid import UUID

from pydantic import ValidationError

from backend.routes import access, auth, resources
from backend.schema.api import (
    ClaimElderProfileRequest,
    ElderCreate,
    LoginRequest,
    RefreshRequest,
    SignupRequest,
)
from backend.utils.claim_codes import generate_claim_code, hash_claim_code, normalize_claim_code


class AuthPayloadTests(unittest.TestCase):
    def test_signup_only_allows_caregiver_accounts(self):
        caregiver = SignupRequest(
            email="caregiver@example.com",
            password="CaregiverPass123!",
            display_name="Caregiver",
            account_type="caregiver",
        )
        self.assertEqual(caregiver.account_type, "caregiver")
        with self.assertRaises(ValidationError):
            SignupRequest(
                email="patient@example.com",
                password="PatientPass123!",
                display_name="Patient",
                account_type="patient",
            )

    def test_signup_rejects_missing_or_privileged_account_type(self):
        with self.assertRaises(ValidationError):
            SignupRequest(
                email="caregiver@example.com",
                password="CaregiverPass123!",
                display_name="Caregiver",
            )
        with self.assertRaises(ValidationError):
            SignupRequest(
                email="caregiver@example.com",
                password="CaregiverPass123!",
                display_name="Caregiver",
                account_type="admin",
            )

    def test_login_and_refresh_payloads_require_credentials(self):
        self.assertEqual(LoginRequest(email="patient@example.com", password="Pass123!").email, "patient@example.com")
        self.assertEqual(RefreshRequest(refresh_token="r" * 32).refresh_token, "r" * 32)
        with self.assertRaises(ValidationError):
            RefreshRequest(refresh_token="short")


class AuthRoutePayloadTests(unittest.TestCase):
    def test_signup_maps_caregiver_type_to_supabase_auth_metadata(self):
        body = SignupRequest(
            email="caregiver@example.com",
            password="CaregiverPass123!",
            display_name="Caregiver",
            account_type="caregiver",
        )
        payload = auth.signup_payload(body)
        self.assertEqual(payload["data"]["account_type"], "caregiver")
        self.assertEqual(payload["email"], "caregiver@example.com")

    def test_claim_code_request_normalizes_grouping_and_case(self):
        normalized = "ABCDEFGHJKMNPQRSTVWXYZ2345"
        request = ClaimElderProfileRequest(code=" abcdE-fghjk-mnpqr-stvwx-yz2345 ")
        self.assertEqual(request.code, normalized)
        with self.assertRaises(ValidationError):
            ClaimElderProfileRequest(code="not-a-real-claim-code")
        with self.assertRaises(ValidationError):
            ClaimElderProfileRequest(code=normalized, extra="admin")

    def test_generated_claim_code_is_formatted_valid_and_only_hash_is_sent(self):
        code = generate_claim_code()
        request = ClaimElderProfileRequest(code=code)
        self.assertEqual(len(normalize_claim_code(code)), 26)
        self.assertEqual(len(code), 30)
        digest = hash_claim_code(code)
        self.assertEqual(len(digest), 64)
        self.assertNotEqual(digest, code)
        self.assertEqual(access.claim_profile_rpc_payload(request), {"p_code_hash": digest})

    def test_issue_claim_code_rpc_payload_contains_trusted_fields(self):
        elder_id = UUID("aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa")
        from datetime import datetime, timezone

        expires_at = datetime(2026, 11, 7, 12, 0, tzinfo=timezone.utc)
        payload = access.issue_claim_code_rpc_payload(elder_id, "a" * 64, expires_at)
        self.assertEqual(payload["p_elder_id"], str(elder_id))
        self.assertEqual(payload["p_code_hash"], "a" * 64)
        self.assertTrue(payload["p_expires_at"].startswith("2026-11-07T12:00:00"))

    def test_elder_create_rpc_payload_has_no_client_supplied_actor_or_role(self):
        body = ElderCreate(
            name="Rohan",
            age=75,
            language="english",
            city="Mumbai",
            doctor_name="Dr. Naman",
            doctor_phone="7894561233",
        )
        payload = resources.elder_create_rpc_payload(body)
        self.assertEqual(payload["p_name"], "Rohan")
        self.assertEqual(payload["p_language"], "english")
        self.assertEqual(payload["p_timezone"], "Asia/Kolkata")
        self.assertTrue(payload["p_lives_alone"])
        self.assertNotIn("created_by_user_id", payload)
        self.assertNotIn("user_id", payload)
        self.assertNotIn("role", payload)


if __name__ == "__main__":
    unittest.main()
