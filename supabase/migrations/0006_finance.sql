-- What's charged: per term, optionally scoped to one class (null class_id
-- means it applies to every class in that term — e.g. a school-wide
-- activity fee vs a class-specific trip fee).
create table fee_structure_items (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references schools (id) on delete cascade,
  term_id uuid not null references terms (id) on delete cascade,
  class_id uuid references classes (id) on delete cascade,
  name text not null,
  amount numeric(12, 2) not null check (amount > 0),
  created_at timestamptz not null default now()
);

create index fee_structure_items_school_id_idx on fee_structure_items (school_id);
create index fee_structure_items_term_id_idx on fee_structure_items (term_id);
create index fee_structure_items_class_id_idx on fee_structure_items (class_id);

alter table fee_structure_items enable row level security;

-- The actual money-in ledger. amount is positive for a normal payment
-- and negative for a reversal of an earlier one (reversal_of_payment_id
-- points back at it) — a learner's balance is just sum(amount), so a
-- reversal nets out correctly without ever touching the original row.
-- "mpesa_manual" is a bursar recording a payment they saw land in the
-- school's till/paybill by hand — genuinely real, distinct from (and not
-- a substitute for) the self-serve STK Push flow, which isn't built yet.
create table payments (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references schools (id) on delete cascade,
  learner_id uuid not null references learners (id) on delete cascade,
  term_id uuid references terms (id) on delete set null,
  amount numeric(12, 2) not null,
  method text not null check (method in ('cash', 'bank_transfer', 'mpesa_manual', 'cheque', 'other')),
  reference text,
  recorded_by uuid not null references users (id),
  received_at timestamptz not null default now(),
  reversal_of_payment_id uuid references payments (id),
  created_at timestamptz not null default now()
);

create index payments_school_id_idx on payments (school_id);
create index payments_learner_id_idx on payments (learner_id);
create index payments_term_id_idx on payments (term_id);

alter table payments enable row level security;

-- Enforced immutability, not just a convention: once a payment is
-- inserted, nothing — not even the service_role client the app itself
-- uses — can UPDATE or DELETE it. Corrections are always a new reversal
-- row. This is what "no silent edits/deletes of confirmed payments"
-- actually means at the database level.
create or replace function reject_payment_mutation()
returns trigger
language plpgsql
as $$
begin
  raise exception 'payments rows are immutable — insert a reversal instead of updating or deleting';
end;
$$;

create trigger payments_no_update before update on payments
  for each row execute function reject_payment_mutation();

create trigger payments_no_delete before delete on payments
  for each row execute function reject_payment_mutation();
