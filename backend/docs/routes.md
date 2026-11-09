# Frontend API Routes

> **Pairing and voice additions:** see [API_REFERENCE.md](../../docs/API_REFERENCE.md) for the added contracts. They depend on the proposed `0004_device_pairing_voice.sql` migration and are not ready against a database until the project owner reviews and applies it.

This document describes the routes currently mounted by the FastAPI app. Unless configured otherwise, the base URL is `http://127.0.0.1:8020` and the API prefix is `/api`.

## Authentication and request conventions

- Public signup/login/refresh routes do not require a bearer token. Protected routes require `Authorization: Bearer <access_token>`.
- In Swagger UI, click **Authorize** and paste the raw `access_token` value only. Do not include quotes or the text `Bearer ` in the value.
- UUID path parameters must be UUIDs. JSON requests use `Content-Type: application/json`.
- For generic elder records, request bodies use an outer `data` object, for example `{ "data": { "title": "Doctor visit" } }`. Only listed fields are accepted; IDs, `elder_id`, timestamps, and audit fields are assigned by the backend/database.
- List routes return `{ "items": [...], "limit": n, "offset": n }`. `limit` defaults to 100 (maximum 500), `offset` defaults to 0.
- Database RLS restricts records to the signed-in user's active elder memberships and role. A missing or inaccessible item commonly returns 404. Invalid request/model values return 422; database policy denials can return 403.

## Auth routes

### `GET /api/health` — check API/database availability

No bearer token required. Returns `{ "status": "ok", "database": "connected" }` when the PostgreSQL pool is available. Returns 503 when the pool is unavailable. This does not verify Supabase Auth configuration or migration completeness.

### `POST /api/auth/signup` — create a caregiver account

No bearer token required. The email is checked for a basic email shape, not verified by this API. Supabase project settings may require email confirmation; in that case signup can return a user without a session.

Request:

```json
{
  "email": "caregiver@example.com",
  "password": "at-least-8-characters",
  "display_name": "Asha Patel",
  "account_type": "caregiver"
}
```

`account_type` must be `caregiver`. Returns Supabase's signup response (201).

### `POST /api/auth/login` — sign in

Request: `{ "email": "caregiver@example.com", "password": "..." }`. Caregiver accounts receive Supabase's session response, including `access_token`, `refresh_token`, `token_type`, expiry information, and user (200). Invalid credentials return 401; a non-caregiver account is rejected with 403.

### `POST /api/auth/refresh` — refresh a session

Request: `{ "refresh_token": "..." }`. Returns a new Supabase session/token response (200). Invalid/expired refresh tokens return 401.

### `POST /api/auth/logout` — sign out current session

Requires bearer token. Returns 204 with no response body.

## User profile

### `GET /api/users/me`

Requires bearer token. Returns the signed-in user's `user_profiles` row. Returns 404 if the profile row is missing (check the signup trigger/migrations).

### `PATCH /api/users/me`

Requires bearer token. Send one or more fields; empty object is rejected.

```json
{ "display_name": "Asha P.", "phone": "+919876543210", "city": "Mumbai" }
```

Allowed fields: `display_name`, `phone`, `city`. Returns the updated profile.

## Elder profiles and patient linking

The current frontend uses device-local patient mode instead of patient-account claiming. A caregiver completes profile setup on the device the patient will use; later launches open the patient interface without patient sign-in. The caregiver session remains active in the background for RLS-protected data access. Explicit caregiver sign-out disables patient mode. Claim-code routes below remain available as legacy backend endpoints and are not used by the frontend.

### `GET /api/elders`

Requires bearer token. Lists only elder profiles accessible to the current account. Supports `limit` and `offset` query parameters.

### `POST /api/elders` — create a care profile

Requires caregiver account. The database checks account type and creates the creator's initial `admin` membership atomically. A patient cannot create a profile through this route.

