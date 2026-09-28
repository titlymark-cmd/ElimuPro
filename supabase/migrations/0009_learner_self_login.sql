-- Older learners (secondary school) can have their own email and their
-- own portal login, separate from any guardian's. Both nullable: most
-- younger learners will have neither.
alter table learners add column email text;
alter table learners add column user_id uuid references users (id) on delete set null;

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

  if v_invitation.role = 'learner' and v_invitation.learner_id is not null then
    update learners set user_id = v_user_id where id = v_invitation.learner_id;
  end if;

  update invitations set accepted_at = now() where id = v_invitation.id;

  return query select v_user_id, v_invitation.school_id, v_is_new;
end;
$$;
