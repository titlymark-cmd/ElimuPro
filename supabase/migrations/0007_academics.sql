create table subjects (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references schools (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique (school_id, name)
);

create index subjects_school_id_idx on subjects (school_id);

alter table subjects enable row level security;

-- Which subjects are actually taught in which class — a school doesn't
-- teach every subject to every class (e.g. no Physics in Grade 1).
create table class_subjects (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references schools (id) on delete cascade,
  class_id uuid not null references classes (id) on delete cascade,
  subject_id uuid not null references subjects (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (class_id, subject_id)
);

create index class_subjects_school_id_idx on class_subjects (school_id);
create index class_subjects_class_id_idx on class_subjects (class_id);

alter table class_subjects enable row level security;

-- A single graded event: "Mid-Term CAT" for Grade 4 Mathematics, Term 1.
create table assessments (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references schools (id) on delete cascade,
  class_id uuid not null references classes (id) on delete cascade,
  subject_id uuid not null references subjects (id) on delete cascade,
  term_id uuid not null references terms (id) on delete cascade,
  name text not null,
  max_score numeric(6, 2) not null check (max_score > 0),
  created_at timestamptz not null default now()
);

create index assessments_school_id_idx on assessments (school_id);
create index assessments_class_id_idx on assessments (class_id);
create index assessments_term_id_idx on assessments (term_id);

alter table assessments enable row level security;

create table marks (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references assessments (id) on delete cascade,
  learner_id uuid not null references learners (id) on delete cascade,
  score numeric(6, 2) not null check (score >= 0),
  recorded_by uuid not null references users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (assessment_id, learner_id)
);

create index marks_assessment_id_idx on marks (assessment_id);
create index marks_learner_id_idx on marks (learner_id);

alter table marks enable row level security;

-- Append-only history of every mark entered or changed — who, when,
-- what it was before, what it became. Never written to directly by the
-- app; only upsert_mark below writes it, in the same transaction as the
-- mark itself, so the two can never drift apart.
create table marks_audit_log (
  id uuid primary key default gen_random_uuid(),
  mark_id uuid not null references marks (id) on delete cascade,
  assessment_id uuid not null,
  learner_id uuid not null,
  old_score numeric(6, 2),
  new_score numeric(6, 2) not null,
  changed_by uuid not null references users (id),
  changed_at timestamptz not null default now()
);

create index marks_audit_log_mark_id_idx on marks_audit_log (mark_id);

alter table marks_audit_log enable row level security;

create or replace function upsert_mark(
  p_assessment_id uuid,
  p_learner_id uuid,
  p_score numeric,
  p_recorded_by uuid
)
returns table (mark_id uuid)
language plpgsql
as $$
declare
  v_mark_id uuid;
  v_old_score numeric;
begin
  select id, score into v_mark_id, v_old_score
  from marks where assessment_id = p_assessment_id and learner_id = p_learner_id;

  if v_mark_id is null then
    insert into marks (assessment_id, learner_id, score, recorded_by)
    values (p_assessment_id, p_learner_id, p_score, p_recorded_by)
    returning id into v_mark_id;

    insert into marks_audit_log (mark_id, assessment_id, learner_id, old_score, new_score, changed_by)
    values (v_mark_id, p_assessment_id, p_learner_id, null, p_score, p_recorded_by);
  else
    update marks set score = p_score, updated_at = now() where id = v_mark_id;

    insert into marks_audit_log (mark_id, assessment_id, learner_id, old_score, new_score, changed_by)
    values (v_mark_id, p_assessment_id, p_learner_id, v_old_score, p_score, p_recorded_by);
  end if;

  return query select v_mark_id;
end;
$$;

-- School-configurable grading scale (not hardcoded to one curriculum) —
-- e.g. a CBC school defines "Exceeding Expectations" 80-100, a school
-- using straight letter grades defines "A" 80-100, etc. Bands must not
-- overlap for a school, enforced by exclusion constraint below.
create extension if not exists btree_gist;

create table grading_bands (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references schools (id) on delete cascade,
  label text not null,
  min_percent numeric(5, 2) not null check (min_percent >= 0),
  max_percent numeric(5, 2) not null check (max_percent <= 100),
  created_at timestamptz not null default now(),
  check (min_percent <= max_percent),
  exclude using gist (school_id with =, numrange(min_percent::numeric, max_percent::numeric, '[]') with &&)
);

create index grading_bands_school_id_idx on grading_bands (school_id);

alter table grading_bands enable row level security;
