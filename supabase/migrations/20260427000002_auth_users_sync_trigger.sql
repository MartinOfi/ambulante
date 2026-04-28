-- B1.2 — Auth ↔ public.users sync trigger.
-- Creates a public.users profile row after every auth.users INSERT.
-- SECURITY DEFINER runs as the function owner (postgres), not the calling role,
-- so it can bypass RLS to insert into public.users from the auth schema trigger.

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (auth_user_id, display_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    case
      when new.raw_user_meta_data->>'role' in ('cliente', 'tienda', 'admin')
        then (new.raw_user_meta_data->>'role')::public.user_role
      else 'cliente'::public.user_role
    end
  );
  return new;
end;
$$;

-- Drop existing trigger first so the migration is re-runnable after supabase db reset
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();
