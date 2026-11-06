"""Drop all SmritiVani schema objects from a database.

Run this ONLY on the wrong project to undo the migration.

Usage:
    python rollback.py
    
It reads DATABASE_URL from .env — make sure it points to the project
you want to clean up before running.
"""

from __future__ import annotations

import os
import sys
from pathlib import Path

from dotenv import load_dotenv

load_dotenv(Path(__file__).with_name(".env"))

DATABASE_URL = os.getenv("DATABASE_URL", "").strip()
if not DATABASE_URL:
    print("ERROR: DATABASE_URL is not set in backend/.env")
    sys.exit(1)

ROLLBACK_SQL = """
-- Drop triggers on auth.users first
drop trigger if exists auth_user_profile_created on auth.users;

-- Drop all triggers on public tables
drop trigger if exists add_elder_creator_as_admin on public.elders;
drop trigger if exists profile_touch_updated_at on public.user_profiles;
drop trigger if exists elder_touch_updated_at on public.elders;
drop trigger if exists membership_touch_updated_at on public.elder_memberships;
drop trigger if exists contact_touch_updated_at on public.elder_contacts;
drop trigger if exists memory_touch_updated_at on public.memories;
drop trigger if exists event_touch_updated_at on public.events;
drop trigger if exists medicine_touch_updated_at on public.medicines;
drop trigger if exists daily_log_touch_updated_at on public.daily_logs;
drop trigger if exists alert_touch_updated_at on public.alerts;
drop trigger if exists elder_prevent_creator_change on public.elders;
drop trigger if exists membership_prevent_creator_change on public.elder_memberships;
drop trigger if exists contact_prevent_creator_change on public.elder_contacts;
drop trigger if exists memory_prevent_creator_change on public.memories;
drop trigger if exists event_prevent_creator_change on public.events;
drop trigger if exists medicine_prevent_creator_change on public.medicines;
drop trigger if exists daily_log_prevent_creator_change on public.daily_logs;
drop trigger if exists alert_prevent_creator_change on public.alerts;
drop trigger if exists conversation_prevent_creator_change on public.conversations;

-- Drop public functions
drop function if exists public.request_elder_link(uuid, text);
drop function if exists public.respond_elder_link_request(uuid, boolean);
drop function if exists public.create_elder_profile(text, smallint, text, text, text, boolean, text, text);
drop function if exists public.issue_elder_claim_code(uuid, text, timestamptz);
drop function if exists public.claim_elder_profile(text);
drop function if exists public.revoke_elder_claim_code(uuid);

-- Drop all tables (cascade handles FK deps)
drop table if exists public.conversation_messages cascade;
drop table if exists public.conversations cascade;
drop table if exists public.alerts cascade;
drop table if exists public.voice_notes cascade;
drop table if exists public.daily_logs cascade;
drop table if exists public.medicine_logs cascade;
drop table if exists public.medicines cascade;
drop table if exists public.events cascade;
drop table if exists public.memory_assets cascade;
drop table if exists public.memories cascade;
drop table if exists public.elder_contacts cascade;
drop table if exists public.elder_access_requests cascade;
drop table if exists public.elder_claim_codes cascade;
drop table if exists public.elder_memberships cascade;
drop table if exists public.elders cascade;
drop table if exists public.user_profiles cascade;

-- Drop private functions and schema
drop function if exists private.has_elder_role(uuid, text[]);
drop function if exists private.can_view_profile(uuid);
drop function if exists private.storage_has_elder_role(text, text[]);
drop function if exists private.add_elder_creator_as_admin();
drop function if exists private.handle_new_auth_user();
drop function if exists private.touch_updated_at();
drop function if exists private.prevent_creator_change();
drop schema if exists private cascade;

-- Drop storage policies
drop policy if exists elder_media_read_member on storage.objects;
drop policy if exists elder_media_insert_caregiver on storage.objects;
drop policy if exists elder_media_insert_patient_audio on storage.objects;
drop policy if exists elder_media_delete_caregiver on storage.objects;

-- Remove storage buckets
delete from storage.objects where bucket_id in ('elder-media', 'elder-audio');
delete from storage.buckets where id in ('elder-media', 'elder-audio');
"""


def run_rollback() -> None:
    try:
        import psycopg
    except ImportError:
        print("ERROR: psycopg is not installed.")
        sys.exit(1)

    print(f"\nTarget DB host: {DATABASE_URL.split('@')[-1].split('/')[0]}")
    confirm = input("\n⚠️  This will DROP all SmritiVani tables and objects. Type YES to confirm: ")
    if confirm.strip() != "YES":
        print("Aborted.")
        sys.exit(0)

    with psycopg.connect(DATABASE_URL, autocommit=True) as conn:
        print("\nRolling back...", flush=True)
        conn.execute(ROLLBACK_SQL)
        print("✅ All SmritiVani objects dropped successfully.")


if __name__ == "__main__":
    run_rollback()

