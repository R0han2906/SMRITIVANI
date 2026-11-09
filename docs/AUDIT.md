# SmritiVani Codebase Audit

> This document includes historical audit notes from before the two-device and voice follow-up. The current contracts are in [API_REFERENCE.md](API_REFERENCE.md), [AUTH_INTEGRATION.md](AUTH_INTEGRATION.md), [ELDERLY_FLOW.md](ELDERLY_FLOW.md), and [KNOWN_LIMITATIONS.md](KNOWN_LIMITATIONS.md).

## Backend Summary

- Framework: FastAPI with Pydantic request models. Persistence is Supabase Postgres/PostgREST with a direct `psycopg` pool used during app startup and health checks. Authentication delegates signup, password login, refresh, and logout to Supabase Auth.
- Authentication: protected routes require a Supabase bearer access token. `backend/middleware/auth.py` validates it through Supabase Auth and builds the current-user dependency. Database access forwards the caller's token so RLS remains authoritative.
- Routes mounted under `/api` by `backend/app.py`:

| Method | Path | Purpose / auth |
|---|---|---|
| GET | `/api/health` | API/Postgres health; public |
| POST | `/api/auth/signup` | Create caregiver account; public |
| POST | `/api/auth/login` | Exchange password for session; public |
| POST | `/api/auth/refresh` | Refresh session; public |
| POST | `/api/auth/logout` | End session; bearer required |
| GET, PATCH | `/api/users/me` | Read/update own profile; bearer required |
| GET, POST | `/api/elders` | List accessible profiles / create caregiver profile; bearer required |
| GET, PATCH, DELETE | `/api/elders/{elder_id}` | Read/update/delete profile; bearer required |
| POST, DELETE | `/api/elders/{elder_id}/claim-code` | Issue/revoke one-time patient claim code; bearer required |
| POST | `/api/users/me/elder-claim` | Patient redeems claim code; bearer required |
| GET, POST | `/api/elders/{elder_id}/{resource}` | List/create allowlisted shared records; bearer required |
| GET, PATCH, DELETE | `/api/elders/{elder_id}/{resource}/{record_id}` | Read/update/delete record where supported; bearer required |

Resource slugs and field allowlists are in `backend/docs/routes.md`: memberships, contacts, memories, memory-assets, events, medicines, medicine-logs, daily-logs, voice-notes, alerts, conversations, and messages. Generic write payloads use `{ "data": { ... } }`. Daily logs and conversations are not client-created; media endpoints handle metadata only, not binary upload/download.

- Pydantic models in `backend/schema/api.py`: `SignupRequest` (email, password, display_name, account_type caregiver|patient), `LoginRequest` (email/password), `RefreshRequest` (refresh_token), `ClaimElderProfileRequest` (normalized code), `ElderCreate`, `ElderUpdate`, and `ProfileUpdate` (display_name/phone/city).
- Migrations: `0001_initial.sql` creates user/profile, elder/membership, contacts, memories/assets, events, medicines/logs, daily logs, voice notes, alerts, conversations/messages plus RLS/storage setup. `0002_patient_claim_codes.sql` adds patient linking and one-time code table/functions. `0003_create_elder_profile_rpc.sql` adds caregiver-only atomic profile creation. Migrations are explicit and are not applied on startup.
- The backend retains legacy patient-claim endpoints for compatibility. The current product path pairs elderly devices separately with opaque device tokens; elderly users do not log in.
- Environment keys present in `backend/.env` (values intentionally not shown): `APP_NAME`, `APP_ENV`, `HOST`, `PORT`, `API_PREFIX`, `RELOAD`, `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `GNANI_API_KEY`. Runtime code requires `DATABASE_URL` at startup; Supabase operations require `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY`. `GNANI_API_KEY` is not read by the current app. Root `.gitignore` ignores `.env` and `.env.*` while allowing `.env.example`.
- Documentation reviewed: `backend/docs/plan.md`, `routes.md`, `implementation.md`, and `agents.md`. No migration was applied to Supabase. A new additive migration proposal has since been added for owner review.
- Known issues: live DB connectivity and migration state have not been verified in this audit. Health only verifies the PostgreSQL pool, not Supabase Auth configuration or migration completeness.

## Frontend Summary

- Framework: React 19, TypeScript and Vite; React Router 7; Tailwind CSS 4 via Vite plugin; Framer Motion and Lucide icons.
- Routing in `frontend/src/App.tsx`: `/login`, `/signup`, `/onboarding`, `/caregiver`, `/caregiver/memory`, `/caregiver/notes`, `/caregiver/emergency`, `/caregiver/log`, `/caregiver/settings`, `/elderly`, `/elderly/listening`, `/elderly/speaking`, `/elderly/medicine`, `/elderly/events`, `/elderly/family`, `/elderly/activities`, `/elderly/emergency`, `/elderly/recap`; wildcard renders Welcome. Routes currently use `BrowserRouter` directly in App.
- Auth pages: Welcome presents caregiver and elderly-device entry points; Signup and Login call backend auth; Onboarding creates the elder profile and writes supported family, facts, and medicine records. The caregiver dashboard issues device-pairing codes. Elderly pages now use the paired device token and a local/optional LLM voice pipeline.
- `frontend/src/services` and `frontend/src/context` now contain the API client and auth provider. `frontend/.env.example` documents the API and proxy settings; frontend `.gitignore` excludes local `.env*` files.
- Caregiver pages use the shared API service and require a linked/accessible elder profile. Reminder delivery, audio transfer/playback, Gnani audio recognition, and push/SMS emergency notification remain unavailable.

## Compatibility Gaps

- Backend base URL defaults to `http://127.0.0.1:8020` and API prefix `/api`; frontend has no configured API URL or service layer.
- Signup must send `{ email, password, display_name, account_type }`; frontend form state and account type must be checked and adapted to this exact schema. Login sends `{ email, password }`.
- Signup may return a user without tokens when Supabase email confirmation is enabled; client cannot assume an authenticated session immediately follows signup.
- `GET /api/users/me` can validate an access token and returns the profile row. `POST /api/auth/refresh` uses `{ refresh_token }`; logout requires bearer token and returns 204.
- Onboarding maps supported profile fields to `POST /api/elders`. Additional details are stored in existing `memories` and `medicines` resource tables through `POST /api/elders/{elder_id}/{resource}` with a `{ data: ... }` envelope. Gender, living arrangement details, and hospital/clinic are stored as memory facts; family entries use memory type `family`; medicine frequency is recorded in `instructions` because there is no frequency column. No schema change is part of this integration.
- Backend app does not add CORS middleware. The Vite development proxy keeps browser API requests same-origin; direct cross-origin production hosting requires a separately configured proxy or approved CORS setup.
- Existing app UI appears to have local/demo routes and no protected-route mechanism. `/caregiver` and `/onboarding` require frontend protection after auth is integrated.

