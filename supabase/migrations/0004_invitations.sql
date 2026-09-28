create table invitations (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references schools (id) on delete cascade,
  email text not null,
  role text not null check (role in (
    'school_owner', 'school_admin', 'headteacher', 'deputy_headteacher',
    'bursar', 'teacher', 'parent', 'learner'
  )),
  token_hash text not null unique,
  invited_by uuid not null references users (id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  accepted_at timestamptz,
  revoked_at timestamptz
);

create index invitations_school_id_idx on invitations (school_id);
create index invitations_token_hash_idx on invitations (token_hash);

-- Only one outstanding (not yet accepted/revoked) invite per school+email+role.
create unique index invitations_one_outstanding
  on invitations (school_id, lower(email), role)
  where accepted_at is null and revoked_at is null;

alter table invitations enable row level security;

-- Accepting an invite either creates a brand-new user (the invitee had no
-- account) or just attaches a membership to an existing one. These are
-- deliberately different security postures: for a NEW user, the caller
-- supplies a fresh password as part of this same call, so a session can
-- be created immediately afterward — the token stands in for email
-- verification, same as any invite-based signup. For an EXISTING user,
-- this function only attaches the membership; it never logs the caller
-- in, because doing so would let anyone holding the invite link (not
-- necessarily the account owner) hijack that account without ever
-- proving they know its password.
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

  update invitations set accepted_at = now() where id = v_invitation.id;

  return query select v_user_id, v_invitation.school_id, v_is_new;
end;
$$;
