-- Lets a superadmin create accounts for other people, without any secret key
-- in the app.
--
-- How it works: the admin puts an email on the invitation list, then the app
-- signs that email up with the chosen password through the normal public
-- sign-up call. A trigger on auth.users rejects every sign-up whose email is
-- not on the list, so nobody else can register. Each user's data is already
-- kept apart by the "Own data only" policies on every table.
--
-- Run this once in the Supabase SQL editor, after 005. Safe to re-run.
--
-- One dashboard setting matters: Authentication → Providers → Email →
-- "Confirm email". With it ON, a created user must click the confirmation
-- email before signing in. Turn it OFF for accounts to work immediately.

-- 1. Who is an admin. Seeded with the superadmin; more can be added here.
create table if not exists admins (
  email text primary key,
  created_at timestamptz not null default now()
);

insert into admins (email) values ('khaingwutyiwin1712@gmail.com')
  on conflict (email) do nothing;

-- True when the signed-in user is an admin. SECURITY DEFINER so the policy
-- on `admins` itself can call it without recursing into that same policy.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admins a
    where lower(a.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

grant execute on function public.is_admin() to authenticated;

alter table admins enable row level security;
drop policy if exists "Admins can read admins" on admins;
create policy "Admins can read admins" on admins for select using (public.is_admin());

-- 2. The invitation list. Only admins may read or change it.
create table if not exists allowed_users (
  email text primary key,
  note text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table allowed_users enable row level security;
drop policy if exists "Admins manage allowed users" on allowed_users;
create policy "Admins manage allowed users" on allowed_users
  for all using (public.is_admin()) with check (public.is_admin());

-- 3. Sign-ups are by invitation only. Deliberately no exception for admin
--    emails: with the admin address committed in this file, such a branch
--    would let anyone claim the admin account on a project where it does
--    not exist yet. Bootstrap a fresh project by inserting the admin's email
--    into allowed_users in the SQL editor before creating the account.
create or replace function public.enforce_invited_signup()
returns trigger
language plpgsql
security definer
set search_path = public
as $
begin
  -- Invited through the app or the SQL editor.
  if new.email is not null
     and exists (select 1 from public.allowed_users u where lower(u.email) = lower(new.email)) then
    return new;
  end if;
  -- Invited from the Supabase dashboard ("Invite user"): the invitation email
  -- is the gate there, and GoTrue stamps invited_at on those rows.
  if new.invited_at is not null then
    return new;
  end if;
  raise exception 'Sign-ups are by invitation only. Ask the admin to create your account.'
    using errcode = 'P0001';
end;
$;

drop trigger if exists enforce_invited_signup on auth.users;
create trigger enforce_invited_signup
  before insert on auth.users
  for each row execute function public.enforce_invited_signup();

-- 4. What the admin sees: every invited email and the state of its account.
--    Reads auth.users, which the API never exposes directly; SECURITY DEFINER
--    with an explicit admin check inside.
create or replace function public.admin_list_users()
returns table (
  email text,
  note text,
  invited_at timestamptz,
  signed_up_at timestamptz,
  confirmed_at timestamptz,
  last_sign_in_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select u.email, u.note, u.created_at, au.created_at, au.email_confirmed_at, au.last_sign_in_at
  from public.allowed_users u
  left join auth.users au on lower(au.email) = lower(u.email)
  where public.is_admin()
  order by u.created_at desc;
$$;

revoke all on function public.admin_list_users() from public;
grant execute on function public.admin_list_users() to authenticated;

notify pgrst, 'reload schema';

-- Verify (run while signed in as the admin from the app, or check the tables):
--   select * from admins;
--   select tgname from pg_trigger where tgname = 'enforce_invited_signup';