```json
{
  "name": "Rohan Patel",
  "age": 75,
  "language": "english",
  "city": "Mumbai",
  "timezone": "Asia/Kolkata",
  "lives_alone": true,
  "doctor_name": "Dr. Naman",
  "doctor_phone": "+919876543210"
}
```

Only `name` is required. `age` may be null or 0–125. Defaults: language `english`, timezone `Asia/Kolkata`, lives_alone `true`. Returns the created elder row (201); save its `id` for subsequent paths.

### `GET /api/elders/{elder_id}`

Requires active membership. Returns the elder row, or 404 if missing/inaccessible.

### `PATCH /api/elders/{elder_id}`

Requires bearer token and an RLS-authorized role. Accepts one or more of the elder-create fields: `name`, `age`, `language`, `city`, `timezone`, `lives_alone`, `doctor_name`, `doctor_phone`. Cannot be empty. Returns the updated row.

### `DELETE /api/elders/{elder_id}`

Requires bearer token and database authorization. Deletes the elder row (204); dependent elder data may cascade-delete per the schema. A missing/inaccessible profile returns 404.

### `POST /api/elders/{elder_id}/claim-code` — caregiver issues patient code

Requires an authorized caregiver/admin membership. Returns a random one-time code once:

```json
{
  "elder_id": "b5ea4076-cbca-4fe1-8cea-ba416f15dbea",
  "claim_code": "ABCDE-FGHJK-MNPQR-STVWX-YZ2345",
  "expires_at": "2026-11-07T10:00:00+00:00",
  "expires_in_seconds": 86400
}
```

The code expires in 24 hours. Keep it private; it is a linking credential. Frontend may encode the exact code in a QR. There is no QR-generation route, and QR must not include passwords, access tokens, or elder details.

### `DELETE /api/elders/{elder_id}/claim-code` — revoke unused code

Requires authorized caregiver/admin membership. Returns 204. Issuing a replacement also invalidates the earlier unused code.

### `POST /api/users/me/elder-claim` — patient redeems code

Requires a signed-in patient account. Request:

```json
{ "code": "ABCDE-FGHJK-MNPQR-STVWX-YZ2345" }
```

The API normalizes formatting and sends only a SHA-256 digest to PostgreSQL. Success returns `{ "elder_id": "...", "elder_name": "Rohan Patel", "linked_at": "..." }`. Invalid, expired, already-used, or unavailable codes share a generic 400 response. Patient accounts can claim one elder profile.

## Shared elder resource routes

Base collection path: `/api/elders/{elder_id}/{resource}`. Record path: `/api/elders/{elder_id}/{resource}/{record_id}`. Replace `{resource}` with one of the exact slugs below. The elder must be accessible to the authenticated account. Any role restrictions listed are also enforced by database RLS; route allowlists alone do not grant permission.

For all listed fields, use the `{ "data": { ... } }` envelope. POST returns the created database row (201); GET list returns paginated envelope; GET one/PATCH return one row; DELETE returns 204. PATCH cannot be empty. Unknown resource slugs return 404. Attempts to use an unsupported operation return 405.

