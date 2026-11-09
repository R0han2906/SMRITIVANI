# Two-device elderly flow

## Device roles

- The caregiver signs in with Supabase Auth, creates the elder profile, and manages care information from a separate device.
- The caregiver creates a short-lived, one-time six-digit pairing code.
- On the elderly tablet or phone, the caregiver opens **I am the patient**, enters the code with the large keypad, and pairs the device once.
- The elderly browser stores an opaque device token and elder ID in local storage. It does not store caregiver credentials or show a caregiver login screen.
- Later visits validate the device token and open the elderly home. A revoked or invalid token sends the user to the pairing keypad.
- The caregiver may review last-active status and revoke paired devices in Settings.

## Security and data storage

Pairing codes are valid for 15 minutes, usable once, and stored as HMAC-SHA-256 digests using `DEVICE_PAIRING_PEPPER`. Device tokens are random opaque values; only SHA-256 digests are stored. Device tokens are sent in the `X-Device-Token` header. Caregiver API calls continue to use Supabase bearer JWTs.

The required database structures are proposed in [migration 0004](../backend/schema/migrations/0004_device_pairing_voice.sql). This file has **not** been applied. The pairing flow cannot work against Supabase until the migration is reviewed and applied by the project owner. It does not alter the existing tables or existing migrations.

The new backend queries use the application's PostgreSQL connection. Caregiver operations first validate the Supabase JWT, then set transaction-local identity claims before checking the existing elder membership function. Elderly requests are authorized by a valid, active device-token digest, which resolves to exactly one elder profile.

## Voice-first behavior

The elderly home places one large microphone action first, with three large visual backups for medicine, family, and bhajan. Browser speech recognition sends every utterance through `/api/voice/text`; the backend classifies intent/emergency, generates a short local response (or optional LLM response in hybrid mode), stores the interaction, and returns a route action. Browser speech synthesis speaks the response before navigation. Emergency interactions also create caregiver-visible alerts.

When browser speech recognition is unavailable, the UI explains the permission/browser issue and keeps large tap-based access available. Recorded-audio transcription is not active until a verified Gnani ASR contract is supplied. Raw audio is not stored.

