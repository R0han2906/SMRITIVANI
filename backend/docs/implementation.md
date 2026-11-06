# Backend Implementation Guide

## Architecture

- `backend/app.py` loads `backend/.env`, creates the FastAPI application, mounts routers, and opens/closes the PostgreSQL pool during lifespan.
- `backend/routes/` contains HTTP endpoints. `backend/middleware/auth.py` validates bearer tokens using Supabase Auth.
- `backend/schema/` contains Pydantic request models and ordered SQL migrations.
- `backend/services/supabase.py` makes caller-scoped Auth/PostgREST requests. `backend/services/database.py` opens the direct PostgreSQL pool used by startup and health checks.
- `backend/utils/` contains shared helpers such as claim-code generation and normalization.
- Resource endpoints restrict writable columns before making PostgREST requests; database RLS still decides whether the caller may read or change each row.

## Identity and authorization model

Supabase Auth owns credentials and session tokens. The `user_profiles` table stores each Auth user's display name and account type (`caregiver` or `patient`). The database signup trigger creates the profile.

`elders` stores the care profile. The creator must be a caregiver and receives an `admin` membership via the database trigger. A separate patient account links to the profile through the one-time claim flow. `elder_memberships` grants elder-scoped access with roles `admin`, `caregiver`, `viewer`, or `patient`; an elder may have multiple caregivers and a caregiver may access multiple elders. `elder_contacts` is an address-book list and does not grant application access.

The backend forwards the authenticated user's access token to PostgREST. Never accept an actor ID or authorization role from the client as proof of permission. A frontend should treat inaccessible and nonexistent records alike where the API returns “not found or not accessible.”

## Data model overview

| Table | Purpose |
|---|---|
| `user_profiles` | Auth-linked account profile and account type. |
| `elders` | Elder care profile and patient-account link. |
| `elder_memberships` | User-to-elder roles, relationship label, and active/revoked state. |
| `elder_claim_codes` | Digest and lifecycle state for caregiver-issued one-time patient claim codes. |
| `elder_access_requests` | Legacy records from the first migration; the newer code-claim flow does not use it. |
| `elder_contacts` | Relatives/neighbors without application accounts. |
| `memories`, `memory_assets` | Elder memories and metadata for private image/audio objects. |
| `events` | Appointments and other dated events. |
| `medicines`, `medicine_logs` | Medicine schedule and recorded dose outcomes. |
| `daily_logs` | Daily mood, recap, and totals; trusted workflow writes only. |
| `voice_notes`, `alerts` | Voice-note metadata and patient alerts. |
| `conversations`, `conversation_messages` | Conversation sessions and ordered turns. |

Binary media belongs in private storage. The current API can create/read/delete some metadata records, but does not upload bytes or create signed URLs. See [routes.md](routes.md) for each resource's actual capabilities and field allowlist.

## Environment configuration

Put local values in ignored `backend/.env`. The application currently reads:

| Key | Required | Purpose |
|---|---:|---|
| `DATABASE_URL` | Yes | Direct PostgreSQL connection used to open the startup pool. Use the proper SSL options for hosted Supabase. |
| `SUPABASE_URL` | Yes for Auth/PostgREST | Supabase project URL. Must match the database project. |
| `SUPABASE_PUBLISHABLE_KEY` | Yes for Auth/PostgREST | Supabase public/publishable project key; caller bearer tokens provide user identity. |
| `APP_NAME` | No | FastAPI title; defaults to `SmritiVani API`. |
| `API_PREFIX` | No | Router prefix; defaults to `/api`. |
| `HOST` | No | Local Uvicorn host; defaults to `127.0.0.1`. |
| `PORT` | No | Local Uvicorn port; defaults to `8020`. |
| `RELOAD` | No | Uvicorn reload switch; defaults to `false`. |

`GNANI_API_KEY` is not currently read by the application; add it when implementing the Gnani service. Do not add Supabase service-role keys or JWT signing secrets for ordinary user-scoped requests. Commit only a placeholder `.env.example`, never real values.

## Migrations

1. `schema/migrations/0001_initial.sql` creates the initial tables, indexes, triggers, RLS policies, grants, and storage bucket configuration.
2. `schema/migrations/0002_patient_claim_codes.sql` adds the one-time claim-code workflow, restricts direct writes to sensitive elder columns, and revokes legacy email-approval RPC access.
3. `schema/migrations/0003_create_elder_profile_rpc.sql` adds authenticated caregiver-only elder profile creation.

Apply migrations in order to the intended Supabase project and record which have been applied. Do not rerun non-idempotent migrations or assume the configured project is up to date. Migration application is not part of API startup.

## Running locally

From the repository's `backend` directory (the directory containing `app.py`) in PowerShell, activate the virtual environment and start the API:

```powershell
.\.venv\Scripts\Activate.ps1
python -m uvicorn app:app --host 127.0.0.1 --port 8020 --reload
```

If your virtual environment is in a different location, adjust only the activation path. Swagger UI is at `http://127.0.0.1:8020/docs` by default.

## Local unit tests

From the repository's `backend` directory:

```powershell
$env:PYTHONPATH = ".."
python -m unittest discover -s test -v
```

Unit tests cover local Pydantic validation, claim-code normalization/hash behavior, and RPC payload helpers. They do not validate live Supabase RLS, database migration state, or multi-user concurrency. Use a disposable Supabase project for those checks.

## Manual authentication and elder-link smoke flow

1. Sign up and log in as a caregiver. Supabase may require email confirmation depending on project settings.
2. In Swagger's **Authorize** dialog, paste the raw `access_token` only (no quotes and no `Bearer ` prefix).
3. Call `POST /api/elders` as the caregiver and save the response's `id`.
4. Call `POST /api/elders/{elder_id}/claim-code`; securely pass the one-time code to the elder, optionally via a QR generated by the client.
5. Sign up/log in as a separate patient account, authorize with the patient's token, then call `POST /api/users/me/elder-claim` with the code.
6. Call `GET /api/elders` as patient and caregiver to confirm both accounts can access the shared profile.
7. Use elder-scoped endpoints only after obtaining that elder's ID. For generic resource routes, the `resource` path value must be one of the exact values in [routes.md](routes.md), and writes must use the `{ "data": { ... } }` body envelope.

Never paste live access tokens or claim codes into chat, screenshots, issue trackers, or logs.
