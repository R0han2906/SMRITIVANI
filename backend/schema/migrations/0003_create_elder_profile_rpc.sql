-- Create care profiles through an authenticated function that derives its actor
-- from auth.uid(). The elder and creator-admin membership commit atomically.
begin;

create function public.create_elder_profile(
    p_name text,
    p_age smallint,
    p_language text,
    p_city text,
    p_timezone text,
    p_lives_alone boolean,
    p_doctor_name text,
    p_doctor_phone text
)
returns setof public.elders
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_user_id uuid := (select auth.uid());
    v_account_type text;
    v_elder public.elders%rowtype;
begin
    if v_user_id is null then
        raise exception 'A valid signed-in user is required to create an elder profile'
            using errcode = '42501';
    end if;

    select profile.account_type into v_account_type
    from public.user_profiles as profile
    where profile.user_id = v_user_id;

    if v_account_type is distinct from 'caregiver' then
        raise exception 'Only a caregiver account can create an elder profile'
            using errcode = '42501';
    end if;

    insert into public.elders (
        name, age, language, city, timezone, lives_alone,
        doctor_name, doctor_phone, created_by_user_id, updated_by_user_id
    ) values (
        p_name, p_age, p_language, p_city, p_timezone, p_lives_alone,
        p_doctor_name, p_doctor_phone, v_user_id, v_user_id
    )
    returning * into v_elder;

    -- The existing AFTER INSERT trigger creates the first admin membership in
    -- this same transaction. If membership creation fails, the profile rolls back.
    return next v_elder;
    return;
end;
$$;

revoke all on function public.create_elder_profile(
    text, smallint, text, text, text, boolean, text, text
) from public, anon;
grant execute on function public.create_elder_profile(
    text, smallint, text, text, text, boolean, text, text
) to authenticated;

notify pgrst, 'reload schema';
commit;
