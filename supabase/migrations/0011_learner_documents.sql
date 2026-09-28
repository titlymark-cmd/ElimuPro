-- Private bucket — never public. Every file is reached only through a
-- server-minted, short-lived signed URL (see downloadLearnerDocumentAction),
-- never a stable public path, per the "no predictable public URLs for
-- sensitive documents" requirement.
insert into storage.buckets (id, name, public)
values ('admission-documents', 'admission-documents', false)
on conflict (id) do nothing;

create table learner_documents (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references schools (id) on delete cascade,
  learner_id uuid not null references learners (id) on delete cascade,
  file_name text not null,
  storage_path text not null,
  content_type text not null,
  size_bytes integer not null,
  uploaded_by uuid not null references users (id),
  created_at timestamptz not null default now()
);

create index learner_documents_school_id_idx on learner_documents (school_id);
create index learner_documents_learner_id_idx on learner_documents (learner_id);

alter table learner_documents enable row level security;
