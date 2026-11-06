-- SmritiVani MVP database schema for Supabase.
-- Intended for a fresh project. Back up and review before applying to any project with data.
begin;

create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create table public.user_profiles (
    user_id uuid primary key references auth.users (id) on delete cascade,
    display_name text not null default '' check (char_length(display_name) <= 160),
    account_type text not null default 'caregiver'
        check (account_type in ('caregiver', 'patient')),
    phone text check (phone is null or char_length(phone) <= 40),
    city text check (city is null or char_length(city) <= 160),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    updated_by_user_id uuid references auth.users (id) on delete set null
);

create table public.elders (
    id uuid primary key default gen_random_uuid(),
    name text not null check (char_length(name) between 1 and 200),
    age smallint check (age is null or age between 0 and 125),
    language text not null default 'english' check (char_length(language) between 2 and 40),
    city text check (city is null or char_length(city) <= 160),
    timezone text not null default 'Asia/Kolkata' check (char_length(timezone) <= 80),
    lives_alone boolean not null default true,
    doctor_name text check (doctor_name is null or char_length(doctor_name) <= 200),
    doctor_phone text check (doctor_phone is null or char_length(doctor_phone) <= 40),
    created_by_user_id uuid references auth.users (id) on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    updated_by_user_id uuid references auth.users (id) on delete set null
);

-- One user can care for several elders; each elder can have several caregivers.
-- A relationship belongs on this link because it can differ for each elder.
create table public.elder_memberships (
    id uuid primary key default gen_random_uuid(),
    elder_id uuid not null references public.elders (id) on delete cascade,
    user_id uuid not null references auth.users (id) on delete restrict,
    role text not null check (role in ('admin', 'caregiver', 'viewer', 'patient')),
    relationship_to_elder text check (
        relationship_to_elder is null or char_length(relationship_to_elder) <= 120
    ),
    status text not null default 'active' check (status in ('active', 'revoked')),
    added_by_user_id uuid references auth.users (id) on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    updated_by_user_id uuid references auth.users (id) on delete set null,
    unique (elder_id, user_id)
);

-- Caregivers can ask to link a verified patient account. A patient must approve
-- before the patient membership is created. The copied display names are only
-- for the patient's approval screen and do not grant access to elder data.
create table public.elder_access_requests (
    id uuid primary key default gen_random_uuid(),
    elder_id uuid not null references public.elders (id) on delete cascade,
    patient_user_id uuid not null references auth.users (id) on delete cascade,
    requester_user_id uuid not null references auth.users (id) on delete cascade,
    elder_name text not null check (char_length(elder_name) between 1 and 200),
    requester_name text not null check (char_length(requester_name) between 1 and 160),
    status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
    created_at timestamptz not null default now(),
    responded_at timestamptz,
    check (patient_user_id <> requester_user_id),
    check ((status = 'pending') = (responded_at is null))
);
create unique index elder_access_requests_pending_unique
    on public.elder_access_requests (elder_id, patient_user_id)
    where status = 'pending';
create index elder_access_requests_patient_idx
    on public.elder_access_requests (patient_user_id, status, created_at desc);

create index elder_memberships_user_idx on public.elder_memberships (user_id, status, elder_id);
create index elder_memberships_elder_idx on public.elder_memberships (elder_id, status, role);

-- Contacts such as a neighbor can be listed without receiving a login.
create table public.elder_contacts (
    id uuid primary key default gen_random_uuid(),
    elder_id uuid not null references public.elders (id) on delete cascade,
    name text not null check (char_length(name) between 1 and 200),
    relationship text check (relationship is null or char_length(relationship) <= 120),
    phone text check (phone is null or char_length(phone) <= 40),
    city text check (city is null or char_length(city) <= 160),
    is_emergency_contact boolean not null default false,
    created_by_user_id uuid references auth.users (id) on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    updated_by_user_id uuid references auth.users (id) on delete set null
);
create index elder_contacts_elder_idx on public.elder_contacts (elder_id, is_emergency_contact);

create table public.memories (
    id uuid primary key default gen_random_uuid(),
    elder_id uuid not null references public.elders (id) on delete cascade,
    type text not null check (type in ('family', 'preference', 'fact', 'story')),
    name text check (name is null or char_length(name) <= 200),
    relationship text check (relationship is null or char_length(relationship) <= 160),
    info text check (info is null or char_length(info) <= 12000),
    created_by_user_id uuid references auth.users (id) on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    updated_by_user_id uuid references auth.users (id) on delete set null,
    deleted_at timestamptz,
    unique (id, elder_id)
);
create index memories_elder_idx on public.memories (elder_id, type, created_at desc);

