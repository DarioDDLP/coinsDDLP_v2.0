-- ─────────────────────────────────────────────────────────────────────────────
-- Admin → Base de datos: número de filas de cada tabla en una sola llamada
--
-- security definer: cuenta también lo que la RLS oculta al admin (user_permission
-- de otros usuarios) y auth.users, que no expone la Data API. Solo lectura y solo admin.
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function public.db_table_counts()
returns table (name text, rows bigint)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Solo el administrador puede consultar la base de datos'
      using errcode = '42501';
  end if;

  return query
              select 'euro', count(*) from public.euro
    union all select 'owner', count(*) from public.owner
    union all select 'euro_ownership', count(*) from public.euro_ownership
    union all select 'peseta_type', count(*) from public.peseta_type
    union all select 'peseta', count(*) from public.peseta
    union all select 'country_location', count(*) from public.country_location
    union all select 'user_permission', count(*) from public.user_permission
    union all select 'guest_permission', count(*) from public.guest_permission
    union all select 'access_visit', count(*) from public.access_visit
    union all select 'access_event', count(*) from public.access_event
    union all select 'numista_usage', count(*) from public.numista_usage
    union all select 'auth_users', count(*) from auth.users;
end;
$$;

revoke execute on function public.db_table_counts() from public, anon;
grant execute on function public.db_table_counts() to authenticated;
