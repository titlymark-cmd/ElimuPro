-- target_role null = visible to every member of the school; otherwise
-- scoped to one role (e.g. only parents, only teachers).
create table announcements (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references schools (id) on delete cascade,
  title text not null,
  body text not null,
  target_role text check (target_role in (
    'school_owner', 'school_admin', 'headteacher', 'deputy_headteacher',
    'bursar', 'teacher', 'parent', 'learner'
  )),
  created_by uuid not null references users (id),
  created_at timestamptz not null default now()
);

create index announcements_school_id_idx on announcements (school_id);
create index announcements_created_at_idx on announcements (created_at desc);

alter table announcements enable row level security;
