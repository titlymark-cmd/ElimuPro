create table attendance_records (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references schools (id) on delete cascade,
  learner_id uuid not null references learners (id) on delete cascade,
  class_id uuid not null references classes (id) on delete cascade,
  date date not null,
  status text not null check (status in ('present', 'absent', 'late', 'excused')),
  recorded_by uuid not null references users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (learner_id, date)
);

create index attendance_records_school_id_idx on attendance_records (school_id);
create index attendance_records_class_id_idx on attendance_records (class_id);
create index attendance_records_learner_id_idx on attendance_records (learner_id);
create index attendance_records_date_idx on attendance_records (date);

alter table attendance_records enable row level security;

create or replace function upsert_attendance(
  p_school_id uuid,
  p_learner_id uuid,
  p_class_id uuid,
  p_date date,
  p_status text,
  p_recorded_by uuid
)
returns table (attendance_id uuid)
language plpgsql
as $$
declare
  v_id uuid;
begin
  insert into attendance_records (school_id, learner_id, class_id, date, status, recorded_by)
  values (p_school_id, p_learner_id, p_class_id, p_date, p_status, p_recorded_by)
  on conflict (learner_id, date) do update
    set status = excluded.status, updated_at = now(), recorded_by = excluded.recorded_by
  returning id into v_id;

  return query select v_id;
end;
$$;

-- A parent invite is for one specific learner — links the invite to
-- that learner so accepting it can attach the resulting account to the
-- matching learner_guardians row (matched on the invited email), which
-- is what actually scopes the parent portal to their own child.
alter table invitations add column learner_id uuid references learners (id) on delete cascade;

create or replace function accept_invitation(
  p_token_hash text,
  p_full_name text,
  p_password_hash text
)
returns table (user_id uuid, school_id uuid, is_new_user boolean)
language plpgsql
as $$
declare
  v_invitation invitations%rowtype;
  v_existing_user_id uuid;
  v_user_id uuid;
  v_is_new boolean;
begin
  select * into v_invitation from invitations where token_hash = p_token_hash;

  if v_invitation is null then
    raise exception 'invitation_not_found';
  end if;
  if v_invitation.accepted_at is not null then
    raise exception 'invitation_already_accepted';
  end if;
  if v_invitation.revoked_at is not null then
    raise exception 'invitation_revoked';
  end if;
  if v_invitation.expires_at < now() then
    raise exception 'invitation_expired';
  end if;

  select id into v_existing_user_id from users where lower(email) = lower(v_invitation.email);

  if v_existing_user_id is not null then
    v_user_id := v_existing_user_id;
    v_is_new := false;
  else
    if p_full_name is null or p_password_hash is null then
      raise exception 'name_and_password_required';
    end if;
    insert into users (email, password_hash, full_name)
    values (v_invitation.email, p_password_hash, p_full_name)
    returning id into v_user_id;
    v_is_new := true;
  end if;

  insert into school_memberships (school_id, user_id, role, status, invited_by, invited_at, joined_at)
  values (v_invitation.school_id, v_user_id, v_invitation.role, 'active', v_invitation.invited_by, v_invitation.created_at, now())
  on conflict (school_id, user_id, role) do nothing;

  if v_invitation.role = 'parent' and v_invitation.learner_id is not null then
    update learner_guardians
    set user_id = v_user_id
    where learner_id = v_invitation.learner_id
      and lower(email) = lower(v_invitation.email);

    if not found then
      insert into learner_guardians (learner_id, full_name, email, relationship, user_id)
      values (v_invitation.learner_id, coalesce(p_full_name, v_invitation.email), v_invitation.email, 'guardian', v_user_id);
    end if;
  end if;

  update invitations set accepted_at = now() where id = v_invitation.id;

  return query select v_user_id, v_invitation.school_id, v_is_new;
end;
$$;