-- Images/audio stay in private Storage. This table only stores metadata and paths.
create table public.memory_assets (
    id uuid primary key default gen_random_uuid(),
    elder_id uuid not null,
    memory_id uuid not null,
    media_type text not null check (media_type in ('image', 'audio')),
    bucket_name text not null default 'elder-media' check (bucket_name = 'elder-media'),
    storage_path text not null,
    mime_type text not null check (mime_type in (
        'image/jpeg', 'image/png', 'image/webp',
        'audio/mpeg', 'audio/mp4', 'audio/ogg', 'audio/wav', 'audio/webm'
    )),
    byte_size bigint not null check (byte_size > 0),
    caption text check (caption is null or char_length(caption) <= 500),
    created_by_user_id uuid references auth.users (id) on delete set null,
    created_at timestamptz not null default now(),
    foreign key (memory_id, elder_id)
        references public.memories (id, elder_id) on delete cascade,
    unique (bucket_name, storage_path),
    check (split_part(storage_path, '/', 1) = elder_id::text),
    check (split_part(storage_path, '/', 2) in ('memories', 'memory-audio')),
    check (media_type <> 'image' or mime_type like 'image/%'),
    check (media_type <> 'audio' or mime_type like 'audio/%')
);
create index memory_assets_memory_idx on public.memory_assets (memory_id, elder_id);

create table public.events (
    id uuid primary key default gen_random_uuid(),
    elder_id uuid not null references public.elders (id) on delete cascade,
    title text not null check (char_length(title) between 1 and 240),
    description text check (description is null or char_length(description) <= 4000),
    starts_at timestamptz not null,
    ends_at timestamptz,
    recurrence_rule text,
    status text not null default 'scheduled'
        check (status in ('scheduled', 'completed', 'cancelled')),
    created_by_user_id uuid references auth.users (id) on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    updated_by_user_id uuid references auth.users (id) on delete set null,
    check (ends_at is null or ends_at >= starts_at)
);
create index events_elder_start_idx on public.events (elder_id, starts_at);

-- One scheduled time per medicine in this MVP. A later migration can add multiple schedules.
create table public.medicines (
    id uuid primary key default gen_random_uuid(),
    elder_id uuid not null references public.elders (id) on delete cascade,
    name text not null check (char_length(name) between 1 and 240),
    dosage text check (dosage is null or char_length(dosage) <= 160),
    instructions text check (instructions is null or char_length(instructions) <= 2000),
    schedule_time time,
    days_of_week smallint[] not null default array[0,1,2,3,4,5,6]::smallint[],
    active boolean not null default true,
    created_by_user_id uuid references auth.users (id) on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    updated_by_user_id uuid references auth.users (id) on delete set null,
    unique (id, elder_id),
    check (cardinality(days_of_week) between 1 and 7),
    check (days_of_week <@ array[0,1,2,3,4,5,6]::smallint[])
);
create index medicines_elder_idx on public.medicines (elder_id, active, name);

create table public.medicine_logs (
    id uuid primary key default gen_random_uuid(),
    elder_id uuid not null,
    medicine_id uuid not null,
    scheduled_for timestamptz not null,
    status text not null check (status in ('taken', 'missed', 'skipped')),
    recorded_by_user_id uuid references auth.users (id) on delete set null,
    recorded_at timestamptz not null default now(),
    note text check (note is null or char_length(note) <= 1000),
    foreign key (medicine_id, elder_id)
        references public.medicines (id, elder_id) on delete cascade,
    unique (medicine_id, scheduled_for)
);
create index medicine_logs_elder_time_idx on public.medicine_logs (elder_id, scheduled_for desc);

create table public.daily_logs (
    id uuid primary key default gen_random_uuid(),
    elder_id uuid not null references public.elders (id) on delete cascade,
    log_date date not null default current_date,
    mood text not null default 'unknown'
        check (mood in ('happy', 'lonely', 'calm', 'distressed', 'confused', 'emotional', 'neutral', 'unknown')),
    summary text check (summary is null or char_length(summary) <= 12000),
    medicines_taken integer not null default 0 check (medicines_taken >= 0),
    medicines_total integer not null default 0 check (medicines_total >= 0),
    alerts integer not null default 0 check (alerts >= 0),
    conversation_count integer not null default 0 check (conversation_count >= 0),
    created_by_user_id uuid references auth.users (id) on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    updated_by_user_id uuid references auth.users (id) on delete set null,
    unique (elder_id, log_date),
    check (medicines_taken <= medicines_total)
);
create index daily_logs_elder_date_idx on public.daily_logs (elder_id, log_date desc);

