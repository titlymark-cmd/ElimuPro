-- Per-school sequential admission numbers, safe under concurrent
-- admissions: the counter row is updated (not just read-then-written)
-- inside create_learner_with_admission_number, so Postgres's normal row
-- locking on UPDATE serializes concurrent callers — two admins enrolling
-- learners at the same instant can't be handed the same number.
create table school_admission_counters (
  school_id uuid primary key references schools (id) on delete cascade,
  next_number integer not null default 1
);

alter table school_admission_counters enable row level security;

create table learners (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references schools (id) on delete cascade,
  admission_number text not null,
  first_name text not null,
  last_name text not null,
  date_of_birth date,
  gender text check (gender in ('male', 'female')),
  class_id uuid references classes (id) on delete set null,
  stream_id uuid references streams (id) on delete set null,
  status text not null default 'active' check (status in ('active', 'inactive', 'graduated', 'transferred')),
  enrolled_at date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (school_id, admission_number)
);

create index learners_school_id_idx on learners (school_id);
create index learners_class_id_idx on learners (class_id);

alter table learners enable row level security;

-- A learner's guardians, captured at admission time even before any of
-- them has an ElimuPro login — user_id is filled in later once a
-- guardian accepts a parent-role invite (see school_memberships/
-- invitations), linking this contact record to a real portal account.
create table learner_guardians (
  id uuid primary key default gen_random_uuid(),
  learner_id uuid not null references learners (id) on delete cascade,
  full_name text not null,
  phone text,
  email text,
  relationship text not null check (relationship in ('mother', 'father', 'guardian')),
  is_primary boolean not null default false,
  user_id uuid references users (id) on delete set null,
  created_at timestamptz not null default now()
);

create index learner_guardians_learner_id_idx on learner_guardians (learner_id);

alter table learner_guardians enable row level security;

create or replace function create_learner_with_admission_number(
  p_school_id uuid,
  p_first_name text,
  p_last_name text,
  p_date_of_birth date,
  p_gender text,
  p_class_id uuid,
  p_stream_id uuid
)
returns table (learner_id uuid, admission_number text)
language plpgsql
as $$
declare
  v_next integer;
  v_admission_number text;
  v_learner_id uuid;
begin
  insert into school_admission_counters (school_id, next_number)
  values (p_school_id, 2)
  on conflict (school_id) do update set next_number = school_admission_counters.next_number + 1
  returning next_number - 1 into v_next;

  v_admission_number := lpad(v_next::text, 4, '0');

  insert into learners (school_id, admission_number, first_name, last_name, date_of_birth, gender, class_id, stream_id)
  values (p_school_id, v_admission_number, p_first_name, p_last_name, p_date_of_birth, p_gender, p_class_id, p_stream_id)
  returning id into v_learner_id;

  return query select v_learner_id, v_admission_number;
end;
$$;
