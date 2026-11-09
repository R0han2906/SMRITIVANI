# Backend Agent Instructions

## Product and scope

SmritiVani is a voice-first companion for older adults in India, with patient and caregiver experiences. Keep backend changes focused and understandable. Deployment is out of scope unless explicitly requested.

## Project conventions

- FastAPI entry point: `backend/app.py`; default local API port: `8020`.
- Keep HTTP handlers in `backend/routes`, request models in `backend/schema`, authentication in `backend/middleware`, integrations and database access in `backend/services`, shared helpers in `backend/utils`, and validation helpers in `backend/validators`.
- Keep route and data contracts documented in `backend/docs/routes.md`; update the other docs when behavior changes.
- Load configuration from environment variables. Never commit real credentials, tokens, database dumps, private uploads, or local environment files.
- Add ordered SQL migrations for database changes. Do not silently edit an already-applied migration to change production data structures.

## Account and access rules

- Signup and login are caregiver-only. The elderly person does not use an email/password account or caregiver JWT.
- The caregiver creates the care profile. The database assigns the creator the initial `admin` membership.
- The caregiver issues a short-lived, one-time numeric pairing code. A separate elderly device exchanges that code for an opaque device token and stores the token locally. Never use a pairing code as a password or permanent credential.
- Raw pairing codes and device tokens must not be logged or persisted. Store only a keyed digest of short pairing codes and a SHA-256 digest of random device tokens.
- Legacy patient-account claim RPCs/migrations may remain in existing Supabase data, but the current product flow does not ask patients to sign up or log in.
- Caregiver access to additional profiles must use active membership records; a contact or relative listed in `contacts` does not receive login access.
- Do not trust user IDs, roles, creator IDs, or audit fields from request bodies. Derive the caregiver actor from the validated Supabase bearer token; derive the elderly profile from the validated paired-device token.
- Use the caller's access token for user-scoped Auth/PostgREST operations so database row-level security applies to that caller. For direct database operations, set transaction-local verified auth claims and explicitly check elder membership. Never accept a user ID without first validating its JWT.

## Data and media rules

- Every elder-owned record must stay scoped to its `elder_id`; keep cross-profile access enforced by database RLS.
- Keep `elders.patient_user_id` writable only by the patient-claim function. Do not add it to API write allowlists.
- Memories support `family`, `preference`, `fact`, and `story` types. Memory images/audio are private storage objects; Postgres stores metadata and object paths, never file bytes or public URLs.
- The current API exposes `memory-assets` and `voice-notes` metadata operations, but does not implement binary upload/download or signed URL routes. Do not imply otherwise in frontend or API docs.
- Daily recaps and assistant-owned conversation records must be written only by trusted backend workflows. Do not expose client writes to those records.
- Keep the elder language default as English.
- One caregiver may support many elders; one elder may have several caregivers. Store each relationship and permission in `elder_memberships`.

## Integrations and tests

- Keep Gnani credentials server-side. Verify current official Gnani API documentation before implementing speech calls.
- Unit tests validate local request models/helpers; they do not prove Supabase RLS or live migration behavior. Be precise about verification claims.
- Database integration checks should use a disposable Supabase project and include role boundaries, cross-elder isolation, and concurrent claim/reissue scenarios.
- Do not claim a migration is installed without checking the target database. Migrations are applied explicitly; FastAPI startup does not apply them.
