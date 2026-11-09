# Authentication and two-device integration

## Caregiver session

1. Caregivers sign up or log in through Supabase Auth. Public signup is restricted to caregiver accounts.
2. The backend validates caregiver bearer JWTs and forwards user-scoped Supabase REST calls so existing RLS policies remain active.
3. Onboarding creates the elder profile and saves caregiver-entered medicines, family information, events, and memories through existing API contracts.
4. Caregiver routes require the caregiver JWT. Explicit logout clears that session.

## Elderly device session

1. From Dashboard or Settings, the caregiver issues a short-lived one-time numeric code for the selected elder.
2. On the separate elderly browser, **I’m the patient** opens the large keypad at `/elderly/pair`.
3. `POST /api/pairing/verify` exchanges the code for an opaque device token. The browser stores that token and the elder ID in local storage; no caregiver credentials are placed on the elderly device.
4. The device sends `X-Device-Token`. Backend pairing routes resolve the token to one elder profile and use that elder ID for resource access.
5. On future visits the app validates the token and opens the elder home. Invalid/revoked tokens return to the pairing screen.
6. The caregiver can inspect device activity or revoke active device tokens.

## Database approval and configuration

The code requires new tables proposed in `backend/schema/migrations/0004_device_pairing_voice.sql`. The migration has not been applied. Do not use pairing or voice insights against a Supabase project until the project owner reviews and applies it. The code change is an additive migration proposal; no existing schema was replaced.

Backend `.env` continues to require `DATABASE_URL`, `SUPABASE_URL`, and `SUPABASE_PUBLISHABLE_KEY`. Add a random `DEVICE_PAIRING_PEPPER` (at least 32 characters). `AI_MODE=mock` uses browser speech and local classification without AI keys. `AI_MODE=hybrid` enables optional Gemini/Groq response providers.

See `backend/docs/routes.md`, `../docs/API_REFERENCE.md`, and `../docs/END_TO_END_TEST_GUIDE.md` for route contracts and manual steps. The coding agent did not test or run the app for this implementation.
