alter table public.users
  add column is_platform_admin boolean not null default false;
