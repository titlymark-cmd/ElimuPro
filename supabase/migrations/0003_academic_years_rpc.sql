-- Creating an academic year always creates its three terms in the same
-- transaction (Kenyan schools always run Term 1/2/3), and always becomes
-- the school's new "current" year/term — clearing whatever was current
-- before, since the partial unique indexes only allow one of each per
-- school. Doing the clear-then-set as one function body keeps it atomic;
-- done as two separate app-level UPDATE/INSERT calls it could leave a
-- school with zero or two "current" years if the second call failed.
create or replace function create_academic_year_with_terms(
  p_school_id uuid,
  p_name text,
  p_start_date date,
  p_end_date date,
  p_term1_start date,
  p_term1_end date,
  p_term2_start date,
  p_term2_end date,
  p_term3_start date,
  p_term3_end date
)
returns table (academic_year_id uuid)
language plpgsql
as $$
declare
  v_year_id uuid;
begin
  update academic_years set is_current = false where school_id = p_school_id and is_current;
  update terms set is_current = false where school_id = p_school_id and is_current;

  insert into academic_years (school_id, name, start_date, end_date, is_current)
  values (p_school_id, p_name, p_start_date, p_end_date, true)
  returning id into v_year_id;

  insert into terms (school_id, academic_year_id, name, start_date, end_date, is_current)
  values
    (p_school_id, v_year_id, 'Term 1', p_term1_start, p_term1_end, true),
    (p_school_id, v_year_id, 'Term 2', p_term2_start, p_term2_end, false),
    (p_school_id, v_year_id, 'Term 3', p_term3_start, p_term3_end, false);

  return query select v_year_id;
end;
$$;