create table public.voice_notes (
    id uuid primary key default gen_random_uuid(),
    elder_id uuid not null references public.elders (id) on delete cascade,
    sender_user_id uuid not null references auth.users (id) on delete restrict,
    storage_path text not null,
    mime_type text not null check (mime_type in ('audio/mpeg', 'audio/mp4', 'audio/ogg', 'audio/wav', 'audio/webm')),
    transcript text check (transcript is null or char_length(transcript) <= 12000),
    status text not null default 'available' check (status in ('available', 'listened', 'archived')),
    listened_at timestamptz,
    listened_by_user_id uuid references auth.users (id) on delete set null,
    created_at timestamptz not null default now(),
    check (split_part(storage_path, '/', 1) = elder_id::text),
    check (split_part(storage_path, '/', 2) = 'voice-notes'),
    unique (storage_path)
);
create index voice_notes_elder_recent_idx on public.voice_notes (elder_id, created_at desc);

create table public.alerts (
    id uuid primary key default gen_random_uuid(),
    elder_id uuid not null references public.elders (id) on delete cascade,
    type text not null check (type in ('fall', 'distress', 'confusion', 'medical', 'other')),
    status text not null default 'open' check (status in ('open', 'acknowledged', 'resolved', 'false_alarm')),
    transcript text check (transcript is null or char_length(transcript) <= 12000),
    audio_storage_path text,
    created_by_user_id uuid references auth.users (id) on delete set null,
    created_at timestamptz not null default now(),
    resolved_by_user_id uuid references auth.users (id) on delete set null,
    resolved_at timestamptz,
    updated_at timestamptz not null default now(),
    updated_by_user_id uuid references auth.users (id) on delete set null,
    check (audio_storage_path is null or split_part(audio_storage_path, '/', 1) = elder_id::text),
    check (audio_storage_path is null or split_part(audio_storage_path, '/', 2) = 'alerts'),
    check ((status in ('resolved', 'false_alarm')) = (resolved_at is not null))
);
create index alerts_elder_recent_idx on public.alerts (elder_id, created_at desc);

create table public.conversations (
    id uuid primary key default gen_random_uuid(),
    elder_id uuid not null references public.elders (id) on delete cascade,
    started_by_user_id uuid references auth.users (id) on delete set null,
    started_at timestamptz not null default now(),
    ended_at timestamptz,
    created_at timestamptz not null default now(),
    unique (id, elder_id),
    check (ended_at is null or ended_at >= started_at)
);
create index conversations_elder_recent_idx on public.conversations (elder_id, started_at desc);

create table public.conversation_messages (
    id uuid primary key default gen_random_uuid(),
    elder_id uuid not null,
    conversation_id uuid not null,
    turn_number integer not null check (turn_number > 0),
    speaker text not null check (speaker in ('patient', 'caregiver', 'assistant')),
    content text not null check (char_length(content) <= 12000),
    intent text check (intent is null or char_length(intent) <= 120),
    audio_storage_path text,
    created_by_user_id uuid references auth.users (id) on delete set null,
    created_at timestamptz not null default now(),
    foreign key (conversation_id, elder_id)
        references public.conversations (id, elder_id) on delete cascade,
    unique (conversation_id, turn_number),
    check (audio_storage_path is null or split_part(audio_storage_path, '/', 1) = elder_id::text),
    check (audio_storage_path is null or split_part(audio_storage_path, '/', 2) = 'conversations')
);
create index conversation_messages_elder_idx on public.conversation_messages (elder_id, created_at desc);

