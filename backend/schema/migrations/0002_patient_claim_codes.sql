-- Caregiver-first onboarding with a short-lived, single-use patient claim code.
-- Apply after 0001_initial.sql. Existing profiles and memberships are preserved.
begin;

alter table public.elders
    add column patient_user_id uuid references auth.users (id) on delete set null;
create unique index elders_patient_user_unique
    on public.elders (patient_user_id) where patient_user_id is not null;

-- Preserve only existing one-patient/one-profile links that are unambiguous.
with patient_links as (
    select elder_id, user_id,
           count(*) over (partition by user_id) as profile_count,
           count(*) over (partition by elder_id) as patient_count
    from public.elder_memberships
    where role = 'patient' and status = 'active'
)
update public.elders as elder
set patient_user_id = link.user_id
from patient_links as link
where link.profile_count = 1 and link.patient_count = 1 and elder.id = link.elder_id;

create table public.elder_claim_codes (
    code_hash text primary key check (code_hash ~ '^[0-9a-f]{64}$'),
    elder_id uuid not null references public.elders (id) on delete cascade,
    created_by_user_id uuid not null references auth.users (id) on delete cascade,
    created_at timestamptz not null default now(),
    expires_at timestamptz not null,
    redeemed_at timestamptz,
    redeemed_by_user_id uuid references auth.users (id) on delete set null,
    revoked_at timestamptz,
    check ((redeemed_at is null) = (redeemed_by_user_id is null)),
    check (not (redeemed_at is not null and revoked_at is not null))
);
create unique index elder_claim_codes_one_open_per_elder
    on public.elder_claim_codes (elder_id)
    where redeemed_at is null and revoked_at is null;
create index elder_claim_codes_expiry_idx on public.elder_claim_codes (expires_at)
    where redeemed_at is null and revoked_at is null;
alter table public.elder_claim_codes enable row level security;
revoke all on public.elder_claim_codes from public, anon, authenticated;

-- Claim links are writable only by the security-definer claim function.
drop policy elders_create_self on public.elders;
create policy elders_create_self on public.elders
    for insert to authenticated with check (
        created_by_user_id = (select auth.uid())
        and updated_by_user_id = (select auth.uid())
        and patient_user_id is null
        and exists (
            select 1 from public.user_profiles as profile
            where profile.user_id = (select auth.uid())
              and profile.account_type = 'caregiver'
        )
    );

-- Remove table-level write grants so clients cannot set patient_user_id.
revoke insert, update on public.elders from authenticated;
grant insert (
    name, age, language, city, timezone, lives_alone, doctor_name,
    doctor_phone, created_by_user_id, updated_by_user_id
) on public.elders to authenticated;
grant update (
    name, age, language, city, timezone, lives_alone, doctor_name,
    doctor_phone, updated_by_user_id
) on public.elders to authenticated;

create function public.issue_elder_claim_code(
    p_elder_id uuid, p_code_hash text, p_expires_at timestamptz
)
returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
    v_patient_user_id uuid;
    v_now timestamptz := clock_timestamp();
begin
    if (select auth.uid()) is null then
        raise exception 'Authentication required' using errcode = '42501';
    end if;
    if p_code_hash is null or p_code_hash !~ '^[0-9a-f]{64}$' then
        raise exception 'Invalid claim code digest' using errcode = '22023';
    end if;
    if p_expires_at is null or p_expires_at <= v_now or p_expires_at > v_now + interval '24 hours 5 minutes' then
        raise exception 'Claim code expiry must be within 24 hours' using errcode = '22023';
    end if;
    if not private.has_elder_role(p_elder_id, array['admin', 'caregiver']) then
        raise exception 'Caregiver access required' using errcode = '42501';
    end if;
    select patient_user_id into v_patient_user_id
    from public.elders where id = p_elder_id for update;
    if not found then
        raise exception 'Elder profile unavailable' using errcode = 'P0002';
    end if;
    if v_patient_user_id is not null then
        raise exception 'Elder profile is already claimed' using errcode = '23505';
    end if;

    update public.elder_claim_codes
    set revoked_at = v_now
    where elder_id = p_elder_id and redeemed_at is null and revoked_at is null;
    insert into public.elder_claim_codes (
        code_hash, elder_id, created_by_user_id, expires_at
    ) values (p_code_hash, p_elder_id, (select auth.uid()), p_expires_at);
    return jsonb_build_object('expires_at', p_expires_at);
end;
$$;