## Integration Plan

1. At the required Checkpoint 1, manually confirm the backend docs endpoint, frontend Welcome page, browser console, and backend logs.
2. Confirm the local backend origin/API prefix from the actual runtime configuration; create frontend `.env.example` with `VITE_API_URL` and a service that follows the backend's actual request/response contracts.
3. Add auth context for session/token, startup validation with `GET /api/users/me`, and refresh behavior via `/api/auth/refresh`; handle email-confirmation signup responses without assuming tokens exist.
4. Wire Signup/Login forms to `/api/auth/signup` and `/api/auth/login`, preserving current UI and mapping backend error details.
5. Add protected routing for onboarding/caregiver pages, persist session as designed, and connect logout to `/api/auth/logout` before local cleanup.
6. Earlier integration plan retained for history; current auth behavior uses caregiver-only account access and device-local patient mode.

## Integration Status (2026-11-07)

> Historical checkpoint notes below describe the earlier single-browser patient-mode milestone. The current two-device implementation is summarized in the newer documentation linked below.

- Checkpoint 1 and Checkpoint 2 were confirmed passed by the user.
- Added the frontend API service and auth context with token persistence, `/users/me` validation, refresh-token recovery, backend error parsing, and logout.
- Connected Signup/Login, protected every existing caregiver route and onboarding, and wired Settings logout as explicitly confirmed by the user.
- Onboarding creates the elder profile with backend-supported fields and enables patient mode on that device after profile/resource saves complete.
- Added the Vite `/api` development proxy to the discovered backend origin to avoid the missing-CORS issue without changing backend code.
- Onboarding writes only user-entered data (the prior demo defaults were removed), records its saved elder ID for retries, avoids repeating resource writes after partial failures during the current session, then enables patient mode after profile and resource writes succeed.
- The caregiver dashboard and sub-pages load records from existing backend APIs, with writes only where supported. Elderly routes need no login on a device configured by a caregiver. Each separate device requires a caregiver to sign in once and enable Settings → Patient access on this device.
- No Supabase schema or migration files were changed or applied. No test account or elder record was created during implementation.
- Medication schedules do not send reminders; voice notes have no audio transfer/playback; daily summaries are read-only; and alerts have status updates but no detection controls or real-time push.
- Verification on 2026-11-07: frontend production build succeeds; all 8 existing backend unittest cases pass; `git diff --check` passes. Build reports existing Vite config and large-chunk warnings. Browser/manual authentication and onboarding checks remain for the user; prior auth checkpoints were confirmed passed by the user.

## Two-device and voice follow-up

- Onboarding now leaves the caregiver in the caregiver experience. Dashboard/Settings create short-lived pairing codes for a different elderly device.
- Elderly device pairing, device-token resource routes, browser speech text processing, local Hindi/Hinglish intent/emergency rules, Gemini/Groq response adapters, caregiver interaction/alert/summary routes, and supporting UI/documentation were added after the historical checks above.
- The required additive migration is `backend/schema/migrations/0004_device_pairing_voice.sql`. It has not been applied to Supabase.
- At the user's request, no build, test suite, API request, app start, audio run, or manual click-through was performed for this follow-up.