create function private.has_elder_role(p_elder_id uuid, p_roles text[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
    select coalesce(
        (select auth.uid()) is not null
        and exists (
            select 1
            from public.elder_memberships as membership
            where membership.elder_id = p_elder_id
              and membership.user_id = (select auth.uid())
              and membership.status = 'active'
              and membership.role = any (p_roles)
        ),
        false
    );
$$;

create function private.can_view_profile(p_profile_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
    select coalesce(
        (select auth.uid()) = p_profile_user_id
        or exists (
            select 1
            from public.elder_memberships as mine
            join public.elder_memberships as theirs on theirs.elder_id = mine.elder_id
            where mine.user_id = (select auth.uid())
              and theirs.user_id = p_profile_user_id
              and mine.status = 'active'
              and theirs.status = 'active'
        ),
        false
    );
$$;

create function private.storage_has_elder_role(p_path text, p_roles text[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
    select case
        when split_part(coalesce(p_path, ''), '/', 1) ~*
            '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        then private.has_elder_role(split_part(p_path, '/', 1)::uuid, p_roles)
        else false
    end;
$$;

create function private.add_elder_creator_as_admin()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
    insert into public.elder_memberships (
        elder_id, user_id, role, status, added_by_user_id
    ) values (
        new.id, new.created_by_user_id, 'admin', 'active', new.created_by_user_id
    );
    return new;
end;
$$;

-- Create a profile as part of Auth signup so users never have to send their
-- identity fields in a later, client-controlled profile creation request.
create function private.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_account_type text;
begin
    v_account_type := case
        when new.raw_user_meta_data ->> 'account_type' in ('caregiver', 'patient')
            then new.raw_user_meta_data ->> 'account_type'
        else 'caregiver'
    end;

    insert into public.user_profiles (user_id, display_name, account_type)
    values (
        new.id,
        left(coalesce(new.raw_user_meta_data ->> 'display_name', ''), 160),
        v_account_type
    )
    on conflict (user_id) do nothing;
    return new;
end;
$$;

create function private.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
    new.updated_at := now();
    new.updated_by_user_id := (select auth.uid());
    return new;
end;
$$;

create function private.prevent_creator_change()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
    old_row jsonb;
    new_row jsonb;
begin
    old_row := to_jsonb(old);
    new_row := to_jsonb(new);
    if (select auth.uid()) is not null then
        if (old_row ? 'created_by_user_id')
           and ((new_row ->> 'created_by_user_id') is distinct from (old_row ->> 'created_by_user_id')) then
            raise exception 'Record creator cannot be changed';
        end if;
        if (old_row ? 'added_by_user_id')
           and ((new_row ->> 'added_by_user_id') is distinct from (old_row ->> 'added_by_user_id')) then
            raise exception 'Membership inviter cannot be changed';
        end if;
        if (old_row ? 'started_by_user_id')
           and ((new_row ->> 'started_by_user_id') is distinct from (old_row ->> 'started_by_user_id')) then
            raise exception 'Conversation starter cannot be changed';
        end if;
    end if;
    return new;
end;
$$;

revoke all on function private.has_elder_role(uuid, text[]) from public, anon;
revoke all on function private.can_view_profile(uuid) from public, anon;
revoke all on function private.storage_has_elder_role(text, text[]) from public, anon;
revoke all on function private.add_elder_creator_as_admin() from public, anon, authenticated;
revoke all on function private.handle_new_auth_user() from public, anon, authenticated;
revoke all on function private.touch_updated_at() from public, anon, authenticated;
revoke all on function private.prevent_creator_change() from public, anon, authenticated;
grant execute on function private.has_elder_role(uuid, text[]) to authenticated;
grant execute on function private.can_view_profile(uuid) to authenticated;
grant execute on function private.storage_has_elder_role(text, text[]) to authenticated;

create trigger add_elder_creator_as_admin
    after insert on public.elders
    for each row execute function private.add_elder_creator_as_admin();

create trigger profile_touch_updated_at before update on public.user_profiles
    for each row execute function private.touch_updated_at();
create trigger elder_touch_updated_at before update on public.elders
    for each row execute function private.touch_updated_at();
create trigger membership_touch_updated_at before update on public.elder_memberships
    for each row execute function private.touch_updated_at();
create trigger contact_touch_updated_at before update on public.elder_contacts
    for each row execute function private.touch_updated_at();
create trigger memory_touch_updated_at before update on public.memories
    for each row execute function private.touch_updated_at();
create trigger event_touch_updated_at before update on public.events
    for each row execute function private.touch_updated_at();
create trigger medicine_touch_updated_at before update on public.medicines
    for each row execute function private.touch_updated_at();
create trigger daily_log_touch_updated_at before update on public.daily_logs
    for each row execute function private.touch_updated_at();
create trigger alert_touch_updated_at before update on public.alerts
    for each row execute function private.touch_updated_at();

create trigger elder_prevent_creator_change before update on public.elders
    for each row execute function private.prevent_creator_change();
create trigger membership_prevent_creator_change before update on public.elder_memberships
    for each row execute function private.prevent_creator_change();
create trigger contact_prevent_creator_change before update on public.elder_contacts
    for each row execute function private.prevent_creator_change();
create trigger memory_prevent_creator_change before update on public.memories
    for each row execute function private.prevent_creator_change();
create trigger event_prevent_creator_change before update on public.events
    for each row execute function private.prevent_creator_change();
create trigger medicine_prevent_creator_change before update on public.medicines
    for each row execute function private.prevent_creator_change();
create trigger daily_log_prevent_creator_change before update on public.daily_logs
    for each row execute function private.prevent_creator_change();
create trigger alert_prevent_creator_change before update on public.alerts
    for each row execute function private.prevent_creator_change();
create trigger conversation_prevent_creator_change before update on public.conversations
    for each row execute function private.prevent_creator_change();

alter table public.user_profiles enable row level security;
alter table public.elders enable row level security;
alter table public.elder_memberships enable row level security;
alter table public.elder_access_requests enable row level security;
alter table public.elder_contacts enable row level security;
alter table public.memories enable row level security;
alter table public.memory_assets enable row level security;
alter table public.events enable row level security;
alter table public.medicines enable row level security;
alter table public.medicine_logs enable row level security;
alter table public.daily_logs enable row level security;
alter table public.voice_notes enable row level security;
alter table public.alerts enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_messages enable row level security;

create policy profiles_read_related on public.user_profiles
    for select to authenticated
    using ((select private.can_view_profile(user_id)));
create policy profiles_update_self on public.user_profiles
    for update to authenticated
    using (user_id = (select auth.uid()))
    with check (user_id = (select auth.uid()));

create policy elders_read_member on public.elders
    for select to authenticated
    using ((select private.has_elder_role(id, array['admin', 'caregiver', 'viewer', 'patient'])));
create policy elders_create_self on public.elders
    for insert to authenticated with check (
        created_by_user_id = (select auth.uid())
        and exists (
            select 1 from public.user_profiles as profile
            where profile.user_id = (select auth.uid())
              and profile.account_type = 'caregiver'
        )
    );
create policy elders_update_admin on public.elders
    for update to authenticated
    using ((select private.has_elder_role(id, array['admin'])))
    with check ((select private.has_elder_role(id, array['admin'])));
create policy elders_delete_admin on public.elders
    for delete to authenticated
    using ((select private.has_elder_role(id, array['admin'])));

create policy memberships_read_member on public.elder_memberships
    for select to authenticated
    using ((select private.has_elder_role(elder_id, array['admin', 'caregiver', 'viewer', 'patient'])));
create policy memberships_add_by_admin on public.elder_memberships
    for insert to authenticated with check (
        added_by_user_id = (select auth.uid())
        and user_id <> (select auth.uid())
        and role <> 'patient'
        and status = 'active'
        and (select private.has_elder_role(elder_id, array['admin']))
    );
create policy memberships_update_by_admin on public.elder_memberships
    for update to authenticated
    using (
        role <> 'patient'
        and (select private.has_elder_role(elder_id, array['admin']))
    )
    with check (
        (select private.has_elder_role(elder_id, array['admin']))
        and role <> 'patient'
        and (user_id <> (select auth.uid()) or (role = 'admin' and status = 'active'))
    );
create policy memberships_delete_other_by_admin on public.elder_memberships
    for delete to authenticated
    using (
        user_id <> (select auth.uid())
        and (select private.has_elder_role(elder_id, array['admin']))
    );

create policy contacts_read_member on public.elder_contacts
    for select to authenticated
    using ((select private.has_elder_role(elder_id, array['admin', 'caregiver', 'viewer', 'patient'])));
create policy contacts_insert_caregiver on public.elder_contacts
    for insert to authenticated with check (
        created_by_user_id = (select auth.uid())
        and (select private.has_elder_role(elder_id, array['admin', 'caregiver']))
    );
create policy contacts_update_caregiver on public.elder_contacts
    for update to authenticated
    using ((select private.has_elder_role(elder_id, array['admin', 'caregiver'])))
    with check ((select private.has_elder_role(elder_id, array['admin', 'caregiver'])));
create policy contacts_delete_caregiver on public.elder_contacts
    for delete to authenticated
    using ((select private.has_elder_role(elder_id, array['admin', 'caregiver'])));

create policy memories_read_member on public.memories
    for select to authenticated using (
        deleted_at is null
        and (select private.has_elder_role(elder_id, array['admin', 'caregiver', 'viewer', 'patient']))
    );
create policy memories_insert_caregiver on public.memories
    for insert to authenticated with check (
        created_by_user_id = (select auth.uid())
        and (select private.has_elder_role(elder_id, array['admin', 'caregiver']))
    );
create policy memories_update_caregiver on public.memories
    for update to authenticated
    using ((select private.has_elder_role(elder_id, array['admin', 'caregiver'])))
    with check ((select private.has_elder_role(elder_id, array['admin', 'caregiver'])));
create policy memories_delete_caregiver on public.memories
    for delete to authenticated
    using ((select private.has_elder_role(elder_id, array['admin', 'caregiver'])));

create policy memory_assets_read_member on public.memory_assets
    for select to authenticated using (
        (select private.has_elder_role(elder_id, array['admin', 'caregiver', 'viewer', 'patient']))
        and exists (
            select 1 from public.memories as memory
            where memory.id = memory_assets.memory_id
              and memory.elder_id = memory_assets.elder_id
              and memory.deleted_at is null
        )
    );
create policy memory_assets_insert_caregiver on public.memory_assets
    for insert to authenticated with check (
        created_by_user_id = (select auth.uid())
        and (select private.has_elder_role(elder_id, array['admin', 'caregiver']))
        and exists (
            select 1 from public.memories as memory
            where memory.id = memory_assets.memory_id
              and memory.elder_id = memory_assets.elder_id
              and memory.deleted_at is null
        )
    );
create policy memory_assets_delete_caregiver on public.memory_assets
    for delete to authenticated
    using ((select private.has_elder_role(elder_id, array['admin', 'caregiver'])));

create policy events_read_member on public.events
    for select to authenticated
    using ((select private.has_elder_role(elder_id, array['admin', 'caregiver', 'viewer', 'patient'])));
create policy events_insert_caregiver on public.events
    for insert to authenticated with check (
        created_by_user_id = (select auth.uid())
        and (select private.has_elder_role(elder_id, array['admin', 'caregiver']))
    );
create policy events_update_caregiver on public.events
    for update to authenticated
    using ((select private.has_elder_role(elder_id, array['admin', 'caregiver'])))
    with check ((select private.has_elder_role(elder_id, array['admin', 'caregiver'])));
create policy events_delete_caregiver on public.events
    for delete to authenticated
    using ((select private.has_elder_role(elder_id, array['admin', 'caregiver'])));

create policy medicines_read_member on public.medicines
    for select to authenticated
    using ((select private.has_elder_role(elder_id, array['admin', 'caregiver', 'viewer', 'patient'])));
create policy medicines_insert_caregiver on public.medicines
    for insert to authenticated with check (
        created_by_user_id = (select auth.uid())
        and (select private.has_elder_role(elder_id, array['admin', 'caregiver']))
    );
create policy medicines_update_caregiver on public.medicines
    for update to authenticated
    using ((select private.has_elder_role(elder_id, array['admin', 'caregiver'])))
    with check ((select private.has_elder_role(elder_id, array['admin', 'caregiver'])));
create policy medicines_delete_admin on public.medicines
    for delete to authenticated
    using ((select private.has_elder_role(elder_id, array['admin'])));

create policy medicine_logs_read_member on public.medicine_logs
    for select to authenticated
    using ((select private.has_elder_role(elder_id, array['admin', 'caregiver', 'viewer', 'patient'])));
create policy medicine_logs_insert_member on public.medicine_logs
    for insert to authenticated with check (
        recorded_by_user_id = (select auth.uid())
        and (select private.has_elder_role(elder_id, array['admin', 'caregiver', 'patient']))
    );
create policy medicine_logs_update_caregiver on public.medicine_logs
    for update to authenticated
    using ((select private.has_elder_role(elder_id, array['admin', 'caregiver'])))
    with check ((select private.has_elder_role(elder_id, array['admin', 'caregiver'])));

create policy daily_logs_read_member on public.daily_logs
    for select to authenticated
    using ((select private.has_elder_role(elder_id, array['admin', 'caregiver', 'viewer', 'patient'])));
-- Daily recaps are written by the trusted backend; there is no client write policy.

create policy voice_notes_read_member on public.voice_notes
    for select to authenticated
    using ((select private.has_elder_role(elder_id, array['admin', 'caregiver', 'viewer', 'patient'])));
create policy voice_notes_insert_caregiver on public.voice_notes
    for insert to authenticated with check (
        sender_user_id = (select auth.uid())
        and (select private.has_elder_role(elder_id, array['admin', 'caregiver']))
    );
-- The backend marks voice notes listened after checking the patient membership.

create policy alerts_read_member on public.alerts
    for select to authenticated
    using ((select private.has_elder_role(elder_id, array['admin', 'caregiver', 'viewer', 'patient'])));
create policy alerts_insert_member on public.alerts
    for insert to authenticated with check (
        created_by_user_id = (select auth.uid())
        and status = 'open'
        and resolved_by_user_id is null
        and resolved_at is null
        and (select private.has_elder_role(elder_id, array['admin', 'caregiver', 'patient']))
    );
create policy alerts_update_caregiver on public.alerts
    for update to authenticated
    using ((select private.has_elder_role(elder_id, array['admin', 'caregiver'])))
    with check (
        (select private.has_elder_role(elder_id, array['admin', 'caregiver']))
        and (
            (status in ('resolved', 'false_alarm')
                and resolved_by_user_id = (select auth.uid())
                and resolved_at is not null)
            or
            (status not in ('resolved', 'false_alarm')
                and resolved_by_user_id is null
                and resolved_at is null)
        )
    );

create policy conversations_read_member on public.conversations
    for select to authenticated
    using ((select private.has_elder_role(elder_id, array['admin', 'caregiver', 'viewer', 'patient'])));
create policy conversations_insert_member on public.conversations
    for insert to authenticated with check (
        started_by_user_id = (select auth.uid())
        and (select private.has_elder_role(elder_id, array['admin', 'caregiver', 'patient']))
    );
create policy conversations_update_starter_or_caregiver on public.conversations
    for update to authenticated
    using (
        started_by_user_id = (select auth.uid())
        or (select private.has_elder_role(elder_id, array['admin', 'caregiver']))
    )
    with check ((select private.has_elder_role(elder_id, array['admin', 'caregiver', 'patient'])));

create policy conversation_messages_read_member on public.conversation_messages
    for select to authenticated
    using ((select private.has_elder_role(elder_id, array['admin', 'caregiver', 'viewer', 'patient'])));
create policy conversation_messages_insert_patient_or_caregiver on public.conversation_messages
    for insert to authenticated with check (
        created_by_user_id = (select auth.uid())
        and (
            (speaker = 'patient' and (select private.has_elder_role(elder_id, array['patient'])))
            or
            (speaker = 'caregiver' and (select private.has_elder_role(elder_id, array['admin', 'caregiver'])))
        )
    );
-- Assistant messages are written by the backend after it verifies the user's elder access.

create policy elder_access_requests_read_patient on public.elder_access_requests
    for select to authenticated
    using (patient_user_id = (select auth.uid()));

-- Match only verified patient accounts, create a pending request, and return
-- the same result for matches and misses so the endpoint cannot enumerate users.
create function public.request_elder_link(p_elder_id uuid, p_patient_email text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_patient_user_id uuid;
    v_elder_name text;
    v_requester_name text;
begin
    if (select auth.uid()) is null then
        raise exception 'Authentication required' using errcode = '28000';
    end if;

    if not private.has_elder_role(p_elder_id, array['admin'])
       or not exists (
           select 1 from public.user_profiles as p
           where p.user_id = (select auth.uid()) and p.account_type = 'caregiver'
       ) then
        raise exception 'Not authorized to request patient access' using errcode = '42501';
    end if;

    select account.name into v_elder_name
    from public.elders as account
    where account.id = p_elder_id;

    select coalesce(profile.display_name, 'Caregiver') into v_requester_name
    from public.user_profiles as profile
    where profile.user_id = (select auth.uid());

    select auth_user.id into v_patient_user_id
    from auth.users as auth_user
    join public.user_profiles as profile on profile.user_id = auth_user.id
    where lower(auth_user.email) = lower(trim(p_patient_email))
      and auth_user.email_confirmed_at is not null
      and profile.account_type = 'patient'
      and auth_user.id <> (select auth.uid())
    limit 1;

    if v_patient_user_id is not null
       and not exists (
           select 1 from public.elder_memberships as membership
           where membership.elder_id = p_elder_id
             and membership.user_id = v_patient_user_id
       ) then
        insert into public.elder_access_requests (
            elder_id, patient_user_id, requester_user_id, elder_name, requester_name
        ) values (
            p_elder_id, v_patient_user_id, (select auth.uid()),
            coalesce(v_elder_name, 'Elder profile'), coalesce(v_requester_name, 'Caregiver')
        )
        on conflict (elder_id, patient_user_id) where status = 'pending' do nothing;
    end if;

    return jsonb_build_object('submitted', true);
end;
$$;

-- Only the addressed patient may respond. Approval and patient-membership
-- creation happen in one transaction inside this restricted database function.
create function public.respond_elder_link_request(p_request_id uuid, p_approve boolean)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_request public.elder_access_requests%rowtype;
    v_membership_id uuid;
begin
    if (select auth.uid()) is null then
        raise exception 'Authentication required' using errcode = '28000';
    end if;

    select * into v_request
    from public.elder_access_requests as access_request
    where access_request.id = p_request_id
      and access_request.patient_user_id = (select auth.uid())
    for update;

    if not found or v_request.status <> 'pending' then
        raise exception 'Access request not found or already handled' using errcode = 'P0002';
    end if;

    if not exists (
        select 1 from public.user_profiles as p
        where p.user_id = (select auth.uid()) and p.account_type = 'patient'
    ) then
        raise exception 'Only the patient account may respond' using errcode = '42501';
    end if;

    update public.elder_access_requests
    set status = case when p_approve then 'approved' else 'rejected' end,
        responded_at = now()
    where id = v_request.id;

    if p_approve then
        insert into public.elder_memberships (
            elder_id, user_id, role, status, added_by_user_id
        ) values (
            v_request.elder_id, v_request.patient_user_id, 'patient', 'active', v_request.requester_user_id
        )
        on conflict (elder_id, user_id) do nothing
        returning id into v_membership_id;

        if v_membership_id is null then
            raise exception 'This account already has a membership for the elder' using errcode = '23505';
        end if;
    end if;

    return jsonb_build_object(
        'request_id', v_request.id,
        'status', case when p_approve then 'approved' else 'rejected' end
    );
end;
$$;

revoke all on function public.request_elder_link(uuid, text) from public, anon;
revoke all on function public.respond_elder_link_request(uuid, boolean) from public, anon;
grant execute on function public.request_elder_link(uuid, text) to authenticated;
grant execute on function public.respond_elder_link_request(uuid, boolean) to authenticated;
revoke all on public.elder_access_requests from public, anon, authenticated;
grant select on public.elder_access_requests to authenticated;

revoke insert, update on public.user_profiles from public, anon, authenticated;
grant update (display_name, phone, city) on public.user_profiles to authenticated;

create trigger auth_user_profile_created
    after insert on auth.users
    for each row execute function private.handle_new_auth_user();

grant select on public.user_profiles to authenticated;
grant select, insert, update, delete on public.elders to authenticated;
grant select, insert, update, delete on public.elder_memberships to authenticated;
grant select, insert, update, delete on public.elder_contacts to authenticated;
grant select, insert, update, delete on public.memories to authenticated;
grant select, insert, delete on public.memory_assets to authenticated;
grant select, insert, update, delete on public.events to authenticated;
grant select, insert, update, delete on public.medicines to authenticated;
grant select, insert, update on public.medicine_logs to authenticated;
grant select on public.daily_logs to authenticated;
grant select, insert on public.voice_notes to authenticated;
grant select, insert, update on public.alerts to authenticated;
grant select, insert, update on public.conversations to authenticated;
grant select, insert on public.conversation_messages to authenticated;

insert into storage.buckets (id, name, public, allowed_mime_types)
values
    (
        'elder-media',
        'elder-media',
        false,
        array['image/jpeg', 'image/png', 'image/webp', 'audio/mpeg', 'audio/mp4', 'audio/ogg', 'audio/wav', 'audio/webm']::text[]
    ),
    (
        'elder-audio',
        'elder-audio',
        false,
        array['audio/mpeg', 'audio/mp4', 'audio/ogg', 'audio/wav', 'audio/webm']::text[]
    )
on conflict (id) do update
set public = false,
    allowed_mime_types = excluded.allowed_mime_types;

create policy elder_media_read_member on storage.objects
    for select to authenticated using (
        bucket_id in ('elder-media', 'elder-audio')
        and (select private.storage_has_elder_role(name, array['admin', 'caregiver', 'viewer', 'patient']))
    );
create policy elder_media_insert_caregiver on storage.objects
    for insert to authenticated with check (
        bucket_id = 'elder-media'
        and split_part(name, '/', 2) in ('memories', 'memory-audio', 'voice-notes')
        and (select private.storage_has_elder_role(name, array['admin', 'caregiver']))
    );
create policy elder_media_insert_patient_audio on storage.objects
    for insert to authenticated with check (
        bucket_id = 'elder-audio'
        and split_part(name, '/', 2) in ('conversations', 'alerts')
        and (select private.storage_has_elder_role(name, array['admin', 'caregiver', 'patient']))
    );
create policy elder_media_delete_caregiver on storage.objects
    for delete to authenticated using (
        bucket_id in ('elder-media', 'elder-audio')
        and (select private.storage_has_elder_role(name, array['admin', 'caregiver']))
    );

-- Selected shared tables feed live caregiver dashboards. Message bodies are fetched
-- through RLS-protected queries instead of broadcast in bulk.
do $$
declare
    v_table_name text;
    v_tables text[] := array[
        'elders', 'elder_memberships', 'elder_access_requests', 'elder_contacts', 'memories', 'memory_assets',
        'events', 'medicines', 'medicine_logs', 'daily_logs', 'voice_notes', 'alerts'
    ];
begin
    if exists (select 1 from pg_catalog.pg_publication where pubname = 'supabase_realtime') then
        foreach v_table_name in array v_tables loop
            if not exists (
                select 1 from pg_catalog.pg_publication_tables
                where pubname = 'supabase_realtime'
                  and schemaname = 'public'
                  and tablename = v_table_name
            ) then
                execute format('alter publication supabase_realtime add table public.%I', v_table_name);
            end if;
        end loop;
    else
        raise notice 'supabase_realtime publication not found; enable shared tables to use live dashboard updates';
    end if;
end;
$$;

commit;