create function public.claim_elder_profile(p_code_hash text)
returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
    v_user_id uuid := (select auth.uid());
    v_account_type text;
    v_elder_id uuid;
    v_elder public.elders%rowtype;
    v_now timestamptz := clock_timestamp();
begin
    if v_user_id is null then
        raise exception 'Authentication required' using errcode = '42501';
    end if;
    if p_code_hash is null or p_code_hash !~ '^[0-9a-f]{64}$' then
        raise exception 'Claim code unavailable' using errcode = 'P0002';
    end if;
    select account_type into v_account_type
    from public.user_profiles where user_id = v_user_id;
    if v_account_type is distinct from 'patient' then
        raise exception 'Only a patient account can claim an elder profile' using errcode = '42501';
    end if;

    -- Lock in elder-first order, matching issuance and revocation.
    select elder_id into v_elder_id
    from public.elder_claim_codes where code_hash = p_code_hash;
    if not found then
        raise exception 'Claim code unavailable' using errcode = 'P0002';
    end if;
    select elder.* into v_elder
    from public.elders as elder where elder.id = v_elder_id for update;
    if not found or v_elder.patient_user_id is not null then
        raise exception 'Claim code unavailable' using errcode = 'P0002';
    end if;
    perform 1 from public.elder_claim_codes as claim
    where claim.code_hash = p_code_hash
      and claim.elder_id = v_elder_id
      and claim.redeemed_at is null and claim.revoked_at is null
      and claim.expires_at > v_now
    for update;
    if not found then
        raise exception 'Claim code unavailable' using errcode = 'P0002';
    end if;
    if exists (
        select 1 from public.elder_memberships as membership
        where membership.user_id = v_user_id and membership.role = 'patient'
          and membership.status = 'active' and membership.elder_id <> v_elder_id
    ) then
        raise exception 'Patient account is already linked to another profile' using errcode = '23505';
    end if;
    if exists (
        select 1 from public.elder_memberships as membership
        where membership.elder_id = v_elder_id and membership.user_id = v_user_id
          and membership.role <> 'patient'
    ) then
        raise exception 'Account has a different membership for this profile' using errcode = '23505';
    end if;

    update public.elders
    set patient_user_id = v_user_id, updated_by_user_id = v_user_id
    where id = v_elder_id;
    insert into public.elder_memberships as existing_membership (
        elder_id, user_id, role, status, added_by_user_id
    ) values (v_elder_id, v_user_id, 'patient', 'active', v_user_id)
    on conflict (elder_id, user_id) do update
    set status = 'active', updated_by_user_id = v_user_id
    where existing_membership.role = 'patient';
    if not found then
        raise exception 'Account membership could not be created' using errcode = '23505';
    end if;
    update public.elder_claim_codes
    set redeemed_at = v_now, redeemed_by_user_id = v_user_id
    where code_hash = p_code_hash;
    return jsonb_build_object(
        'elder_id', v_elder.id, 'elder_name', v_elder.name, 'linked_at', v_now
    );
end;
$$;

create function public.revoke_elder_claim_code(p_elder_id uuid)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
    v_elder_id uuid;
begin
    if (select auth.uid()) is null then
        raise exception 'Authentication required' using errcode = '42501';
    end if;
    if not private.has_elder_role(p_elder_id, array['admin', 'caregiver']) then
        raise exception 'Caregiver access required' using errcode = '42501';
    end if;
    select id into v_elder_id from public.elders where id = p_elder_id for update;
    if not found then
        raise exception 'Elder profile unavailable' using errcode = 'P0002';
    end if;
    update public.elder_claim_codes
    set revoked_at = clock_timestamp()
    where elder_id = v_elder_id and redeemed_at is null and revoked_at is null;
end;
$$;

revoke all on function public.issue_elder_claim_code(uuid, text, timestamptz) from public, anon;
revoke all on function public.claim_elder_profile(text) from public, anon;
revoke all on function public.revoke_elder_claim_code(uuid) from public, anon;
grant execute on function public.issue_elder_claim_code(uuid, text, timestamptz) to authenticated;
grant execute on function public.claim_elder_profile(text) to authenticated;
grant execute on function public.revoke_elder_claim_code(uuid) to authenticated;

-- Disable the old email-approval RPCs; retain their table for existing data.
revoke all on function public.request_elder_link(uuid, text) from public, anon, authenticated;
revoke all on function public.respond_elder_link_request(uuid, boolean) from public, anon, authenticated;
revoke all on public.elder_access_requests from public, anon, authenticated;

notify pgrst, 'reload schema';

commit;
