-- Stage B: foundational multi-tenant model.
--
-- Every table gets RLS enabled with zero policies, so the anon/publishable
-- key (PostgREST) has no access at all — the app talks to Postgres only
-- through the service_role key from trusted Next.js server code, which
-- bypasses RLS by design. All tenant scoping (school_id) is enforced in
-- application code from the caller's verified session, never from a
-- client-supplied value.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- users: global identity. A person can belong to multiple schools, so
-- this table is deliberately NOT school-scoped — school_memberships is
-- what ties a user to a school and a role there.
-- ---------------------------------------------------------------------
create table users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  phone text,
  password_hash text not null,
  full_name text not null,
  status text not null default 'active' check (status in ('active', 'suspended')),
  email_verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index users_email_idx on users (lower(email));

alter table users enable row level security;

-- ---------------------------------------------------------------------
-- sessions: DB-backed, opaque, revocable. The cookie holds only a random
-- token; what's stored here is its sha256 hash, so a DB read alone can't
-- be replayed as a live session. Doubles as login history per device.
-- ---------------------------------------------------------------------
create table sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users (id) on delete cascade,
  token_hash text not null unique,
  ip_address text,
  user_agent text,
  created_at timestamptz not null default now(),
  last_used_at timestamptz not null default now(),
  expires_at timestamptz not null,
  revoked_at timestamptz
);

create index sessions_user_id_idx on sessions (user_id);
create index sessions_token_hash_idx on sessions (token_hash);

alter table sessions enable row level security;

-- ---------------------------------------------------------------------
-- login_attempts: brute-force / rate-limit tracking and audit trail.
-- Recorded for every attempt, success or failure, keyed by the email
-- typed (user_id is null when the email doesn't match any account, so
-- failed attempts against unknown emails are still visible for abuse
-- monitoring without leaking account existence to the caller).
-- ---------------------------------------------------------------------
create table login_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users (id) on delete set null,
  email_attempted text not null,
  ip_address text,
  user_agent text,
  success boolean not null,
  created_at timestamptz not null default now()
);

create index login_attempts_email_idx on login_attempts (lower(email_attempted), created_at desc);
create index login_attempts_ip_idx on login_attempts (ip_address, created_at desc);

alter table login_attempts enable row level security;

-- ---------------------------------------------------------------------
-- schools: the tenant. Every other domain table (learners, fees,
-- academics, ...) will carry a school_id foreign key back to this.
-- ---------------------------------------------------------------------
create table schools (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  education_levels text[] not null default '{}',
  category text not null check (category in ('day', 'boarding', 'mixed')),
  county text,
  subcounty text,
  address text,
  phone text,
  email text,
  logo_url text,
  status text not null default 'trial' check (status in ('trial', 'active', 'suspended')),
  subscription_plan text,
  subscription_status text not null default 'trialing' check (subscription_status in ('trialing', 'active', 'past_due', 'canceled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index schools_slug_idx on schools (slug);

alter table schools enable row level security;

-- ---------------------------------------------------------------------
-- school_memberships: ties a user to a school with a role. A person can
-- hold more than one role at the same school (e.g. a teacher whose own
-- child is also enrolled there), so uniqueness is per (school, user,
-- role) rather than per (school, user).
-- ---------------------------------------------------------------------
create table school_memberships (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references schools (id) on delete cascade,
  user_id uuid not null references users (id) on delete cascade,
  role text not null check (role in (
    'school_owner', 'school_admin', 'headteacher', 'deputy_headteacher',
    'bursar', 'teacher', 'parent', 'learner'
  )),
  status text not null default 'active' check (status in ('invited', 'active', 'suspended')),
  invited_by uuid references users (id) on delete set null,
  invited_at timestamptz,
  joined_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (school_id, user_id, role)
);

create index school_memberships_user_id_idx on school_memberships (user_id);
create index school_memberships_school_id_idx on school_memberships (school_id);

alter table school_memberships enable row level security;

-- ---------------------------------------------------------------------
-- academic_years / terms: per-school academic calendar.
-- ---------------------------------------------------------------------
create table academic_years (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references schools (id) on delete cascade,
  name text not null,
  start_date date not null,
  end_date date not null,
  is_current boolean not null default false,
  created_at timestamptz not null default now(),
  unique (school_id, name)
);

create index academic_years_school_id_idx on academic_years (school_id);

-- Only one current academic year per school.
create unique index academic_years_one_current_per_school
  on academic_years (school_id)
  where is_current;

alter table academic_years enable row level security;

create table terms (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references schools (id) on delete cascade,
  academic_year_id uuid not null references academic_years (id) on delete cascade,
  name text not null check (name in ('Term 1', 'Term 2', 'Term 3')),
  start_date date not null,
  end_date date not null,
  is_current boolean not null default false,
  created_at timestamptz not null default now(),
  unique (academic_year_id, name)
);

create index terms_school_id_idx on terms (school_id);
create index terms_academic_year_id_idx on terms (academic_year_id);

create unique index terms_one_current_per_school
  on terms (school_id)
  where is_current;

alter table terms enable row level security;

-- ---------------------------------------------------------------------
-- classes / streams: per-school class structure (e.g. "Grade 4" with
-- streams "Blue"/"Green", or "Form 2" with streams "East"/"West").
-- ---------------------------------------------------------------------
create table classes (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references schools (id) on delete cascade,
  name text not null,
  education_level text not null check (education_level in ('primary', 'junior_secondary', 'senior_secondary')),
  level_order integer not null,
  created_at timestamptz not null default now(),
  unique (school_id, name)
);

create index classes_school_id_idx on classes (school_id);

alter table classes enable row level security;

create table streams (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references schools (id) on delete cascade,
  class_id uuid not null references classes (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique (class_id, name)
);

create index streams_school_id_idx on streams (school_id);
create index streams_class_id_idx on streams (class_id);

alter table streams enable row level security;
