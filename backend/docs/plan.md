# Backend Plan

## Current baseline

- FastAPI entry point: `backend/app.py`; default local port: `8020`; default API prefix: `/api`.
- Supabase Auth owns caregiver and patient credentials. PostgreSQL stores account profiles, elder care profiles, memberships, and shared care data.
- The API validates Supabase access tokens and forwards each caller's token to PostgREST. PostgreSQL row-level security is the final data access boundary.
- SQL migrations are ordered in `backend/schema/migrations`: base schema (`0001`), one-time patient claim codes (`0002`), and caregiver-only elder creation (`0003`). Apply them deliberately to the intended Supabase project; API startup does not run migrations.
- The current route inventory and request/response examples are in [routes.md](routes.md).
- Deployment configuration is out of scope for this stage.

## User flow

1. A caregiver creates a separate caregiver account and signs in.
2. The caregiver creates an elder care profile. The database creates the creator's initial admin membership in the same transaction.
3. The caregiver issues a one-time claim code and shares the code with the patient, optionally by displaying it as a QR code.
4. The patient creates or signs in to a separate patient account on the elder's device and submits the code.
5. PostgreSQL validates the account and code and atomically links the patient account to the profile.
6. Caregivers and patient use their own accounts and memberships to access shared records.

The claim code is a short-lived linking credential, not a login. It is shown once, expires after 24 hours, is stored only as a digest, and is invalidated when redeemed, revoked, expired, or replaced. QR generation is a client responsibility; there is no QR-image endpoint.

## Implemented capabilities

- Signup, login, refresh, logout, and current user profile read/update.
- Create/list/read/update/delete elder profiles (create is caregiver-only by database function).
- Issue, revoke, and redeem patient claim codes.
- Generic elder-scoped CRUD for the resources listed in `routes.md`, subject to route field allowlists and database RLS.
- Health endpoint checks the PostgreSQL pool.

## Follow-up work

- Caregiver membership invitation and management UX/flow with carefully scoped role changes.
- Actual private image/audio upload and download routes, plus short-lived signed URLs.
- Trusted Gnani speech pipeline and backend workflows for assistant messages, conversations, alerts, and daily recaps.
- Frontend subscriptions for live shared updates; current API does not provide a WebSocket or Realtime subscription endpoint.
- Integration checks against a disposable Supabase project for all roles, cross-profile isolation, and concurrent code claims/reissue.

## Gnani integration

Gnani is intended to support speech communication. Before implementing, identify whether the feature needs Speech APIs, Agent Builder, or Platform APIs in the official documentation. Call Gnani from backend services, keep API keys server-side, and avoid exposing vendor secrets to the frontend.
