-- Atomic "create a school + its owner account" operation. A single SQL
-- function body is one transaction, so a school row is never left behind
-- without its owner (or vice versa) if either insert fails — e.g. a
-- duplicate email or duplicate slug rolls back both.
create or replace function create_school_owner_signup(
  p_school_name text,
  p_slug text,
  p_category text,
  p_full_name text,
  p_email text,
  p_password_hash text
)
returns table (school_id uuid, user_id uuid, membership_id uuid)
language plpgsql
as $$
declare
  v_school_id uuid;
  v_user_id uuid;
  v_membership_id uuid;
begin
  if exists (select 1 from users where lower(email) = lower(p_email)) then
    raise exception 'email_taken' using errcode = 'unique_violation';
  end if;

  if exists (select 1 from schools where slug = p_slug) then
    raise exception 'slug_taken' using errcode = 'unique_violation';
  end if;

  insert into schools (name, slug, category)
  values (p_school_name, p_slug, p_category)
  returning id into v_school_id;

  insert into users (email, password_hash, full_name)
  values (p_email, p_password_hash, p_full_name)
  returning id into v_user_id;

  insert into school_memberships (school_id, user_id, role, status, joined_at)
  values (v_school_id, v_user_id, 'school_owner', 'active', now())
  returning id into v_membership_id;

  return query select v_school_id, v_user_id, v_membership_id;
end;
$$;
