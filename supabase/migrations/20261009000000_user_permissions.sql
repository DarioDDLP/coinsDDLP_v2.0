-- ─────────────────────────────────────────────────────────────────────────────
-- Permisos de usuario gestionados por el admin
--
--   · `user_permission`  → permisos concedidos a cada usuario
--   · `guest_permission` → permisos del perfil Invitado (visitantes sin sesión;
--                          los usuarios con sesión también los heredan)
--   · `is_admin()` / `has_permission(p)` → usadas por las políticas RLS
--
-- Las tablas de permisos solo se escriben desde la Edge Function `admin-users`
-- (service_role). El admin (`app_metadata.role = 'admin'`) tiene todos.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Tablas
create table if not exists public.user_permission (
  "userId"   uuid not null references auth.users(id) on delete cascade,
  permission text not null,
  primary key ("userId", permission)
);

create table if not exists public.guest_permission (
  permission text primary key
);

alter table public.user_permission  enable row level security;
alter table public.guest_permission enable row level security;

create policy "user_permission_select_own" on public.user_permission
  for select to authenticated using (auth.uid() = "userId");

create policy "guest_permission_select_all" on public.guest_permission
  for select to anon, authenticated using (true);

grant select on public.user_permission  to authenticated;
grant select on public.guest_permission to anon, authenticated;

-- 2. Funciones
create or replace function public.is_admin()
returns boolean
language sql
stable
set search_path = ''
as $$
  select coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin';
$$;

create or replace function public.has_permission(p text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.is_admin()
    or exists (select 1 from public.guest_permission g where g.permission = p)
    or exists (
      select 1 from public.user_permission u
      where u."userId" = auth.uid() and u.permission = p
    );
$$;

grant execute on function public.is_admin()            to anon, authenticated;
grant execute on function public.has_permission(text)  to anon, authenticated;

-- 3. Limpieza de las políticas de escritura anteriores (las de lectura se mantienen)
do $$
declare
  r record;
begin
  for r in
    select policyname, tablename
    from pg_policies
    where schemaname = 'public'
      and tablename in ('euro', 'peseta', 'peseta_type', 'euro_ownership', 'country_location')
      and cmd <> 'SELECT'
  loop
    execute format('drop policy %I on public.%I', r.policyname, r.tablename);
  end loop;
end $$;

-- 4. Nuevas políticas de escritura

-- ---- euro (catálogo) ----
create policy "euro_insert_tools" on public.euro
  for insert to authenticated
  with check (public.has_permission('tools.addEuro') or public.has_permission('tools.addYear'));
create policy "euro_update_catalog" on public.euro
  for update to authenticated
  using (public.has_permission('euros.catalog.edit'))
  with check (public.has_permission('euros.catalog.edit'));
create policy "euro_delete" on public.euro
  for delete to authenticated
  using (public.has_permission('euros.delete'));

-- ---- euro_ownership (posesión) ----
create policy "euro_ownership_insert" on public.euro_ownership
  for insert to authenticated
  with check (
    (auth.uid() = "ownerId" and public.has_permission('euros.units.editOwn'))
    or public.has_permission('euros.units.editAny')
  );
create policy "euro_ownership_update" on public.euro_ownership
  for update to authenticated
  using (
    (auth.uid() = "ownerId" and public.has_permission('euros.units.editOwn'))
    or public.has_permission('euros.units.editAny')
  )
  with check (
    (auth.uid() = "ownerId" and public.has_permission('euros.units.editOwn'))
    or public.has_permission('euros.units.editAny')
  );
create policy "euro_ownership_delete" on public.euro_ownership
  for delete to authenticated
  using (
    (auth.uid() = "ownerId" and public.has_permission('euros.units.editOwn'))
    or public.has_permission('euros.units.editAny')
  );

-- ---- country_location (álbumes) ----
create policy "country_location_insert" on public.country_location
  for insert to authenticated
  with check (public.has_permission('location.create'));
create policy "country_location_update" on public.country_location
  for update to authenticated
  using (public.has_permission('location.update'))
  with check (public.has_permission('location.update'));
create policy "country_location_delete" on public.country_location
  for delete to authenticated
  using (public.has_permission('location.delete'));

grant insert, update, delete on public.country_location to authenticated;

-- ---- peseta / peseta_type: solo admin ----
create policy "peseta_insert_admin" on public.peseta
  for insert to authenticated with check (public.is_admin());
create policy "peseta_update_admin" on public.peseta
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "peseta_delete_admin" on public.peseta
  for delete to authenticated using (public.is_admin());

create policy "peseta_type_insert_admin" on public.peseta_type
  for insert to authenticated with check (public.is_admin());
create policy "peseta_type_update_admin" on public.peseta_type
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "peseta_type_delete_admin" on public.peseta_type
  for delete to authenticated using (public.is_admin());

-- 5. Semilla: mantener lo que hoy puede hacer cada uno
insert into public.guest_permission (permission) values
  ('export.excel'),
  ('collection.switch'),
  ('section.estadisticas'),
  ('section.ubicacion'),
  ('section.pesetas'),
  ('section.conmemorativas'),
  ('numista.quotaView')
on conflict do nothing;

insert into public.user_permission ("userId", permission)
select u.id, 'euros.units.editOwn'
from auth.users u
where coalesce(u.raw_app_meta_data ->> 'role', '') <> 'admin'
on conflict do nothing;