| Resource slug | Table | Create fields | Update fields | Delete | Notes |
|---|---|---|---|---|---|
| `memberships` | `elder_memberships` | `user_id`, `role`, `relationship_to_elder` | `role`, `relationship_to_elder`, `status` | Yes | Admin-only policies; roles are `admin`, `caregiver`, `viewer`, `patient`; status `active` or `revoked`. Patient membership is created by claim flow; direct DB policy restricts role changes. |
| `contacts` | `elder_contacts` | `name`, `relationship`, `phone`, `city`, `is_emergency_contact` | same | Yes | Contact listing does not create an app account or grant access. |
| `memories` | `memories` | `type`, `name`, `relationship`, `info` | same | Yes | Types: `family`, `preference`, `fact`, `story`. Caregiver/admin write policy; members may read. |
| `memory-assets` | `memory_assets` | `memory_id`, `media_type`, `storage_path`, `mime_type`, `byte_size`, `caption` | None | Yes | Metadata only. `media_type`: `image` or `audio`; accepted MIME types: `image/jpeg`, `image/png`, `image/webp`, `audio/mpeg`, `audio/mp4`, `audio/ogg`, `audio/wav`, `audio/webm`. Object path begins `{elder_id}/memories/` or `{elder_id}/memory-audio/`. Binary upload/download and signed URLs are not implemented. |
| `events` | `events` | `title`, `description`, `starts_at`, `ends_at`, `recurrence_rule`, `status` | same | Yes | `starts_at` is required ISO-8601 datetime with timezone; `ends_at` optional and cannot precede start. Status: `scheduled`, `completed`, `cancelled`. |
| `medicines` | `medicines` | `name`, `dosage`, `instructions`, `schedule_time`, `days_of_week`, `active` | same | Yes | `name` required. One schedule time per medicine. `schedule_time` uses `HH:MM[:SS]`. `days_of_week` is an array of integers 0–6 (0=Sunday through 6=Saturday); defaults to all days. |
| `medicine-logs` | `medicine_logs` | `medicine_id`, `scheduled_for`, `status`, `note` | `status`, `note` | No | `scheduled_for` ISO-8601 datetime; status `taken`, `missed`, or `skipped`. Unique per medicine and scheduled time. |
| `daily-logs` | `daily_logs` | Not available to client | Not available | No | Read-only to client; trusted backend workflow writes. |
| `voice-notes` | `voice_notes` | `storage_path`, `mime_type`, `transcript` | None | No | Metadata only; audio upload is not implemented. MIME types match audio types above. Storage path begins `{elder_id}/voice-notes/`. |
| `alerts` | `alerts` | `type`, `transcript`, `audio_storage_path` | `status` | No | Create starts `open`. Type: `fall`, `distress`, `confusion`, `medical`, `other`. Status: `open`, `acknowledged`, `resolved`, `false_alarm`. Members with allowed patient/caregiver roles can create; caregivers/admins can update per RLS. |
| `conversations` | `conversations` | Not available to client | `ended_at` | No | Trusted workflow creates sessions; authenticated clients may update end time subject to RLS. |
| `messages` | `conversation_messages` | `conversation_id`, `turn_number`, `speaker`, `content`, `intent`, `audio_storage_path` | None | No | `turn_number` starts at 1 and is unique within conversation. Client speaker is stored as `patient` only when exactly `patient`, otherwise normalized to `caregiver`; assistant messages are trusted workflow writes. |

### Event example

Create an appointment under the elder's `events` resource:

```http
POST /api/elders/{elder_id}/events
Authorization: Bearer <access_token>
Content-Type: application/json
```

```json
{
  "data": {
    "title": "Doctor appointment",
    "description": "Routine checkup",
    "starts_at": "2026-11-10T10:30:00+05:30",
    "ends_at": "2026-11-10T11:00:00+05:30",
    "status": "scheduled"
  }
}
```

Use the UUID returned from `POST /api/elders` as `{elder_id}`. The resource path is the literal slug `events`; the event title belongs in `data.title`. The code phrase “Doctor appointment” is not a resource slug.

## Current API limitations

- There are no dedicated caregiver invitation, elder search-by-name, QR image, upload/download, signed URL, WebSocket, or frontend Realtime subscription routes yet.
- `memories`, contacts, events, and medicine schedules are shared through the database, but database writes become immediately queryable rather than producing an application push event. A frontend must refresh/refetch unless it separately configures and verifies Supabase Realtime.
- Generic resources use database field types and constraints; invalid values can be rejected by PostgREST/PostgreSQL even when the JSON field is allowlisted.
- `/health` checks the PostgreSQL pool. It does not validate Supabase Auth credentials or prove that every migration is installed.
