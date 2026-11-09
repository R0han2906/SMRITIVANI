-- Proposed two-device pairing and voice-history tables.
-- Review before applying. This migration is NOT applied automatically by FastAPI.
begin;

create table public.elder_device_codes (
    id uuid primary key default gen_random_uuid(),
    elder_id uuid not null references public.elders(id) on delete cascade,
    code_hash text not null unique,
    issued_by_user_id uuid not null references auth.users(id) on delete cascade,
    expires_at timestamptz not null,
    consumed_at timestamptz,
    created_at timestamptz not null default now()
);
create unique index elder_device_codes_one_active_idx on public.elder_device_codes(elder_id)
    where consumed_at is null;
create index elder_device_codes_expiry_idx on public.elder_device_codes(expires_at);

create table public.paired_devices (
    id uuid primary key default gen_random_uuid(),
    elder_id uuid not null references public.elders(id) on delete cascade,
    device_token_hash text not null unique,
    user_agent text check (user_agent is null or char_length(user_agent) <= 500),
    first_paired_at timestamptz not null default now(),
    last_seen_at timestamptz not null default now(),
    is_active boolean not null default true
);
create index paired_devices_elder_idx on public.paired_devices(elder_id, is_active);

create table public.voice_interactions (
    id uuid primary key default gen_random_uuid(),
    elder_id uuid not null references public.elders(id) on delete cascade,
    session_id uuid,
    transcript text not null check (char_length(transcript) <= 12000),
    transcript_lang text not null default 'hi-IN',
    transcript_confidence real,
    intent text not null default 'general',
    intent_confidence real,
    sentiment text not null default 'neutral',
    sentiment_score real,
    is_emergency boolean not null default false,
    emergency_terms text[] not null default '{}',
    assistant_response text not null check (char_length(assistant_response) <= 12000),
    action_type text not null default 'none',
    action_target text not null default '',
    asr_provider text not null default 'browser',
    tts_provider text not null default 'browser',
    llm_provider text not null default 'local_rules',
    latency_ms integer not null default 0 check (latency_ms >= 0),
    created_at timestamptz not null default now()
);
create index voice_interactions_elder_recent_idx on public.voice_interactions(elder_id, created_at desc);
create index voice_interactions_emergency_idx on public.voice_interactions(elder_id, created_at desc) where is_emergency;

create table public.safety_alerts (
    id uuid primary key default gen_random_uuid(),
    elder_id uuid not null references public.elders(id) on delete cascade,
    voice_interaction_id uuid references public.voice_interactions(id) on delete set null,
    severity text not null check (severity in ('low','medium','high','critical')),
    alert_type text not null,
    transcript text check (transcript is null or char_length(transcript) <= 12000),
    detected_terms text[] not null default '{}',
    status text not null default 'pending' check (status in ('pending','acknowledged','resolved','false_positive')),
    acknowledged_by uuid references auth.users(id) on delete set null,
    acknowledged_at timestamptz,
    created_at timestamptz not null default now()
);
create index safety_alerts_elder_recent_idx on public.safety_alerts(elder_id, created_at desc);
create index safety_alerts_status_idx on public.safety_alerts(status, created_at desc);

create table public.daily_summaries (
    id uuid primary key default gen_random_uuid(),
    elder_id uuid not null references public.elders(id) on delete cascade,
    summary_date date not null,
    mood_score real,
    mood_label text,
    medicine_compliance_pct real,
    total_interactions integer not null default 0,
    total_talk_seconds integer not null default 0,
    summary_text text,
    highlights jsonb not null default '[]'::jsonb,
    created_at timestamptz not null default now(),
    unique(elder_id, summary_date)
);
create index daily_summaries_elder_date_idx on public.daily_summaries(elder_id, summary_date desc);

alter table public.elder_device_codes enable row level security;
alter table public.paired_devices enable row level security;
alter table public.voice_interactions enable row level security;
alter table public.safety_alerts enable row level security;
alter table public.daily_summaries enable row level security;

create policy "caregivers read elder voice interactions" on public.voice_interactions
    for select to authenticated using (private.has_elder_role(elder_id, array['admin','caregiver','viewer']));
create policy "caregivers read elder safety alerts" on public.safety_alerts
    for select to authenticated using (private.has_elder_role(elder_id, array['admin','caregiver','viewer']));
create policy "caregivers update elder safety alerts" on public.safety_alerts
    for update to authenticated using (private.has_elder_role(elder_id, array['admin','caregiver']))
    with check (private.has_elder_role(elder_id, array['admin','caregiver']));
create policy "caregivers read elder daily summaries" on public.daily_summaries
    for select to authenticated using (private.has_elder_role(elder_id, array['admin','caregiver','viewer']));

-- No direct client access to pairing credentials or assistant-authored records.
revoke all on public.elder_device_codes, public.paired_devices, public.voice_interactions,
    public.safety_alerts, public.daily_summaries from anon, authenticated;
grant select on public.voice_interactions, public.safety_alerts, public.daily_summaries to authenticated;
grant update(status, acknowledged_by, acknowledged_at) on public.safety_alerts to authenticated;

notify pgrst, 'reload schema';
commit;
